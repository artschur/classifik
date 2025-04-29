import { Suspense } from 'react';
import { ReviewsSkeleton } from '@/components/skeletons/skeletonReview';
import CompanionReviews from '@/components/companionReviews';
import {
  CompanionProfile,
  CompanionSkeleton,
} from '@/components/CompanionProfile';
import { getReviewsByCompanionId } from '@/db/queries/reviews';
import { PageViewTracker } from '@/components/analytics-components';

export default async function CompanionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [reviews] = await Promise.all([getReviewsByCompanionId(parseInt(id))]);
  const reviewsRating =
    reviews.length > 0
      ? reviews.map((review) => review.rating).sort((a, b) => a - b)[
          Math.floor(reviews.length / 2)
        ]
      : 'Sem avaliações';

  return (
    <div className="flex flex-col gap-4">
      <PageViewTracker companionId={parseInt(id)} />
      <Suspense fallback={<CompanionSkeleton />}>
        <CompanionProfile id={parseInt(id)} reviewsRating={reviewsRating} />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <CompanionReviews id={parseInt(id)} initialReviews={reviews} />
      </Suspense>
    </div>
  );
}
