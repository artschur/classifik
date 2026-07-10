'use server';

import { kv } from '@/db';

const key = (slug: string) => `story:views:${slug}`;

export async function incrementStoryViews(slug: string): Promise<void> {
  await kv.incr(key(slug));
}

export async function getStoryViews(slug: string): Promise<number> {
  const v = await kv.get<number>(key(slug));
  return v ?? 0;
}

export async function getAllStoryViews(
  slugs: string[],
): Promise<Record<string, number>> {
  if (slugs.length === 0) return {};
  const values = await kv.mget<number[]>(...slugs.map(key));
  return Object.fromEntries(slugs.map((slug, i) => [slug, values[i] ?? 0]));
}
