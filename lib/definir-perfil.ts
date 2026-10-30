import 'server-only';

import { clerkClient } from '@clerk/nextjs/server';
import { tagCompanionInRD } from '@/lib/rd-station';

/**
 * Regista no Clerk se a conta é de anunciante ou de cliente. É o que o
 * /onboarding faz quando ela escolhe, e o que a escolha feita no popup antes
 * do registo faz sem passar por lá (app/api/onboard).
 */
export async function definirPerfil(userId: string, isCompanion: boolean) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  await client.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      onboardingComplete: true,
      isCompanion,
      isRegistrationComplete: false,
      // Anunciantes começam com a marca a false; clientes não têm passos a cumprir.
      hasUploadedDocs: isCompanion ? false : true,
      plan: user.publicMetadata.plan || 'free',
    },
  });

  // A tag fica até ao fim do registo; quem parar a meio é quem tem esta e não
  // tem a de concluído.
  if (isCompanion) {
    const email = user.emailAddresses[0]?.emailAddress;
    if (email) await tagCompanionInRD(email, 'registo-incompleto', user.fullName ?? undefined);
  }
}
