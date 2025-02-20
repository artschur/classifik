'use client';

import type React from 'react';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Play, Pause } from 'lucide-react';
import type { Media } from '@/types/types';
import { Button } from '@/components/ui/button';

interface ImageGridProps {
  images: (Media | string)[];
}

export function ImageGrid({ images }: ImageGridProps) {
  const [selectedMedia, setSelectedMedia] = useState<Media | string | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const isVideo = (media: Media | string) =>
    (typeof media === 'object' && media.type === 'video') ||
    (typeof media === 'string' && media.match(/\.(mp4|webm|ogg)$/i));

  const getMediaUrl = (media: Media | string) =>
    typeof media === 'object' ? media.publicUrl : media;

  const setVideoRef = (mediaUrl: string) => (el: HTMLVideoElement | null) => {
    videoRefs.current[mediaUrl] = el;
  };

  const togglePlay = (mediaUrl: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const video = videoRefs.current[mediaUrl];
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
      setIsPlaying((prev) => ({
        ...prev,
        [mediaUrl]: !video.paused,
      }));
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((media, index) => {
          const isVideoMedia = isVideo(media);
          const mediaUrl = getMediaUrl(media);

          return (
            <div
              key={index}
              className={`aspect-square cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] relative ${
                index === 0 ? 'col-span-2 row-span-2' : ''
              }`}
              onClick={() => setSelectedMedia(media)}
            >
              <div className="relative w-full h-full">
                {isVideoMedia ? (
                  <>
                    <video
                      ref={setVideoRef(mediaUrl)}
                      src={mediaUrl}
                      className="absolute inset-0 w-full h-full object-cover"
                      playsInline
                      muted
                      loop
                      controls={false}
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/50 hover:bg-black/70"
                      onClick={(e) => togglePlay(mediaUrl, e)}
                    >
                      {isPlaying[mediaUrl] ? (
                        <Pause className="h-6 w-6 text-white" />
                      ) : (
                        <Play className="h-6 w-6 text-white" />
                      )}
                    </Button>
                  </>
                ) : (
                  <Image
                    src={mediaUrl || '/placeholder.svg'}
                    alt={`Media ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => {
            setSelectedMedia(null);
            Object.values(videoRefs.current).forEach((video) => {
              if (video) video.pause();
            });
            setIsPlaying({});
          }}
        >
          <div
            className="relative max-w-5xl w-full h-auto mx-4 transform transition-all duration-300 ease-in-out scale-95 hover:scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo(selectedMedia) ? (
              <div className="relative">
                <video
                  src={getMediaUrl(selectedMedia)}
                  className="w-full h-auto max-h-[90vh] rounded-lg shadow-2xl"
                  controls
                  playsInline
                />
              </div>
            ) : (
              <Image
                src={getMediaUrl(selectedMedia) || '/placeholder.svg'}
                alt="Expanded media"
                width={1600}
                height={900}
                className="object-contain rounded-lg shadow-2xl"
              />
            )}
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors duration-200"
              onClick={() => {
                setSelectedMedia(null);
                Object.values(videoRefs.current).forEach((video) => {
                  if (video) video.pause();
                });
                setIsPlaying({});
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
