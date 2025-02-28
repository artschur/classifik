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
    <div className="container mx-auto">
      <AnalyticsCards analytics={analytics} />
      <AnalyticsChart analytics={analytics} />
    </div>
  );
}
