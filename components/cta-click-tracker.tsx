'use client';

import { useEffect } from 'react';
import { gaEvent } from '@/lib/ga';
import { stripLocale } from '@/lib/i18n';

/**
 * Destinos que contam como intenção de anunciar. Um clique em qualquer link
 * para estas páginas gera o evento `cta_anuncio` no GA4, com o texto do botão
 * e a página onde estava. Sem isto o GA4 só via a chegada ao destino e não
 * dizia qual dos CTAs (topo, meio ou fim de página, calculadora) a gerou.
 */
const DESTINOS_ANUNCIO = [
  '/checkout',
  '/quanto-ganha-acompanhante',
  '/companions/register',
  '/ajuda-anunciantes',
];

/**
 * Um único ouvinte no documento, em vez de mexer em cada botão: os CTAs estão
 * espalhados por muitos componentes e novos CTAs passam a contar sozinhos.
 * Não desenha nada.
 */
export function CtaClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link) return;

      let url: URL;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      // /en/quanto-ganha-acompanhante conta como /quanto-ganha-acompanhante;
      // o idioma fica visível na página de origem.
      const { path } = stripLocale(url.pathname);
      const destino = DESTINOS_ANUNCIO.find(
        (d) => path === d || path.startsWith(`${d}/`),
      );
      if (!destino) return;

      gaEvent('cta_anuncio', {
        destino,
        texto: (link.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 100),
        origem: window.location.pathname,
      });
    };

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
