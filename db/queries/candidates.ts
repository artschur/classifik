import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { sql } from 'drizzle-orm';
import { db } from '..';
import { isAdmin } from '@/components/header';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { previewToken } from '@/lib/preview-token';
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

export type PublishedImported = {
  companionId: number;
  candidateId: string;
  name: string;
  city: string;
  paused: boolean;
  identityVerified: boolean;
  coverUrl: string | null;
  consentimentoEm: Date | null;
  conviteExpiraEm: Date | null;
  /** /companions/<id>?ver=<código>: abre o perfil mesmo em pausa. */
  previewPath: string;
};

/**
 * Perfis já criados a partir das candidatas e ainda sem conta delas, em
 * pausa ou no ar. É daqui que o admin envia a pré-visualização e o convite.
 */
export async function getPublishedImported(): Promise<PublishedImported[]> {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    throw new Error('Não autorizado');
  }

  const rows = await db.execute<{
    companion_id: number;
    candidate_id: string;
    name: string;
    city: string;
    paused: boolean;
    identity_verified: boolean;
    cover_url: string | null;
    consentimento_em: Date | null;
    convite_expira_em: Date | null;
  }>(sql`
    select p.id as companion_id, c.id as candidate_id, p.name, ci.city, p.paused, p.identity_verified,
      c.consentimento_em, c.convite_expira_em,
      (select i.public_url from public.images i
        where i.companion_id = p.id and i.is_verification_video = false
        order by i.position, i.id limit 1) as cover_url
    from staging.candidatos c
    join public.companions p on p.id = c.companion_id
    join public.cities ci on ci.id = p.location_id
    where p.auth_id like 'import\\_%'
    order by p.paused desc, p.updated_at desc`);

  return Array.from(rows).map((r) => ({
    companionId: r.companion_id,
    candidateId: r.candidate_id,
    name: r.name,
    city: r.city,
    paused: r.paused,
    identityVerified: r.identity_verified,
    coverUrl: r.cover_url,
    consentimentoEm: r.consentimento_em,
    conviteExpiraEm: r.convite_expira_em,
    previewPath: `/companions/${r.companion_id}?ver=${previewToken(r.companion_id)}`,
  }));
}

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
