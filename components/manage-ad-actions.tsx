'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pause, Play, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { togglePauseAd, deleteCompanionAccount } from '@/app/actions/account-management';

const DELETE_CONFIRMATION_PHRASE = 'APAGAR';

export function ManageAdActions({ initialPaused }: { initialPaused: boolean }) {
  const { toast } = useToast();
  const router = useRouter();

  const [paused, setPaused] = useState(initialPaused);
  const [isTogglingPause, startTogglePause] = useTransition();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleTogglePause = () => {
    const next = !paused;
    startTogglePause(async () => {
      const result = await togglePauseAd(next);
      if (result.success) {
        setPaused(next);
        toast({
          title: next ? 'Anúncio pausado' : 'Anúncio reactivado',
          description: next
            ? 'O teu perfil deixou de aparecer no site. Podes reactivar quando quiseres.'
            : 'O teu perfil voltou a ficar visível no site.',
          variant: 'success',
        });
        router.refresh();
      } else {
        toast({
          title: 'Erro',
          description: result.error ?? 'Não foi possível actualizar o anúncio.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteCompanionAccount(confirmationText);
      if (result && !result.success) {
        toast({
          title: 'Erro',
          description: result.error ?? 'Não foi possível apagar a conta.',
          variant: 'destructive',
        });
        setIsDeleting(false);
      }
      // Em caso de sucesso, a action redirecciona a partir do servidor —
      // não há mais nada para fazer aqui.
    } catch (error) {
      // O redirect() da action lança um sinal interno do Next que tem de
      // continuar a propagar-se; só um erro genuíno deve mostrar toast.
      if (
        error &&
        typeof error === 'object' &&
        'digest' in error &&
        typeof (error as { digest?: unknown }).digest === 'string' &&
        (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
      ) {
        throw error;
      }
      toast({
        title: 'Erro',
        description: 'Não foi possível apagar a conta. Tenta novamente.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={handleTogglePause}
        disabled={isTogglingPause}
      >
        {isTogglingPause ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : paused ? (
          <Play className="h-4 w-4" />
        ) : (
          <Pause className="h-4 w-4" />
        )}
        {paused ? 'Reativar anúncio' : 'Pausar anúncio'}
      </Button>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (isDeleting) return;
          setDeleteDialogOpen(open);
          if (!open) setConfirmationText('');
        }}
      >
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4" />
            Apagar anúncio
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar a tua conta definitivamente?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  Isto apaga o teu perfil, fotos, vídeo de verificação, documentos,
                  avaliações e histórico — de tudo, sem possibilidade de recuperar.
                  Uma eventual subscrição activa é cancelada automaticamente.
                </p>
                <p>
                  Escreve{' '}
                  <strong className="text-foreground">
                    {DELETE_CONFIRMATION_PHRASE}
                  </strong>{' '}
                  para confirmar.
                </p>
                <Input
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={DELETE_CONFIRMATION_PHRASE}
                  disabled={isDeleting}
                  autoComplete="off"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                isDeleting ||
                confirmationText.trim().toUpperCase() !== DELETE_CONFIRMATION_PHRASE
              }
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Apagar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
