import { and, eq, inArray, gt } from 'drizzle-orm';
import { db, kv } from '..';
import { companionsTable, subscriptionsTable } from '../schema';
import Stripe from 'stripe';
import { stripe } from '../stripe';
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

  // current_period_start/end vivem no item da assinatura nesta versão da API
  // da Stripe (deixaram de existir no objecto subscription). O código antigo
  // não lia daqui e gravava sempre "agora + 2 meses", fixo, independente do
  // período real de cada plano, o que tanto podia cortar o acesso antes da
  // hora como prolongá-lo além do previsto.
  const currentPeriodStart = item?.current_period_start
    ? new Date(item.current_period_start * 1000)
    : new Date();
  const currentPeriodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000)
    : new Date();

  // Determine active status early
  const isActive = ACTIVE_STATUSES.includes(subscription.status as any);

  await db.transaction(async (tx) => {
    // 0) Ensure companion exists for this clerkId. If not, bail out (can't satisfy FK).
    const companionRow = await tx
      .select({ id: companionsTable.id })
      .from(companionsTable)
      .where(eq(companionsTable.auth_id, clerkId))
      .limit(1);

    if (!companionRow || companionRow.length === 0) {
      // No companion exists yet for this clerkId; inserting subscriptions would violate FK
      // Log and exit early. You may choose a different policy (store in KV, queue, or create companion row).
      console.warn(
        `Skipping subscription upsert: no companion found for clerkId=${clerkId}. stripeCustomerId=${stripeCustomerId}`
      );
      return;
    }

    // 1) Update companion first so the referenced stripe_customer_id exists before inserting subscription
    await tx
      .update(companionsTable)
      .set({
        has_active_ad: isActive,
        plan_type: isActive ? (planType ?? 'free') : 'free',
        ad_expiration_date: currentPeriodEnd,
        stripe_customer_id: stripeCustomerId,
      })
      .where(eq(companionsTable.auth_id, clerkId));

    // 2) Insert / upsert subscription record
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

/** Estados em que a Stripe ainda cobra, ou pode vir a cobrar, a subscrição. */
const ESTADOS_QUE_COBRAM: Stripe.Subscription.Status[] = [
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'incomplete',
  'paused',
];

/**
 * Cancela na Stripe tudo o que ainda pode cobrar uma conta, antes de o perfil
 * ser apagado. Procura sempre na própria Stripe, e não só na base: uma
 * subscrição pode nunca ter ficado registada aqui (comprada antes de haver
 * perfil, ou com o aviso da Stripe perdido) e continuaria a cobrar depois de
 * o perfil desaparecer. Foi assim que uma cliente ficou a pagar o VIP sem
 * anúncio nenhum.
 *
 * Os clientes Stripe da conta vêm de três lados: o gravado no perfil, o
 * gravado no KV no checkout, e uma pesquisa na Stripe pelo id da conta, que o
 * checkout põe nos metadados do cliente.
 *
 * Cancela já, e não no fim do período: sem perfil não há anúncio para pagar.
 * Os reembolsos ficam de fora, são decisão à parte. Erros a falar com a
 * Stripe sobem para quem chama, que não deve apagar nada nesse caso.
 */
export async function cancelarSubscricoesNaStripe(params: {
  clerkId: string;
  stripeCustomerId?: string | null;
}): Promise<{ canceladas: number; falhas: string[] }> {
  const { clerkId, stripeCustomerId } = params;
  const clientes = new Set<string>();
  if (stripeCustomerId) clientes.add(stripeCustomerId);

  const doCheckout = await kv.get<string>(`stripe:user:${clerkId}`);
  if (typeof doCheckout === 'string' && doCheckout) clientes.add(doCheckout);

  // O id entra no texto da pesquisa: só passa no formato do Clerk (letras,
  // números e _), para não partir nem alterar a pesquisa.
  if (/^[A-Za-z0-9_]+$/.test(clerkId)) {
    const encontrados = await stripe.customers.search({
      query: `metadata['userId']:'${clerkId}'`,
      limit: 20,
    });
    for (const cliente of encontrados.data) clientes.add(cliente.id);
  }

  let canceladas = 0;
  const falhas: string[] = [];

  for (const cliente of clientes) {
    const subscricoes = await stripe.subscriptions.list({
      customer: cliente,
      status: 'all',
      limit: 100,
    });
    for (const subscricao of subscricoes.data) {
      if (!ESTADOS_QUE_COBRAM.includes(subscricao.status)) continue;
      try {
        await stripe.subscriptions.cancel(subscricao.id);
        canceladas++;
      } catch (error) {
        console.error(`Falha ao cancelar a subscrição ${subscricao.id} na Stripe:`, error);
        falhas.push(subscricao.id);
      }
    }
  }

  return { canceladas, falhas };
}
