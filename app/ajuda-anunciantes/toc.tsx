'use client';

import { useState, useEffect } from 'react';

export const tocItems = [
  { href: '#registo', label: 'Registo' },
  { href: '#criar-anuncio', label: 'Criar o anúncio' },
  { href: '#fotografias', label: 'Fotografias' },
  { href: '#video-verificacao', label: 'Vídeo de verificação' },
  { href: '#verificacao', label: 'Verificação' },
  { href: '#aprovacao', label: 'Aprovação' },
  { href: '#dicas', label: 'Dicas' },
  { href: '#faq', label: 'Perguntas frequentes' },
  { href: '#suporte', label: 'Suporte' },
];

function useActiveSection() {
  const [active, setActive] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: '-10% 0% -75% 0%' }
    );

    tocItems.forEach(({ href }) => {
      const el = document.getElementById(href.slice(1));
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return active;
}

export function TocMobile() {
  const active = useActiveSection();

  return (
    <div className="md:hidden sticky top-16 z-40 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto max-w-6xl px-4">
        <div
          className="flex gap-2 overflow-x-auto py-2.5 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {tocItems.map((item) => {
            const isActive = active === item.href.slice(1);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TocDesktop() {
  const active = useActiveSection();

  return (
    <aside className="hidden md:block">
      <div className="sticky top-24">
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-4 px-2">
          Nesta página
        </p>
        <nav className="space-y-0.5">
          {tocItems.map((item) => {
            const isActive = active === item.href.slice(1);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 text-sm py-1.5 px-2 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'text-primary font-medium bg-primary/8'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <span
                  className={`w-1 h-1 rounded-full flex-shrink-0 transition-all duration-200 ${
                    isActive ? 'bg-primary scale-150' : 'bg-border'
                  }`}
                />
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
