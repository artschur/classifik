'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { CompanionFiltered, FilterTypesCompanions } from '@/types/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCompanionsToFilter } from '@/db/queries/companions';
import { useEffect, useState } from 'react';

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
      console.log('Fetching companions:', location, page, filters);
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

function CompanionCard({ companion }: { companion: CompanionFiltered }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === companion.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? companion.images.length - 1 : prevIndex - 1
    );
  };

  return (
    <Link
      href={`/companions/${companion.id}`}
      className="transition-transform duration-200 ease-in-out transform hover:scale-105"
    >
      <Card className="h-full overflow-hidden">
        <div className="relative aspect-[4/3]">
          <Image
            src={companion.images[currentImageIndex] ?? '/image.png'}
            alt={companion.name}
            fill={true}
            className="object-cover"
          />
          {companion.images.length > 1 && (
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
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">{companion.name}</h3>
            <Badge variant="secondary">{companion.age} years</Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {companion.shortDescription}
          </p>
          <div className="flex flex-wrap gap-2">
            {companion.silicone && <Badge variant="outline">Silicone</Badge>}
            {companion.ethinicity && (
              <Badge variant="outline">{companion.ethinicity}</Badge>
            )}
            {companion.eyeColor && (
              <Badge variant="outline">{companion.eyeColor}</Badge>
            )}
            {companion.hairColor && (
              <Badge variant="outline">{companion.hairColor}</Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <span className="text-lg font-bold">
            € {companion.price.toFixed(2)}
          </span>
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
