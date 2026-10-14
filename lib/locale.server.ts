import { headers } from 'next/headers';
import { LOCALE_HEADER, PATH_HEADER, type Locale } from '@/lib/i18n';

/** Idioma do pedido actual, definido pelo proxy.ts. Português por omissão. */
export async function getLocale(): Promise<Locale> {
  const h = await headers();
  return h.get(LOCALE_HEADER) === 'en' ? 'en' : 'pt';
}

/** Caminho do pedido actual, sem o prefixo /en. */
export async function getPathWithoutLocale(): Promise<string> {
  const h = await headers();
  return h.get(PATH_HEADER) ?? '/';
}
