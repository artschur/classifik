import { Search } from 'lucide-react';
import { LocaleLink } from '@/components/locale-link';
import type { Locale } from '@/lib/i18n';

const TEXTO: Record<Locale, string> = {
  pt: 'Procurar acompanhantes por distrito',
  en: 'Search escorts by district',
};

/**
 * Barra branca "Procurar acompanhantes por distrito", com lupa. Abre a lista
 * de distritos (/location), onde a escolha é feita. No banner é mais alta.
 */
export function DistrictSearch({
  variant = 'hero',
  locale = 'pt',
}: {
  variant?: 'hero' | 'inline';
  locale?: Locale;
}) {
  const hero = variant === 'hero';
  return (
    <LocaleLink
      locale={locale}
      href="/location"
      className={`group inline-flex w-full items-center gap-3 rounded-full bg-white text-neutral-500 ring-1 transition-colors hover:ring-rose-400 ${
        hero ? 'max-w-md py-2 pl-5 pr-2 shadow-lg ring-black/5' : 'max-w-xs py-1 pl-4 pr-1 shadow-sm ring-neutral-200'
      }`}
    >
      <span className={`flex-1 truncate ${hero ? 'text-base' : 'text-sm'}`}>{TEXTO[locale]}</span>
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-rose-600 transition-colors group-hover:bg-rose-500 ${
          hero ? 'h-11 w-11' : 'h-8 w-8'
        }`}
      >
        <Search className={`text-white ${hero ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
      </span>
    </LocaleLink>
  );
}
