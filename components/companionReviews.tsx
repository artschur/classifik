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
import type { ReviewResponse } from '@/db/queries/reviews';
import { useState } from 'react';
import { Star } from 'lucide-react';

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

  // Calculate average rating
  const averageRating =
    reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length ||
    0;

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center justify-between md:justify-start w-full gap-2">
            <div className="flex flex-row gap-3 items-center">
              <Star className="w-6 h-6 text-red-400 fill-red-400" />
              <span className="text-2xl font-semibold">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <Badge variant="secondary" className="text-sm">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </Badge>
          </div>
        </div>

        <Card className="w-full">
          <CardContent>
            <div className="">
              <Suspense fallback={<ReviewsSkeleton />}>
                <ReviewsList initialReviews={reviews} />
              </Suspense>
            </div>
          </CardContent>
          <CardFooter>
            <InsertReviewsForm companionId={id} onAddReview={handleAddReview} />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
