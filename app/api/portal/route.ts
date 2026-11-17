import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db, kv } from '@/db';
import { stripe } from '@/db/stripe';
import { companionsTable } from '@/db/schema';
import { localizeHref, type Locale } from '@/lib/i18n';
import { PORTAL_CONFIG_ID } from '@/lib/planos';

/**
 * Abre o portal de cliente da Stripe para a própria anunciante: gerir,
 * mudar ou cancelar o plano, mudar o cartão e ver as faturas.
 *
 * O cliente Stripe sai sempre da conta com sessão (do perfil, ou do que o
 * checkout guardou), nunca do pedido: com um id do pedido, qualquer pessoa
 * abria o portal de outra e cancelava-lhe o plano.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale: Locale = url.searchParams.get('lang') === 'en' ? 'en' : 'pt';
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const [perfil] = await db
    .select({ stripeCustomerId: companionsTable.stripe_customer_id })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, userId))
    .limit(1);
  const doCheckout = await kv.get<string>(`stripe:user:${userId}`);
  const cliente = perfil?.stripeCustomerId || (typeof doCheckout === 'string' ? doCheckout : null);

  // Nunca comprou nada: não há plano para gerir. Vai ver os planos.
  if (!cliente) {
    return Response.redirect(new URL(localizeHref('/checkout', locale), req.url), 303);
  }

  try {
    const sessao = await stripe.billingPortal.sessions.create({
      customer: cliente,
      configuration: PORTAL_CONFIG_ID,
      return_url: `${url.origin}${localizeHref('/profile', locale)}`,
      locale: locale === 'en' ? 'en' : 'auto',
    });
    return Response.redirect(sessao.url, 303);
  } catch (error) {
    console.error('Não foi possível abrir o portal da Stripe:', error);
    return new Response('Não foi possível abrir a gestão do plano. Tente outra vez.', { status: 500 });
  }
}
