"use server";

import { clerkClient, auth } from "@clerk/nextjs/server";
import { upsertContactInRD } from "@/lib/rd-station";

/**
 * Guarda nome e telemóvel no RD Station assim que ela passa da primeira etapa,
 * muito antes de existir perfil.
 *
 * Sem isto, quem desistia entre a primeira etapa e o carregamento das fotos
 * deixava no RD apenas o email: o nome e o contacto que chegou a escrever
 * perdiam-se, e são justamente o que permite falar com ela depois.
 *
 * O email vem da sessão e nunca do cliente, para o contacto de outra pessoa
 * não poder ser injectado no pedido.
 */
export const saveRegistrationContact = async (
  name: string,
  phone: string,
): Promise<void> => {
  const { userId } = await auth();
  if (!userId) return;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return;

  await upsertContactInRD({ email, name, phone });
};

export const completeFirstStepRegistration = async () => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  const client = await clerkClient();

  // Clerk's update is a deep merge, so we only need to
  // send the keys we want to change/add.
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: true, // Mark step 1 done
      isRegistrationComplete: true,
      isCompanion: true,        // Set the role
    },
  });

  return { success: true }
}
