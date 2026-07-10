'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CompanionPreview, Media } from '@/types/types';

function getImageUrl(image: string | Media): string {
  return typeof image === 'string' ? image : image.publicUrl;
}

export function AllCompanionsCarousel() {
  const [companions, setCompanions] = useState<CompanionPreview[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/companions/random')
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setCompanions(data as CompanionPreview[]);
      })
      .catch(() => {});
  }, []);

  const scroll = (dir: 'left' | 'right') =>
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });

  if (!Array.isArray(companions) || companions.length === 0) return null;

  return (
    <section style={{ width: '100%', paddingTop: '2rem', paddingBottom: '2rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Acompanhantes verificadas</h2>
          <Link href="/location" className="text-xs text-muted-foreground hover:text-rose-500 transition-colors">
            Encontrar por distrito →
          </Link>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 p-1.5 bg-background border border-border rounded-full shadow hover:bg-accent transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <div
            ref={scrollRef}
            style={{ display: 'flex', gap: '10px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {companions.map((companion) => {
              const img = companion.images[0];
              const imgUrl = img ? getImageUrl(img) : null;
              return (
                <Link
                  key={String(companion.id) + companion.name}
                  href={`/companions/${companion.id}`}
                  style={{ flexShrink: 0, width: '140px', display: 'block' }}
                >
                  <div style={{ position: 'relative', width: '140px', height: '187px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#262626', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {imgUrl && (
                      <Image
                        src={imgUrl}
                        alt={companion.name}
                        fill
                        className="object-cover"
                        sizes="140px"
                      />
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px' }}>
                      <p style={{ color: 'white', fontSize: '11px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{companion.name}</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{companion.city}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 p-1.5 bg-background border border-border rounded-full shadow hover:bg-accent transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
