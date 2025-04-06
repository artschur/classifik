import { eq } from 'drizzle-orm';
import { db, kv } from '..';
import { companionsTable } from '../schema';
import { stripe } from '../stripe';

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
    // Get payment intents or charges for this customer
    const payments = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 10,
    });

    const adPurchases: AdPurchase[] = [];

    // Process successful payments
    const successfulPayments = payments.data.filter(
      (payment) => payment.status === 'succeeded'
    );

    for (const payment of successfulPayments) {
      // Fetch checkout session and line items as before
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: payment.id,
      });

      if (sessions.data.length > 0) {
        const session = sessions.data[0];
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id
        );

        for (const item of lineItems.data) {
          if (!item.price) continue;
          const productId = item.price.product as string;
          const product = await stripe.products.retrieve(productId);
          const durationDays = product.metadata.duration || '30';

          adPurchases.push({
            id: payment.id,
            productId:
              typeof item.price.product === 'string'
                ? item.price.product
                : item.price.product.id,
            productName: product.name,
            purchaseDate: new Date(payment.created * 1000),
            durationDays: parseInt(durationDays),
          });
        }
      }
    }

    adPurchases.sort(
      (a, b) =>
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    );

    const purchaseData: CustomerAdData = { adPurchases };
    console.log(purchaseData);
    await kv.set(`stripe:ads:${customerId}`, purchaseData);
    return purchaseData;
  } catch (error) {
    console.error('Error syncing purchase data to KV:', error);
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
