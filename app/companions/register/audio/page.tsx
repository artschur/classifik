import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCompanionNameByClerkId } from '@/db/queries/companions';
import AudioFormClient from './audio-form';
import { isVerificationPending } from '@/app/actions/document-verification';
import { canRecordAudio } from '@/lib/audio-access';
import { getLocale } from '@/lib/locale.server';
import { localizeHref } from '@/lib/i18n';

const TEXT = {
  pt: {
    semPerfil: 'Companion not found',
    titulo: (nome: string) => `Audio para ${nome}`,
  },
  en: {
    semPerfil: 'Profile not found',
    titulo: (nome: string) => `Audio for ${nome}`,
  },
} as const;

export default async function AudioPage() {
  const locale = await getLocale();
  const t = TEXT[locale];
  const { userId, redirectToSignIn } = await auth();

  // A entrada é a página do Clerk: /sign-in não existe no site.
  if (!userId) {
    return redirectToSignIn();
  }

  const [isUserVerified, companion] = await Promise.all([
    isVerificationPending(userId),
    getCompanionNameByClerkId(userId),
  ]);

  if (isUserVerified) {
    redirect(localizeHref('/companions/verification/pending', locale));
  }

  if (!(await canRecordAudio(userId))) {
    redirect(localizeHref('/checkout', locale));
  }

  if (!companion) {
    return <div>{t.semPerfil}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">{t.titulo(companion.name)}</h1>

      <Suspense
        fallback={
          <div className="flex flex-col gap-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 w-full flex flex-row bg-neutral-200 animate-pulse rounded-md"
              ></div>
            ))}
          </div>
        }
      >
        <AudioFormClient companionId={companion.id} userId={userId} />
      </Suspense>
    </div>
  );
}
