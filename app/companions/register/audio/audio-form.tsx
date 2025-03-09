'use client';

import type React from 'react';

import { useState } from 'react';
import { AudioRecorder } from './audio-recorder';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { uploadAudio } from '@/db/queries/audio';

interface AudioFormClientProps {
  companionId: number;
  userId: string;
}

export default function AudioFormClient({
  companionId,
  userId,
}: AudioFormClientProps) {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAudioRecorded = (blob: Blob | null) => {
    setAudioBlob(blob);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!audioBlob) {
      toast({
        title: 'Audio está faltando',
        description: 'Por favor, grave um áudio antes de enviar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append('audio', audioBlob, `${userId}-recording.mp3`);
      formData.append('companionId', companionId.toString());

      const audioFile = new File([audioBlob], `${userId}-recording'.mp3`, {
        type: audioBlob.type,
        lastModified: Date.now(),
      });

      const result = await uploadAudio({
        audioFile,
        companionId,
        clerkId: userId,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Audio enviado',
        description: 'Seu áudio foi enviado com sucesso.',
      });

      setAudioBlob(null);
    } catch (error) {
      console.error('Erro ao enviar audio', error);
      toast({
        title: 'Upload falhou',
        description:
          typeof error === 'object' && error !== null && 'message' in error
            ? String(error.message)
            : 'Erro ao enviar o áudio',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grave seu áudio</CardTitle>
        <CardDescription>
          Adicione um audio para atrair mais visitantes para o seu perfil.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Áudio</Label>
            <AudioRecorder onAudioRecorded={handleAudioRecorded} />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !audioBlob}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar gravação'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
