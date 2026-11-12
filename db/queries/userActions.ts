'use server';

import { auth } from "@clerk/nextjs/server";

// Tudo o que está aqui é chamável pelo navegador: só dados da própria sessão.
// O último acesso de uma anunciante passou para lib/ultimo-acesso.ts, e o id
// da conta a partir do perfil para app/actions/document-verification.ts, os
// dois só do servidor.

export async function getEmail() {
  const { sessionClaims } = await auth();
  return sessionClaims?.email;
}

export async function getLastSignIn() {
  const { sessionClaims } = await auth();
  return sessionClaims?.last_sign_in;
}
