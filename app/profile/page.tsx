import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
  getCompanionByClerkId,
  getCompanionIdByClerkId,
} from '@/db/queries/companions';
import { auth } from '@clerk/nextjs/server';
import AnalyticsMain from '@/components/analytics-main';
import { AnalyticsTimeframe } from '@/components/timeframe-selection-analytics';

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
  const companion = await getCompanionByClerkId(userId);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold">Dashboard de Métricas</h1>
      <p className="text-xl font-sans text-gray-300 pt-4">
        Olá {companion.name}. <br /> Aqui você verá a interação de seus clientes
        com o seu perfil.
      </p>
      <div className="pt-8">
        <AnalyticsTimeframe days={days} />
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
