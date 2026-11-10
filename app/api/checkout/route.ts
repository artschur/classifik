import { db, kv } from '@/db';
import { lerIdsGa } from '@/lib/ga-server';
import { stripe } from '@/db/stripe';
import { auth } from '@clerk/nextjs/server';
import { priceIdToPlan } from '@/db/queries/kv';
import { isUserACompanion } from '@/db/queries/companions';
import { companionsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isAdmin } from '@/components/header';
import { acessoAPlanos, DESTINO_SEM_ACESSO } from '@/db/queries/verificacao';

export async function GET(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new Response('Unauthorized', { status: 401 });
        }

        // O mesmo requisito do /api/can-checkout, repetido aqui porque aquele
        // só informa o botão: é este endereço que cria mesmo a assinatura, e
        // chega-se a ele escrevendo o URL à mão. Sem perfil não há anúncio
        // para destacar, e o pagamento ficaria sem dono; sem selo, o caminho
        // é a verificação. Os admins só precisam de perfil (compras de teste).
        if (isAdmin(userId)) {
            if (!(await isUserACompanion(userId))) {
                return Response.redirect(new URL('/companions/register', req.url), 303);
            }
        } else {
            const acesso = await acessoAPlanos(userId);
            if (acesso !== 'pode') {
                return Response.redirect(new URL(DESTINO_SEM_ACESSO[acesso], req.url), 303);
            }
        }

        const url = new URL(req.url);
        const priceId = url.searchParams.get('priceId');

        // Compra de teste: só um admin pode pedir o checkout sem o mês grátis,
        // para ver uma cobrança real e o plano a activar logo. Para qualquer
        // outra conta o parâmetro é ignorado.
        const semTrial = url.searchParams.get('semTrial') === '1' && isAdmin(userId);

        if (!priceId) {
            return new Response('Missing price ID', { status: 400 });
        }

        // ✅ Validate that the priceId exists in our plan mapping
        const planInfo = priceIdToPlan[priceId];
        if (!planInfo) {
            return new Response('Invalid price ID', { status: 400 });
        }

        let stripeCustomerId = await kv.get(`stripe:user:${userId}`);

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                metadata: {
                    userId: userId,
                },
            });

            stripeCustomerId = customer.id;
            await db
                .update(companionsTable)
                .set({
                    stripe_customer_id: stripeCustomerId as string,
                })
                .where(eq(companionsTable.auth_id, userId));

            await kv.set(`stripe:user:${userId}`, stripeCustomerId);
        }

        console.log(
            `🛒 Creating checkout for user ${userId}, customer ${stripeCustomerId}, plan ${planInfo.name}`
        );

        const checkout = await stripe.checkout.sessions.create({
            customer: stripeCustomerId as string,
            success_url: 'https://onesugar.pt/success',
            // "Voltar" na página da Stripe regressa aos planos. Antes apontava
            // para /cancelled, uma página que nunca existiu, e dava 404.
            cancel_url: `${url.origin}/checkout`,
            mode: 'subscription',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            ...(semTrial
                ? {}
                : {
                      subscription_data: {
                          // Um mês. Quem já estiver a meio de um período de dois meses
                          // mantém-no: a Stripe fixa a duração no momento da assinatura.
                          trial_period_days: 30,
                          trial_settings: {
                              end_behavior: {
                                  missing_payment_method: 'cancel' as const, // Cancel if no payment method at trial end
                              },
                          },
                      },
                  }),
            payment_method_collection: 'always',
            metadata: {
                userId: userId,
                stripeCustomerId: stripeCustomerId as string,
                planType: planInfo.name,
                ...(semTrial ? { testeAdminSemTrial: 'sim' } : {}),
                ...metadadosGa(req, userId),
            },
            allow_promotion_codes: true,
        });

        return Response.redirect(checkout.url as string);
    } catch (error) {
        console.error('❌ Error creating checkout session:', error);
        return new Response('Internal server error', { status: 500 });
    }
}

/**
 * Identificadores do GA4 da visita que iniciou o checkout. O webhook da
 * Stripe usa-os para atribuir a assinatura e as cobranças (que chegam até 30
 * dias depois) ao mesmo utilizador do GA4, e portanto à origem dele.
 * As compras de teste dos admins ficam marcadas para não entrar no GA4.
 */
function metadadosGa(req: Request, userId: string): Record<string, string> {
    if (isAdmin(userId)) return { ga_ignorar: 'sim' };
    const { clientId, sessionId } = lerIdsGa(req.headers.get('cookie'));
    return {
        ...(clientId ? { ga_client_id: clientId } : {}),
        ...(sessionId ? { ga_session_id: sessionId } : {}),
    };
}
