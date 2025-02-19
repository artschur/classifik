'use client';

import { Suspense } from 'react';
import type { ReviewResponse } from '@/db/queries/reviews';
import { Review } from './ui/review';
import { useUser } from '@clerk/nextjs';
import { ReviewsSkeleton } from './ui/review';

function ReviewsContent({
  reviews,
  user,
}: {
  reviews: ReviewResponse[];
  user: any;
}) {
  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Nenhum review ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reviews.map((review) => (
        <Review key={review.id} review={review} user={user} />
      ))}
    </div>
  );
}

export function ReviewsList({
  initialReviews,
}: {
  initialReviews: ReviewResponse[];
}) {
  const { user } = useUser();

  return (
    <Suspense fallback={<ReviewsSkeleton />}>
      <ReviewsContent reviews={initialReviews} user={user} />
    </Suspense>
  );
}
