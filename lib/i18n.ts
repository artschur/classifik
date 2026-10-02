/**
 * Idiomas do site.
 *
 * O português continua sem prefixo, exactamente nas URLs de sempre. O inglês
 * vive em /en/... : o proxy.ts reescreve /en/x para a mesma página /x e
 * marca o pedido com o idioma, por isso não há páginas duplicadas no código.
 *
 * Só as páginas com versão em inglês completa estão em EN_ROUTES. Um
 * endereço /en/ fora desta lista redirecciona para a versão portuguesa, e as
 * ligações feitas a partir de páginas em inglês para páginas sem versão
 * inglesa apontam directamente para o português. Assim nunca há uma página
 * em /en/ com metade do texto em português, nem hreflang a apontar para uma
 * página que não existe.
 */
export type Locale = 'pt' | 'en';

export const DEFAULT_LOCALE: Locale = 'pt';

export const SITE_URL = 'https://www.onesugar.pt';

/** Cabeçalho interno com que o proxy passa o idioma às páginas. */
export const LOCALE_HEADER = 'x-onesugar-locale';
/** Cabeçalho interno com o caminho sem prefixo de idioma. */
export const PATH_HEADER = 'x-onesugar-path';

const EN_ROUTES: RegExp[] = [
  /^\/$/,
  /^\/location$/,
  /^\/companions$/,
  /^\/companions\/\d+$/,
  /^\/sobre$/,
  /^\/ajuda-anunciantes$/,
  /^\/quanto-ganha-acompanhante$/,
];

/** A página tem versão em inglês? Recebe o caminho sem /en e sem query. */
export function hasEnglish(path: string): boolean {
  const clean = path.split(/[?#]/)[0] || '/';
  return EN_ROUTES.some((re) => re.test(clean));
}

/** Tira o prefixo /en de um caminho. "/en" vira "/", "/en/sobre" vira "/sobre". */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    return { locale: 'en', path: pathname.slice(3) || '/' };
  }
  return { locale: 'pt', path: pathname };
}

/**
 * Endereço de uma página interna no idioma pedido. Em inglês só leva o
 * prefixo se a página tiver versão inglesa; senão fica o endereço português.
 * Ligações externas, âncoras e mailto passam sem alterações.
 */
export function localizeHref(href: string, locale: Locale): string {
  if (locale !== 'en' || !href.startsWith('/') || href.startsWith('/en')) {
    return href;
  }
  const [pathAndQuery, hash] = href.split('#');
  const [path, query] = pathAndQuery.split('?');
  if (!hasEnglish(path)) return href;
  const prefixed = path === '/' ? '/en' : `/en${path}`;
  return `${prefixed}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}

/** O destino está noutro idioma que não o da página actual? */
export function crossesLocale(href: string, locale: Locale): boolean {
  if (!href.startsWith('/')) return false;
  const target = stripLocale(href.split(/[?#]/)[0]).locale;
  return target !== locale;
}

/** URL absoluto de uma página num idioma. */
export function absoluteUrl(path: string, locale: Locale): string {
  if (locale === 'en') {
    return `${SITE_URL}${path === '/' ? '/en' : `/en${path}`}`;
  }
  return `${SITE_URL}${path === '/' ? '' : path}`;
}

/**
 * canonical e hreflang de uma página. O canonical aponta sempre para a
 * própria versão; o hreflang só aparece quando a página existe nos dois
 * idiomas, com o português como x-default.
 */
export function pageAlternates(path: string, locale: Locale) {
  const canonical = absoluteUrl(path, locale);
  if (!hasEnglish(path)) return { canonical };
  return {
    canonical,
    languages: {
      'pt-PT': absoluteUrl(path, 'pt'),
      en: absoluteUrl(path, 'en'),
      'x-default': absoluteUrl(path, 'pt'),
    },
  };
}

export const OG_LOCALE: Record<Locale, string> = { pt: 'pt_PT', en: 'en_US' };
export const HTML_LANG: Record<Locale, string> = { pt: 'pt-PT', en: 'en' };
