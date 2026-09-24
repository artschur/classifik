import { db } from '..';
import {
  storiesTable,
  companionsTable,
  citiesTable,
  imagesTable,
  DbStory,
  NewDbStory,
} from '../schema';
import { eq, and, asc, desc } from 'drizzle-orm';

export type { DbStory };

/** Acompanhante ligada a um conto, tal como é mostrada a quem lê. */
export type StoryCompanion = {
  id: number;
  name: string;
  age: number;
  city: string;
  shortDescription: string | null;
  imageUrl: string | null;
};

/**
 * Perfis que podem ser ligados a um conto, agrupados por distrito.
 *
 * Só entram os que estão mesmo no ar. Ligar um conto a um perfil por aprovar
 * ou pausado dava uma ligação para uma página que responde "não existe" a
 * quem a seguisse.
 */
export async function getLinkableCompanionsByDistrict(): Promise<
  { district: string; companions: { id: number; name: string }[] }[]
> {
  const rows = await db
    .select({
      id: companionsTable.id,
      name: companionsTable.name,
      district: citiesTable.city,
    })
    .from(companionsTable)
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    .where(
      and(eq(companionsTable.verified, true), eq(companionsTable.paused, false)),
    )
    .orderBy(asc(citiesTable.city), asc(companionsTable.name));

  const porDistrito = new Map<string, { id: number; name: string }[]>();
  for (const row of rows) {
    if (!porDistrito.has(row.district)) porDistrito.set(row.district, []);
    porDistrito.get(row.district)!.push({ id: row.id, name: row.name });
  }

  return Array.from(porDistrito, ([district, companions]) => ({
    district,
    companions,
  }));
}

/**
 * A acompanhante ligada a um conto, para mostrar a quem lê.
 *
 * As condições de visibilidade são reavaliadas aqui, e não apenas no momento
 * de ligar: um perfil pode ter sido pausado ou devolvido à verificação depois
 * de o conto ser publicado, e nesse caso a ligação simplesmente deixa de
 * aparecer, em vez de levar a uma página que já não existe.
 */
export async function getStoryCompanion(
  companionId: number | null,
): Promise<StoryCompanion | null> {
  if (!companionId) return null;

  const [companion] = await db
    .select({
      id: companionsTable.id,
      name: companionsTable.name,
      age: companionsTable.age,
      city: citiesTable.city,
      shortDescription: companionsTable.shortDescription,
    })
    .from(companionsTable)
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    .where(
      and(
        eq(companionsTable.id, companionId),
        eq(companionsTable.verified, true),
        eq(companionsTable.paused, false),
      ),
    )
    .limit(1);

  if (!companion) return null;

  const [foto] = await db
    .select({ url: imagesTable.public_url })
    .from(imagesTable)
    .where(
      and(
        eq(imagesTable.companionId, companionId),
        eq(imagesTable.is_verification_video, false),
        eq(imagesTable.pending_approval, false),
      ),
    )
    .orderBy(asc(imagesTable.position), asc(imagesTable.id))
    .limit(1);

  return { ...companion, imageUrl: foto?.url ?? null };
}

/** Troca a imagem de capa de um conto já publicado. */
export async function setDbStoryCover(
  id: number,
  coverImageUrl: string,
  coverStoragePath: string,
): Promise<void> {
  await db
    .update(storiesTable)
    .set({
      cover_image_url: coverImageUrl,
      cover_storage_path: coverStoragePath,
    })
    .where(eq(storiesTable.id, id));
}

/** Liga ou desliga um conto de um perfil. `null` desfaz a ligação. */
export async function setDbStoryCompanion(
  id: number,
  companionId: number | null,
): Promise<void> {
  await db
    .update(storiesTable)
    .set({ companion_id: companionId })
    .where(eq(storiesTable.id, id));
}

export async function getAllDbStories(): Promise<DbStory[]> {
  return db.select().from(storiesTable).orderBy(desc(storiesTable.published_at));
}

export async function getDbStoryBySlug(slug: string): Promise<DbStory | null> {
  const [story] = await db
    .select()
    .from(storiesTable)
    .where(eq(storiesTable.slug, slug))
    .limit(1);
  return story ?? null;
}

export async function createDbStory(data: NewDbStory): Promise<DbStory> {
  const [story] = await db.insert(storiesTable).values(data).returning();
  return story;
}

export async function deleteDbStory(id: number): Promise<void> {
  await db.delete(storiesTable).where(eq(storiesTable.id, id));
}

export async function setDbStoryFeatured(id: number): Promise<void> {
  await db.update(storiesTable).set({ featured: false });
  await db.update(storiesTable).set({ featured: true }).where(eq(storiesTable.id, id));
}
