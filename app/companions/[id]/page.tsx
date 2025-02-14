import { Suspense } from 'react';
import { ReviewsSkeleton } from '@/components/skeletons/skeletonReview';
import CompanionReviews from '@/components/companionReviews';
import { CompanionProfile, CompanionSkeleton } from '@/components/CompanionProfile';

export default async function CompanionPage({ params } : {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<CompanionSkeleton />}>
        <CompanionProfile id={parseInt(id)} />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <CompanionReviews id={parseInt(id)} />
      </Suspense>
    </div>
  );
}
