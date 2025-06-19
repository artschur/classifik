import { eq } from 'drizzle-orm';
import { db, kv } from '..';
import { companionsTable, paymentsTable } from '../schema';
import { stripe } from '../stripe';
import { auth } from '@clerk/nextjs/server';

export enum PlanType {
  FREE = 'free',
  BASICO = 'basico',
  PLUS = 'plus',
  VIP = 'vip',
}

export interface AdPurchase {
  id: string;
  productId: string;
  productName: PlanType;
  priceId: string;
  purchaseDate: Date;
  durationDays: number;
}

export interface CustomerAdData {
  adPurchases: AdPurchase[];
}

export const priceIdToPlan: Record<string, { name: string; duration: number }> = {
  price_1RbnIFCZhSZjuUHNWbRH1gx9: { name: 'basico', duration: 30 },
  price_1RbnIqCZhSZjuUHNMppbWPE3: { name: 'plus', duration: 30 },
  price_1RbnJcCZhSZjuUHNg5ae8KRf: { name: 'vip', duration: 30 },
};

export async function syncStripeDataToKV(customerId: string): Promise<CustomerAdData> {
  try {
    const payments = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 2,
    });

    const successfulPayments = payments.data.filter((payment) => payment.status === 'succeeded');

    // Process all payments in parallel
    const purchasePromises = successfulPayments.map(async (payment) => {
      const sessionsResponse = await stripe.checkout.sessions.list({
        payment_intent: payment.id,
      });

      if (sessionsResponse.data.length === 0) return [];

      const session = sessionsResponse.data[0];
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      // Process all line items in parallel
      const itemPromises = lineItems.data.map(async (item) => {
        if (!item.price) return null;

        const productId = item.price.product as string;
        const productName = priceIdToPlan[item.price.id].name;

        return {
          id: payment.id,
          priceId: item.price.id,
          productId:
            typeof item.price.product === 'string' ? item.price.product : item.price.product.id,
          productName: productId,
          purchaseDate: new Date(payment.created * 1000),
          durationDays: 30,
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
      (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime(),
    );

    const purchaseData: CustomerAdData = { adPurchases };

    await Promise.all([
      kv.set(`stripe:ads:${customerId}`, purchaseData),
      savePaymentToDB({
        paymentId: adPurchases[0].id,
        customerId,
        planType: adPurchases[0].productName,
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
  planType,
}: {
  paymentId: string;
  customerId: string;
  planType: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    Promise.all([
      await db.insert(paymentsTable).values({
        stripe_payment_id: paymentId,
        stripe_customer_id: customerId,
        plan_type: planType,
        clerk_id: userId,
        max_allowed_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        date: new Date(),
      }),
      await db
        .update(companionsTable)
        .set({
          ad_expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          has_active_ad: true,
          plan_type: planType,
        })
        .where(eq(companionsTable.stripe_customer_id, customerId)),
    ]);
    console.log('Payment saved to DB successfully');
  } catch (error) {
    console.error('Error saving payment to DB:', error);
    throw error;
  }
}

export async function hasActiveAd(clerkId: string) {
  const [lastDayAllowed] = await db
    .select({ date: paymentsTable.date })
    .from(paymentsTable)
    .where(eq(paymentsTable.clerk_id, clerkId));

  if (!lastDayAllowed) {
    return false;
  }
  const currentDate = new Date();
  return lastDayAllowed.date > currentDate;
}
