'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { CompanionFiltered } from '@/types/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@clerk/nextjs/server';
import { getImagesByAuthId } from '@/db/queries/images';
import { useEffect, useState } from 'react';

export function GetCurrentUserImages({ userId }: { userId: string }) {
  const [images, setImages] = useState<{ publicUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImages() {
      setLoading(true);
      try {
        const fetchedImages = await getImagesByAuthId(userId);
        setImages(fetchedImages);
      } catch (error) {
        console.error('Failed to fetch images:', error);
        // Handle error appropriately, e.g., display an error message
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchImages();
    }
  }, [userId]);

  if (loading) {
    return <div>Loading images...</div>; // Or a skeleton loader
  }

  return (
    <div>
      {images.map((image) => (
        <Image
          src={image.publicUrl}
          width={200}
          height={200}
          alt="User uploaded image"
          key={image.publicUrl}
        />
      ))}
    </div>
  );
}

export function CompanionsList({
  companions,
}: {
  companions: CompanionFiltered[];
}) {
  if (!companions || companions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No companions found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {companions.map((companion: CompanionFiltered) => (
          <Link
            key={companion.id}
            href={`/companions/${companion.id}`}
            className="transition-transform duration-200 ease-in-out transform hover:scale-105"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{companion.name}</span>
                  <Badge variant="secondary">{companion.age} years</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-48 mb-4">
                  <Image
                    src={`/image.png`}
                    alt={companion.name}
                    fill={true}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {companion.shortDescription}
                </p>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="flex items-center">
                  <span>€ {companion.price.toFixed(2)}</span>
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CompanionsListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <Card key={index} className="h-full">
          <CardHeader>
            <Skeleton className="w-3/4 h-6" />
          </CardHeader>
          <CardContent>
            <Skeleton className="w-full h-48 mb-4" />
            <Skeleton className="w-full h-4 mb-2" />
            <Skeleton className="w-3/4 h-4" />
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Skeleton className="w-1/4 h-4" />
            <Skeleton className="w-1/4 h-4" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
