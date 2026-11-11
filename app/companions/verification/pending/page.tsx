import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getCompanionNameByClerkId } from '@/db/queries/companions';
import { EstadoRegisto } from '@/components/registo/estado-registo';
import { LocaleLink } from '@/components/locale-link';
import { getLocale } from '@/lib/locale.server';
import { localizeHref } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const TEXT = {
  pt: {
    obrigado: (nome: string) => `Obrigado, ${nome}!`,
    enviado:
      'O seu perfil foi enviado para a nossa equipa. Avisamos assim que for aprovado.',
    painel: 'Ir para o meu painel',
  },
  en: {
    obrigado: (nome: string) => `Thank you, ${nome}!`,
    enviado:
      "Your profile has been sent to our team. We'll let you know as soon as it's approved.",
    painel: 'Go to my dashboard',
  },
} as const;

/**
 * Fim do registo: o perfil está na fila do admin. Mostra o que ainda falta
 * (verificação, características) com o caminho para cada coisa.
 */
export default async function PendingVerificationPage() {
  const locale = await getLocale();
  const t = TEXT[locale];

  // A entrada é a página do Clerk: /sign-in não existe no site.
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const companion = await getCompanionNameByClerkId(userId).catch(() => null);
  if (!companion) redirect(localizeHref('/companions/register', locale));

  return (
    <div className="container mx-auto max-w-3xl space-y-8 px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t.obrigado(companion.name.trim())}</h1>
        <p className="text-muted-foreground">{t.enviado}</p>
      </div>

      <EstadoRegisto clerkId={userId} contexto="final" />

      <Button asChild>
        <LocaleLink locale={locale} href="/profile">
          {t.painel}
        </LocaleLink>
      </Button>
    </div>
  );
}
