'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface ImageGridProps {
  images: string[];
}

export function ImageGrid({ images }: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Helper to decide grid span classes for a more dynamic layout
  const getGridClasses = (index: number) => {
    const classes = [
      'col-span-1 row-span-1',
      'col-span-2 row-span-1',
      'col-span-1 row-span-2',
      'col-span-2 row-span-2',
      'col-span-3 row-span-1',
      'col-span-1 row-span-1',
    ];
    return classes[index % classes.length];
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-6 pt-6">
        {images.map((img, index) => (
          <div
            key={index}
            className={`${getGridClasses(
              index
            )} cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
            onClick={() => setSelectedImage(img)}
          >
            <div className="relative w-full h-full min-h-[250px]">
              <Image
                src={img || '/placeholder.svg'}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-5xl w-full h-auto mx-4 transform transition-all duration-300 ease-in-out scale-95 hover:scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage || '/placeholder.svg'}
              alt="Expanded image"
              width={1600}
              height={900}
              className="object-contain rounded-lg shadow-2xl"
            />
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors duration-200"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
