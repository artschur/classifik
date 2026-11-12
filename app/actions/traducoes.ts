'use server';

import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { companionPendingEditsTable, companionsTable } from '@/db/schema';
import { isAdmin } from '@/components/header';
import {
  caracteresDe,
  fonteDaTraducao,
  garantirTraducao,
  garantirTraducaoComCusto,
  gravarTraducaoRevista,
  traduzirDescricoes,
  type EstadoTraducao,
  type MotivoFalha,
} from '@/lib/traducao-perfis';

/**
 * Acções do admin sobre a versão inglesa das descrições. Este ficheiro é
 * 'use server': cada função exportada é chamável do navegador, por isso
 * todas começam por confirmar que quem chama é admin.
 */

async function souAdmin(): Promise<boolean> {
  const { userId } = await auth();
  return Boolean(userId && isAdmin(userId));
}

/**
 * Por pedido do botão "Traduzir os que faltam". O limite diário configurado
 * no Google Cloud é de 15 000 caracteres; fica margem para as aprovações do
 * mesmo dia, que também traduzem.
 */
const LIMITE_POR_LOTE = 12_000;

export type RevisaoIngles =
  | {
      ok: true;
      fonte: string;
      shortPt: string;
      descPt: string;
      shortEn: string;
      descEn: string;
      /** 'guardada': já existia para este texto. 'nova': acabada de traduzir, ainda por gravar. */
      origem: 'guardada' | 'nova';
      /** A guardada já foi corrigida por um admin: continua marcada como revista. */
      revista: boolean;
      /** A descrição já estava escrita em inglês: o texto é o dela. */
      original: boolean;
    }
  | {
      ok: false;
      motivo: MotivoFalha | 'nao-autorizado' | 'nao-encontrado';
      fonte?: string;
      shortPt?: string;
      descPt?: string;
    };

/**
 * Prepara a versão inglesa para o admin rever antes de aprovar. Usa o texto
 * que vai ficar publicado: o da edição à espera, se houver, senão o actual.
 * Não grava nada: a tradução só é guardada ao aprovar, com as correcções.
 */
export async function prepararRevisaoIngles(companionId: number): Promise<RevisaoIngles> {
  if (!(await souAdmin())) return { ok: false, motivo: 'nao-autorizado' };

  const [perfil] = await db
    .select({
      shortDescription: companionsTable.shortDescription,
      description: companionsTable.description,
      shortDescriptionEn: companionsTable.shortDescriptionEn,
      descriptionEn: companionsTable.descriptionEn,
      fonte: companionsTable.translation_source,
      estado: companionsTable.translation_status,
      payload: companionPendingEditsTable.payload,
    })
    .from(companionsTable)
    .leftJoin(
      companionPendingEditsTable,
      eq(companionPendingEditsTable.companion_id, companionsTable.id),
    )
    .where(eq(companionsTable.id, companionId))
    .limit(1);
  if (!perfil) return { ok: false, motivo: 'nao-encontrado' };

  // Igual ao que applyCompanionFormValues escreve ao aprovar a edição.
  const proposta = perfil.payload as { shortDescription?: unknown; description?: unknown } | null;
  const shortPt = proposta
    ? typeof proposta.shortDescription === 'string' ? proposta.shortDescription : ''
    : perfil.shortDescription ?? '';
  const descPt = proposta
    ? typeof proposta.description === 'string' ? proposta.description : ''
    : perfil.description ?? '';
  const fonte = fonteDaTraducao(shortPt || null, descPt);

  if (perfil.fonte === fonte && perfil.descriptionEn) {
    return {
      ok: true,
      fonte,
      shortPt,
      descPt,
      shortEn: perfil.shortDescriptionEn ?? '',
      descEn: perfil.descriptionEn,
      origem: 'guardada',
      revista: perfil.estado === 'revisto',
      original: perfil.estado === 'original',
    };
  }

  // Pela cache: abrir o separador outra vez, ou aprovar a seguir, não volta
  // a pagar o mesmo texto ao Google.
  const traducao = await traduzirDescricoes(shortPt, descPt);
  if (!traducao.ok) return { ok: false, motivo: traducao.motivo, fonte, shortPt, descPt };

  return {
    ok: true,
    fonte,
    shortPt,
    descPt,
    shortEn: traducao.shortEn,
    descEn: traducao.descEn,
    origem: 'nova',
    revista: false,
    original: traducao.original,
  };
}

export type PerfilTraducao = {
  id: number;
  name: string;
  paused: boolean;
  shortPt: string;
  descPt: string;
  shortEn: string;
  descEn: string;
  fonte: string;
  /** 'em-falta': sem tradução ou desactualizada. 'original': ela escreveu em inglês. */
  estado: 'auto' | 'revisto' | 'original' | 'em-falta';
  caracteres: number;
};

/** Perfis publicados, com o estado da versão inglesa. Os que faltam primeiro. */
export async function getPerfisParaTraducao(): Promise<PerfilTraducao[]> {
  if (!(await souAdmin())) throw new Error('Não autorizado');

  const linhas = await db
    .select({
      id: companionsTable.id,
      name: companionsTable.name,
      paused: companionsTable.paused,
      shortDescription: companionsTable.shortDescription,
      description: companionsTable.description,
      shortDescriptionEn: companionsTable.shortDescriptionEn,
      descriptionEn: companionsTable.descriptionEn,
      fonte: companionsTable.translation_source,
      estado: companionsTable.translation_status,
    })
    .from(companionsTable)
    .where(eq(companionsTable.verified, true))
    .orderBy(desc(companionsTable.id));

  const perfis = linhas.map((l): PerfilTraducao => {
    const fonte = fonteDaTraducao(l.shortDescription, l.description);
    const atual = l.fonte === fonte && Boolean(l.descriptionEn);
    return {
      id: l.id,
      name: l.name.trim(),
      paused: l.paused,
      shortPt: l.shortDescription ?? '',
      descPt: l.description ?? '',
      shortEn: atual ? l.shortDescriptionEn ?? '' : '',
      descEn: atual ? l.descriptionEn ?? '' : '',
      fonte,
      estado: atual
        ? l.estado === 'revisto' || l.estado === 'original'
          ? l.estado
          : 'auto'
        : 'em-falta',
      caracteres: caracteresDe([l.shortDescription, l.description]),
    };
  });

  const ordem = { 'em-falta': 0, auto: 1, original: 2, revisto: 3 } as const;
  return perfis.sort(
    (a, b) => ordem[a.estado] - ordem[b.estado] || Number(a.paused) - Number(b.paused),
  );
}

export type ResultadoLote = {
  ok: boolean;
  traduzidos: number;
  /** Caracteres enviados ao Google neste clique (os que vieram da cache não contam). */
  caracteres: number;
  emFalta: number;
  /** Perfis traduzidos que não ficaram gravados (o texto mudou entretanto). */
  naoGravados: string[];
  paragem?: MotivoFalha | 'lote' | 'nao-autorizado';
};

/**
 * Traduz os perfis publicados sem versão inglesa (ou com ela desactualizada),
 * os visíveis primeiro, até LIMITE_POR_LOTE caracteres. O resto fica para o
 * clique seguinte (ou para o dia seguinte, se o limite do Google chegar).
 */
export async function traduzirEmFalta(): Promise<ResultadoLote> {
  if (!(await souAdmin())) {
    return {
      ok: false,
      traduzidos: 0,
      caracteres: 0,
      emFalta: 0,
      naoGravados: [],
      paragem: 'nao-autorizado',
    };
  }

  const emFalta = (await getPerfisParaTraducao()).filter((p) => p.estado === 'em-falta');
  let traduzidos = 0;
  let caracteres = 0;
  const naoGravados: string[] = [];
  let paragem: ResultadoLote['paragem'];

  for (const perfil of emFalta) {
    // Conta tudo o que foi enviado ao Google, gravado ou não: um clique nunca
    // passa de LIMITE_POR_LOTE, aconteça o que acontecer à gravação.
    if (caracteres + perfil.caracteres > LIMITE_POR_LOTE) {
      paragem = 'lote';
      break;
    }
    const { estado, gastos } = await garantirTraducaoComCusto(perfil.id);
    caracteres += gastos;
    if (estado === 'traduzida' || estado === 'sem-texto') {
      traduzidos++;
    } else if (estado === 'desatualizada' || estado === 'nao-encontrado') {
      naoGravados.push(perfil.name);
    } else if (estado === 'limite' || estado === 'sem-chave' || estado === 'erro') {
      paragem = estado;
      break;
    }
  }

  return {
    ok: (!paragem || paragem === 'lote') && naoGravados.length === 0,
    traduzidos,
    caracteres,
    emFalta: emFalta.length - traduzidos,
    naoGravados,
    paragem,
  };
}

/** Grava a versão inglesa corrigida pelo admin. */
export async function guardarTraducao(
  companionId: number,
  dados: { shortEn: string; descEn: string; fonte: string },
): Promise<EstadoTraducao | 'nao-autorizado'> {
  if (!(await souAdmin())) return 'nao-autorizado';
  return gravarTraducaoRevista(companionId, { ...dados, editada: true });
}

/** Volta a pedir a tradução automática, por cima da que existe. */
export async function retraduzir(companionId: number): Promise<EstadoTraducao | 'nao-autorizado'> {
  if (!(await souAdmin())) return 'nao-autorizado';
  return garantirTraducao(companionId, { forcar: true });
}
