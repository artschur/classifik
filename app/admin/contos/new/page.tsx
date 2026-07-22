import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/components/header';
import { getAllDbStories } from '@/db/queries/stories';
import { stories as staticStories, dbToStory } from '@/lib/stories';
import { NewStoryForm } from './new-story-form';

export default async function NewStoryPage() {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) redirect('/');

  const dbStories = await getAllDbStories().catch(() => []);
  const dbSlugs = new Set(dbStories.map((s) => s.slug));
  const allStories = [
    ...dbStories.map(dbToStory),
    ...staticStories.filter((s) => !dbSlugs.has(s.slug)),
  ];
  const collections = Array.from(
    new Map(allStories.map((s) => [s.collectionSlug, { slug: s.collectionSlug, label: s.collection }])).values()
  );

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Novo conto</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Preencha os campos e publique o conto no site.
        </p>
      </div>
      <NewStoryForm collections={collections} />
    </div>
  );
}
