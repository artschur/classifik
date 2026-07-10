import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Flame, Send, Sparkles } from 'lucide-react';
import { stories as staticStories, isNew, dbToStory } from '@/lib/stories';
import { getAllStoryViews } from '@/app/actions/story-views';
import { getAllDbStories } from '@/db/queries/stories';

export const metadata: Metadata = {
  title: 'Contos Eróticos | Histórias que ficam na memória | Onesugar',
  description:
    'Contos eróticos, romances intensos e fantasias envolventes para despertar emoções, imaginação e novas sensações.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Contos Eróticos | Onesugar',
    description: 'Histórias que ficam na memória.',
    url: 'https://www.onesugar.pt/contos',
    siteName: 'Onesugar',
    locale: 'pt_PT',
    type: 'website',
  },
};

export const revalidate = 300; // revalidate view counts every 5 min

export default async function ContosPage({
  searchParams,
}: {
  searchParams: Promise<{ colecao?: string }>;
}) {
  const { colecao } = await searchParams;

  // Merge DB stories + static stories (DB takes priority on slug collision)
  const dbStories = await getAllDbStories().catch(() => []);
  const dbSlugs = new Set(dbStories.map((s) => s.slug));
  const stories = [
    ...dbStories.map(dbToStory),
    ...staticStories.filter((s) => !dbSlugs.has(s.slug)),
  ];

  // Derive collections from actual stories — no hardcoded list
  const collections = Array.from(
    new Map(stories.map((s) => [s.collectionSlug, { slug: s.collectionSlug, label: s.collection }])).values()
  );

  // Fetch all view counts in one round-trip
  const slugs = stories.map((s) => s.slug);
  const viewCounts = await getAllStoryViews(slugs).catch(() =>
    Object.fromEntries(slugs.map((s) => [s, 0])),
  );

  const featured = stories.find((s) => s.featured) ?? stories[0];

  // Latest: sorted by publishedAt descending
  const latest = [...stories]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .filter((s) => !colecao || s.collectionSlug === colecao);

  // Most read: sorted by view count
  const mostRead = [...stories]
    .sort((a, b) => (viewCounts[b.slug] ?? 0) - (viewCounts[a.slug] ?? 0))
    .slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-rose-950/30 to-zinc-950 border-b border-rose-900/20">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Left */}
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 bg-rose-600/20 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                <Sparkles className="h-3 w-3" />
                Stories OneSugar
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Histórias que ficam<br />
                <span className="text-rose-400">na memória</span>
              </h1>
              <p className="text-base text-zinc-300 max-w-md leading-relaxed">
                Contos eróticos, romances intensos e fantasias envolventes para
                despertar emoções, imaginação e novas sensações.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="#ultimas"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors"
                >
                  Explorar histórias
                </Link>
                <Link
                  href="#partilhar"
                  className="border border-rose-500/50 text-rose-300 hover:bg-rose-600/10 font-semibold px-6 py-3 rounded-full text-sm transition-colors"
                >
                  Enviar minha história
                </Link>
              </div>
            </div>

            {/* Right — decorative */}
            <div className="hidden md:flex justify-center">
              <div className="relative w-80 h-80 rounded-2xl overflow-hidden border border-rose-500/20 shadow-2xl shadow-rose-900/30">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-900/40 to-zinc-900/80 z-10" />
                {featured.coverImage ? (
                  <Image
                    src={featured.coverImage}
                    alt="Contos OneSugar"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-rose-300/20 text-9xl font-serif select-none">✦</span>
                  </div>
                )}
                {/* Floating card on top */}
                <div className="absolute bottom-4 left-4 right-4 z-20 bg-black/70 backdrop-blur-sm rounded-xl p-3 border border-rose-500/20">
                  <p className="text-rose-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Em destaque
                  </p>
                  <p className="text-white text-sm font-bold line-clamp-1">{featured.title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-16">

        {/* ── Featured story ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-4 w-4 text-rose-500" />
            <h2 className="text-xl font-bold">História em destaque</h2>
          </div>

          <Link href={`/contos/${featured.slug}`} className="group block">
            <div className="rounded-2xl border border-border overflow-hidden hover:border-rose-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-rose-900/10 md:flex">
              {/* Image */}
              <div className="relative md:w-2/5 aspect-[4/3] md:aspect-auto bg-gradient-to-br from-rose-950/60 to-zinc-900 flex-shrink-0">
                {featured.coverImage ? (
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-rose-300/20 text-8xl font-serif select-none">✦</span>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                    {featured.collection}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 flex flex-col justify-center space-y-4">
                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight group-hover:text-rose-400 transition-colors">
                  {featured.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed line-clamp-3">
                  {featured.excerpt}
                </p>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {featured.readTime} min de leitura
                  </span>
                  <span className="text-sm text-muted-foreground">{featured.author}</span>
                </div>
                <div>
                  <span className="inline-block bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors">
                    Ler história →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* ── Collection filter tabs ───────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2" id="ultimas">
          <Link
            href="/contos"
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              !colecao
                ? 'bg-rose-600 text-white border-rose-600'
                : 'border-border text-muted-foreground hover:border-rose-500 hover:text-foreground'
            }`}
          >
            Todas
          </Link>
          {collections.map((c) => (
            <Link
              key={c.slug}
              href={`/contos?colecao=${c.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                colecao === c.slug
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'border-border text-muted-foreground hover:border-rose-500 hover:text-foreground'
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>

        {/* ── Latest stories ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold mb-6">Últimas histórias</h2>
          {latest.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma história encontrada.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {latest.map((story) => (
                <LatestStoryCard
                  key={story.slug}
                  story={story}
                  isNewStory={isNew(story.publishedAt)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Most read ───────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Flame className="h-4 w-4 text-rose-500" />
            <h2 className="text-xl font-bold">Histórias mais lidas</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
            {mostRead.map((story, idx) => (
              <MostReadCard
                key={story.slug}
                story={story}
                rank={idx + 1}
                views={viewCounts[story.slug] ?? 0}
              />
            ))}
          </div>
        </section>

        {/* ── CTA submit story ────────────────────────────────────────────── */}
        <section
          id="partilhar"
          className="rounded-2xl bg-gradient-to-br from-rose-950/40 to-zinc-900 border border-rose-900/30 px-8 py-12 text-center space-y-4"
        >
          <Send className="h-8 w-8 text-rose-400 mx-auto" />
          <h2 className="text-2xl font-extrabold">Tem uma história para partilhar?</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Envie o seu conto e faça parte do universo Stories OneSugar.
          </p>
          <a
            href="mailto:stories@onesugar.pt?subject=Submissão de conto"
            className="inline-block bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3 rounded-full text-sm transition-colors mt-2"
          >
            Enviar minha história
          </a>
        </section>

      </div>
    </div>
  );
}

/* ── Local sub-components ────────────────────────────────────────────────── */

function LatestStoryCard({
  story,
  isNewStory,
}: {
  story: import('@/lib/stories').Story;
  isNewStory: boolean;
}) {
  return (
    <Link href={`/contos/${story.slug}`} className="group block">
      <article className="overflow-hidden rounded-xl border border-border bg-card hover:border-rose-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-rose-900/10">
        <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-rose-950/60 to-zinc-900">
          {story.coverImage ? (
            <Image
              src={story.coverImage}
              alt={story.title}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-end p-3">
              <span className="text-rose-300/30 text-4xl font-serif select-none">✦</span>
            </div>
          )}
          {isNewStory && (
            <div className="absolute top-2 right-2">
              <span className="bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full">
                Novo
              </span>
            </div>
          )}
        </div>
        <div className="p-3 space-y-1.5">
          <h3 className="font-bold text-sm leading-snug group-hover:text-rose-400 transition-colors line-clamp-2">
            {story.title}
          </h3>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">{story.readTime} min</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function MostReadCard({
  story,
  rank,
  views,
}: {
  story: import('@/lib/stories').Story;
  rank: number;
  views: number;
}) {
  return (
    <Link href={`/contos/${story.slug}`} className="group block">
      <article className="overflow-hidden rounded-xl border border-border bg-card hover:border-rose-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-rose-900/10">
        <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-rose-950/60 to-zinc-900">
          {story.coverImage ? (
            <Image
              src={story.coverImage}
              alt={story.title}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-end p-3">
              <span className="text-rose-300/30 text-4xl font-serif select-none">✦</span>
            </div>
          )}
          {/* Rank badge */}
          <div className="absolute top-2 left-2">
            <span className="bg-black/80 backdrop-blur-sm text-white text-xs font-extrabold w-7 h-7 rounded-full flex items-center justify-center border border-rose-500/40">
              #{rank}
            </span>
          </div>
        </div>
        <div className="p-3 space-y-1.5">
          <h3 className="font-bold text-sm leading-snug group-hover:text-rose-400 transition-colors line-clamp-2">
            {story.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="text-xs">{story.readTime} min</span>
            </div>
            {views > 0 && (
              <span className="text-xs text-muted-foreground">{views} leituras</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
