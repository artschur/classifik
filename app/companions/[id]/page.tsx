import { Suspense } from 'react';
import { ReviewsSkeleton } from '@/components/skeletons/skeletonReview';
import CompanionReviews from '@/components/companionReviews';
import {
  CompanionProfile,
  CompanionSkeleton,
} from '@/components/CompanionProfile';
import { getReviewsByCompanionId } from '@/db/queries/reviews';
import { PageViewTracker } from '@/components/analytics-components';
import { auth } from '@clerk/nextjs/server';
import { isUserBlocked } from '@/db/queries/companions';
import { BlockedProfileMessage } from '@/components/blocked-profile-message';
import { redirect } from 'next/navigation';

export default async function CompanionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companionId = parseInt(id);

  // Check if user is blocked
  const { userId } = await auth();
  let isBlocked = false;

  if (userId) {
    isBlocked = await isUserBlocked(companionId, userId);
  }

  // If user is blocked, show blocked message
  if (isBlocked) {
    return <BlockedProfileMessage />;
  }

  const [reviews] = await Promise.all([getReviewsByCompanionId(companionId)]);
  const reviewsRating =
    reviews.length > 0
      ? reviews.map((review) => review.rating).sort((a, b) => a - b)[
          Math.floor(reviews.length / 2)
        ]
      : 'Sem avaliações';

  return (
    <div className="flex flex-col gap-4">
      <PageViewTracker companionId={companionId} />
      <Suspense fallback={<CompanionSkeleton />}>
        <CompanionProfile id={companionId} reviewsRating={reviewsRating} />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <CompanionReviews id={companionId} initialReviews={reviews} />
      </Suspense>
    </div>
  );
}
