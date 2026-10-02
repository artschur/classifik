import Link from 'next/link';
import type { ComponentProps } from 'react';
import { crossesLocale, localizeHref, type Locale } from '@/lib/i18n';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
  locale: Locale;
};

/**
 * Ligação interna que respeita o idioma da página.
 *
 * Em inglês, aponta para /en/... quando a página de destino tem versão
 * inglesa e para o endereço português quando não tem. Quando o destino fica
 * noutro idioma, usa um <a> normal em vez do <Link>: o layout (menu, rodapé,
 * <html lang>) só é desenhado de novo numa navegação completa, e trocar de
 * idioma sem ela deixava o menu na língua anterior.
 */
export function LocaleLink({ href, locale, prefetch, ...rest }: Props) {
  const target = localizeHref(href, locale);
  if (crossesLocale(target, locale)) {
    const { replace, scroll, shallow, passHref, legacyBehavior, onNavigate, ...anchorProps } =
      rest as Record<string, unknown>;
    void replace; void scroll; void shallow; void passHref; void legacyBehavior; void onNavigate;
    return <a href={target} {...(anchorProps as ComponentProps<'a'>)} />;
  }
  return <Link href={target} prefetch={prefetch} {...rest} />;
}
