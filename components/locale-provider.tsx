'use client';

import { createContext, useContext } from 'react';
import type { Locale } from '@/lib/i18n';

const LocaleContext = createContext<Locale>('pt');

/**
 * Passa o idioma do pedido (lido no servidor pelo layout) aos componentes de
 * cliente. Mudar de idioma faz sempre uma navegação completa (ver
 * LocaleLink), por isso o valor nunca fica desactualizado.
 */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}
