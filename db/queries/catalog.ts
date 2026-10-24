import 'server-only';

import { and, asc, desc, eq, gte, ilike, inArray, lte, sql, type SQL } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from '..';
import { characteristicsTable, citiesTable, companionsTable, imagesTable, reviewsTable } from '../schema';
import type { FilterTypesCompanions } from '@/types/types';

/**
 * Catálogo da página principal (/): todas as sugars no ar, de
 * todos os distritos, com os mesmos filtros da página de distrito
 * (getCompanionsToFilter) e o total, para a paginação numerada.
 *
 * Fica num ficheiro à parte, e não em companions.ts, porque aquele é
 * 'use server' e tudo o que exporta passa a ser chamável do navegador.
 */
export type CatalogCompanion = {
  id: number;
  name: string;
  age: number;
  gender: string;
  city: string;
  citySlug: string;
  planType: string;
  identityVerified: boolean;
  price: number | null;
  cover: { url: string; focalX: number; focalY: number; zoom: number } | null;
  photoCount: number;
  rating: number | null;
  reviewCount: number;
};

/** Igual às condições da página de distrito, sem o distrito. */
function condicoes(filters?: FilterTypesCompanions): SQL[] {
  const c: SQL[] = [eq(companionsTable.verified, true), eq(companionsTable.paused, false)];

  if (filters?.search) {
    c.push(sql`LOWER(${companionsTable.name}) LIKE LOWER(${'%' + filters.search + '%'})`);
  }
  if (filters?.price) {
    const [min, max] = filters.price.split('-').map(Number);
    if (min && max) c.push(and(gte(companionsTable.price, min), lte(companionsTable.price, max))!);
  }
  if (filters?.gender) {
    const g = filters.gender.toLowerCase();
    if (g === 'feminino' || g === 'masculino' || g === 'trans') c.push(ilike(companionsTable.gender, g));
  }
  if (filters?.age) {
    const [min, max] = filters.age.split('-').map(Number);
    if (min && max) c.push(and(gte(companionsTable.age, min), lte(companionsTable.age, max))!);
  }
  if (filters?.height) {
    const [min, max] = filters.height.split('-').map(Number);
    if (min && max) {
      c.push(and(gte(characteristicsTable.height, String(min / 100)), lte(characteristicsTable.height, String(max / 100)))!);
    }
  }
  if (filters?.weight) {
    const [min, max] = filters.weight.split('-').map(Number);
    if (min && max) {
      c.push(and(gte(characteristicsTable.weight, String(min)), lte(characteristicsTable.weight, String(max)))!);
    }
  }
  if (filters?.hairColor) {
    const cores = filters.hairColor.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
    if (cores.length) c.push(inArray(sql`LOWER(${characteristicsTable.hair_color})`, cores));
  }
  if (filters?.silicone) c.push(eq(characteristicsTable.silicone, true));
  if (filters?.tattoos) c.push(eq(characteristicsTable.tattoos, true));
  if (filters?.smoker) c.push(eq(characteristicsTable.smoker, true));

  return c;
}

/** Planos pagos primeiro (VIP, Plus, Clássico), como nos distritos. */
const ordemPlano = sql`CASE
  WHEN ${companionsTable.ad_expiration_date} IS NULL OR ${companionsTable.ad_expiration_date} <= NOW() THEN 0
  WHEN ${companionsTable.plan_type} = 'vip' THEN 3
  WHEN ${companionsTable.plan_type} = 'plus' THEN 2
  WHEN ${companionsTable.plan_type} = 'classic' THEN 1
  ELSE 0 END`;

export const getCatalogCompanions = unstable_cache(
  async (
    page: number,
    pageSize: number,
    filters?: FilterTypesCompanions,
  ): Promise<{ companions: CatalogCompanion[]; total: number }> => {
    const onde = and(...condicoes(filters));

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(companionsTable)
      .innerJoin(characteristicsTable, eq(characteristicsTable.companion_id, companionsTable.id))
      .where(onde);

    if (!total) return { companions: [], total: 0 };

    // Preço só ordena quando pedido; sem preço vai sempre para o fim.
    const ordemPreco =
      filters?.sort === 'price-asc'
        ? [sql`${companionsTable.price} asc nulls last`]
        : filters?.sort === 'price-desc'
          ? [sql`${companionsTable.price} desc nulls last`]
          : [];

    const linhas = await selecionar()
      .where(onde)
      // O id no fim dá uma ordem estável: sem ele, a mesma sugar podia
      // aparecer em duas páginas ou em nenhuma.
      .orderBy(desc(ordemPlano), ...ordemPreco, desc(companionsTable.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { total, companions: await completar(linhas) };
  },
  ['catalogo-home'],
  { revalidate: 1800, tags: ['companions', 'companions-filter'] },
);

/**
 * Destaques do topo: quem tem plano pago e válido, VIP primeiro, por ordem
 * aleatória dentro de cada plano (como o carrossel da página actual).
 */
export const getFeaturedCompanions = unstable_cache(
  async (limite: number): Promise<CatalogCompanion[]> => {
    const linhas = await selecionar()
      .where(
        and(
          eq(companionsTable.verified, true),
          eq(companionsTable.paused, false),
          inArray(companionsTable.plan_type, ['vip', 'plus', 'classic']),
          sql`${companionsTable.ad_expiration_date} > NOW()`,
        ),
      )
      .orderBy(desc(ordemPlano), sql`RANDOM()`)
      .limit(limite);
    return completar(linhas);
  },
  ['destaques-home'],
  { revalidate: 300, tags: ['companions'] },
);

function selecionar() {
  return db
    .select({
      id: companionsTable.id,
      name: companionsTable.name,
      age: companionsTable.age,
      gender: companionsTable.gender,
      price: companionsTable.price,
      identityVerified: companionsTable.identity_verified,
      city: citiesTable.city,
      citySlug: citiesTable.slug,
      planType: sql<string>`CASE WHEN ${companionsTable.ad_expiration_date} > NOW() THEN ${companionsTable.plan_type} ELSE 'free' END`,
      rating: sql<string | null>`(SELECT avg(r.rating) FROM ${reviewsTable} r WHERE r.companion_id = ${companionsTable.id})`,
      reviewCount: sql<number>`(SELECT count(*)::int FROM ${reviewsTable} r WHERE r.companion_id = ${companionsTable.id})`,
    })
    .from(companionsTable)
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    .innerJoin(characteristicsTable, eq(characteristicsTable.companion_id, companionsTable.id));
}

type Linha = Awaited<ReturnType<typeof selecionar>>[number];

/** Junta a capa (com o enquadramento escolhido) e o número de fotos. */
async function completar(linhas: Linha[]): Promise<CatalogCompanion[]> {
  const ids = linhas.map((l) => l.id);
  const fotos = ids.length
    ? await db
        .select({
          companionId: imagesTable.companionId,
          url: imagesTable.public_url,
          focalX: imagesTable.focal_x,
          focalY: imagesTable.focal_y,
          zoom: imagesTable.zoom,
        })
        .from(imagesTable)
        .where(
          and(
            inArray(imagesTable.companionId, ids),
            eq(imagesTable.pending_approval, false),
            eq(imagesTable.is_verification_video, false),
          ),
        )
        .orderBy(asc(imagesTable.position), asc(imagesTable.id))
    : [];

  const porPerfil = new Map<number, typeof fotos>();
  for (const f of fotos) {
    // Vídeos não servem de capa num cartão.
    if (/\.(mp4|webm|ogg|mov)$/i.test(f.url)) continue;
    const lista = porPerfil.get(f.companionId) ?? [];
    lista.push(f);
    porPerfil.set(f.companionId, lista);
  }

  return linhas.map((l) => {
    const lista = porPerfil.get(l.id) ?? [];
    const capa = lista[0];
    return {
      ...l,
      rating: l.rating === null ? null : Math.round(Number(l.rating) * 10) / 10,
      cover: capa
        ? { url: capa.url, focalX: capa.focalX ?? 50, focalY: capa.focalY ?? 50, zoom: capa.zoom ?? 100 }
        : null,
      photoCount: lista.length,
    };
  });
}