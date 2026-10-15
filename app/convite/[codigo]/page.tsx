import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { readInvite } from '@/db/queries/invites';
import { getLocale } from '@/lib/locale.server';
import { ClaimInviteButton } from './claim-button';

export const metadata: Metadata = {
  title: 'Convite',
  robots: { index: false, follow: false },
};

const TEXT = {
  pt: {
    tituloValido: 'O seu perfil na OneSugar',
    tituloInvalido: 'Convite indisponível',
    expirado: 'Este convite expirou. Peça um novo à equipa OneSugar.',
    reclamado: 'Este perfil já está ligado a uma conta. Se é seu, basta entrar com essa conta.',
    invalido: 'Este link não é válido. Confirme que o copiou completo.',
    explicacao: (nome: string) =>
      `Preparámos um perfil para si${nome ? ` (${nome})` : ''}. Ao continuar, ele passa a estar ligado à sua conta: pode editá-lo, completar a informação que falta e decidir o que fica publicado.`,
    criar: 'Criar conta e ficar com o perfil',
    jaTem: 'Já criou conta antes?',
    entrar: 'Entrar',
    naoQuer: 'Se não quer ter perfil na OneSugar, responda à mensagem da nossa equipa e o perfil é apagado.',
  },
  en: {
    tituloValido: 'Your profile on OneSugar',
    tituloInvalido: 'Invitation unavailable',
    expirado: 'This invitation has expired. Ask the OneSugar team for a new one.',
    reclamado: 'This profile is already linked to an account. If it is yours, just sign in with that account.',
    invalido: 'This link is not valid. Make sure you copied all of it.',
    explicacao: (nome: string) =>
      `We have prepared a profile for you${nome ? ` (${nome})` : ''}. When you continue, it is linked to your account: you can edit it, add the missing details and decide what is published.`,
    criar: 'Create an account and keep the profile',
    jaTem: 'Already created an account?',
    entrar: 'Sign in',
    naoQuer: 'If you do not want a profile on OneSugar, reply to our team’s message and the profile will be deleted.',
  },
} as const;

/**
 * Página do convite que o admin envia a uma candidata para ela ficar com o
 * perfil que foi preparado. Entra (ou cria conta) e confirma: o perfil passa
 * a ser dela e segue para o registo, já preenchido.
 */
export default async function ConvitePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const [convite, { userId }, locale] = await Promise.all([readInvite(codigo), auth(), getLocale()]);
  const t = TEXT[locale];
  // Depois de entrar ou criar conta, volta ao mesmo convite e no mesmo idioma.
  const aqui = `${locale === 'en' ? '/en' : ''}/convite/${codigo}`;

  return (
    <div className="container mx-auto flex max-w-lg justify-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">
            {convite.estado === 'valido' ? t.tituloValido : t.tituloInvalido}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {convite.estado === 'expirado' && <p>{t.expirado}</p>}
          {convite.estado === 'reclamado' && <p>{t.reclamado}</p>}
          {convite.estado === 'invalido' && <p>{t.invalido}</p>}

          {convite.estado === 'valido' && (
            <>
              <p>{t.explicacao(convite.nome)}</p>
              {userId ? (
                <ClaimInviteButton codigo={codigo} locale={locale} />
              ) : (
                <div className="space-y-2">
                  <SignUpButton mode="modal" forceRedirectUrl={aqui} signInForceRedirectUrl={aqui}>
                    <Button className="w-full">{t.criar}</Button>
                  </SignUpButton>
                  {/* Quase sempre ela não tem conta. Fica para quem já a criou
                      (por exemplo, abriu este link antes e não terminou). */}
                  <p className="text-center text-xs">
                    {t.jaTem}{' '}
                    <SignInButton mode="modal" forceRedirectUrl={aqui} signUpForceRedirectUrl={aqui}>
                      <button type="button" className="underline hover:text-foreground">
                        {t.entrar}
                      </button>
                    </SignInButton>
                  </p>
                </div>
              )}
              <p className="text-xs">{t.naoQuer}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
