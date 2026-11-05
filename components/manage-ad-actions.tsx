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
import { useLocale } from '@/components/locale-provider';

// A frase pedida para apagar a conta, em cada idioma. Tem de bater com a do
// servidor (app/actions/account-management.ts).
const DELETE_CONFIRMATION_PHRASE = { pt: 'APAGAR', en: 'DELETE' } as const;

const TEXT = {
  pt: {
    pausado: 'Anúncio pausado',
    reactivado: 'Anúncio reactivado',
    pausadoTexto: 'O teu perfil deixou de aparecer no site. Podes reactivar quando quiseres.',
    reactivadoTexto: 'O teu perfil voltou a ficar visível no site.',
    erro: 'Erro',
    erroActualizar: 'Não foi possível actualizar o anúncio.',
    erroApagar: 'Não foi possível apagar a conta.',
    erroApagarTente: 'Não foi possível apagar a conta. Tenta novamente.',
    reativar: 'Reativar anúncio',
    pausar: 'Pausar anúncio',
    apagar: 'Apagar anúncio',
    dialogoTitulo: 'Apagar a tua conta definitivamente?',
    dialogoTexto:
      'Isto apaga o teu perfil, fotos, vídeo de verificação, documentos, avaliações e histórico — de tudo, sem possibilidade de recuperar. Uma eventual subscrição activa é cancelada automaticamente.',
    escreve: 'Escreve',
    paraConfirmar: 'para confirmar.',
    cancelar: 'Cancelar',
    apagarDefinitivamente: 'Apagar definitivamente',
  },
  en: {
    pausado: 'Listing paused',
    reactivado: 'Listing reactivated',
    pausadoTexto: 'Your profile no longer appears on the site. You can reactivate it whenever you like.',
    reactivadoTexto: 'Your profile is visible on the site again.',
    erro: 'Error',
    erroActualizar: 'We could not update your listing.',
    erroApagar: 'We could not delete your account.',
    erroApagarTente: 'We could not delete your account. Please try again.',
    reativar: 'Reactivate listing',
    pausar: 'Pause listing',
    apagar: 'Delete listing',
    dialogoTitulo: 'Delete your account permanently?',
    dialogoTexto:
      'This deletes your profile, photos, verification video, documents, reviews and history, all of it, with no way to recover it. Any active subscription is cancelled automatically.',
    escreve: 'Type',
    paraConfirmar: 'to confirm.',
    cancelar: 'Cancel',
    apagarDefinitivamente: 'Delete permanently',
  },
} as const;

export function ManageAdActions({ initialPaused }: { initialPaused: boolean }) {
  const { toast } = useToast();
  const router = useRouter();
  const locale = useLocale();
  const t = TEXT[locale];
  const frase = DELETE_CONFIRMATION_PHRASE[locale];

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
          title: next ? t.pausado : t.reactivado,
          description: next ? t.pausadoTexto : t.reactivadoTexto,
          variant: 'success',
        });
        router.refresh();
      } else {
        toast({
          title: t.erro,
          description: result.error ?? t.erroActualizar,
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
          title: t.erro,
          description: result.error ?? t.erroApagar,
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
        title: t.erro,
        description: t.erroApagarTente,
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
        {paused ? t.reativar : t.pausar}
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
            {t.apagar}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.dialogoTitulo}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>{t.dialogoTexto}</p>
                <p>
                  {t.escreve}{' '}
                  <strong className="text-foreground">{frase}</strong>{' '}
                  {t.paraConfirmar}
                </p>
                <Input
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={frase}
                  disabled={isDeleting}
                  autoComplete="off"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t.cancelar}</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                isDeleting ||
                confirmationText.trim().toUpperCase() !== frase
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
              {t.apagarDefinitivamente}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
