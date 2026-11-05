import { Suspense } from 'react';
import { getRelevantInfoAnalytics } from '@/db/queries/companions';
import { auth, clerkClient } from '@clerk/nextjs/server';
import AnalyticsMain from '@/components/analytics-main';
import { AnalyticsTimeframe } from '@/components/timeframe-selection-analytics';
import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/components/locale-link';
import { getLocale } from '@/lib/locale.server';
import { kv } from '@/db';
import { getActiveSubscriptionByClerkId } from '@/db/queries/subscriptions';
import { db } from '@/db';
import { paymentsTable } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ManageAdActions } from '@/components/manage-ad-actions';
import { canRecordAudio } from '@/lib/audio-access';
import { Mic } from 'lucide-react';
import { EstadoRegisto } from '@/components/registo/estado-registo';

const TEXT = {
  pt: {
    semSessao: 'Faca login para ver as analytics',
    editar: 'Editar Perfil',
    audio: 'Gravar áudio',
    bloqueios: 'Gerenciar Bloqueios',
    ola: (nome: string) => `Olá ${nome}!`,
    intro1: 'Esse é seu dashboard de métricas. ',
    intro2: ' Aqui você verá a interação de seus clientes com o seu perfil.',
    planoPagamento: 'Plano de pagamento',
    planoAtual: 'Plano Atual',
    diasRestantes: (n: number) => `${n} dias restantes`,
    interacoes: 'Total de Interações',
    avaliacao: 'Avaliação Média',
  },
  en: {
    semSessao: 'Sign in to see your analytics',
    editar: 'Edit profile',
    audio: 'Record audio',
    bloqueios: 'Manage blocked users',
    ola: (nome: string) => `Hi ${nome}!`,
    intro1: 'This is your stats dashboard. ',
    intro2: ' Here you can see how clients interact with your profile.',
    planoPagamento: 'Payment plan',
    planoAtual: 'Current plan',
    diasRestantes: (n: number) => (n === 1 ? '1 day left' : `${n} days left`),
    interacoes: 'Total interactions',
    avaliacao: 'Average rating',
  },
} as const;

interface AdPurchase {
  id: string;
  productId: string;
  productName: string;
  purchaseDate: string; // Consider using Date if you parse it
  durationDays: number;
}

interface AdPurchases {
  adPurchases: AdPurchase[];
}

async function getRemainingDays(userId: string): Promise<number> {
  try {
    // First, check for active subscription
    const subscription = await getActiveSubscriptionByClerkId(userId);

    if (subscription) {
      const now = new Date();
      const endDate = new Date(subscription.current_period_end);
      const timeDiff = endDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      return Math.max(0, daysRemaining);
    }

    // Fallback to legacy payment system
    const [latestPayment] = await db
      .select({ maxAllowedDate: paymentsTable.max_allowed_date })
      .from(paymentsTable)
      .where(eq(paymentsTable.clerk_id, userId))
      .orderBy(desc(paymentsTable.date))
      .limit(1);

    if (latestPayment?.maxAllowedDate) {
      const now = new Date();
      const endDate = new Date(latestPayment.maxAllowedDate);
      const timeDiff = endDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      return Math.max(0, daysRemaining);
    }

    return 0; // No active plan
  } catch (error) {
    console.error('Error calculating remaining days:', error);
    return 0;
  }
}

export default async function AnalyticsDashboard({
  searchParams,
}: {
  searchParams: Promise<{ days: string }>;
}) {
  const locale = await getLocale();
  const t = TEXT[locale];
  const { userId, sessionClaims } = await auth();
  const sParams = await searchParams;

  if (!userId) {
    return <div>{t.semSessao}</div>;
  }

  const days = sParams.days ? parseInt(sParams.days) : 7;
  const companion = await getRelevantInfoAnalytics({ clerkId: userId });

  // Get remaining days for the current plan
  const [remainingDays, showAudio] = await Promise.all([
    getRemainingDays(userId),
    // Só com perfil criado: o áudio fica ligado ao anúncio.
    companion.id !== 0 ? canRecordAudio(userId) : Promise.resolve(false),
  ]);

  return (
    <div className="container mx-auto py-8 px-4">
      {companion.id !== 0 && (
        <EstadoRegisto clerkId={userId} contexto="painel" centrado={false} />
      )}
      <div className="flex flex-wrap gap-4 mb-6">
        <LocaleLink locale={locale} href={'/companions/register'}>
          <Button variant="default">{t.editar}</Button>
        </LocaleLink>
        {showAudio && (
          <LocaleLink locale={locale} href={'/companions/register/audio'}>
            <Button variant="default">
              <Mic className="h-4 w-4" />
              {t.audio}
            </Button>
          </LocaleLink>
        )}
        {sessionClaims.metadata.plan === 'vip' ? (
          <LocaleLink locale={locale} href={'/block'}>
            <Button variant="outline">{t.bloqueios}</Button>
          </LocaleLink>
        ) : null}
        {companion.id !== 0 && (
          <ManageAdActions initialPaused={companion.paused} />
        )}
      </div>
      <h1 className="text-3xl font-bold">
        {/* Sem perfil, a query devolve o nome "Usuário": em inglês fica "Hi there!" */}
        {t.ola(locale === 'en' && companion.id === 0 ? 'there' : companion.name)}
      </h1>
      <p className="text-xl font-sans text-gray-300 pt-4">
        {t.intro1}
        <br />
        {t.intro2}
      </p>
      <div className="p-8 text-white">{t.planoPagamento}</div>
      <div className="p-4 rounded-lg bg-card">
        <h3 className="text-lg font-semibold">{t.planoAtual}</h3>
        <p className="text-2xl font-bold capitalize">
          {companion.plan ?? 'Free'}
        </p>
        <p className="text-lg font-semibold">{t.diasRestantes(remainingDays)}</p>
      </div>

      <div className="pt-8">
        <AnalyticsTimeframe days={days} />
      </div>
      <div className="grid grid-cols-2 gap-4 py-4">
        <div className="p-4 rounded-lg bg-card">
          <h3 className="text-lg font-semibold">{t.interacoes}</h3>
          <p className="text-2xl font-bold">{companion.interactions}</p>
        </div>
        <div className="p-4 rounded-lg bg-card">
          <h3 className="text-lg font-semibold">{t.avaliacao}</h3>
          {/* No need for toFixed here since we did it in the function */}
          <p className="text-2xl font-bold">{companion.averageRating}/5</p>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-lg bg-card animate-pulse"
                />
              ))}
            </div>
            <div className="h-[400px] w-full rounded-lg bg-card animate-pulse" />
          </div>
        }
      >
        <div className="py-2">
          <AnalyticsMain days={days} companionId={companion.id} />
        </div>
      </Suspense>
    </div>
  );
}
