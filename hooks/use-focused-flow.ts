'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Páginas onde a pessoa vem fazer uma coisa concreta e as janelas
 * automáticas do site (escolha Sugar/Cliente, aviso promocional) só a
 * desviavam do caminho:
 * - convite: a candidata vem ligar a conta ao perfil que a equipa preparou;
 * - pré-visualização (?ver=): a mesma candidata a ver o perfil antes de
 *   autorizar.
 *
 * O parâmetro lê-se do endereço depois de montar, em vez de useSearchParams,
 * para não obrigar o layout inteiro a ficar dentro de um Suspense.
 */
export function useFocusedFlow(): { convite: boolean; preview: boolean } {
  const pathname = usePathname();
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    setPreview(new URLSearchParams(window.location.search).has('ver'));
  }, [pathname]);

  return { convite: /^(\/en)?\/convite\//.test(pathname ?? ''), preview };
}
