'use client';

import { useState, useTransition } from 'react';
import { EyeOff, Eye, ShieldAlert, ShieldCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import {
  clearSugarOfDay,
  sendCompanionToReview,
  setCompanionPausedAsAdmin,
  setSugarOfDay,
  verifyIdentityAsAdmin,
} from '@/db/queries/companions';
import { ImportedShareButtons } from '@/components/imported-share-buttons';
import { ImportedEditButton } from '@/components/imported-edit-button';

/**
 * Controlos de admin na página do próprio perfil. Antes disto, tirar um
 * anúncio do ar ou devolvê-lo à verificação só se fazia à mão na base de dados.
 */
export function AdminProfileControls({
  companionId,
  name,
  paused,
  verified,
  identityVerified,
  viaSelo = null,
  vipActive,
  isSugarOfDay,
  previewPath = null,
}: {
  /** Só em perfis criados pelo admin ainda sem conta dela: links para lhe enviar. */
  previewPath?: string | null;
  companionId: number;
  name: string;
  paused: boolean;
  verified: boolean;
  /** Selo "Verificada" (documento visto). */
  identityVerified: boolean;
  /** Por que via foi dado o selo: só o admin a vê. */
  viaSelo?: string | null;
  /** VIP pago e ainda dentro da validade — só estas podem ser "do dia". */
  vipActive: boolean;
  isSugarOfDay: boolean;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isPaused, setIsPaused] = useState(paused);
  const [isVerified, setIsVerified] = useState(verified);
  const [temSelo, setTemSelo] = useState(identityVerified);
  const [via, setVia] = useState(viaSelo);
  const [isDoDia, setIsDoDia] = useState(isSugarOfDay);
  const [confirmingReview, setConfirmingReview] = useState(false);

  // Documento recebido por WhatsApp (ou vídeo e documento já enviados pelo
  // site): dá o selo sem mexer na publicação. No site o selo é igual.
  const handleVerifyIdentity = () => {
    startTransition(async () => {
      const result = await verifyIdentityAsAdmin(companionId);
      if (!result.success) {
        toast({
          title: 'Erro',
          description: result.error ?? 'Não foi possível verificar.',
          variant: 'destructive',
        });
        return;
      }
      setTemSelo(true);
      setVia(result.method ?? null);
      toast({
        title: 'Marcada como verificada',
        description: `${name} passou a ter o selo "Verificada".`,
        variant: 'success',
      });
    });
  };

  // Quem já é "do dia" vê sempre o botão, para se poder tirar o destaque
  // mesmo que o VIP tenha entretanto expirado.
  const podeSerDoDia = vipActive && isVerified && !isPaused;
  const mostrarDoDia = podeSerDoDia || isDoDia;

  const handleToggleDoDia = () => {
    startTransition(async () => {
      const result = isDoDia
        ? await clearSugarOfDay(companionId)
        : await setSugarOfDay(companionId);

      if (!result.success) {
        toast({
          title: 'Erro',
          description: result.error ?? 'Não foi possível alterar o destaque.',
          variant: 'destructive',
        });
        return;
      }

      const agora = !isDoDia;
      setIsDoDia(agora);
      toast({
        title: agora ? 'Sugar do dia' : 'Destaque removido',
        description: agora
          ? `${name} passou a ser a sugar do dia na página inicial. A anterior, se havia, foi substituída.`
          : `${name} deixou de estar em destaque na página inicial.`,
        variant: 'success',
      });
    });
  };

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

      <p className="text-sm text-muted-foreground mb-1">
        {!isVerified
          ? 'Este perfil não está aprovado: não aparece no site. Só os admins (e a dona) o vêem aqui.'
          : isPaused
            ? 'Este anúncio está pausado: não aparece no site. Só os admins o vêem aqui.'
            : 'Este anúncio está no ar, visível para todos.'}
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        {temSelo
          ? `Selo: Verificada${via === 'whatsapp' ? ' (documento visto por WhatsApp)' : via === 'documento' ? ' (vídeo e documento pelo site)' : ''}.`
          : 'Selo: Não verificada.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        {/* Só perfis criados pela equipa e ainda sem conta: os outros são
            editados pela própria anunciante. */}
        {previewPath && <ImportedEditButton companionId={companionId} />}
        {!temSelo && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isPending}>
                <ShieldCheck className="h-4 w-4 mr-1.5" /> Marcar como verificada
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Recebeste o documento dela por WhatsApp?</AlertDialogTitle>
                <AlertDialogDescription>
                  {name} passa a ter o selo &quot;Verificada&quot;, igual ao das
                  outras. Se ela enviou vídeo e documento pelo site, ficam
                  aprovados. A via fica registada e só os admins a vêem.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleVerifyIdentity}>
                  Marcar como verificada
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
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

        {mostrarDoDia && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleDoDia}
            disabled={isPending}
            className={
              isDoDia
                ? 'border-rose-400 text-rose-700 dark:text-rose-300'
                : undefined
            }
          >
            <Star
              className={`h-4 w-4 mr-1.5 ${isDoDia ? 'fill-rose-400 text-rose-400' : ''}`}
            />
            {isDoDia ? 'Remover de sugar do dia' : 'Tornar sugar do dia'}
          </Button>
        )}
      </div>

      {previewPath && (
        <div className="mt-3 space-y-1">
          <p className="text-sm text-muted-foreground">
            Perfil criado pela equipa, ainda sem conta dela. Envie-lhe a pré-visualização e o convite para o
            registo. Reactivar o anúncio regista que ela autorizou por WhatsApp.
          </p>
          <ImportedShareButtons companionId={companionId} previewPath={previewPath} />
        </div>
      )}

      {isDoDia && (
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
          É a sugar do dia: aparece em destaque no topo da página inicial.
        </p>
      )}

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
