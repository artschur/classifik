import 'server-only';

import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '..';
import {
  characteristicsTable,
  companionPendingEditsTable,
  companionsTable,
  documentsTable,
} from '../schema';
import { caracteristicasVazias } from '@/lib/registo-schema';

/**
 * Estado da verificação de identidade (vídeo e documento), lido dos ficheiros
 * enviados. Fica num ficheiro à parte, e não em companions.ts ou nas acções de
 * documentos, porque esses são 'use server' e tudo o que exportam passa a ser
 * chamável do navegador.
 */

export const TIPOS_DOCUMENTO_ID = ['id_card', 'passport', 'drivers_license', 'selfie'];

/** Estado de cada peça: o vídeo, e o documento de identificação. */
export type EstadoPeca = 'por-enviar' | 'pendente' | 'aprovado' | 'recusado';

/**
 * - verificada: tem o selo
 * - em-analise: vídeo e documento enviados, à espera do admin
 * - parcial: só um dos dois enviado
 * - recusada: o que enviou foi recusado e não mandou outro
 * - por-enviar: nunca enviou nada
 */
export type EstadoVerificacao = 'verificada' | 'em-analise' | 'parcial' | 'recusada' | 'por-enviar';

export type ResumoDocumentos = {
  video: EstadoPeca;
  documento: EstadoPeca;
  /** Motivo escrito pelo admin na recusa mais recente, para ela ver. */
  motivoRecusa: string | null;
};

type LinhaDocumento = {
  companionId: number;
  document_type: string;
  status: string;
  notes: string | null;
};

/**
 * Uma peça vale pelo melhor que tiver: um envio pendente ou aprovado conta
 * mesmo que haja recusas antigas do mesmo tipo, porque é o reenvio dela.
 */
function estadoPeca(linhas: LinhaDocumento[]): EstadoPeca {
  if (linhas.some((d) => d.status === 'pendente')) return 'pendente';
  if (linhas.some((d) => d.status === 'aprovado')) return 'aprovado';
  if (linhas.some((d) => d.status === 'recusado')) return 'recusado';
  return 'por-enviar';
}

/** As linhas chegam da mais recente para a mais antiga. */
function resumir(linhas: LinhaDocumento[]): ResumoDocumentos {
  const videos = linhas.filter((d) => d.document_type === 'verification_video');
  const documentos = linhas.filter((d) => TIPOS_DOCUMENTO_ID.includes(d.document_type));
  const video = estadoPeca(videos);
  const documento = estadoPeca(documentos);

  const recusadas = [
    ...(video === 'recusado' ? videos : []),
    ...(documento === 'recusado' ? documentos : []),
  ].filter((d) => d.status === 'recusado' && d.notes);

  return { video, documento, motivoRecusa: recusadas[0]?.notes ?? null };
}

const enviada = (p: EstadoPeca) => p === 'pendente' || p === 'aprovado';

export function estadoVerificacao(
  identityVerified: boolean,
  r: ResumoDocumentos,
): EstadoVerificacao {
  if (identityVerified) return 'verificada';
  if (enviada(r.video) && enviada(r.documento)) return 'em-analise';
  if (enviada(r.video) || enviada(r.documento)) return 'parcial';
  if (r.video === 'recusado' || r.documento === 'recusado') return 'recusada';
  return 'por-enviar';
}

/**
 * Vídeo e documento ambos à espera do admin. É o caso em que ele já não pode
 * pô-la no ar sem selo: tem de aprovar como verificada ou recusar os
 * documentos primeiro.
 */
export function verificacaoCompletaPendente(r: ResumoDocumentos): boolean {
  return r.video === 'pendente' && r.documento === 'pendente';
}

export function temDocumentosPendentes(r: ResumoDocumentos): boolean {
  return r.video === 'pendente' || r.documento === 'pendente';
}

export async function resumoDocumentosPorCompanion(
  companionIds: number[],
): Promise<Map<number, ResumoDocumentos>> {
  const resumos = new Map<number, ResumoDocumentos>();
  if (companionIds.length === 0) return resumos;

  const linhas = await db
    .select({
      companionId: documentsTable.companionId,
      document_type: documentsTable.document_type,
      status: documentsTable.status,
      notes: documentsTable.notes,
    })
    .from(documentsTable)
    .where(inArray(documentsTable.companionId, companionIds))
    .orderBy(desc(documentsTable.created_at), desc(documentsTable.id));

  for (const id of companionIds) {
    resumos.set(id, resumir(linhas.filter((d) => d.companionId === id)));
  }
  return resumos;
}

export async function resumoDocumentos(companionId: number): Promise<ResumoDocumentos> {
  const resumos = await resumoDocumentosPorCompanion([companionId]);
  return resumos.get(companionId)!;
}

/**
 * Quem pode comprar um plano: perfil aprovado e com o selo "Verificada". Sem
 * selo, o caminho é a verificação; com selo mas fora do ar (devolvida à
 * verificação pelo admin), espera pela nova aprovação.
 */
export type AcessoPlanos = 'sem-perfil' | 'sem-selo' | 'em-revisao' | 'pode';

export async function acessoAPlanos(clerkId: string): Promise<AcessoPlanos> {
  const [companion] = await db
    .select({
      verified: companionsTable.verified,
      identityVerified: companionsTable.identity_verified,
    })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, clerkId))
    .limit(1);

  if (!companion) return 'sem-perfil';
  if (!companion.identityVerified) return 'sem-selo';
  if (!companion.verified) return 'em-revisao';
  return 'pode';
}

/**
 * Tudo o que os avisos dela precisam (painel, edição, próprio anúncio e fim do
 * registo): se o perfil está no ar, recusado, verificado, e se as
 * características estão por preencher. Null se ainda não há perfil.
 */
export type EstadoRegisto = {
  companionId: number;
  aprovado: boolean;
  pausado: boolean;
  recusado: boolean;
  motivoRecusa: string | null;
  verificacao: EstadoVerificacao;
  documentos: ResumoDocumentos;
  caracteristicasVazias: boolean;
  /** Já preencheu, mas o perfil está no ar e a edição espera pelo admin. */
  caracteristicasEmRevisao: boolean;
};

export async function estadoDoRegisto(clerkId: string): Promise<EstadoRegisto | null> {
  const [linha] = await db
    .select({
      id: companionsTable.id,
      verified: companionsTable.verified,
      paused: companionsTable.paused,
      identityVerified: companionsTable.identity_verified,
      rejectedAt: companionsTable.rejected_at,
      rejectionReason: companionsTable.rejection_reason,
      weight: characteristicsTable.weight,
      height: characteristicsTable.height,
      ethnicity: characteristicsTable.ethnicity,
      eye_color: characteristicsTable.eye_color,
      hair_color: characteristicsTable.hair_color,
      hair_length: characteristicsTable.hair_length,
      shoe_size: characteristicsTable.shoe_size,
      edicaoPendente: companionPendingEditsTable.payload,
    })
    .from(companionsTable)
    .leftJoin(characteristicsTable, eq(characteristicsTable.companion_id, companionsTable.id))
    .leftJoin(
      companionPendingEditsTable,
      eq(companionPendingEditsTable.companion_id, companionsTable.id),
    )
    .where(eq(companionsTable.auth_id, clerkId))
    .limit(1);

  if (!linha) return null;

  const documentos = await resumoDocumentos(linha.id);
  const vazias = caracteristicasVazias(linha);

  return {
    companionId: linha.id,
    aprovado: linha.verified,
    pausado: linha.paused,
    recusado: linha.rejectedAt !== null,
    motivoRecusa: linha.rejectionReason,
    verificacao: estadoVerificacao(linha.identityVerified, documentos),
    documentos,
    caracteristicasVazias: vazias,
    caracteristicasEmRevisao:
      vazias && linha.edicaoPendente !== null && !caracteristicasVazias(linha.edicaoPendente),
  };
}

/** Por que via foi dado o selo ('documento' ou 'whatsapp'). Só para o admin. */
export async function viaDoSelo(companionId: number): Promise<string | null> {
  const [linha] = await db
    .select({ via: companionsTable.identity_verified_method })
    .from(companionsTable)
    .where(eq(companionsTable.id, companionId))
    .limit(1);
  return linha?.via ?? null;
}

/** Para onde vai quem ainda não pode comprar. */
export const DESTINO_SEM_ACESSO: Record<Exclude<AcessoPlanos, 'pode'>, string> = {
  'sem-perfil': '/companions/register',
  'sem-selo': '/companions/verification',
  'em-revisao': '/profile',
};
