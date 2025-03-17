import { Suspense } from 'react';
import { getRelevantInfoAnalytics } from '@/db/queries/companions';
import { auth } from '@clerk/nextjs/server';
import AnalyticsMain from '@/components/analytics-main';
import { AnalyticsTimeframe } from '@/components/timeframe-selection-analytics';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AnalyticsDashboard({
  searchParams,
}: {
  searchParams: Promise<{ days: string }>;
}) {
  const { userId } = await auth();
  const sParams = await searchParams;

  if (!userId) {
    return <div>Faca login para ver as analytics</div>;
  }

  const days = sParams.days ? parseInt(sParams.days) : 7;
  const companion = await getRelevantInfoAnalytics({ clerkId: userId });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex space-x-4 mb-6">
        <Link href={'/companions/register'}>
          <Button variant="default">Suas informações</Button>
        </Link>
        <Link href={'/companions/register/audio/'}>
          <Button variant="default">Audios</Button>
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Olá {companion.name}!</h1>
      <p className="text-xl font-sans text-gray-300 pt-4">
        Esse é seu dashboard de métricas. <br /> Aqui você verá a interação de
        seus clientes com o seu perfil.
      </p>
      <div className="pt-8">
        <AnalyticsTimeframe days={days} />
      </div>
      <div className="grid grid-cols-2 gap-4 py-4">
        <div className="p-4 rounded-lg bg-card">
          <h3 className="text-lg font-semibold">Total de Interações</h3>
          <p className="text-2xl font-bold">{companion.interactions}</p>
        </div>
        <div className="p-4 rounded-lg bg-card">
          <h3 className="text-lg font-semibold">Avaliação Média</h3>
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
