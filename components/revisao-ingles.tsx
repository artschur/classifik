'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { prepararRevisaoIngles } from '@/app/actions/traducoes';

/** Versão inglesa a gravar na aprovação. Fica no cartão, para sobreviver à troca de separador. */
export type InglesEmRevisao = {
  fonte: string;
  shortPt: string;
  descPt: string;
  shortEn: string;
  descEn: string;
  editada: boolean;
};

const AVISOS: Record<string, string> = {
  'sem-chave':
    'A tradução automática ainda não está ligada (falta a chave do Google na Vercel). Pode escrever a versão inglesa à mão, ou aprovar assim e traduzir depois no separador "Inglês".',
  limite:
    'O limite diário de tradução foi atingido. Pode escrever a versão inglesa à mão, ou aprovar assim: o perfil fica com o português em /en e traduz-se depois no separador "Inglês".',
  erro:
    'A tradução automática falhou. Pode escrever a versão inglesa à mão, ou aprovar assim e tentar depois no separador "Inglês".',
};

/**
 * Separador "Inglês" da fila de verificação: a tradução automática do texto
 * que vai ficar publicado, para o admin corrigir antes de aprovar. Só traduz
 * quando o separador é aberto; se não for, a aprovação traduz sozinha.
 */
export function RevisaoIngles({
  companionId,
  valor,
  onChange,
}: {
  companionId: number;
  valor: InglesEmRevisao | null;
  onChange: (valor: InglesEmRevisao) => void;
}) {
  const [aCarregar, setACarregar] = useState(valor === null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (valor !== null) return;
    let ativo = true;
    prepararRevisaoIngles(companionId)
      .then((r) => {
        if (!ativo) return;
        if (r.ok) {
          onChange({
            fonte: r.fonte,
            shortPt: r.shortPt,
            descPt: r.descPt,
            shortEn: r.shortEn,
            descEn: r.descEn,
            editada: r.revista,
          });
        } else if (r.fonte !== undefined) {
          setAviso(AVISOS[r.motivo] ?? AVISOS.erro);
          onChange({
            fonte: r.fonte,
            shortPt: r.shortPt ?? '',
            descPt: r.descPt ?? '',
            shortEn: '',
            descEn: '',
            editada: true,
          });
        } else {
          setAviso('Não foi possível abrir a versão inglesa deste perfil.');
        }
      })
      .catch(() => ativo && setAviso(AVISOS.erro))
      .finally(() => ativo && setACarregar(false));
    return () => {
      ativo = false;
    };
    // Carrega uma vez por cartão: o valor fica guardado no cartão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companionId]);

  if (aCarregar) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A traduzir…
      </div>
    );
  }

  if (!valor) {
    return <p className="py-6 text-sm text-muted-foreground">{aviso}</p>;
  }

  const editar = (campo: 'shortEn' | 'descEn', texto: string) =>
    onChange({ ...valor, [campo]: texto, editada: true });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Versão que aparece em /en. É a tradução automática do texto que vai ficar
        publicado: corrija o que for preciso, é gravada ao aprovar. Se não abrir
        este separador, a tradução é feita na mesma ao aprovar.
      </p>
      {aviso && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          {aviso}
        </p>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium">Descrição curta</p>
        <p className="text-xs text-muted-foreground">{valor.shortPt || '(vazia)'}</p>
        {valor.shortPt && (
          <Textarea
            rows={2}
            lang="en"
            value={valor.shortEn}
            onChange={(e) => editar('shortEn', e.target.value)}
          />
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Descrição</p>
        <p className="whitespace-pre-line text-xs text-muted-foreground">{valor.descPt}</p>
        <Textarea
          rows={8}
          lang="en"
          value={valor.descEn}
          onChange={(e) => editar('descEn', e.target.value)}
        />
      </div>
    </div>
  );
}
