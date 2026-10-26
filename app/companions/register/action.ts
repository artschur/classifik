"use server";

import { clerkClient, auth } from "@clerk/nextjs/server";
import { upsertContactInRD } from "@/lib/rd-station";

/**
 * Guarda o telemóvel (e o nome, se já estiver escrito) no RD Station logo no
 * passo 1, muito antes de existir perfil: assim que o telemóvel fica válido,
 * e outra vez ao passar o passo.
 *
 * Sem isto, quem desistia antes de carregar fotos deixava no RD apenas o
 * email: o nome e o contacto que chegou a escrever perdiam-se, e são
 * justamente o que permite falar com ela depois.
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

  const telefone = phone?.trim();
  if (!telefone || telefone.length < 8 || telefone.length > 20) return;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return;

  await upsertContactInRD({
    email,
    name: name?.trim().slice(0, 100) || undefined,
    phone: telefone,
  });
};
