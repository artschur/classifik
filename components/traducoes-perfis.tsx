'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Languages, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  guardarTraducao,
  retraduzir,
  traduzirEmFalta,
  type PerfilTraducao,
  type ResultadoLote,
} from '@/app/actions/traducoes';

const ESTADO = {
  'em-falta': { texto: 'Sem inglês', className: 'bg-amber-100 text-amber-900' },
  auto: { texto: 'Tradução automática', className: 'bg-sky-100 text-sky-900' },
  revisto: { texto: 'Revisto', className: 'bg-green-100 text-green-800' },
} as const;

const FALHA: Record<string, string> = {
  'sem-chave': 'Falta a chave do Google (GOOGLE_TRANSLATE_API_KEY) na Vercel.',
  limite: 'O limite diário de tradução do Google foi atingido. Continue amanhã.',
  erro: 'A tradução falhou. Tente de novo mais tarde.',
  'nao-autorizado': 'Sem permissão.',
  'nao-encontrado': 'Perfil não encontrado.',
  desatualizada:
    'O texto em português deste perfil mudou entretanto. A lista foi atualizada: reveja a tradução de novo.',
};

function mensagemDoLote(r: ResultadoLote): string {
  const feitos = `${r.traduzidos} ${r.traduzidos === 1 ? 'perfil traduzido' : 'perfis traduzidos'}`;
  if (!r.paragem) return `${feitos}. Não falta nenhum.`;
  if (r.paragem === 'lote') {
    return `${feitos}. Faltam ${r.emFalta}: clique de novo para continuar.`;
  }
  return `${feitos}. ${FALHA[r.paragem] ?? FALHA.erro}`;
}

/**
 * Separador "Inglês" do /verify: a versão inglesa (/en) das descrições dos
 * perfis publicados. Traduz os que faltam (em lotes, dentro do limite diário)
 * e deixa corrigir qualquer tradução.
 */
export function TraducoesPerfis({ perfis }: { perfis: PerfilTraducao[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [aTraduzir, startLote] = useTransition();
  const emFalta = perfis.filter((p) => p.estado === 'em-falta');
  const caracteresEmFalta = emFalta.reduce((t, p) => t + p.caracteres, 0);

  const traduzirTodos = () =>
    startLote(async () => {
      const r = await traduzirEmFalta();
      toast({
        title: r.ok ? 'Tradução' : 'Tradução interrompida',
        description: mensagemDoLote(r),
        variant: r.ok ? 'success' : 'destructive',
      });
      router.refresh();
    });

  return (
    <div className="w-full space-y-6">
      <div className="rounded-lg border p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Descrições dos perfis publicados em inglês, para a versão /en. A tradução é
          automática quando um perfil é aprovado ou o texto muda; aqui pode corrigi-la ou
          traduzir os perfis que ainda não têm versão inglesa. Sem tradução, a página em
          inglês mostra o texto em português com um aviso.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <span className="font-semibold">{emFalta.length}</span> sem inglês
            {emFalta.length > 0 && (
              <span className="text-muted-foreground">
                {' '}· cerca de {caracteresEmFalta.toLocaleString('pt-PT')} caracteres
              </span>
            )}
          </p>
          <Button onClick={traduzirTodos} disabled={aTraduzir || emFalta.length === 0}>
            {aTraduzir ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Languages className="mr-2 h-4 w-4" />
            )}
            Traduzir os que faltam
          </Button>
        </div>
      </div>

      <ul className="space-y-3">
        {perfis.map((perfil) => (
          <li key={`${perfil.id}-${perfil.fonte}-${perfil.estado}`}>
            <PerfilIngles perfil={perfil} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PerfilIngles({ perfil }: { perfil: PerfilTraducao }) {
  const router = useRouter();
  const { toast } = useToast();
  const [aGravar, startGravar] = useTransition();
  const [shortEn, setShortEn] = useState(perfil.shortEn);
  const [descEn, setDescEn] = useState(perfil.descEn);
  const estado = ESTADO[perfil.estado];

  const correr = (acao: () => Promise<string>, sucesso: string) =>
    startGravar(async () => {
      const r = await acao();
      const ok = r === 'traduzida' || r === 'atual';
      toast({
        title: ok ? sucesso : 'Não foi possível',
        description: ok ? undefined : FALHA[r] ?? FALHA.erro,
        variant: ok ? 'success' : 'destructive',
      });
      if (ok || r === 'desatualizada') router.refresh();
    });

  return (
    <details className="rounded-lg border p-4">
      <summary className="flex cursor-pointer flex-wrap items-center gap-2">
        <span className="font-medium">{perfil.name}</span>
        <span className="text-xs text-muted-foreground">#{perfil.id}</span>
        {perfil.paused && <Badge variant="outline">Em pausa</Badge>}
        <Badge variant="secondary" className={estado.className}>
          {estado.texto}
        </Badge>
        <a
          href={`/en/companions/${perfil.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Ver em /en
        </a>
      </summary>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Descrição curta</p>
          <p className="text-xs text-muted-foreground">{perfil.shortPt || '(vazia)'}</p>
          {perfil.shortPt && (
            <Textarea rows={2} lang="en" value={shortEn} onChange={(e) => setShortEn(e.target.value)} />
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Descrição</p>
          <p className="whitespace-pre-line text-xs text-muted-foreground">{perfil.descPt}</p>
          <Textarea rows={8} lang="en" value={descEn} onChange={(e) => setDescEn(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              correr(
                () => guardarTraducao(perfil.id, { shortEn, descEn, fonte: perfil.fonte }),
                'Tradução guardada',
              )
            }
            disabled={aGravar || !descEn.trim()}
          >
            {aGravar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
          <Button
            variant="outline"
            onClick={() => correr(() => retraduzir(perfil.id), 'Traduzido de novo')}
            disabled={aGravar}
          >
            {perfil.estado === 'em-falta' ? 'Traduzir' : 'Traduzir de novo'}
          </Button>
        </div>
      </div>
    </details>
  );
}
