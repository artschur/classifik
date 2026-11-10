import type Stripe from 'stripe';
import { stripe } from '@/db/stripe';
import { priceIdToPlan } from '@/db/queries/kv';
import { clientIdDeReserva, enviarEventoGa } from '@/lib/ga-server';

/**
 * Medição das assinaturas no GA4, chamada pelo webhook da Stripe.
 *
 * O checkout dá 30 dias grátis, por isso há dois momentos:
 * - assinatura_concluida: o checkout terminou e o mês grátis começou (0 €).
 * - purchase: a Stripe cobrou de facto. Primeiro no fim do mês grátis, depois
 *   em cada renovação. É aqui que entra a receita, com o id da fatura como
 *   transaction_id.
 *
 * Os identificadores do GA4 vêm dos metadados que o /api/checkout grava na
 * sessão da Stripe, e ficam copiados na assinatura para as cobranças futuras.
 * Nenhum erro daqui interrompe o webhook.
 */

function idCliente(metadata: Stripe.Metadata | null | undefined, customerId: string): string {
  return metadata?.ga_client_id || clientIdDeReserva(customerId);
}

function planoDa(subscription: Stripe.Subscription) {
  const price = subscription.items.data[0]?.price;
  return {
    priceId: price?.id,
    plano: (price && priceIdToPlan[price.id]?.name) || 'desconhecido',
    valorMensal: price?.unit_amount != null ? price.unit_amount / 100 : undefined,
    moeda: (price?.currency ?? 'eur').toUpperCase(),
  };
}

export async function medirAssinaturaConcluida(session: Stripe.Checkout.Session): Promise<void> {
  try {
    if (session.mode !== 'subscription' || !session.subscription) return;
    const meta = session.metadata ?? {};
    if (meta.ga_ignorar === 'sim' || meta.testeAdminSemTrial === 'sim') {
      await guardarNaAssinatura(session.subscription, { ga_ignorar: 'sim' });
      return;
    }

    const customerId = session.customer as string;
    const clientId = idCliente(meta, customerId);
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    const { plano, valorMensal, moeda } = planoDa(subscription);

    // As cobranças chegam noutra altura e só trazem a assinatura: os ids do
    // GA4 passam a viver também nela.
    await guardarNaAssinatura(subscription.id, {
      ga_client_id: clientId,
      ...(meta.ga_session_id ? { ga_session_id: meta.ga_session_id } : {}),
    });

    await enviarEventoGa(
      clientId,
      'assinatura_concluida',
      {
        plano,
        valor_mensal: valorMensal,
        currency: moeda,
        mes_gratis: subscription.status === 'trialing',
      },
      // O evento chega segundos depois do checkout: entra na mesma sessão.
      { sessionId: meta.ga_session_id }
    );
  } catch (error) {
    console.warn('[GA4 MP] assinatura_concluida não medida', error);
  }
}

export async function medirCobranca(
  invoice: Stripe.Invoice,
  subscription: Stripe.Subscription
): Promise<void> {
  try {
    if (!invoice.amount_paid || invoice.amount_paid <= 0) return;
    const meta = subscription.metadata ?? {};
    if (meta.ga_ignorar === 'sim') return;

    const customerId = invoice.customer as string;
    const clientId = idCliente(meta, customerId);
    const { priceId, plano } = planoDa(subscription);
    const primeira = meta.ga_primeira_cobranca !== 'enviada';
    const valor = invoice.amount_paid / 100;

    await enviarEventoGa(clientId, 'purchase', {
      transaction_id: invoice.id,
      value: valor,
      currency: invoice.currency.toUpperCase(),
      tipo_cobranca: primeira ? 'primeira_cobranca' : 'renovacao',
      plano,
      items: [{ item_id: priceId ?? plano, item_name: `Plano ${plano}`, price: valor, quantity: 1 }],
    });

    if (primeira) await guardarNaAssinatura(subscription.id, { ga_primeira_cobranca: 'enviada' });
  } catch (error) {
    console.warn('[GA4 MP] purchase não medida', error);
  }
}

async function guardarNaAssinatura(
  subscription: string | Stripe.Subscription,
  metadata: Record<string, string>
): Promise<void> {
  const id = typeof subscription === 'string' ? subscription : subscription.id;
  // A Stripe junta estas chaves às que já existem; não apaga nenhuma.
  await stripe.subscriptions.update(id, { metadata });
}
