'use client';

import { useEffect } from 'react';

/**
 * Os filtros recarregam a página com os parâmetros no endereço (o mesmo
 * componente da página de distrito), o que a levava de volta ao banner. Com
 * filtros ou página no endereço, desce logo ao catálogo.
 */
export function ScrollToCatalog() {
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const temFiltro = [...p.keys()].some((k) => k !== 'utm_source' && !k.startsWith('utm_'));
    if (temFiltro || window.location.hash === '#catalogo') {
      document.getElementById('catalogo')?.scrollIntoView({ block: 'start' });
    }
  }, []);
  return null;
}
