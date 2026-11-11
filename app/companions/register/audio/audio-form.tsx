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
import { getMyAudio, updateAudio, uploadAudio } from '@/db/queries/audio';
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
import { useLocale } from '@/components/locale-provider';
import { localizeHref } from '@/lib/i18n';

const TEXT = {
  pt: {
    erroVerificarTitulo: 'Erro ao verificar áudio existente',
    erroVerificarTexto:
      'Houve um erro ao verificar se você já possui um áudio gravado.',
    faltaTitulo: 'Audio está faltando',
    faltaTexto: 'Por favor, grave um áudio antes de enviar.',
    enviadoTitulo: 'Áudio enviado',
    emRevisao:
      'O seu áudio novo vai ser revisto pela nossa equipa. Até lá, o perfil continua com o áudio anterior.',
    enviado: 'O seu áudio foi enviado com sucesso.',
    falhouTitulo: 'Upload falhou',
    falhouTexto: 'Erro ao enviar o áudio',
    titulo: 'Grave seu áudio',
    descricao: 'Adicione um audio para atrair mais visitantes para o seu perfil.',
    aEspera:
      'O seu áudio mais recente está à espera de aprovação. Gravar um novo substitui o que está à espera.',
    jaTem:
      'Você já possui um áudio gravado. Gravar um novo substituirá o existente, depois de aprovado pela nossa equipa.',
    audio: 'Áudio',
    enviando: 'Enviando...',
    substituirGravacao: 'Substituir gravação',
    enviarGravacao: 'Enviar gravação',
    dialogoTitulo: 'Substituir áudio existente?',
    dialogoTexto:
      'Você já possui um áudio gravado. Se continuar, o novo substitui o atual. Se o seu perfil já estiver publicado, a troca só acontece depois de a nossa equipa aprovar o áudio novo.',
    cancelar: 'Cancelar',
    confirmar: 'Confirmar substituição',
  },
  en: {
    erroVerificarTitulo: 'Could not check your existing audio',
    erroVerificarTexto:
      'Something went wrong while checking whether you already have an audio recording.',
    faltaTitulo: 'Audio missing',
    faltaTexto: 'Please record an audio clip before sending.',
    enviadoTitulo: 'Audio sent',
    emRevisao:
      'Our team will review your new audio. Until then, your profile keeps the previous one.',
    enviado: 'Your audio has been sent.',
    falhouTitulo: 'Upload failed',
    falhouTexto: 'Something went wrong while sending the audio',
    titulo: 'Record your audio',
    descricao: 'Add an audio clip to attract more visitors to your profile.',
    aEspera:
      'Your latest audio is waiting for approval. Recording a new one replaces the one that is waiting.',
    jaTem:
      'You already have an audio recording. Recording a new one will replace it once our team approves it.',
    audio: 'Audio',
    enviando: 'Sending...',
    substituirGravacao: 'Replace recording',
    enviarGravacao: 'Send recording',
    dialogoTitulo: 'Replace your existing audio?',
    dialogoTexto:
      'You already have an audio recording. If you continue, the new one replaces the current one. If your profile is already live, the change only happens after our team approves the new audio.',
    cancelar: 'Cancel',
    confirmar: 'Confirm replacement',
  },
} as const;

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
    pendingApproval: boolean;
  } | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const t = TEXT[locale];

  useEffect(() => {
    let isMounted = true;

    const checkExistingAudio = async () => {
      try {
        const existing = await getMyAudio();

        if (isMounted) {
          setHasExistingAudio(existing);
        }
      } catch (error) {
        console.error('Failed to check existing audio:', error);
        if (isMounted) {
          toast({
            title: t.erroVerificarTitulo,
            description: t.erroVerificarTexto,
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
        title: t.faltaTitulo,
        description: t.faltaTexto,
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
      // A conta e o perfil vêm da sessão, no servidor.
      const result = hasExistingAudio
        ? await updateAudio({ audioFile })
        : await uploadAudio({ audioFile });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: t.enviadoTitulo,
        description: result.pendingReview ? t.emRevisao : t.enviado,
      });

      // O áudio abre-se a partir do perfil, e é para lá que ela volta. Antes ia
      // para /companions/verification, que mostrava a quem já está aprovada o
      // passo do vídeo como se estivesse a começar o registo.
      router.push(localizeHref('/profile', locale));

      setAudioBlob(null);
    } catch (error) {
      console.error('Erro ao enviar audio', error);
      toast({
        title: t.falhouTitulo,
        description:
          typeof error === 'object' && error !== null && 'message' in error
            ? String(error.message)
            : t.falhouTexto,
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
          <CardTitle>{t.titulo}</CardTitle>
          <CardDescription>
            {t.descricao}
            {hasExistingAudio?.pendingApproval ? (
              <p className="mt-2 text-amber-600">{t.aEspera}</p>
            ) : hasExistingAudio ? (
              <p className="mt-2 text-amber-600">{t.jaTem}</p>
            ) : null}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 flex flex-row items-center justify-center">
            <div className="space-y-2">
              <Label>{t.audio}</Label>
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
                ? t.enviando
                : hasExistingAudio
                  ? t.substituirGravacao
                  : t.enviarGravacao}
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
            <AlertDialogTitle>{t.dialogoTitulo}</AlertDialogTitle>
            <AlertDialogDescription>{t.dialogoTexto}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancelar}</AlertDialogCancel>
            <AlertDialogAction onClick={submitAudio}>
              {t.confirmar}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
