import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isUserACompanion } from '@/db/queries/companions';
import { definirPerfil } from '@/lib/definir-perfil';

/**
 * Destino do registo feito a partir do popup "Sou Sugar / Sou Cliente": grava
 * a escolha e segue directo para a página de destino, sem passar pelo
 * /onboarding. Quem já tem perfil ou já escolheu antes não é alterada.
 */
export async function GET(req: Request) {
  const { userId, sessionClaims } = await auth();
  const para = (caminho: string) => NextResponse.redirect(new URL(caminho, req.url));

  if (!userId) return para('/');
  if (await isUserACompanion(userId)) return para('/profile');

  const metadata = sessionClaims?.metadata;
  if (metadata?.onboardingComplete) {
    return para(metadata.isCompanion ? '/companions/register' : '/location');
  }

  const sugar = new URL(req.url).searchParams.get('tipo') === 'sugar';
  await definirPerfil(userId, sugar);
  return para(sugar ? '/companions/register' : '/location');
}
