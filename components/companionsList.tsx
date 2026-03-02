'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { CompanionFiltered, FilterTypesCompanions, Media } from '@/types/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getCompanionsToFilter } from '@/db/queries/companions';
import { useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Check } from 'lucide-react';
import { PlanType } from '@/db/queries/kv';

export function CompanionsList({
  location,
  page,
  filters,
}: {
  location: string;
  page: number;
  filters?: FilterTypesCompanions;
}) {
  const [companions, setCompanions] = useState<CompanionFiltered[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanions = async () => {
      setLoading(true);
      try {
        const data = await getCompanionsToFilter(location, page, filters);
        setCompanions(data);
      } catch (error) {
        console.error('Failed to fetch companions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanions();
  }, [location, page, filters]);

  if (loading) {
    return <CompanionsListSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {companions.map((companion: CompanionFiltered) => (
        <CompanionCard key={companion.id} companion={companion} />
      ))}
    </div>
  );
}

const planRibbonStyles: Record<string, { bg: string; text: string; border: string; label: string; emoji: string }> = {
  vip: {
    bg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    text: 'text-yellow-900',
    border: 'border-yellow-600/30',
    label: 'VIP',
    emoji: '👑',
  },
  plus: {
    bg: 'bg-gradient-to-r from-orange-400 to-rose-400',
    text: 'text-white',
    border: 'border-orange-600/30',
    label: 'Plus',
    emoji: '⭐',
  },
  classic: {
    bg: 'bg-gradient-to-r from-pink-300 to-rose-400',
    text: 'text-rose-900',
    border: 'border-rose-400/30',
    label: 'Classic',
    emoji: '✨',
  },
};

const PlanRibbon = ({ plan }: { plan?: string | null }) => {
  if (!plan || plan === 'free') return null;

  const style = planRibbonStyles[plan.toLowerCase()];
  // const style = planRibbonStyles["classic"];
  if (!style) return null;

  return (
    <div className="absolute top-0 right-0 z-10 w-24 h-24 pointer-events-none">
      {/* Floating emoji — top-right, slightly rotated */}
      <span className="absolute -top-1 right-0 text-3xl drop-shadow-md rotate-45 inline-block">
        {style.emoji}
      </span>
      {/* Diagonal ribbon strip */}
      <div className="overflow-hidden w-full h-full absolute inset-0">
        <div
          className={`absolute top-[18px] -right-[28px] ${style.bg} ${style.text} text-[11px] font-bold py-1 w-32 text-center transform rotate-45 shadow-md uppercase tracking-wider border-b ${style.border}`}
        >
          {style.label}
        </div>
      </div>
    </div>
  );
};

export function CompanionCard({ companion }: { companion: CompanionFiltered }) {
  const images = companion.images
    .filter((media): media is string | Media => {
      if (typeof media === 'string') {
        return !media.match(/\.(mp4|webm|ogg)$/i);
      }
      return media.type !== 'video';
    })
    .map((media) => (typeof media === 'object' ? media.publicUrl : media));

  // const getPlanBadge = (planType?: string | null) => {
  //   switch (planType) {
  //     case 'basico':
  //       return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Clássico</Badge>;
  //     case 'plus':
  //       return <Badge className="bg-purple-100 text-purple-800 border-purple-200">PLUS</Badge>;
  //     case 'vip':
  //       return (
  //         <Badge className="bg-gold-100 text-gold-800 border-gold-200 bg-gradient-to-r from-yellow-200 to-yellow-300 text-yellow-900">
  //           VIP
  //         </Badge>
  //       );
  //     default:
  //       return (
  //         <Badge variant="outline" className="text-gray-600">
  //           FREE
  //         </Badge>
  //       );
  //   }
  // };

  return (
    <Link
      href={`/companions/${companion.id}`}
      className="transition-transform duration-200 ease-in-out transform hover:scale-102"
    >
      <Card className="h-full overflow-hidden">
        <Carousel className="w-full">
          <CarouselContent>
            {images.length > 0 ? (
              images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-[4/3]">
                    <PlanRibbon plan={companion.planType} />
                    <Image
                      src={image || '/placeholder.svg'}
                      alt={`${companion.name} - Image ${index + 1}`}
                      fill={true}
                      className="object-cover"
                    />
                    <Image
                      src={'/watermark.png'}
                      width={100}
                      height={100}
                      alt="Marca d'água"
                      className="absolute inset-0 m-auto h-16 w-16 opacity-80 invert"
                    />
                  </div>
                </CarouselItem>
              ))
            ) : (
              <CarouselItem>
                <div className="relative aspect-[4/3]">
                  <Image src="/image.png" alt={companion.name} fill={true} className="object-cover" />
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
          {images.length > 1 && (
            <>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
            </>
          )}
        </Carousel>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">{companion.name}</h3>
            <div className="flex items-center gap-2">
              {/*{getPlanBadge(companion.planType)}*/}
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Check className="w-3 h-3 mr-1" /> Verificado
              </Badge>
              <Badge variant="secondary">{companion.age} anos</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{companion.shortDescription}</p>
          <div className="flex flex-wrap gap-2">
            {companion.silicone && <Badge variant="outline">Silicone</Badge>}
            {companion.ethinicity && <Badge variant="outline">{companion.ethinicity}</Badge>}
            {companion.eyeColor && <Badge variant="outline">{companion.eyeColor}</Badge>}
            {companion.hairColor && <Badge variant="outline">{companion.hairColor}</Badge>}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <span className="text-lg font-bold">€ {companion.price.toFixed(2)}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export function CompanionsListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <Card key={index} className="h-full">
          <Skeleton className="w-full aspect-[4/3]" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="w-1/2 h-6" />
              <Skeleton className="w-1/4 h-6" />
            </div>
            <Skeleton className="w-full h-4 mb-2" />
            <Skeleton className="w-3/4 h-4 mb-2" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="w-20 h-6" />
              <Skeleton className="w-20 h-6" />
              <Skeleton className="w-20 h-6" />
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Skeleton className="w-1/4 h-6" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
