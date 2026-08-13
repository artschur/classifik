"use client";

import { useState, useEffect } from "react";

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
    n.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-border shadow-lg">
      {/* Header */}
      <div className="bg-rose-600 text-white text-center px-6 py-6">
        <p className="text-sm font-medium opacity-90">Simule os seus ganhos</p>
        <p className="text-4xl font-extrabold mt-1">{fmt(monthly)}</p>
        <p className="text-sm opacity-80 mt-0.5">por mês</p>
      </div>

      {/* Badge */}
      <div className="bg-white dark:bg-zinc-900 border-b border-border px-4 py-2.5 text-center">
        <span className="text-green-600 dark:text-green-400 text-sm font-semibold">
          💰 100% do valor do encontro é seu.
        </span>
      </div>

      {/* Controls */}
      <div className="bg-card px-6 py-6 space-y-6">
        {/* Price per hour */}
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">Valor de cada encontro</p>
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setPricePerHour((p) => Math.max(25, p - 25))}
              className="h-10 w-10 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xl font-bold flex items-center justify-center transition-colors shrink-0"
              aria-label="Diminuir"
            >
              −
            </button>
            <span className="text-2xl font-bold tabular-nums">€ {pricePerHour} /h</span>
            <button
              onClick={() => setPricePerHour((p) => Math.min(1000, p + 25))}
              className="h-10 w-10 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xl font-bold flex items-center justify-center transition-colors shrink-0"
              aria-label="Aumentar"
            >
              +
            </button>
          </div>
        </div>

        {/* Encounters per day */}
        <div className="space-y-1.5">
          <p className="text-center text-sm">
            <span className="text-rose-500 font-bold text-base">{encountersPerDay}</span>
            {" "}encontros por dia
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
            {" "}dias por semana
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
          Valor estimado com base nos dados que introduziu. Não é uma garantia
          de rendimento — os ganhos reais dependem da procura, do distrito e da
          sua disponibilidade.
        </p>

        {/* CTA */}
        {cta ?? (
          <button
            onClick={() => document.getElementById("register-form")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Criar o meu perfil de Sugar gratuitamente
          </button>
        )}
      </div>
    </div>
  );
}
