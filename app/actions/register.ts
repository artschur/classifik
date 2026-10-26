'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { after } from 'next/server';
import { registerCompanion } from '@/db/queries/companions';
import { upsertSubscriptionFromStripe } from '@/db/queries/subscriptions';
import { stripe } from '@/db/stripe';
import type { RegisterCompanionFormValues } from '@/lib/registo-schema';
import { tagCompanionInRD } from '@/lib/rd-station';

/**
 * Liga ao perfil recém-criado uma subscrição que já exista na Stripe.
 *
 * Nada impede que alguém compre o plano antes de montar o perfil, e nesse
 * caso o aviso da Stripe chega quando ainda não há acompanhante nenhuma a
 * quem o atribuir. A gravação do plano desiste aí, escreve um aviso no
 * registo do servidor e nunca mais tenta — o pagamento fica órfão e a pessoa
 * continua a aparecer como anúncio gratuito apesar de estar a pagar.
 *
 * Agora que o perfil existe, a peça que faltava está cá: basta perguntar à
 * Stripe se havia alguma subscrição à espera. Assim a ordem deixa de
 * importar, comprar antes ou depois dá o mesmo resultado.
 *
 * Não é exportada de propósito: neste ficheiro tudo o que se exporta fica
 * chamável a partir do browser.
 */
async function linkExistingSubscription(clerkId: string) {
  try {
    const cc = await clerkClient();
    const user = await cc.users.getUser(clerkId);
    const stripeCustomerId = user.publicMetadata?.stripeCustomerId;

    if (typeof stripeCustomerId !== 'string' || !stripeCustomerId) return;

    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 10,
    });

    const live = subscriptions.data.find(
      (s) => s.status === 'active' || s.status === 'trialing',
    );
    if (!live) return;

    await upsertSubscriptionFromStripe({
      subscription: live,
      clerkId,
      stripeCustomerId,
    });
  } catch (error) {
    // Falhar aqui não pode impedir o registo: o perfil já foi criado e o
    // plano volta a ser tentado no evento seguinte da Stripe.
    console.error('Falha ao ligar subscrição existente ao perfil:', error);
  }
}

/**
 * Marca no Clerk que o registo de base está feito, logo que o perfil existe.
 * Até aqui isto só acontecia no fim do passo das fotos: quem fechava o site
 * depois da primeira foto ficava presa pelo proxy no formulário, com o perfil
 * já criado. O RD fica a saber que o perfil foi criado e está na fila.
 *
 * Não é exportada de propósito: neste ficheiro tudo o que se exporta fica
 * chamável a partir do browser.
 */
async function markProfileCreated(clerkId: string) {
  try {
    const cc = await clerkClient();
    const user = await cc.users.getUser(clerkId);
    await cc.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        onboardingComplete: true,
        isCompanion: true,
        isRegistrationComplete: true,
      },
    });

    const email = user.emailAddresses[0]?.emailAddress;
    if (email) {
      await tagCompanionInRD(email, 'perfil-criado', user.fullName ?? undefined);
    }
  } catch (error) {
    console.error('Falha ao marcar o perfil como criado:', error);
  }
}

export async function registerCompanionAction(companionPayload: RegisterCompanionFormValues) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Sessão expirada. Entre outra vez.');
  }

  // A conta, o email e a validação dos dados ficam do lado do servidor.
  const companion = await registerCompanion(companionPayload);

  await markProfileCreated(userId);

  // Depois da resposta seguir: consultar a Stripe é lento e o registo não
  // deve esperar por isso.
  after(() => linkExistingSubscription(userId));

  return companion;
}
