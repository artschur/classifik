'use client';

import { useEffect, useState } from 'react';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import { gaEvent } from '@/lib/ga';
import { CAMPO_TELEFONE } from './inicio-registo';

/**
 * Barra fixa no fundo do ecrã, só no telemóvel. Aparece quando o formulário
 * do topo sai do ecrã e leva-a de volta a ele, com o foco no telefone.
 *
 * Tem também o WhatsApp do apoio: nesta página o botão verde flutuante do site
 * fica escondido no telemóvel (cobria a barra), por isso o contacto passa
 * para aqui.
 */
export function BarraFixa({
  botao,
  whatsapp,
  whatsappUrl,
}: {
  botao: string;
  whatsapp: string;
  whatsappUrl: string;
}) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo = document.getElementById('comecar');
    if (!alvo) return;
    // Só depois de o formulário ter ficado para trás (acima do ecrã): no topo
    // da página o formulário está à vista ou logo abaixo, e a barra taparia o
    // botão dele.
    const obs = new IntersectionObserver(([e]) =>
      setVisivel(!e.isIntersecting && e.boundingClientRect.top < 0),
    );
    obs.observe(alvo);
    return () => obs.disconnect();
  }, []);

  const irParaFormulario = () => {
    gaEvent('anunciar_barra_fixa');
    document.getElementById('comecar')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Depois de rolar: no telemóvel, focar já abre o teclado.
    window.setTimeout(() => document.getElementById(CAMPO_TELEFONE)?.focus({ preventScroll: true }), 450);
  };

  return (
    <div
      aria-hidden={!visivel}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur transition-transform duration-300 md:hidden ${
        visivel ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      }`}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          tabIndex={visivel ? 0 : -1}
          onClick={irParaFormulario}
          className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-base font-bold text-white shadow-lg shadow-rose-950/30"
        >
          {botao}
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={visivel ? 0 : -1}
          aria-label={whatsapp}
          onClick={() => gaEvent('contato_suporte', { metodo: 'whatsapp' })}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500 text-white"
        >
          <IconBrandWhatsapp className="h-6 w-6" />
        </a>
      </div>
    </div>
  );
}
