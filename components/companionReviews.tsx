'use client';

import { Suspense } from 'react';
import { ReviewsList } from './reviewsList';
import InsertReviewsForm from './insertReviewsForm';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReviewsSkeleton } from './skeletons/skeletonReview';
import { ReviewResponse } from '@/db/queries/reviews';
import { useState } from 'react';

export default function CompanionReviews({
  id,
  initialReviews,
}: {
  id: number;
  initialReviews: ReviewResponse[];
}) {
  const [reviews, setReviews] = useState(initialReviews);

  const handleAddReview = (newReview: ReviewResponse) => {
    setReviews((prev) => [newReview, ...prev]);
  };

  return (
    <Card className="w-full max-w-5xl mx-auto mt-8 px-8 py-6">
      <CardHeader className="flex flex-row items-center justify-start">
        <Badge variant="secondary">{reviews.length} reviews</Badge>
      </CardHeader>
      <CardContent>
        <div className="">
          <Suspense fallback={<ReviewsSkeleton />}>
            <ReviewsList initialReviews={reviews} />
          </Suspense>
        </div>
      </CardContent>
      <CardFooter className="">
        <InsertReviewsForm companionId={id} onAddReview={handleAddReview} />
      </CardFooter>
    </Card>
  );
}
