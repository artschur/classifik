import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isUserACompanion } from '@/db/queries/companions';
import { definirPerfil } from '@/lib/definir-perfil';
import { localizeHref, type Locale } from '@/lib/i18n';

/**
 * Destino do registo feito a partir do popup "Sou Sugar / Sou Cliente": grava
 * a escolha e segue directo para a página de destino, sem passar pelo
 * /onboarding. Quem já tem perfil ou já escolheu antes não é alterada.
 */
export async function GET(req: Request) {
  const { userId, sessionClaims } = await auth();
  // O popup diz em que língua estava a pessoa (lang=en), e o registo segue nela.
  const locale: Locale = new URL(req.url).searchParams.get('lang') === 'en' ? 'en' : 'pt';
  const para = (caminho: string) =>
    NextResponse.redirect(new URL(localizeHref(caminho, locale), req.url));

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
