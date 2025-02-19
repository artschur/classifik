'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp } from 'lucide-react';
import { likeReview, unlikeReview } from '@/db/queries/reviews';
import type { ReviewResponse } from '@/db/queries/reviews';
import { useState } from 'react';

export function Review({
  review,
  user,
}: {
  review: ReviewResponse;
  user: any;
}) {
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user?.id || isLiking) return;
    setIsLiking(true);
    if (review.userLiked) {
      await unlikeReview(review.id, user.id);
      setIsLiking(false);
      review.likes--;
      review.userLiked = false;
      return;
    }
    await likeReview(review.id, user.id);
    setIsLiking(false);
    review.likes++;
    review.userLiked = true;
  };
  console.log(review.userLiked);
  return (
    <div className="flex items-start gap-4">
      <Avatar className="w-10 h-10">
        <AvatarImage
          src={`https://api.dicebear.com/6.x/initials/svg?seed=${review.author}`}
        />
        <AvatarFallback>{review.author?.slice(0, 2) || 'AN'}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{review.author || 'Anonymous'}</h3>
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < (review.rating || 0)
                    ? 'text-yellow-300 fill-yellow-300'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {review.created_at?.toLocaleDateString().toString() ?? ''}
        </p>
        <p className="mt-2 text-sm">{review.comment}</p>
        {user && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={handleLike}
              disabled={isLiking}
            >
              {review.userLiked ? (
                <>
                  <ThumbsUp className="w-4 h-4 mr-1 fill-neutral-400" />
                  Útil ({review.likes})
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Útil ({review.likes})
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReviewsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/4 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
