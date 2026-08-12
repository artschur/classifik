import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStoryBySlug, getAllSlugs, stories as staticStories, dbToStory } from '@/lib/stories';
import { StoryCard } from '@/components/story-card';
import { StoryViewTracker } from '@/components/story-view-tracker';
import { getAllDbStories, getDbStoryBySlug } from '@/db/queries/stories';

export const dynamicParams = true;

export async function generateStaticParams() {
  const dbStories = await getAllDbStories().catch(() => []);
  const dbSlugs = dbStories.map((s) => ({ slug: s.slug }));
  const staticSlugs = getAllSlugs()
    .filter((s) => !dbStories.find((d) => d.slug === s))
    .map((slug) => ({ slug }));
  return [...dbSlugs, ...staticSlugs];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dbStory = await getDbStoryBySlug(slug).catch(() => null);
  const story = dbStory ? dbToStory(dbStory) : getStoryBySlug(slug);
  if (!story) return { title: 'Conto não encontrado | Onesugar' };

  return {
    title: `${story.title} — ${story.collection} | Onesugar`,
    description: story.excerpt,
    robots: { index: true, follow: true },
    openGraph: {
      title: story.title,
      description: story.excerpt,
      url: `https://www.onesugar.pt/contos/${slug}`,
      siteName: 'Onesugar',
      locale: 'pt_PT',
      type: 'article',
      ...(story.coverImage && {
        images: [{ url: story.coverImage, width: 1200, height: 630, alt: story.title }],
      }),
    },
  };
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check DB first, then fall back to static stories
  const dbStory = await getDbStoryBySlug(slug).catch(() => null);
  const story = dbStory ? dbToStory(dbStory) : getStoryBySlug(slug);
  if (!story) notFound();

  // Related stories: same collection, excluding current
  const dbStories = await getAllDbStories().catch(() => []);
  const dbSlugs = new Set(dbStories.map((s) => s.slug));
  const allStories = [
    ...dbStories.map(dbToStory),
    ...staticStories.filter((s) => !dbSlugs.has(s.slug)),
  ];
  const related = allStories
    .filter((s) => s.collectionSlug === story.collectionSlug && s.slug !== story.slug)
    .slice(0, 4);

  // Build image map: paragraphIndex → image src
  const imageAfter = new Map(story.inlineImages.map((img) => [img.afterIndex, img]));

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <StoryViewTracker slug={slug} />
      {/* Back + collection breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/contos" className="hover:text-foreground transition-colors">
          Contos
        </Link>
        <span>›</span>
        <Link
          href={`/contos?colecao=${story.collectionSlug}`}
          className="hover:text-foreground transition-colors"
        >
          {story.collection}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 space-y-3">
        <span className="inline-block bg-rose-600/20 border border-rose-500/40 text-rose-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          {story.collection}
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight">{story.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <span>{story.author}</span>
          <span>·</span>
          <span>{story.readTime} min de leitura</span>
          <span>·</span>
          <span>
            {new Date(story.publishedAt).toLocaleDateString('pt-PT', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Cover image */}
      {story.coverImage && (
        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-10 bg-zinc-900">
          <Image
            src={story.coverImage}
            alt={story.title}
            fill
            priority
            className="object-cover object-center"
          />
        </div>
      )}

      {/* Story content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-0">
        {story.paragraphs.map((paragraph, idx) => (
          <div key={idx}>
            {/* Quebras de linha dentro de um bloco viram parágrafos próprios:
                o HTML colapsa \n em espaço, o que juntava tudo num só bloco. */}
            {paragraph
              .split(/\n+/)
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, lineIdx) => (
                <p
                  key={lineIdx}
                  className="text-base leading-relaxed mb-5 text-foreground/90"
                >
                  {line}
                </p>
              ))}
            {imageAfter.has(idx) && imageAfter.get(idx)!.src && (
              <div className="my-8 rounded-xl overflow-hidden">
                <Image
                  src={imageAfter.get(idx)!.src}
                  alt={imageAfter.get(idx)!.alt || ''}
                  width={800}
                  height={600}
                  className="w-full object-cover rounded-xl"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Author signature */}
      <div className="mt-10 pt-6 border-t border-border text-right">
        <span className="font-bold text-foreground">{story.author}</span>
      </div>

      {/* Related stories */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold mb-6">Mais da coleção</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((s) => (
              <StoryCard key={s.slug} story={s} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/contos"
          className="inline-block border border-rose-500 text-rose-500 hover:bg-rose-600 hover:text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors"
        >
          Ver todos os contos
        </Link>
      </div>
    </div>
  );
}
