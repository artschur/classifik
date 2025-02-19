'use client';

import { CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { insertReview, ReviewResponse } from '@/db/queries/reviews';
import { useUser } from '@clerk/nextjs';
import { useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function InsertReviewsForm({
  companionId,
  onAddReview,
}: {
  companionId: number;
  onAddReview?: (review: ReviewResponse) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useUser();

  async function handleSubmit(formData: FormData) {
    if (!user) return;
    startTransition(async () => {
      try {
        const newReview = await insertReview({
          companion_id: companionId,
          rating,
          comment: formData.get('comment') as string,
          clerkId: user.id,
        });
        setComment('');
        setRating(5);
        onAddReview?.(newReview);
        toast({
          title: 'Review Added',
          description: 'Your review has been successfully added.',
          variant: 'success',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to add review. Please try again.',
          variant: 'destructive',
        });
      }
    });
  }

  if (!user) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Please login to leave a review</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit}>
      <CardTitle>Deixe seu review</CardTitle>
      <div className="flex items-center gap-4">
        <Avatar className="w-10 h-10">
          <AvatarImage
            src={
              user.imageUrl ||
              `https://api.dicebear.com/6.x/initials/svg?seed=${user.username}`
            }
          />
          <AvatarFallback>{user.firstName?.slice(0, 2) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{user.firstName || user.username}</h3>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  onClick={() => setRating(i + 1)}
                  className={`w-4 h-4 cursor-pointer ${
                    i < rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <textarea
            name="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full h-24 mt-2 p-2 border border-gray-300 rounded"
            placeholder="Escreva seu review"
          ></textarea>
          <div className="flex items-center gap-2 mt-2">
            <Button type="submit" variant="default" size="sm">
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
