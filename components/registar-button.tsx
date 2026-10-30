'use client';

export const EVENTO_REGISTAR = 'onesugar:registar';

/**
 * Envolve um botão de registo: em vez de abrir logo a janela do Clerk, pede ao
 * popup "Sou Sugar / Sou Cliente" (TwoStepModal) para perguntar primeiro.
 */
export function RegistarButton({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="contents"
      onClick={() => window.dispatchEvent(new Event(EVENTO_REGISTAR))}
    >
      {children}
    </span>
  );
}
