"use client";
import { Suspense, useRef } from 'react';
import { CompanionCard, CompanionCardSkeleton } from '@/components/companion-card';
import { SectionHeading } from './v0/section-heading';
import { CompanionPreview } from '@/types/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function CarouselSkeleton() {
  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto py-4 sm:gap-6">
      {[...Array(5)].map((_, i) => (
        <CompanionCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroCarousel({ companions }: { companions: CompanionPreview[] }) {

  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full bg-muted py-10 sm:py-12 md:py-20 lg:py-28" aria-labelledby="featured-sugars-heading">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading
          title="Sugars em Destaque"
          description="Conheça algumas das nossas Sugars VIP mais exclusivas e verificadas."
        />
        <div className="relative mt-6 sm:mt-8">
          {/* Left Button */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>

          {/* Carousel */}
          <div
            ref={carouselRef}
            className="no-scrollbar flex gap-4 overflow-x-auto py-4 sm:gap-6 snap-x snap-mandatory scroll-smooth"
          >
            <Suspense fallback={<CarouselSkeleton />}>
              {companions.map((companion) => (
                <div key={companion.id} className="snap-start">
                  <CompanionCard companion={companion} />
                </div>
              ))}
            </Suspense>
          </div>

          {/* Right Button */}
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
            aria-label="Scroll Right"
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </div>
    </section>
  );
}
