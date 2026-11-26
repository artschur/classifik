import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { db } from '@/db';
import { companionsTable } from '@/db/schema';
import { resumoDocumentos } from '@/db/queries/verificacao';
import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/components/locale-link';
import { getLocale } from '@/lib/locale.server';
import { localizeHref } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const TEXT = {
  pt: {
    meta: 'Anúncio criado',
    titulo: 'O seu anúncio foi criado com sucesso!',
    emAnalise: 'O seu perfil encontra-se em processo de análise pela nossa equipa.',
    verificacaoEnviadaTitulo: 'Verificação de identidade em análise',
    verificacaoEnviada:
      'Recebemos o seu vídeo e documento. Assim que forem aprovados, o seu perfil recebe o selo de verificação OneSugar.',
    verificacaoDepoisTitulo: 'Selo de verificação OneSugar',
    verificacaoDepois:
      'Poderá realizar a verificação de identidade posteriormente, diretamente através do seu perfil, para obter o selo de verificação OneSugar.',
    selo: 'Este selo transmite maior confiança, segurança e credibilidade aos utilizadores que visitam o seu perfil.',
    obrigado: 'Agradecemos a sua confiança e damos-lhe as boas-vindas à OneSugar!',
    completar: 'Completar as informações do meu perfil',
  },
  en: {
    meta: 'Listing created',
    titulo: 'Your listing has been created!',
    emAnalise: 'Your profile is now being reviewed by our team.',
    verificacaoEnviadaTitulo: 'Identity verification under review',
    verificacaoEnviada:
      'We have received your video and document. As soon as they are approved, your profile gets the OneSugar verified badge.',
    verificacaoDepoisTitulo: 'OneSugar verified badge',
    verificacaoDepois:
      'You can verify your identity later, directly from your profile, to get the OneSugar verified badge.',
    selo: 'This badge gives visitors to your profile more trust, safety and credibility.',
    obrigado: 'Thank you for your trust, and welcome to OneSugar!',
    completar: 'Complete my profile information',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  return { title: TEXT[await getLocale()].meta, robots: { index: false, follow: false } };
}

/**
 * Entre a verificação (passo 4) e o resto do perfil (passo 5): confirma que o
 * anúncio foi criado e diz em que pé está a verificação.
 */
export default async function PerfilCriadoPage() {
  const locale = await getLocale();
  const t = TEXT[locale];

  // A entrada é a página do Clerk: /sign-in não existe no site.
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const [companion] = await db
    .select({ id: companionsTable.id, identityVerified: companionsTable.identity_verified })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, userId))
    .limit(1);

  if (!companion) redirect(localizeHref('/companions/register', locale));

  const documentos = await resumoDocumentos(companion.id);
  const enviada = (estado: string) => estado === 'pendente' || estado === 'aprovado';
  const verificacaoEnviada =
    companion.identityVerified || (enviada(documentos.video) && enviada(documentos.documento));

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-500" />
          <h1 className="text-2xl font-semibold tracking-tight">{t.titulo}</h1>
          <p className="text-base text-muted-foreground">{t.emAnalise}</p>
        </div>

        <div className="space-y-4 px-6 pb-6">
          {verificacaoEnviada ? (
            <div className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <Clock className="h-6 w-6 shrink-0 text-amber-500" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{t.verificacaoEnviadaTitulo}</p>
                <p className="text-muted-foreground">{t.verificacaoEnviada}</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 rounded-xl border border-rose-600/30 bg-rose-600/5 p-4">
              <ShieldCheck className="h-6 w-6 shrink-0 text-rose-600" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{t.verificacaoDepoisTitulo}</p>
                <p className="text-muted-foreground">{t.verificacaoDepois}</p>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground">{t.selo}</p>
          <p className="text-center font-semibold">{t.obrigado}</p>
        </div>

        <div className="p-6 pt-0">
          <Button asChild size="lg" className="h-auto min-h-12 w-full whitespace-normal py-3 text-base font-semibold">
            <LocaleLink locale={locale} href="/companions/register/completar">
              {t.completar}
            </LocaleLink>
          </Button>
        </div>
      </div>
    </div>
  );
}
