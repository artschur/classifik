import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { sql } from 'drizzle-orm';
import { db } from '..';
import { isAdmin } from '@/components/header';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { buildPrefill, draftSchema, type ApprovalPrefill, type Draft } from '@/lib/candidate-approval';

/**
 * Candidatas a anunciante à espera de contacto (staging.candidatos, ver
 * drizzle/0033). Só para a fila do /verify: nunca são lidas por páginas
 * públicas, e não estão na tabela companions até ela autorizar.
 *
 * Fica fora de um ficheiro 'use server' de propósito: assim não é uma acção
 * chamável do navegador, só uma leitura feita no servidor pela página.
 */
export type Candidate = {
  id: string;
  status: 'candidato' | 'contactado' | 'autorizado' | 'publicado' | 'recusado';
  nomeAnuncio: string;
  telefone: string;
  cidade: string | null;
  zona: string | null;
  distrito: string | null;
  distritoSlug: string | null;
  idadeTexto: string | null;
  nacionalidade: string | null;
  idiomas: string[];
  horario: string | null;
  descricao: string | null;
  olhos: string | null;
  altura: string | null;
  peso: string | null;
  /** Caminho no bucket "candidatas" e endereço assinado para o ver. */
  fotos: { path: string; url: string }[];
  /** False enquanto o script de descarga não passou por ela. */
  fotosGuardadas: boolean;
  prefill: ApprovalPrefill;
  /** O que o admin já preparou no formulário e guardou sem publicar. */
  rascunho: Draft | null;
  origens: string[];
  nFontes: number;
  flags: string[];
  pontuacao: number | null;
  consentimentoEm: Date | null;
};

const hostDe = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

/** Endereços assinados, mantendo cada um junto do caminho a que pertence. */
async function fotosAssinadas(paths: string[]) {
  if (paths.length === 0) return [];
  const { data, error } = await getSupabaseAdmin()
    .storage.from('candidatas')
    .createSignedUrls(paths, 60 * 60);
  if (error || !data) {
    console.error('Falha ao assinar fotos de candidata:', error);
    return [];
  }
  return data
    .filter((item): item is typeof item & { path: string; signedUrl: string } =>
      Boolean(item.path && item.signedUrl))
    .map((item) => ({ path: item.path, url: item.signedUrl }));
}

type Row = {
  id: string;
  status: Candidate['status'];
  nome_anuncio: string;
  telefone: string;
  cidade: string | null;
  zona: string | null;
  distrito: string | null;
  distrito_slug: string | null;
  city_id: number | null;
  idade_texto: string | null;
  nacionalidade: string | null;
  idiomas: string[] | null;
  horario: string | null;
  descricao: string | null;
  olhos: string | null;
  altura: string | null;
  peso: string | null;
  fotos_guardadas: string[] | null;
  rascunho: unknown;
  origens: unknown;
  n_fontes: number;
  flags: string[] | null;
  pontuacao: string | null;
  consentimento_em: Date | null;
};

export async function getCandidates(): Promise<Candidate[]> {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    throw new Error('Não autorizado');
  }

  // Quem recusou é apagada; quem já foi publicada passou para companions.
  const rows = await db.execute<Row>(sql`
    select c.*, ci.city as distrito, ci.slug as distrito_slug
    from staging.candidatos c
    left join public.cities ci on ci.id = c.city_id
    where c.status in ('candidato', 'contactado', 'autorizado')
    order by ci.slug nulls last, c.pontuacao desc nulls last, c.criado_em
  `);

  return Promise.all(Array.from(rows).map(async (r) => {
    const origens = Array.isArray(r.origens) ? r.origens : [];
    const hosts = origens
      .map((o) => (typeof o === 'string' ? o : (o as { url?: string })?.url))
      .filter((u): u is string => typeof u === 'string')
      .map(hostDe)
      .filter((h): h is string => Boolean(h));

    return {
      id: r.id,
      status: r.status,
      nomeAnuncio: r.nome_anuncio,
      telefone: r.telefone,
      cidade: r.cidade,
      zona: r.zona,
      distrito: r.distrito,
      distritoSlug: r.distrito_slug,
      idadeTexto: r.idade_texto,
      nacionalidade: r.nacionalidade,
      idiomas: r.idiomas ?? [],
      horario: r.horario,
      descricao: r.descricao,
      olhos: r.olhos,
      altura: r.altura,
      peso: r.peso,
      // Cópias no bucket privado "candidatas" (drizzle/0034), vistas por
      // endereços assinados.
      fotos: await fotosAssinadas(r.fotos_guardadas ?? []),
      fotosGuardadas: r.fotos_guardadas !== null,
      prefill: buildPrefill({
        idadeTexto: r.idade_texto,
        cityId: r.city_id,
        altura: r.altura,
        peso: r.peso,
        olhos: r.olhos,
        idiomas: r.idiomas ?? [],
        descricao: r.descricao,
      }),
      rascunho: r.rascunho ? (draftSchema.safeParse(r.rascunho).data ?? null) : null,
      origens: [...new Set(hosts)],
      nFontes: r.n_fontes,
      flags: r.flags ?? [],
      pontuacao: r.pontuacao === null ? null : Number(r.pontuacao),
      consentimentoEm: r.consentimento_em,
    };
  }));
}
