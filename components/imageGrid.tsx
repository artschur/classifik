'use client';

import type React from 'react';
import { useState, useRef, useCallback, useTransition } from 'react';
import Image from 'next/image';
import { X, Play, Pause, Plus } from 'lucide-react';
import type { Media } from '@/types/types';
import { Button } from '@/components/ui/button';
import { getImagesByCompanionId } from '@/db/queries/images';

interface ImageGridProps {
  initialImages: (Media | string)[];
  companionId: number;
  totalImages: number;
}

export function ImageGrid({
  initialImages,
  companionId,
  totalImages,
}: ImageGridProps) {
  const [selectedMedia, setSelectedMedia] = useState<Media | string | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const [images, setImages] = useState<(Media | string)[]>(() =>
    initialImages.map((img) => {
      if (typeof img === 'string' && img.match(/\.(mp4|webm|ogg|mov)$/i)) {
        return {
          type: 'video',
          publicUrl: img,
        } as Media;
      }
      return img;
    })
  );

  const isVideo = (media: Media | string) =>
    (typeof media === 'object' && media.type === 'video') ||
    (typeof media === 'string' && media.match(/\.(mp4|webm|ogg)$/i));
  const getMediaUrl = (media: Media | string) =>
    typeof media === 'object' ? media.publicUrl : media;

  const setVideoRef = (mediaUrl: string) => (el: HTMLVideoElement | null) => {
    videoRefs.current[mediaUrl] = el;
  };

  const [isLoading, startTransition] = useTransition();
  const [offset, setOffset] = useState(3);
  const [hasMore, setHasMore] = useState(totalImages > 3);

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>(
    Object.fromEntries(
      images.filter(isVideo).map((media) => [getMediaUrl(media), null])
    )
  );

  const loadMoreImages = useCallback(() => {
    if (isLoading) return;

    startTransition(async () => {
      const result = await getImagesByCompanionId(companionId, 6, offset);
      if (result.images.length === 0) {
        setHasMore(false);
      } else {
        const newMedia = result.images.map((img) => {
          const isVideoUrl = img.publicUrl.match(/\.(mp4|webm|ogg|mov)$/i);
          if (isVideoUrl) {
            return {
              type: 'video',
              publicUrl: img.publicUrl,
            } as Media;
          }
          return img.publicUrl;
        });

        // Reset video refs for new videos
        const currentVideoRefs = { ...videoRefs.current };
        setImages((prev) => {
          const updatedImages = [...prev, ...newMedia];
          // Update video refs for new videos
          updatedImages.forEach((media) => {
            if (isVideo(media)) {
              const url = getMediaUrl(media);
              if (!currentVideoRefs[url]) {
                currentVideoRefs[url] = null;
              }
            }
          });
          videoRefs.current = currentVideoRefs;
          return updatedImages;
        });

        setOffset((prev) => prev + result.images.length);
        setHasMore(offset + result.images.length < totalImages);
      }
    });
  }, [companionId, offset, isLoading, totalImages]);

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
                      preload="metadata"
                      poster={`${mediaUrl}#t=0.1`}
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 z-10"
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
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                )}
              </div>
              {index === images.length - 1 && hasMore && (
                <div
                  className="absolute inset-0 bg-black/40 hover:bg-black/60 transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-[2px] hover:backdrop-blur-[4px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadMoreImages();
                  }}
                >
                  <div className="text-white text-center transform transition-transform duration-300 hover:scale-110">
                    <Plus className="h-10 w-10 mx-auto mb-2 stroke-2" />
                    <span className="text-xl font-medium">
                      Ver próximas {Math.min(6, totalImages - images.length)}{' '}
                      fotos
                    </span>
                    <p className="text-sm text-white/70">
                      {images.length} de {totalImages}
                    </p>
                  </div>
                </div>
              )}
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
              <video
                src={getMediaUrl(selectedMedia)}
                className="w-full h-auto max-h-[90vh] rounded-lg shadow-2xl"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <div className="relative aspect-video">
                <Image
                  src={getMediaUrl(selectedMedia)}
                  alt="Expanded media"
                  fill
                  className="object-contain rounded-lg shadow-2xl"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                />
              </div>
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
