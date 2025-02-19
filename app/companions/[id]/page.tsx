import { Suspense } from 'react';
import { ReviewsSkeleton } from '@/components/skeletons/skeletonReview';
import CompanionReviews from '@/components/companionReviews';
import {
  CompanionProfile,
  CompanionSkeleton,
} from '@/components/CompanionProfile';
import { getReviewsByCompanionId } from '@/db/queries/reviews';

export default async function CompanionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [reviews] = await Promise.all([getReviewsByCompanionId(parseInt(id))]);

  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<CompanionSkeleton />}>
        <CompanionProfile id={parseInt(id)} />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <CompanionReviews id={parseInt(id)} initialReviews={reviews} />
      </Suspense>
    </div>
  );
}
