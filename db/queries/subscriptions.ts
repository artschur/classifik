import { and, eq, inArray, gt } from 'drizzle-orm';
import { db } from '..';
import { companionsTable, subscriptionsTable } from '../schema';
import Stripe from 'stripe';
import { priceIdToPlan } from './kv';

const ACTIVE_STATUSES = ['active', 'trialing'] as const;

export type ActiveSubscriptionStatus = (typeof ACTIVE_STATUSES)[number];

export async function upsertSubscriptionFromStripe(params: {
  subscription: Stripe.Subscription;
  clerkId: string;
  stripeCustomerId: string;
}) {
  const { subscription, clerkId, stripeCustomerId } = params;

  const item = subscription.items.data[0];
  const priceId = item?.price?.id ?? undefined;
  const productId =
    typeof item?.price?.product === 'string'
      ? (item?.price?.product as string)
      : (item?.price?.product as Stripe.Product | undefined)?.id;
  const planType = priceId ? priceIdToPlan[priceId]?.name : undefined;

  // Use current date and add 30 days for subscription period
  const currentPeriodStart = new Date();
  const currentPeriodEnd = new Date();
  currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

  await db.transaction(async (tx) => {
    // Use upsert to handle duplicate key violations
    await tx
      .insert(subscriptionsTable)
      .values({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: stripeCustomerId,
        clerk_id: clerkId,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        price_id: priceId,
        product_id: productId,
        plan_type: planType,
      })
      .onConflictDoUpdate({
        target: subscriptionsTable.stripe_subscription_id,
        set: {
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end ?? false,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          price_id: priceId,
          product_id: productId,
          plan_type: planType,
          updated_at: new Date(),
        },
      });

    // Reflect on companion record
    const isActive = ACTIVE_STATUSES.includes(subscription.status as any);
    await tx
      .update(companionsTable)
      .set({
        has_active_ad: isActive,
        plan_type: planType ?? 'free',
        ad_expiration_date: currentPeriodEnd,
        stripe_customer_id: stripeCustomerId,
      })
      .where(eq(companionsTable.auth_id, clerkId));
  });
}

export async function getActiveSubscriptionByClerkId(clerkId: string) {
  const now = new Date();
  const rows = await db
    .select()
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.clerk_id, clerkId),
        inArray(
          subscriptionsTable.status,
          ACTIVE_STATUSES as unknown as string[]
        ),
        gt(subscriptionsTable.current_period_end, now)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function hasActiveSubscription(clerkId: string) {
  const sub = await getActiveSubscriptionByClerkId(clerkId);
  return Boolean(sub);
}
