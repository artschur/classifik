'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  deleteCompanionPermanently,
  revertRejection,
  type getRejectedCompanions,
} from '@/db/queries/companions';

type Recusada = Awaited<ReturnType<typeof getRejectedCompanions>>[number];

/**
 * Separador "Recusadas" do /verify. A recusa não apaga nada: daqui o admin
 * devolve o perfil à fila ou apaga-o de vez (pedido de remoção, spam).
 */
export function RejectedCompanions({ companions }: { companions: Recusada[] }) {
  if (companions.length === 0) {
    return <p className="text-lg text-center text-gray-500">Não há perfis recusados.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Recusados pelo admin. Ela vê o motivo ao entrar e, se corrigir o perfil,
        volta sozinha para a fila. Apagar de vez remove fotos, vídeo e
        documentos, cancela a subscrição na Stripe se houver, e não avisa o RD.
      </p>
      <ul className="space-y-3">
        {companions.map((c) => (
          <Linha key={c.id} companion={c} />
        ))}
      </ul>
    </div>
  );
}

function Linha({ companion: c }: { companion: Recusada }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirmacao, setConfirmacao] = useState('');

  const correr = (acao: () => Promise<{ success: boolean; error?: string }>, ok: string) =>
    startTransition(async () => {
      const res = await acao();
      if (res.success) {
        toast({ title: ok, variant: 'success' });
        router.refresh();
      } else {
        toast({ title: 'Erro', description: res.error, variant: 'destructive' });
      }
    });

  return (
    <li className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        {c.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura simples
          <img src={c.cover} alt="" className="h-16 w-12 shrink-0 rounded object-cover" />
        ) : (
          <div className="h-16 w-12 shrink-0 rounded bg-muted" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{c.name}</span>
            <Badge variant="outline">{c.city}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {c.phone}
            {c.rejectedAt && ` · recusado a ${new Date(c.rejectedAt).toLocaleDateString('pt-PT')}`}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/companions/${c.id}`} target="_blank">
              Ver perfil
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => correr(() => revertRejection(c.id), 'Devolvido à fila de verificação')}
          >
            Reverter recusa
          </Button>
          <AlertDialog onOpenChange={(aberto) => !aberto && setConfirmacao('')}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isPending}>
                Apagar de vez
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apagar {c.name} de vez?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2">
                    <p>
                      O perfil, as fotos, o áudio, o vídeo e os documentos são
                      apagados e não há forma de os recuperar. O RD não é avisado.
                    </p>
                    <p>
                      Se ela tiver um plano, a subscrição é cancelada na Stripe
                      (sem reembolso automático).
                    </p>
                    <p>
                      Escreva <strong>APAGAR</strong> para confirmar.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                placeholder="APAGAR"
                autoComplete="off"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  disabled={confirmacao.trim().toUpperCase() !== 'APAGAR'}
                  onClick={() => correr(() => deleteCompanionPermanently(c.id), 'Perfil apagado de vez')}
                >
                  Apagar de vez
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {c.rejectionReason && (
        <p className="text-sm">
          <span className="font-medium">Motivo:</span> {c.rejectionReason}
        </p>
      )}
    </li>
  );
}
