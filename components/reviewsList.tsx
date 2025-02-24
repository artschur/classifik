'use client';

import { Suspense } from 'react';
import {
  getReviewsByCompanionId,
  type ReviewResponse,
} from '@/db/queries/reviews';
import { Review } from './ui/review';
import { SignInButton, useUser } from '@clerk/nextjs';
import { ReviewsSkeleton } from './ui/review';
import { IconEyeClosed } from '@tabler/icons-react';
import { companionsTable } from '@/db/schema';
import { usePathname } from 'next/navigation';

function ReviewsContent({
  reviews,
  user,
}: {
  reviews: ReviewResponse[];
  user: any;
}) {
  if (reviews.length === 0) {
    return (
      <div className="py-8 mt-8 h-32 text-center flex flex-col items-center">
        <p className="text-muted-foreground mt-8">Nenhum review ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-6">
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
  if (!user) {
    return (
      <div className="py-8 text-center flex flex-col items-center">
        <IconEyeClosed className="w-12 h-12 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">Faça login para ver os reviews</p>
        <SignInButton mode="modal" forceRedirectUrl={usePathname()}>
          <div className="px-4 p-2 m-4 hover:cursor-pointer rounded-lg bg-primary">
            Entrar
          </div>
        </SignInButton>

        <div className="w-full space-y-2">
          {initialReviews.map((review) => (
            <div
              key={review.id}
              className="flex items-start gap-8 space-y-4 animate-pulse"
            >
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <Suspense fallback={<ReviewsSkeleton />}>
      <ReviewsContent reviews={initialReviews} user={user} />
    </Suspense>
  );
}
