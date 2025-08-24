import { and, eq, gt, inArray } from 'drizzle-orm';
import { db } from '..';
import { paymentsTable, subscriptionsTable } from '../schema';

export async function getUserPlan(auth_id: string) {
  // Prefer active subscription plan if any
  const now = new Date();
  const subscription = await db
    .select({ plan: subscriptionsTable.plan_type })
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.clerk_id, auth_id),
        inArray(subscriptionsTable.status, ['active', 'trialing']),
        gt(subscriptionsTable.current_period_end, now)
      )
    )
    .limit(1);

  if (subscription[0]?.plan) return subscription[0].plan;

  const [plan] = await db
    .select({ plan: paymentsTable.plan_type })
    .from(paymentsTable)
    .where(eq(paymentsTable.clerk_id, auth_id))
    .limit(1);

  return plan?.plan ?? 'free';
}
