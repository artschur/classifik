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
    <Card className="w-full max-w-5xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <Badge variant="secondary">{reviews.length} reviews</Badge>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<ReviewsSkeleton />}>
          <ReviewsList initialReviews={reviews} />
        </Suspense>
      </CardContent>
      <CardFooter>
        <InsertReviewsForm companionId={id} onAddReview={handleAddReview} />
      </CardFooter>
    </Card>
  );
}
