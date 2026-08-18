import { db } from '..';
import { storiesTable, DbStory, NewDbStory } from '../schema';
import { eq, desc } from 'drizzle-orm';

export type { DbStory };

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
