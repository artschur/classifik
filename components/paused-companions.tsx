'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { PausedCompanion } from '@/db/queries/paused';
import { sendCompanionToReview, setCompanionPausedAsAdmin } from '@/db/queries/companions';
import { ImportedShareButtons } from '@/components/imported-share-buttons';

/**
 * Separador "Em pausa" do /verify.
 *
 * Dois casos com donos diferentes: os perfis importados por publicar, que o
 * admin põe no ar quando estiverem bem, e as anunciantes que pausaram o
 * próprio anúncio, que só se vêem aqui. Reactivar essas seria passar por
 * cima de uma decisão delas.
 */
export function PausedCompanions({ companions }: { companions: PausedCompanion[] }) {
  const importadas = companions.filter((c) => c.imported);
  const daAnunciante = companions.filter((c) => !c.imported);

  if (companions.length === 0) {
    return <p className="text-lg text-center text-gray-500">Não há perfis em pausa.</p>;
  }

  return (
    <div className="space-y-8">
      <Secao
        titulo="Importadas por publicar"
        nota="Criadas a partir das candidatas e ainda escondidas. Pôr no ar regista que ela autorizou por WhatsApp."
        lista={importadas}
        geridaPeloAdmin
      />
      <Secao
        titulo="Pausadas pela anunciante"
        nota="Foi ela que escondeu o anúncio. Só ela o volta a pôr no ar."
        lista={daAnunciante}
        geridaPeloAdmin={false}
      />
    </div>
  );
}

function Secao({
  titulo,
  nota,
  lista,
  geridaPeloAdmin,
}: {
  titulo: string;
  nota: string;
  lista: PausedCompanion[];
  geridaPeloAdmin: boolean;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold border-b pb-2">
          {titulo} <span className="text-muted-foreground font-normal">· {lista.length}</span>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{nota}</p>
      </div>
      {lista.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum.</p>
      ) : (
        <ul className="space-y-3">
          {lista.map((c) => (
            <Linha key={c.id} companion={c} geridaPeloAdmin={geridaPeloAdmin} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Linha({ companion: c, geridaPeloAdmin }: { companion: PausedCompanion; geridaPeloAdmin: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

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
    <li className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center gap-3">
      {c.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- miniatura simples
        <img src={c.coverUrl} alt="" className="h-16 w-12 shrink-0 rounded object-cover" />
      ) : (
        <div className="h-16 w-12 shrink-0 rounded bg-muted" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{c.name}</span>
          <Badge variant="outline">{c.city}</Badge>
          {!c.identityVerified && <Badge variant="secondary">Sem selo</Badge>}
        </div>
        {c.updatedAt && (
          <p className="text-xs text-muted-foreground">
            Última alteração a {new Date(c.updatedAt).toLocaleDateString('pt-PT')}
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/companions/${c.id}`} target="_blank">
            Ver perfil
          </Link>
        </Button>
        {geridaPeloAdmin && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => correr(() => sendCompanionToReview(c.id), 'Devolvido à verificação')}
            >
              Devolver à verificação
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => correr(() => setCompanionPausedAsAdmin(c.id, false), 'Perfil no ar')}
            >
              {/* Regista que ela autorizou por WhatsApp, se ainda não houver registo. */}
              Pôr no ar · autorizou por WhatsApp
            </Button>
          </>
        )}
      </div>
      </div>
      {c.previewPath && <ImportedShareButtons companionId={c.id} previewPath={c.previewPath} />}
    </li>
  );
}
