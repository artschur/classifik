'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { after } from 'next/server';
import { registerCompanion } from '@/db/queries/companions';
import { upsertSubscriptionFromStripe } from '@/db/queries/subscriptions';
import { stripe } from '@/db/stripe';
import { RegisterCompanionFormValues } from '@/components/formCompanionRegister';

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

export async function registerCompanionAction(companionPayload: RegisterCompanionFormValues) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    // This is the only place an auth error should originate
    throw new Error('Authentication failed: No user ID found.');
  }

  // 2. Reliably get the user's email
  let email = sessionClaims?.email;
  if (!email) {
    try {
      const cc = await clerkClient();
      const user = await cc.users.getUser(userId);
      email =
        user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
        user.emailAddresses?.[0]?.emailAddress;
    } catch (error) {
      console.error('Failed to fetch user from Clerk:', error);
      throw new Error('Could not retrieve user email.');
    }
  }

  if (!email) {
    throw new Error('Authentication failed: No email found for user.');
  }

  // 3. Call the strict, predictable database helper
  const companion = await registerCompanion(companionPayload, userId, email);

  // Depois da resposta seguir: consultar a Stripe é lento e o registo não
  // deve esperar por isso.
  after(() => linkExistingSubscription(userId));

  return companion;
}
