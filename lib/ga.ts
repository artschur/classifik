/**
 * Envio de eventos para o GA4 a partir do código.
 *
 * O gtag só existe em produção (ver app/layout.tsx) e depois de o script
 * carregar. Fora disso a chamada é ignorada em silêncio, para nenhum clique
 * falhar por causa da medição.
 */
type GaParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function gaEvent(name: string, params: GaParams = {}): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
