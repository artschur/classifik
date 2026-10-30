'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { hasEnglish, stripLocale, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * PT | EN na barra do topo, também no telemóvel. Leva à mesma página no
 * outro idioma quando ela existe; se a página actual não tem versão inglesa,
 * o EN leva à home em inglês.
 *
 * O caminho vem do servidor no primeiro desenho e é relido do endereço do
 * navegador a cada navegação: o menu vive no layout, que não é desenhado de
 * novo ao mudar de página dentro do mesmo idioma. Os links são <a> normais
 * porque trocar de idioma pede uma navegação completa.
 */
export function LanguageSwitcher({
  locale,
  initialPath,
  className,
}: {
  locale: Locale;
  initialPath: string;
  className?: string;
}) {
  const pathname = usePathname();
  const [path, setPath] = useState(initialPath);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setPath(stripLocale(window.location.pathname).path);
    setQuery(window.location.search);
  }, [pathname]);

  const ptHref = `${path}${query}`;
  const enHref = hasEnglish(path) ? `${path === '/' ? '/en' : `/en${path}`}${query}` : '/en';

  const item = (active: boolean) =>
    cn(
      'px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-[13px] font-semibold transition-colors',
      active ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground',
    );

  // No telemóvel fica numa cápsula com contorno, ao lado do botão do menu,
  // para se ler como um interruptor de idioma. No computador fica como antes.
  return (
    <div
      className={cn(
        'flex items-center gap-0.5 sm:gap-1 rounded-full border border-border p-0.5 sm:border-0 sm:p-0',
        className,
      )}
      role="group"
      aria-label={locale === 'en' ? 'Language' : 'Idioma'}
    >
      <a href={ptHref} hrefLang="pt-PT" lang="pt-PT" aria-current={locale === 'pt' ? 'true' : undefined} className={item(locale === 'pt')}>
        PT
      </a>
      <a href={enHref} hrefLang="en" lang="en" aria-current={locale === 'en' ? 'true' : undefined} className={item(locale === 'en')}>
        EN
      </a>
    </div>
  );
}
