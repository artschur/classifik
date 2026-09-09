import { and, desc, eq, gt, inArray } from 'drizzle-orm';
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

  // Fallback para compra avulsa (não-assinatura). Sem o filtro de
  // max_allowed_date, qualquer pagamento antigo, mesmo já expirado, mantinha
  // o plano pago para sempre — era o bug de "compra uma vez, fica pra
  // sempre". O desc() garante que, havendo mais de um pagamento, pegamos o
  // mais recente e não um qualquer.
  const [plan] = await db
    .select({ plan: paymentsTable.plan_type })
    .from(paymentsTable)
    .where(
      and(
        eq(paymentsTable.clerk_id, auth_id),
        gt(paymentsTable.max_allowed_date, now)
      )
    )
    .orderBy(desc(paymentsTable.max_allowed_date))
    .limit(1);

  return plan?.plan ?? 'free';
}
