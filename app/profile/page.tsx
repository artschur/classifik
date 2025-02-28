import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { getCompanionIdByClerkId } from '@/db/queries/companions';
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
  const companionId = await getCompanionIdByClerkId(userId);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard de Métricas</h1>
      <AnalyticsTimeframe days={days} />

      <Suspense fallback={<Button disabled>Carregando...</Button>}>
        <AnalyticsMain days={days} companionId={companionId} />
      </Suspense>
    </div>
  );
}
