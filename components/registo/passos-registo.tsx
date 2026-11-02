"use client";

import { Check } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

// Componente de cliente para ler o idioma do contexto: também é usado em
// páginas de servidor (verificação, passo 5) sem ter de receber o idioma.
const TEXT = {
  pt: {
    passos: ["Informações", "Localização", "Fotos", "Verificação", "Sobre si"],
    aria: "Passos do registo",
    passo: (n: number) => `Passo ${n} de 5`,
  },
  en: {
    passos: ["Details", "Location", "Photos", "Verification", "About you"],
    aria: "Sign up steps",
    passo: (n: number) => `Step ${n} of 5`,
  },
} as const;

/**
 * Indicador dos cinco passos do registo. Os três primeiros vivem no
 * formulário; a verificação e o resto do perfil têm página própria.
 */
export function PassosRegisto({ atual }: { atual: 1 | 2 | 3 | 4 | 5 }) {
  const t = TEXT[useLocale()];
  return (
    <nav aria-label={t.aria} className="mx-auto mb-8 w-full max-w-3xl">
      <p className="mb-3 text-sm font-medium text-muted-foreground">{t.passo(atual)}</p>
      <ol className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {t.passos.map((nome, i) => {
          const n = i + 1;
          const feito = n < atual;
          const agora = n === atual;
          return (
            <li
              key={nome}
              aria-current={agora ? "step" : undefined}
              className="flex items-center gap-2"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  agora
                    ? "bg-rose-600 text-white"
                    : feito
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {feito ? <Check className="h-3.5 w-3.5" /> : n}
              </span>
              <span className={agora ? "font-semibold text-foreground" : "text-muted-foreground"}>
                {nome}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
