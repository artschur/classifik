'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { PublishedImported } from '@/db/queries/candidates';
import { registerCandidateConsent } from '@/app/actions/candidates';
import { ImportedShareButtons } from '@/components/imported-share-buttons';
import { setCompanionPausedAsAdmin } from '@/db/queries/companions';
import { ConsentDialog } from '@/components/candidate-actions';

/**
 * Perfis já criados a partir das candidatas, ainda sem conta delas. É daqui
 * que o admin lhes envia o link de pré-visualização (abre mesmo em pausa) e o
 * convite para ligarem a conta, e onde os põe no ar quando autorizarem.
 */
export function PublishedImportedList({ perfis }: { perfis: PublishedImported[] }) {
  if (perfis.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold border-b pb-2">
          Publicadas, ainda sem conta dela <span className="font-normal text-muted-foreground">· {perfis.length}</span>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Envie-lhe a pré-visualização para ver como ficou e o convite para ligar a conta. Pôr no ar regista
          que ela autorizou por WhatsApp; usar o convite também conta como consentimento.
        </p>
      </div>
      <ul className="space-y-3">
        {perfis.map((p) => (
          <Linha key={p.companionId} perfil={p} />
        ))}
      </ul>
    </section>
  );
}

function Linha({ perfil: p }: { perfil: PublishedImported }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [consentimentoAberto, setConsentimentoAberto] = useState(false);

  const correr = (acao: () => Promise<{ success: boolean; error?: string }>, ok: string) =>
    startTransition(async () => {
      const res = await acao();
      if (res.success) {
        toast({ title: ok, variant: 'success' });
        setConsentimentoAberto(false);
        router.refresh();
      } else {
        toast({ title: 'Erro', description: res.error, variant: 'destructive' });
      }
    });

  return (
    <li className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        {p.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura simples
          <img src={p.coverUrl} alt="" className="h-16 w-12 shrink-0 rounded object-cover" />
        ) : (
          <div className="h-16 w-12 shrink-0 rounded bg-muted" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{p.name}</span>
            <Badge variant="outline">{p.city}</Badge>
            <Badge variant={p.paused ? 'secondary' : 'default'}>{p.paused ? 'Em pausa' : 'No ar'}</Badge>
            {!p.identityVerified && <Badge variant="secondary">Sem selo</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {p.consentimentoEm
              ? `Consentimento a ${new Date(p.consentimentoEm).toLocaleDateString('pt-PT')}`
              : 'Sem consentimento registado'}
            {p.conviteExpiraEm && ` · convite válido até ${new Date(p.conviteExpiraEm).toLocaleDateString('pt-PT')}`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={p.previewPath} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> Ver
          </a>
        </Button>
        {!p.consentimentoEm && (
          <Button variant="outline" size="sm" disabled={isPending} onClick={() => setConsentimentoAberto(true)}>
            Registar consentimento
          </Button>
        )}
        {p.paused ? (
          // Sem consentimento registado, o texto do botão é a confirmação.
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => correr(() => setCompanionPausedAsAdmin(p.companionId, false), 'Perfil no ar')}
          >
            {p.consentimentoEm ? 'Pôr no ar' : 'Pôr no ar · autorizou por WhatsApp'}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => correr(() => setCompanionPausedAsAdmin(p.companionId, true), 'Perfil em pausa')}
          >
            Pausar
          </Button>
        )}
      </div>

      <ImportedShareButtons
        companionId={p.companionId}
        previewPath={p.previewPath}
        temConvite={Boolean(p.conviteExpiraEm)}
      />

      <ConsentDialog
        aberto={consentimentoAberto}
        onFechar={() => setConsentimentoAberto(false)}
        isPending={isPending}
        onConfirmar={(dados) => correr(() => registerCandidateConsent(p.candidateId, dados), 'Consentimento registado')}
      />
    </li>
  );
}
