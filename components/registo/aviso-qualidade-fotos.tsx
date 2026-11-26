"use client";

import { AlertCircle } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

const TEXT = {
  pt: {
    titulo: "Qualidade das fotografias",
    preferencia: "A OneSugar dá preferência a fotografias com:",
    itens: [
      "Alta resolução, boa iluminação e nitidez;",
      "Enquadramento e proporções adequados;",
      "Sem marcas de água de outras plataformas.",
    ],
    proibidas: "Não são permitidas fotografias vulgares, explícitas ou de baixa qualidade.",
    recusa: "As fotografias que não cumpram estes requisitos não serão aprovadas.",
  },
  en: {
    titulo: "Photo quality",
    preferencia: "OneSugar gives preference to photos with:",
    itens: [
      "High resolution, good lighting and sharpness;",
      "Suitable framing and proportions;",
      "No watermarks from other platforms.",
    ],
    proibidas: "Vulgar, explicit or low-quality photos are not allowed.",
    recusa: "Photos that do not meet these requirements will not be approved.",
  },
} as const;

/** Regras das fotos, por cima do envio (registo e edição). */
export function AvisoQualidadeFotos() {
  const t = TEXT[useLocale()];
  return (
    <div className="flex gap-3 rounded-xl border border-rose-600/30 bg-rose-600/5 p-4 md:p-5">
      <AlertCircle className="h-6 w-6 shrink-0 text-rose-600" />
      <div className="space-y-3 text-sm">
        <div>
          <h3 className="text-base font-bold text-rose-600">{t.titulo}</h3>
          <p className="mt-1 text-muted-foreground">{t.preferencia}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
            {t.itens.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p className="font-semibold text-rose-600">{t.proibidas}</p>
        <p className="text-muted-foreground">{t.recusa}</p>
      </div>
    </div>
  );
}
