import { and, eq, gt, inArray } from 'drizzle-orm';
import { db, kv } from '..';
import { companionsTable, paymentsTable, subscriptionsTable } from '../schema';
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
  productName: string; // Changed from PlanType to string
  priceId: string;
  purchaseDate: Date;
  durationDays: number;
}

export interface CustomerAdData {
  adPurchases: AdPurchase[];
}

export const BASIC_PRICE_ID = process.env.STRIPE_BASIC_PRICE_ID || '';
export const PLUS_PRICE_ID = process.env.STRIPE_PLUS_PRICE_ID || '';
export const VIP_PRICE_ID = process.env.STRIPE_VIP_PRICE_ID || '';

export const priceIdToPlan: Record<string, { name: string; duration: number }> = {
  // Replace these with your new recurring price IDs from Stripe Dashboard
  [BASIC_PRICE_ID]: { name: 'basico', duration: 30 },
  [PLUS_PRICE_ID]: { name: 'plus', duration: 30 },
  [VIP_PRICE_ID]: { name: 'vip', duration: 30 },
};

export async function syncStripeDataToKV(
  customerId: string,
  userIdFromWebhook: string, // Add optional parameter
): Promise<CustomerAdData> {
  try {
    console.log(`🔄 Starting sync for customer: ${customerId}`);

    const payments = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 5,
    });

    const successfulPayments = payments.data.filter((payment) => payment.status === 'succeeded');
    console.log(`✅ Found ${successfulPayments.length} successful payments`);

    if (successfulPayments.length === 0) {
      console.log('⚠️ No successful payments found');
      return { adPurchases: [] };
    }

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

        const planInfo = priceIdToPlan[item.price.id];
        const productName = planInfo?.name || 'unknown';

        console.log(`📦 Processing item: ${item.price.id} -> ${productName}`);

        return {
          id: payment.id,
          priceId: item.price.id,
          productId: typeof item.price.product === 'string' ? item.price.product : item.price.product.id,
          productName: productName,
          purchaseDate: new Date(payment.created * 1000),
          durationDays: planInfo?.duration || 30,
        };
      });

      const results = await Promise.all(itemPromises);
      return results.filter(Boolean) as AdPurchase[];
    });

    const purchaseArrays = await Promise.all(purchasePromises);
    const adPurchases = purchaseArrays.flat();

    adPurchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

    const purchaseData: CustomerAdData = { adPurchases };

    console.log(`💾 Saving purchase data for ${adPurchases.length} purchases`);

    // ✅ Fixed: Pass userIdFromWebhook if available
    await Promise.all([
      kv.set(`stripe:ads:${customerId}`, purchaseData),
      adPurchases.length > 0
        ? savePaymentToDB({
            paymentId: adPurchases[0].id,
            customerId,
            planType: adPurchases[0].productName,
            userIdFromWebhook, // Pass the userId from webhook
          })
        : Promise.resolve(),
    ]);

    console.log('✅ Sync completed successfully');
    return purchaseData;
  } catch (error) {
    console.error('❌ Error syncing purchase data to KV:', error);
    throw error;
  }
}

async function savePaymentToDB({
  paymentId,
  customerId,
  planType,
  userIdFromWebhook,
}: {
  paymentId: string;
  customerId: string;
  planType: string;
  userIdFromWebhook: string;
}) {
  try {
    console.log(`💾 Saving payment to DB: ${paymentId}, plan: ${planType}`);

    let userId = userIdFromWebhook;

    // If still no userId, try to get from Stripe customer metadata
    if (!userId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer && !customer.deleted && customer.metadata?.userId) {
          userId = customer.metadata.userId;
        }
      } catch (error) {
        console.error('Failed to retrieve customer metadata:', error);
      }
    }

    if (!userId) {
      throw new Error('Unable to determine userId for payment');
    }

    console.log(`👤 Using userId: ${userId}`);

    // ✅ Fixed: Properly await Promise.all

    await db.transaction(async (tx) => {
      (await tx.insert(paymentsTable).values({
        stripe_payment_id: paymentId,
        stripe_customer_id: customerId,
        plan_type: planType,
        clerk_id: userId,
        max_allowed_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        date: new Date(),
      }),
        await tx
          .update(companionsTable)
          .set({
            ad_expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            has_active_ad: true,
            plan_type: planType,
          })
          .where(eq(companionsTable.stripe_customer_id, customerId)));
    });

    console.log('✅ Payment saved to DB successfully');
  } catch (error) {
    console.error('❌ Error saving payment to DB:', error);
    console.error('Details:', {
      paymentId,
      customerId,
      planType,
      userIdFromWebhook,
    });
    throw error; // Re-throw to propagate the error
  }
}

export async function hasActiveAd(clerkId: string) {
  try {
    // 1) Prefer active subscription (active or trialing, not expired)
    const now = new Date();
    const [activeSub] = await db
      .select({
        status: subscriptionsTable.status,
        end: subscriptionsTable.current_period_end,
      })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.clerk_id, clerkId),
          inArray(subscriptionsTable.status, ['active', 'trialing']),
          gt(subscriptionsTable.current_period_end, now),
        ),
      )
      .limit(1);

    if (activeSub?.end && activeSub.end > now) return true;

    // 2) Fallback to legacy one-off payment window
    const [lastDayAllowed] = await db
      .select({ date: paymentsTable.max_allowed_date }) // ✅ Fixed: use max_allowed_date
      .from(paymentsTable)
      .where(eq(paymentsTable.clerk_id, clerkId))
      .orderBy(paymentsTable.date) // Get the latest payment
      .limit(1);

    if (!lastDayAllowed) {
      return false;
    }

    const currentDate = new Date();
    return lastDayAllowed.date > currentDate;
  } catch (error) {
    console.error('❌ Error checking active ad status:', error);
    return false;
  }
}
