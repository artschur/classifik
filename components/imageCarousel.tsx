'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSwipeable } from 'react-swipeable';

interface ImageCarouselProps {
  images: string[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Arrow navigation handlers
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsLoading(true);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsLoading(true);
  }, [images.length]);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  return (
    <div
      className="relative w-full max-w-4xl mx-auto select-none"
      {...swipeHandlers}
    >
      <Card className="border-none shadow-lg">
        <CardContent className="relative aspect-[16/9] p-0 overflow-hidden">
          {isLoading && (
            <Skeleton className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          <Image
            src={images[currentIndex] || '/placeholder.svg'}
            alt={`Carousel image ${currentIndex + 1}`}
            layout="fill"
            objectFit="cover"
            onLoad={handleImageLoad}
            className={`transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            priority
          />
        </CardContent>
      </Card>
      {/* Arrows */}
      <button
        aria-label="Previous image"
        onClick={handlePrev}
        className="absolute top-1/2 left-2 -translate-y-1/2 z-20 bg-white/90 hover:bg-primary hover:text-white rounded-full p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        aria-label="Next image"
        onClick={handleNext}
        className="absolute top-1/2 right-2 -translate-y-1/2 z-20 bg-white/90 hover:bg-primary hover:text-white rounded-full p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {/* Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
        {images.map((_, index) => (
          <button
            key={index}
            aria-label={`Go to image ${index + 1}`}
            className={`w-2 h-2 mx-1 rounded-full transition-all border border-white ${
              index === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
            }`}
            onClick={() => {
              setCurrentIndex(index);
              setIsLoading(true);
            }}
          />
        ))}
      </div>
    </div>
  );
}
