'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Square, Play, Pause, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  className?: string;
  onAudioRecorded?: (audioBlob: Blob | null) => void;
}

export function AudioRecorder({
  className,
  onAudioRecorded,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => setIsPlaying(false);
    audioRef.current.onpause = () => setIsPlaying(false);
    audioRef.current.onplay = () => setIsPlaying(true);

    return () => {
      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.onpause = null;
        audioRef.current.onplay = null;
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/mp3',
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        if (audioRef.current) {
          audioRef.current.src = url;
        }
        if (onAudioRecorded) {
          onAudioRecorded(audioBlob);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();

      // Stop all tracks on the stream
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());

      setIsRecording(false);

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Toggle play/pause
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  // Delete recording
  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.src = '';
      }

      if (onAudioRecorded) {
        onAudioRecorded(null);
      }
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Recording visualization */}
          <div className="relative w-full h-24 bg-muted rounded-lg overflow-hidden flex items-center justify-center mb-2">
            {isRecording ? (
              <div className="relative w-full h-full">
                <div
                  className="absolute inset-0 bg-primary/30 rounded-lg animate-[pulse_1.5s_ease-in-out_infinite]"
                  style={{
                    transform: 'scale(0.85)',
                    animation: 'blob 2s infinite ease-in-out',
                  }}
                />
                <div
                  className="absolute inset-0 bg-primary/20 rounded-lg animate-[pulse_2s_ease-in-out_0.5s_infinite]"
                  style={{
                    transform: 'scale(0.9)',
                    animation: 'blob 2.5s 0.5s infinite ease-in-out',
                  }}
                />
                <style jsx>{`
                  @keyframes blob {
                    0% {
                      transform: scale(0.8);
                      opacity: 0.8;
                    }
                    50% {
                      transform: scale(1);
                      opacity: 0.4;
                    }
                    100% {
                      transform: scale(0.8);
                      opacity: 0.8;
                    }
                  }
                `}</style>
              </div>
            ) : audioUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-3/4 h-8 bg-primary/20 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full bg-primary transition-all duration-300',
                      isPlaying ? 'animate-progress' : ''
                    )}
                    style={{ width: isPlaying ? '100%' : '0%' }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Pronto para gravar</p>
            )}
          </div>

          {/* Timer display */}
          <div className="text-xl font-medium">
            {isRecording
              ? formatTime(recordingDuration)
              : audioUrl
              ? 'Recording saved'
              : 'Record audio'}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4 mt-4">
            {!audioUrl ? (
              // Recording controls
              <Button
                variant={isRecording ? 'destructive' : 'default'}
                size="lg"
                type="button"
                className={cn(
                  'h-16 w-16 rounded-full',
                  isRecording && 'animate-pulse'
                )}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <Square className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
            ) : (
              // Playback controls
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  className="h-12 w-12 rounded-full"
                  onClick={togglePlayback}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  className="h-12 w-12 rounded-full"
                  onClick={deleteRecording}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
