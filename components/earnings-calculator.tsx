"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/components/locale-provider";

const TEXT = {
  pt: {
    simulate: "Simule os seus ganhos",
    perMonth: "por mês",
    badge: "💰 100% do valor do encontro é seu.",
    price: "Valor de cada encontro",
    less: "Diminuir",
    more: "Aumentar",
    perDay: "encontros por dia",
    perWeek: "dias por semana",
    disclaimer:
      "Valor estimado com base nos dados que introduziu. Não é uma garantia de rendimento — os ganhos reais dependem da procura, do distrito e da sua disponibilidade.",
    cta: "Criar o meu perfil de Sugar gratuitamente",
  },
  en: {
    simulate: "Estimate your earnings",
    perMonth: "per month",
    badge: "💰 You keep 100% of what you charge.",
    price: "Price per meeting",
    less: "Decrease",
    more: "Increase",
    perDay: "meetings per day",
    perWeek: "days per week",
    disclaimer:
      "Estimate based on the numbers you entered. It is not a guarantee of income: real earnings depend on demand, your district and your availability.",
    cta: "Create my profile for free",
  },
} as const;

export function EarningsCalculator({
  cta,
  onChange,
}: {
  cta?: React.ReactNode;
  /** Notifica o pai a cada ajuste, para reaproveitar os valores simulados. */
  onChange?: (values: {
    pricePerHour: number;
    encountersPerDay: number;
    daysPerWeek: number;
    monthly: number;
  }) => void;
}) {
  const locale = useLocale();
  const t = TEXT[locale];
  const [pricePerHour, setPricePerHour] = useState(150);
  const [encountersPerDay, setEncountersPerDay] = useState(3);
  const [daysPerWeek, setDaysPerWeek] = useState(4);

  const monthly = pricePerHour * encountersPerDay * daysPerWeek * 4;

  useEffect(() => {
    onChange?.({ pricePerHour, encountersPerDay, daysPerWeek, monthly });
    // `onChange` é omitido de propósito: o pai costuma passar uma função
    // inline, que mudaria de identidade a cada render e criaria um ciclo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricePerHour, encountersPerDay, daysPerWeek, monthly]);

  const fmt = (n: number) =>
    n.toLocaleString(locale === "en" ? "en-GB" : "pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-border shadow-lg">
      {/* Header */}
      <div className="bg-rose-600 text-white text-center px-6 py-6">
        <p className="text-sm font-medium opacity-90">{t.simulate}</p>
        <p className="text-4xl font-extrabold mt-1">{fmt(monthly)}</p>
        <p className="text-sm opacity-80 mt-0.5">{t.perMonth}</p>
      </div>

      {/* Badge */}
      <div className="bg-white dark:bg-zinc-900 border-b border-border px-4 py-2.5 text-center">
        <span className="text-green-600 dark:text-green-400 text-sm font-semibold">
          {t.badge}
        </span>
      </div>

      {/* Controls */}
      <div className="bg-card px-6 py-6 space-y-6">
        {/* Price per hour */}
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">{t.price}</p>
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setPricePerHour((p) => Math.max(25, p - 25))}
              className="h-10 w-10 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xl font-bold flex items-center justify-center transition-colors shrink-0"
              aria-label={t.less}
            >
              −
            </button>
            <span className="text-2xl font-bold tabular-nums">€ {pricePerHour} /h</span>
            <button
              onClick={() => setPricePerHour((p) => Math.min(1000, p + 25))}
              className="h-10 w-10 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xl font-bold flex items-center justify-center transition-colors shrink-0"
              aria-label={t.more}
            >
              +
            </button>
          </div>
        </div>

        {/* Encounters per day */}
        <div className="space-y-1.5">
          <p className="text-center text-sm">
            <span className="text-rose-500 font-bold text-base">{encountersPerDay}</span>
            {" "}{t.perDay}
          </p>
          <input
            type="range"
            min={1}
            max={10}
            value={encountersPerDay}
            onChange={(e) => setEncountersPerDay(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
        </div>

        {/* Days per week */}
        <div className="space-y-1.5">
          <p className="text-center text-sm">
            <span className="text-rose-500 font-bold text-base">{daysPerWeek}</span>
            {" "}{t.perWeek}
          </p>
          <input
            type="range"
            min={1}
            max={7}
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
        </div>

        <p className="text-[11px] leading-snug text-muted-foreground text-center">
          {t.disclaimer}
        </p>

        {/* CTA */}
        {cta ?? (
          <button
            onClick={() => document.getElementById("register-form")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {t.cta}
          </button>
        )}
      </div>
    </div>
  );
}
