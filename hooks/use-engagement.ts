'use client';

import { useEffect, useState } from 'react';

/**
 * Fica verdadeiro quando o visitante dá sinal de estar a explorar o site: ou
 * rolou o suficiente, ou já lá esteve tempo que chegue.
 *
 * Serve para não interromper quem acabou de chegar. Um aviso que salta à
 * frente antes de a pessoa ver o que quer que seja é fechado por reflexo,
 * sem ser lido, e ainda tapa o conteúdo que ela veio procurar — vale menos
 * do que o mesmo aviso mostrado a quem já demonstrou interesse.
 *
 * Uma vez verdadeiro nunca mais volta atrás: quem rolou e voltou ao topo
 * continua a contar como interessado.
 */
export function useEngagement({
  afterMs,
  afterScrollPx,
}: {
  afterMs: number;
  afterScrollPx: number;
}): boolean {
  const [engaged, setEngaged] = useState(false);

  useEffect(() => {
    if (engaged) return;

    const marcar = () => setEngaged(true);
    const aoRolar = () => {
      if (window.scrollY >= afterScrollPx) marcar();
    };

    // Quem recarrega a meio da página já está a meio da página.
    aoRolar();

    const temporizador = setTimeout(marcar, afterMs);
    window.addEventListener('scroll', aoRolar, { passive: true });

    return () => {
      clearTimeout(temporizador);
      window.removeEventListener('scroll', aoRolar);
    };
  }, [engaged, afterMs, afterScrollPx]);

  return engaged;
}
