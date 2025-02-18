'use client';

import {
  Check,
  X,
  User,
  Phone,
  MapPin,
  Languages,
  Ruler,
  Weight,
  Eye,
  Scissors,
} from 'lucide-react';
import type { RegisterCompanionFormValues } from './formCompanionRegister';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { approveCompanion, rejectCompanion } from '@/db/queries/companions';
import Link from 'next/link';
import Image from 'next/image';
import { CompanionFiltered, Media } from '@/types/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function SingleCompanionVerify({
  companion,
  onActionComplete,
}: {
  companion: CompanionFiltered;
  onActionComplete: (companionId: number) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = companion.images
    .filter((media): media is string | Media => {
      if (typeof media === 'string') {
        return !media.match(/\.(mp4|webm|ogg)$/i);
      }
      return media.type !== 'video';
    })
    .map((media) => (typeof media === 'object' ? media.publicUrl : media));

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      try {
        await approveCompanion(companion.id);
        toast({
          title: 'Companion Approved',
          description: `${companion.name} has been successfully approved.`,
          variant: 'success',
        });
        onActionComplete(companion.id);
      } catch (e) {
        setError('Failed to approve companion. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to approve companion. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleReject = () => {
    setError(null);
    startTransition(async () => {
      try {
        await rejectCompanion(companion.id);
        toast({
          title: 'Companion Rejected',
          description: `${companion.name} has been rejected.`,
          variant: 'success',
        });
        onActionComplete(companion.id);
      } catch (e) {
        setError('Failed to reject companion. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to reject companion. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">
            {companion.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={images[currentImageIndex] ?? '/image.png'}
            alt={companion.name}
            fill={true}
            className="object-cover rounded-lg"
          />
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={prevImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={nextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {companion.shortDescription}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{companion.age} anos</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{companion.shortDescription}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Ruler className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{companion.height}m</span>
          </div>
          <div className="flex items-center space-x-2">
            <Weight className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{companion.weight}kg</span>
          </div>
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{companion.eyeColor || 'N/A'}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={companion.silicone ? 'default' : 'secondary'}>
            Silicone
          </Badge>
          <Badge variant={companion.tattoos ? 'default' : 'secondary'}>
            Tatuagens
          </Badge>
          <Badge variant={companion.piercings ? 'default' : 'secondary'}>
            Piercings
          </Badge>
          <Badge variant={companion.smoker ? 'default' : 'secondary'}>
            Fumante
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Scissors className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{companion.hairColor}</span>
        </div>

        <p className="text-sm">{companion.shortDescription}</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between w-full gap-4">
          <Button
            variant="outline"
            className="w-full sm:w-1/2 bg-red-500 hover:bg-red-600 text-white"
            onClick={handleReject}
            disabled={isPending}
          >
            <X className="w-4 h-4 mr-2" /> Rejeitar
          </Button>
          <Button
            className="w-full sm:w-1/2 bg-green-500 hover:bg-green-600 text-white"
            onClick={handleApprove}
            disabled={isPending}
          >
            <Check className="w-4 h-4 mr-2" /> Aprovar
          </Button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {isPending && <p className="text-gray-500 text-sm">Processing...</p>}
      </CardFooter>
    </Card>
  );
}
