'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/components/locale-provider';

export const tocItems = [
  { href: '#registo', label: 'Registo', labelEn: 'Sign up' },
  { href: '#criar-anuncio', label: 'Criar o anúncio', labelEn: 'Create your listing' },
  { href: '#fotografias', label: 'Fotografias', labelEn: 'Photos' },
  { href: '#video-verificacao', label: 'Vídeo de verificação', labelEn: 'Verification video' },
  { href: '#verificacao', label: 'Verificação', labelEn: 'Verification' },
  { href: '#aprovacao', label: 'Aprovação', labelEn: 'Approval' },
  { href: '#edicoes-perfil', label: 'Edições ao perfil', labelEn: 'Editing your profile' },
  { href: '#dicas', label: 'Dicas', labelEn: 'Tips' },
  { href: '#faq', label: 'Perguntas frequentes', labelEn: 'FAQ' },
  { href: '#suporte', label: 'Suporte', labelEn: 'Support' },
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
  const en = useLocale() === 'en';

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
                {en ? item.labelEn : item.label}
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
  const en = useLocale() === 'en';

  return (
    <aside className="hidden md:block">
      <div className="sticky top-24">
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-4 px-2">
          {en ? 'On this page' : 'Nesta página'}
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
                {en ? item.labelEn : item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
