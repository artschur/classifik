import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanionPreview } from '@/types/types';

export function CompanionCard({ companion }: { companion: CompanionPreview }) {
  const imageUrl = Array.isArray(companion.images) && companion.images.length > 0
    ? (typeof companion.images[0] === 'string' ? companion.images[0] : companion.images[0].publicUrl)
    : '/placeholder.png';

  return (
    <Link
      href={`/profile/${companion.id}`}
      className="group w-60 flex-shrink-0 overflow-hidden rounded-lg shadow-lg"
    >
      <div className="relative h-80 w-full">
        <Image
          src={imageUrl}
          alt={`Image of ${companion.name}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 text-white">
          <h3 className="truncate text-xl font-bold">{companion.name}</h3>
          <p className="text-sm">{companion.city}</p>
        </div>
      </div>
    </Link>
  );
}

export function CompanionCardSkeleton() {
  return (
    <div className="w-60 flex-shrink-0">
      <Skeleton className="h-80 w-full rounded-lg" />
      <div className="mt-2 space-y-2 p-1">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
