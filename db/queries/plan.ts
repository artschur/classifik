import { eq } from 'drizzle-orm';
import { db } from '..';
import { paymentsTable } from '../schema';

export async function getUserPlan(auth_id: string) {
  const [plan] = await db
    .select({ plan: paymentsTable.plan_type })
    .from(paymentsTable)
    .where(eq(paymentsTable.clerk_id, auth_id));

  return plan.plan;
}
