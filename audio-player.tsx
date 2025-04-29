'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export default function MusicPlayer({ songUrl }: { songUrl: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set up event listeners
    const setAudioData = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
        setIsLoading(false);
      }
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsLoading(false);
    };

    // Events
    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('durationchange', setAudioData); // Additional event to ensure we catch duration
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('error', handleError);
    audio.volume = volume;

    // Cleanup
    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('durationchange', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('error', handleError);
    };
  }, [volume]);

  // Play/Pause toggle
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error('Failed to play audio:', err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  // Seek to a specific time
  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Toggle mute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);

    // If changing from zero, unmute
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      audio.muted = false;
    }

    // If setting to zero, mute
    if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
      audio.muted = true;
    }
  };

  // Format time in MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '00:00';

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-6 rounded-xl bg-current border border-muted shadow-sm">
      <audio ref={audioRef} src={songUrl} preload="metadata" />

      <div className="space-y-6">
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.01}
            onValueChange={handleSeek}
            className="cursor-pointer"
            disabled={isLoading || duration === 0}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary text-primary-foreground hover:bg-secondary/80 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              disabled={isLoading}
            >
              {isPlaying ? (
                <Pause size={15} />
              ) : (
                <Play size={15} className="ml-1" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
