import { Suspense } from 'react';
import { getSelfAnalytics } from '@/db/queries/analytics';
import { AnalyticsChart } from '@/components/analytics-chart';
import { AnalyticsCards } from './analytics-cards';

export default async function AnalyticsMain({
  days,
  companionId,
}: {
  days: number;
  companionId: number;
}) {
  const analytics = await getSelfAnalytics({ days, companionId });

  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-32 bg-muted/20 rounded-lg animate-pulse" />
            <div className="h-32 bg-muted/20 rounded-lg animate-pulse" />
          </div>
        }
      >
        <AnalyticsCards analytics={analytics} />
      </Suspense>

      <Suspense
        fallback={
          <div className="mt-6 h-80 bg-muted/20 rounded-lg animate-pulse" />
        }
      >
        <AnalyticsChart analytics={analytics} />
      </Suspense>
    </div>
  );
}
