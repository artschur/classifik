import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays } from 'lucide-react';
import type { Story } from '@/lib/stories';

export function StoryCard({ story }: { story: Story }) {
  return (
    <Link href={`/contos/${story.slug}`} className="group block">
      <article className="overflow-hidden rounded-xl border border-border bg-card hover:border-rose-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-rose-900/10">
        {/* Square cover image */}
        <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-rose-950/60 to-zinc-900">
          {story.coverImage ? (
            <Image
              src={story.coverImage}
              alt={story.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-end p-4">
              <span className="text-rose-300/40 text-5xl font-serif select-none leading-none">✦</span>
            </div>
          )}
          {/* Collection badge overlay */}
          <div className="absolute top-3 left-3">
            <span className="bg-black/70 backdrop-blur-sm text-rose-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-rose-500/30">
              {story.collection}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4 space-y-2">
          <h2 className="font-bold text-base leading-snug group-hover:text-rose-400 transition-colors line-clamp-2">
            {story.title}
          </h2>
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {story.excerpt}
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">{story.author}</span>
            <span className="text-xs text-muted-foreground">{story.readTime} min</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground pt-0.5">
            <CalendarDays className="h-3 w-3" />
            <span className="text-xs">
              {new Date(story.publishedAt).toLocaleDateString('pt-PT', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
