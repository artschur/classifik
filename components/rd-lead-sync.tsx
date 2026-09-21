import { auth, clerkClient } from '@clerk/nextjs/server';
import { after } from 'next/server';
import { tagCompanionInRD, upsertContactInRD } from '@/lib/rd-station';

/**
 * Leva o email para o RD Station na primeira vez que alguém aparece
 * autenticado no site, seja qual for a porta por onde entrou.
 *
 * Fica no layout, e não no ecrã de onboarding, porque nem toda a gente passa
 * por lá: os botões de entrada apontam para sítios diferentes (avaliações,
 * planos, calculadora) e o desvio para /onboarding no proxy testa
 * `onboardingComplete === false`, que numa conta acabada de criar é
 * `undefined`. Aqui não há caminho por onde escapar.
 *
 * A tag é deliberadamente neutra: neste instante ainda não se sabe se a
 * pessoa quer anunciar ou só ver o site. Quem se declara anunciante leva
 * `registo-incompleto` no passo seguinte.
 *
 * Não desenha nada.
 */
export async function RDLeadSync() {
  const { userId, sessionClaims } = await auth();

  if (!userId) return null;
  // Saída barata no caso normal: quem já foi sincronizado não chega a tocar
  // na API do Clerk.
  if (sessionClaims?.metadata?.rdSynced) return null;

  after(async () => {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);

    // Os dados da sessão só acompanham a alteração no pedido seguinte, por
    // isso a confirmação que conta é esta, lida do utilizador.
    if (user.publicMetadata?.rdSynced) return;

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) return;

    const name = user.fullName ?? undefined;
    await upsertContactInRD({ email, name });
    await tagCompanionInRD(email, 'conta-criada', name);

    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { ...user.publicMetadata, rdSynced: true },
    });
  });

  return null;
}
