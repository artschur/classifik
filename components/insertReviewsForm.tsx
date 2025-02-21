'use client';

import { CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { insertReview, ReviewResponse } from '@/db/queries/reviews';
import { useUser } from '@clerk/nextjs';
import { useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';
import { IconFlare } from '@tabler/icons-react';

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
  if (!user) return;

  return (
    <form action={handleSubmit} className="w-full flex flex-col gap-2 p-4">
      <Avatar className="w-10 h-10">
        <AvatarImage
          src={
            user.imageUrl ||
            `https://api.dicebear.com/6.x/initials/svg?seed=${user.username}`
          }
        />
        <AvatarFallback>{user.firstName?.slice(0, 2) || 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex flex-row justify-between">
        <h3 className="font-semibold">{user.username}</h3>
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <IconFlare
              key={i}
              onClick={() => setRating(i + 1)}
              className={`w-4 h-4 cursor-pointer ${
                i < rating ? 'text-red-400 fill-red-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col pb-4 pt-4 gap-6">
        <Textarea
          name="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full h-8 p-4 rounded-xl bg-neutral-950"
          placeholder="Escreva seu review..."
        />
        <Button type="submit" className="px-4" variant="default" size="sm">
          Enviar
        </Button>
      </div>
    </form>
  );
}
