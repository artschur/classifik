'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
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
import {
  getAudioUrlByClerkId,
  updateAudio,
  uploadAudio,
} from '@/db/queries/audio';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

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
  const [hasExistingAudio, setHasExistingAudio] = useState<{
    id: number;
    publicUrl: string;
  } | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkExistingAudio = async () => {
      try {
        const existing = await getAudioUrlByClerkId(userId);

        if (isMounted) {
          setHasExistingAudio(existing);
        }
      } catch (error) {
        console.error('Failed to check existing audio:', error);
        if (isMounted) {
          toast({
            title: 'Erro ao verificar áudio existente',
            description:
              'Houve um erro ao verificar se você já possui um áudio gravado.',
            variant: 'destructive',
          });
        }
      }
    };

    checkExistingAudio();

    return () => {
      isMounted = false;
    };
  }, [userId]);

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

    if (hasExistingAudio) {
      setIsConfirmDialogOpen(true);
      return;
    }

    await submitAudio();
  };

  const submitAudio = async () => {
    setIsSubmitting(true);

    try {
      const audioFile = new File([audioBlob!], `${userId}-recording.mp3`, {
        type: audioBlob!.type,
        lastModified: Date.now(),
      });

      // Use the appropriate function based on whether audio exists
      const result = hasExistingAudio
        ? await updateAudio({
          audioFile,
          companionId,
          clerkId: userId,
        })
        : await uploadAudio({
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

      router.push('/companions/verification');

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

  // Rest of your component remains the same

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Grave seu áudio</CardTitle>
          <CardDescription>
            Adicione um audio para atrair mais visitantes para o seu perfil.
            {hasExistingAudio && (
              <p className="mt-2 text-amber-600">
                Você já possui um áudio gravado. Gravar um novo substituirá o
                existente.
              </p>
            )}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 flex flex-row items-center justify-center">
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
              {isSubmitting
                ? 'Enviando...'
                : hasExistingAudio
                  ? 'Substituir gravação'
                  : 'Enviar gravação'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir áudio existente?</AlertDialogTitle>
            <AlertDialogDescription>
              Você já possui um áudio gravado. Se continuar, seu áudio atual
              será substituído permanentemente pelo novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={submitAudio}>
              Confirmar substituição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
