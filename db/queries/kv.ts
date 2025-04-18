import { eq } from 'drizzle-orm';
import { db, kv } from '..';
import { companionsTable, paymentsTable } from '../schema';
import { stripe } from '../stripe';
import { auth, clerkClient, createClerkClient } from '@clerk/nextjs/server';

export interface AdPurchase {
  id: string;
  productId: string;
  productName: string;
  purchaseDate: Date;
  durationDays: number;
}

export interface CustomerAdData {
  adPurchases: AdPurchase[];
}

export async function syncStripeDataToKV(
  customerId: string
): Promise<CustomerAdData> {
  try {
    const payments = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 2,
    });

    const successfulPayments = payments.data.filter(
      (payment) => payment.status === 'succeeded'
    );

    // Process all payments in parallel
    const purchasePromises = successfulPayments.map(async (payment) => {
      const sessionsResponse = await stripe.checkout.sessions.list({
        payment_intent: payment.id,
      });

      if (sessionsResponse.data.length === 0) return [];

      const session = sessionsResponse.data[0];
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id
      );

      // Process all line items in parallel
      const itemPromises = lineItems.data.map(async (item) => {
        if (!item.price) return null;

        const productId = item.price.product as string;
        const product = await stripe.products.retrieve(productId);
        const durationDays = product.metadata.duration || '30';

        return {
          id: payment.id,
          productId:
            typeof item.price.product === 'string'
              ? item.price.product
              : item.price.product.id,
          productName: product.name,
          purchaseDate: new Date(payment.created * 1000),
          durationDays: parseInt(durationDays),
        };
      });

      // Wait for all line items to be processed
      const results = await Promise.all(itemPromises);
      return results.filter(Boolean) as AdPurchase[]; // Remove nulls
    });

    // Wait for all payments to be processed
    const purchaseArrays = await Promise.all(purchasePromises);

    // Flatten the array of arrays
    const adPurchases = purchaseArrays.flat();

    // Sort purchases by date
    adPurchases.sort(
      (a, b) =>
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    );

    const purchaseData: CustomerAdData = { adPurchases };

    await Promise.all([
      kv.set(`stripe:ads:${customerId}`, purchaseData),
      savePaymentToDB({
        paymentId: adPurchases[0].id,
        customerId,
        durationDays: adPurchases[0].durationDays,
      }),
    ]);

    return purchaseData;
  } catch (error) {
    console.error('Error syncing purchase data to KV:', error);
    throw error;
  }
}

async function savePaymentToDB({
  paymentId,
  customerId,
  durationDays,
}: {
  paymentId: string;
  customerId: string;
  durationDays: number;
}) {
  try {
    Promise.all([
      await db.insert(paymentsTable).values({
        stripe_payment_id: paymentId,
        stripe_customer_id: customerId,
        date: new Date(),
      }),
      await db
        .update(companionsTable)
        .set({
          ad_expiration_date: new Date(
            Date.now() + durationDays * 24 * 60 * 60 * 1000
          ),
          has_active_ad: true,
        })
        .where(eq(companionsTable.stripe_customer_id, customerId)),
    ]);
    console.log('Payment saved to DB successfully');
  } catch (error) {
    console.error('Error saving payment to DB:', error);
    throw error;
  }
}

export async function hasActiveAdvertisement({
  userId,
}: {
  userId: string;
}): Promise<boolean> {
  try {
    let stripeCustomerId = await kv.get<string>(`stripe:user:${userId}`);

    if (!stripeCustomerId) {
      const user = await db
        .select({
          stripeCustomerId: companionsTable.stripe_customer_id,
        })
        .from(companionsTable)
        .where(eq(companionsTable.auth_id, userId));

      const { stripeCustomerId } = user[0];

      if (!stripeCustomerId) {
        console.error('No Stripe customer ID found for user:', userId);
        return false;
      }
      await kv.set(`stripe:user:${userId}`, stripeCustomerId);
    }
    const adData = await kv.get<CustomerAdData>(
      `stripe:ads:${stripeCustomerId}`
    );

    if (!adData) {
      // Sync from Stripe if not found
      if (stripeCustomerId) {
        const freshData = await syncStripeDataToKV(stripeCustomerId);
        return checkForActiveAd(freshData.adPurchases);
      }
      return false;
    }

    return checkForActiveAd(adData.adPurchases);
  } catch (error) {
    console.error('Error checking active ad status:', error);
    return false;
  }
}

function checkForActiveAd(purchases: AdPurchase[]): boolean {
  const now = new Date();

  return purchases.some((purchase) => {
    const expiryDate = new Date(purchase.purchaseDate);
    expiryDate.setDate(expiryDate.getDate() + purchase.durationDays);
    return now < expiryDate;
  });
}
