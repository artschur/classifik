'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Fila horizontal dos destaques, com setas no desktop e deslizar no
 * telemóvel. Os cartões chegam já desenhados pelo servidor.
 */
export function FeaturedRow({ children }: { children: React.ReactNode }) {
  const faixa = useRef<HTMLDivElement>(null);

  const mover = (sentido: 1 | -1) => {
    const el = faixa.current;
    if (!el) return;
    el.scrollBy({ left: sentido * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div className="absolute -top-12 right-0 hidden gap-2 sm:flex">
        <button
          type="button"
          onClick={() => mover(-1)}
          aria-label="Anteriores"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-accent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => mover(1)}
          aria-label="Seguintes"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={faixa}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}
