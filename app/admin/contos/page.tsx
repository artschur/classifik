import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/components/header';
import { getAllDbStories } from '@/db/queries/stories';
import { DeleteStoryButton } from './delete-button';
import { FeatureStoryButton } from './feature-button';

export const dynamic = 'force-dynamic';

export default async function AdminContosPage() {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) redirect('/');

  const stories = await getAllDbStories();

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Contos</h1>
          <p className="text-muted-foreground text-sm mt-1">{stories.length} publicados</p>
        </div>
        <Link
          href="/admin/contos/new"
          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          + Novo conto
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Nenhum conto publicado ainda.</p>
          <Link href="/admin/contos/new" className="text-rose-500 hover:underline text-sm mt-2 inline-block">
            Criar o primeiro conto →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => {
            const storagePaths = [
              story.cover_storage_path,
              ...((story.inline_images as any[]) ?? []).map((img: any) => img.storagePath),
            ].filter(Boolean) as string[];

            return (
              <div
                key={story.id}
                className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card hover:border-rose-500/30 transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                  {story.cover_image_url ? (
                    <Image src={story.cover_image_url} alt={story.title} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-rose-300/30 text-2xl">
                      ✦
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{story.title}</span>
                    {story.featured && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-rose-600/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full shrink-0">
                        Destaque
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {story.collection} · {story.author} · {story.read_time} min
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(story.published_at).toLocaleDateString('pt-PT')} · /contos/{story.slug}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 shrink-0">
                  <Link
                    href={`/contos/${story.slug}`}
                    target="_blank"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ver →
                  </Link>
                  <FeatureStoryButton id={story.id} featured={story.featured} />
                  <DeleteStoryButton id={story.id} storagePaths={storagePaths} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
