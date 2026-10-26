import { Check } from "lucide-react";

const PASSOS = ["Informações", "Localização", "Fotos", "Verificação", "Sobre si"] as const;

/**
 * Indicador dos cinco passos do registo. Os três primeiros vivem no
 * formulário; a verificação e o resto do perfil têm página própria.
 */
export function PassosRegisto({ atual }: { atual: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <nav aria-label="Passos do registo" className="mx-auto mb-8 w-full max-w-3xl">
      <p className="mb-3 text-sm font-medium text-muted-foreground">Passo {atual} de 5</p>
      <ol className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {PASSOS.map((nome, i) => {
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
