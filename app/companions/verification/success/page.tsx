import { Button } from '@/components/ui/button';
import {
  getCompanionByClerkId,
  getCompanionNameByClerkId,
} from '@/db/queries/companions';
import { auth } from '@clerk/nextjs/server';
import { Suspense } from 'react';
import { LocaleLink } from '@/components/locale-link';
import { getLocale } from '@/lib/locale.server';

const TEXT = {
  pt: {
    parabens: 'Parabéns',
    verificada: 'Sua conta foi verificada com',
    sucesso: ' sucesso.',
    agora:
      'Agora você pode vizualizar suas estatísticas e aparecer para clientes ao redor do mundo 🌎',
    verPerfil: 'Visualizar seu perfil',
  },
  en: {
    parabens: 'Congratulations',
    verificada: 'Your account has been',
    sucesso: ' verified.',
    agora:
      'You can now see your statistics and appear to clients around the world 🌎',
    verPerfil: 'View your profile',
  },
} as const;

async function getCompanionName() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { name } = await getCompanionNameByClerkId(userId);

  if (!name) {
    throw new Error('Companion not found');
  }
  return { name };
}

async function CompanionGreeting() {
  const { name } = await getCompanionName();
  return <span className="">{name}</span>;
}

export default async function SucessfulVerificationPage() {
  const locale = await getLocale();
  const t = TEXT[locale];
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="flex flex-col items-start">
        <h1 className="text-3xl">
          {t.parabens} <br />
          <Suspense
            fallback={
              <div className="h-8 w-48 bg-stone-600 rounded-lg animate-pulse"></div>
            }
          >
            <CompanionGreeting />!
          </Suspense>
        </h1>
        <h1 className="text-xl pt-4">
          {t.verificada}
          <span className="text-green-500">{t.sucesso}</span>
        </h1>
        <p className="text-muted-foreground max-w-[400px] pt-2">{t.agora}</p>
        <LocaleLink locale={locale} href={`/profile`}>
          <Button
            variant="default"
            className="mt-4 bg-green-500 text-green-900 hover:bg-green-800 hover:text-green-200"
          >
            {t.verPerfil}
          </Button>
        </LocaleLink>
      </div>
    </div>
  );
}
