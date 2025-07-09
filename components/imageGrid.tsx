'use client';

import type React from 'react';
import { useState, useRef, useCallback, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { X, Play, Pause, Plus } from 'lucide-react';
import type { Media } from '@/types/types';
import { Button } from '@/components/ui/button';
import { getImagesByCompanionId } from '@/db/queries/images';
import { useSwipeable } from 'react-swipeable';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set());
  const [videoStates, setVideoStates] = useState<{
    [key: string]: { ready: boolean; currentTime: number };
  }>({});
  const [nextBatchLoading, setNextBatchLoading] = useState(false);

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
    if (isLoading || nextBatchLoading) return;

    setNextBatchLoading(true);
    startTransition(async () => {
      const result = await getImagesByCompanionId(companionId, 3, offset);
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
      setNextBatchLoading(false);
    });
  }, [companionId, offset, isLoading, totalImages, nextBatchLoading]);

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

  const getVideoPoster = (url: string) => {
    // Create a poster URL by appending a timestamp to force the first frame
    return `${url}#t=0.01`;
  };

  const handleVideoLoaded = (mediaUrl: string) => {
    setLoadedVideos((prev) => new Set(prev).add(mediaUrl));
  };

  const handleVideoState = (mediaUrl: string, video: HTMLVideoElement) => {
    if (video.readyState >= 2) {
      // HAVE_CURRENT_DATA or better
      video.currentTime = 0.1; // Set to first frame
      setVideoStates((prev) => ({
        ...prev,
        [mediaUrl]: { ready: true, currentTime: 0.1 },
      }));
    }
  };

  // Modal navigation helpers
  const getCurrentModalIndex = () =>
    selectedMedia
      ? images.findIndex(
          (media) => getMediaUrl(media) === getMediaUrl(selectedMedia)
        )
      : -1;
  const handleModalNav = useCallback(
    (direction: 'prev' | 'next') => {
      if (!selectedMedia) return;
      const currentIndex = getCurrentModalIndex();
      if (currentIndex === -1) return;
      let newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0) newIndex = images.length - 1;
      if (newIndex >= images.length) newIndex = 0;
      setSelectedMedia(images[newIndex]);
    },
    [selectedMedia, images]
  );
  // Keyboard navigation for modal
  useEffect(() => {
    if (!selectedMedia) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleModalNav('prev');
      } else if (e.key === 'ArrowRight') {
        handleModalNav('next');
      } else if (e.key === 'Escape') {
        setSelectedMedia(null);
        Object.values(videoRefs.current).forEach((video) => {
          if (video) video.pause();
        });
        setIsPlaying({});
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, handleModalNav]);
  // Swipe handlers for modal
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleModalNav('next'),
    onSwipedRight: () => handleModalNav('prev'),
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

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
                    {!videoStates[mediaUrl]?.ready && (
                      <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
                    )}
                    <video
                      ref={setVideoRef(mediaUrl)}
                      src={mediaUrl}
                      className={`absolute inset-0 w-full h-full object-cover ${
                        videoStates[mediaUrl]?.ready
                          ? 'opacity-100'
                          : 'opacity-0'
                      } transition-opacity duration-300`}
                      playsInline
                      muted
                      loop
                      preload="auto"
                      onLoadedData={(e) =>
                        handleVideoState(mediaUrl, e.target as HTMLVideoElement)
                      }
                      onSeeked={(e) => {
                        const video = e.target as HTMLVideoElement;
                        if (video.currentTime === 0.1) {
                          setVideoStates((prev) => ({
                            ...prev,
                            [mediaUrl]: { ready: true, currentTime: 0.1 },
                          }));
                        }
                      }}
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"
                      aria-hidden="true"
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
                    {nextBatchLoading ? (
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-2"></div>
                        <span className="text-xl font-medium">
                          Carregando...
                        </span>
                      </div>
                    ) : (
                      <>
                        <Plus className="h-10 w-10 mx-auto mb-2 stroke-2" />
                        <span className="text-xl font-medium">
                          Ver próximas 3 fotos
                        </span>
                        <p className="text-sm text-white/70">
                          {images.length} de {totalImages}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {nextBatchLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className={`aspect-square rounded-xl bg-neutral-900 animate-pulse ${
                i === 0 ? 'col-span-2 row-span-2' : ''
              }`}
            />
          ))}
        </div>
      )}

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
            className="relative max-w-5xl w-full h-auto mx-4"
            onClick={(e) => e.stopPropagation()}
            {...swipeHandlers}
          >
            {/* Modal arrows, only if more than one image */}
            {images.length > 1 && (
              <>
                <button
                  aria-label="Previous image"
                  onClick={() => handleModalNav('prev')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-primary hover:text-white rounded-full p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ marginLeft: '1.5rem' }}
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  aria-label="Next image"
                  onClick={() => handleModalNav('next')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-primary hover:text-white rounded-full p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ marginRight: '1.5rem' }}
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}
            {/* Pill indicator below modal */}
            {selectedMedia && images.length > 1 && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[-2.5rem] flex justify-center w-auto">
                <span className="px-4 py-1 rounded-full bg-black/70 text-white text-sm font-medium shadow-md">
                  {getCurrentModalIndex() + 1} / {images.length}
                </span>
              </div>
            )}
            {isVideo(selectedMedia) ? (
              <div className="flex justify-center items-center transition-transform duration-300 ease-in-out scale-95 hover:scale-100">
                <video
                  src={getMediaUrl(selectedMedia)}
                  className="w-auto h-[60vh] max-h-[80vh] md:w-full md:h-auto md:max-h-[80vh] rounded-lg shadow-2xl object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              </div>
            ) : (
              <div className="relative flex justify-center items-center w-full h-full">
                <Image
                  src={getMediaUrl(selectedMedia)}
                  alt="Expanded media"
                  className="object-contain rounded-lg shadow-2xl"
                  sizes="100vw"
                  width={100}
                  height={100}
                  style={{
                    maxWidth: '80vw',
                    maxHeight: '80vh',
                    width: '100%',
                    height: 'auto',
                    minHeight: '400px',
                  }}
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
