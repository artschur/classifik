import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '..';
import { neighborhoodsTable } from '../schema';

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * O concelho é digitado à mão pela anunciante, então o mesmo sítio chega
 * escrito de várias formas ("Cascais", "cascais", "CASCAIS"). Guardamos uma
 * linha canónica por concelho e distrito, identificada pelo slug, e ligamos a
 * companion a ela. Assim o campo fica pronto para servir de filtro ou de
 * página própria mais tarde, em vez de ser texto solto repetido.
 *
 * Vive fora de companions.ts porque esse ficheiro é 'use server': exportada
 * de lá, passava a ser uma acção chamável do navegador.
 */
export async function resolveNeighborhoodId(
  tx: typeof db,
  rawName: string | undefined | null,
  cityId: number,
): Promise<number | null> {
  const name = rawName?.trim();
  if (!name) return null;

  const slug = slugify(name);
  if (!slug) return null;

  const [existing] = await tx
    .select({ id: neighborhoodsTable.id })
    .from(neighborhoodsTable)
    .where(and(eq(neighborhoodsTable.slug, slug), eq(neighborhoodsTable.city_id, cityId)))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await tx
    .insert(neighborhoodsTable)
    .values({ neighborhood: name, city_id: cityId, slug })
    .returning({ id: neighborhoodsTable.id });

  return created?.id ?? null;
}
