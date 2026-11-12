'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import SingleCompanionVerify from '@/components/singleComponentVerify';
import { AdminProfileControls } from '@/components/admin-profile-controls';
import { Linha as LinhaImportada } from '@/components/published-imported';
import type { CompanionFiltered } from '@/types/types';
import type { PublishedImported } from '@/db/queries/candidates';
import type { ControlosDoPerfil } from '@/lib/admin-phone-search';

/** Mesma impressão digital da fila: um cartão com dados novos recomeça do zero. */
function assinatura(valor: unknown): string {
  const texto = JSON.stringify(valor);
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (Math.imul(31, h) + texto.charCodeAt(i)) | 0;
  return `${texto.length}-${h}`;
}

/**
 * Resultados da busca por telefone. Por cada perfil:
 *
 * - a barra de ações que ele tem nos outros separadores: as importadas sem
 *   conta têm a linha de Importadas/Em pausa (Ver, Editar, Gerir fotos,
 *   consentimento, Pôr no ar, pré-visualização e convite); as outras têm os
 *   controlos de admin da página do perfil (pausar, selo, mover para
 *   verificação, destaque);
 * - por baixo, o cartão completo da fila (fotos, documentos, aprovar, recusar).
 *
 * Depois de uma acção o cartão não desaparece, como na fila: a página recarrega
 * os dados e mostra o novo estado.
 */
export function VerifySearchResults({
  companions,
  controlos,
  importadas,
}: {
  companions: CompanionFiltered[];
  controlos: Record<number, ControlosDoPerfil>;
  importadas: Record<number, PublishedImported>;
}) {
  const router = useRouter();
  return (
    <div className="flex w-full flex-col items-center space-y-10">
      {companions.map((companion) => {
        const ctrl = controlos[companion.id];
        const importada = importadas[companion.id];
        return (
          <div
            key={`${companion.id}-${assinatura([companion, ctrl, importada])}`}
            className="flex w-full flex-col items-center gap-3"
          >
            <div className="w-full max-w-2xl">
              {importada ? (
                <ul>
                  <LinhaImportada perfil={importada} />
                </ul>
              ) : (
                ctrl && (
                  <AdminProfileControls
                    companionId={ctrl.companionId}
                    name={ctrl.name}
                    paused={ctrl.paused}
                    verified={ctrl.verified}
                    identityVerified={ctrl.identityVerified}
                    viaSelo={ctrl.viaSelo}
                    vipActive={ctrl.vipActive}
                    isSugarOfDay={ctrl.isSugarOfDay}
                    previewPath={ctrl.previewPath}
                  />
                )
              )}
            </div>
            <SingleCompanionVerify
              companion={companion}
              onActionComplete={() => router.refresh()}
              esconderEdicao
            />
            <Link
              href={`/companions/${companion.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Abrir a página pública do perfil
            </Link>
          </div>
        );
      })}
    </div>
  );
}
