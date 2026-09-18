'use client';

import { useState, useTransition } from 'react';
import { EyeOff, Eye, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  sendCompanionToReview,
  setCompanionPausedAsAdmin,
} from '@/db/queries/companions';

/**
 * Controlos de admin na página do próprio perfil. Antes disto, tirar um
 * anúncio do ar ou devolvê-lo à verificação só se fazia à mão na base de dados.
 */
export function AdminProfileControls({
  companionId,
  name,
  paused,
  verified,
}: {
  companionId: number;
  name: string;
  paused: boolean;
  verified: boolean;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isPaused, setIsPaused] = useState(paused);
  const [isVerified, setIsVerified] = useState(verified);
  const [confirmingReview, setConfirmingReview] = useState(false);

  const handleTogglePause = () => {
    startTransition(async () => {
      const next = !isPaused;
      const result = await setCompanionPausedAsAdmin(companionId, next);

      if (!result.success) {
        toast({
          title: 'Erro',
          description: result.error ?? 'Não foi possível alterar o anúncio.',
          variant: 'destructive',
        });
        return;
      }

      setIsPaused(next);
      toast({
        title: next ? 'Anúncio pausado' : 'Anúncio reactivado',
        description: next
          ? `${name} deixou de aparecer no site. Os dados ficam intactos.`
          : `${name} voltou a aparecer no site.`,
        variant: 'success',
      });
    });
  };

  const handleSendToReview = () => {
    startTransition(async () => {
      const result = await sendCompanionToReview(companionId);

      if (!result.success) {
        toast({
          title: 'Erro',
          description:
            result.error ?? 'Não foi possível mover para verificação.',
          variant: 'destructive',
        });
        return;
      }

      setIsVerified(false);
      setConfirmingReview(false);
      toast({
        title: 'Movida para verificação',
        description: `${name} saiu do site e está na página de verificação.`,
        variant: 'success',
      });
    });
  };

  return (
    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
      <div className="flex items-center gap-2 mb-1">
        <ShieldAlert className="h-4 w-4" />
        <p className="font-semibold">Controlos de administração</p>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        {!isVerified
          ? 'Este perfil não está verificado: não aparece no site e está na fila de verificação. Só os admins o vêem aqui.'
          : isPaused
            ? 'Este anúncio está pausado: não aparece no site. Só os admins o vêem aqui.'
            : 'Este anúncio está no ar, visível para todos.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTogglePause}
          disabled={isPending}
        >
          {isPaused ? (
            <>
              <Eye className="h-4 w-4 mr-1.5" /> Reactivar anúncio
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4 mr-1.5" /> Pausar anúncio
            </>
          )}
        </Button>

        {isVerified &&
          (confirmingReview ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={handleSendToReview}
                disabled={isPending}
              >
                Confirmar: tirar do ar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingReview(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmingReview(true)}
              disabled={isPending}
            >
              <ShieldAlert className="h-4 w-4 mr-1.5" /> Mover para verificação
            </Button>
          ))}
      </div>

      {confirmingReview && (
        <p className="mt-2 text-sm text-muted-foreground">
          O anúncio sai do site e volta à fila de verificação, onde pode ser
          aprovado outra vez. Nada é apagado.
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Pausar é reversível aqui mesmo. Mover para verificação exige uma nova
        aprovação na página de verificação.
      </p>
    </div>
  );
}
