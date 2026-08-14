'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { EarningsCalculator } from '@/components/earnings-calculator';
import { captureCalculatorLead } from '@/app/actions/calculator-lead';

/**
 * Calculadora pública + captação de lead.
 *
 * Fluxo: a visitante simula os ganhos, deixa o telefone (com consentimento
 * explícito) e segue direto para o registo de acompanhante. O telefone e o
 * valor/hora simulado viajam para o formulário, que já os usa como valores
 * iniciais — ela não reescreve o que acabou de introduzir.
 *
 * O destino do registo é /companions/register, que marca isCompanion
 * automaticamente. Quem chega por aqui já declarou a intenção, por isso não
 * passa pelo ecrã /onboarding.
 */
export function LeadCapture() {
  const { openSignUp } = useClerk();

  const [phone, setPhone] = useState('');
  const [acceptsMarketing, setAcceptsMarketing] = useState(true);
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [pricePerHour, setPricePerHour] = useState(150);
  const [monthly, setMonthly] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const digits = phone.replace(/\D/g, '');
  const phoneLooksValid = digits.length >= 9;

  const goToRegister = () => {
    const params = new URLSearchParams();
    if (phoneLooksValid) params.set('phone', phone.trim());
    if (pricePerHour) params.set('price', String(pricePerHour));
    const target = `/companions/register?${params.toString()}`;

    openSignUp({
      forceRedirectUrl: target,
      signInForceRedirectUrl: target,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneLooksValid) {
      setError('Introduza um número de telefone válido.');
      return;
    }
    if (!acceptsTerms) {
      setError('É necessário aceitar os Termos e a Política de Privacidade.');
      return;
    }

    setSubmitting(true);
    try {
      // Só envia para o RD Station se ela consentiu receber comunicações.
      if (acceptsMarketing) {
        await captureCalculatorLead({
          phone: phone.trim(),
          simulatedMonthly: monthly,
        });
      }
    } finally {
      setSubmitting(false);
      goToRegister();
    }
  };

  return (
    <div className="space-y-6">
      <EarningsCalculator
        onChange={(v) => {
          setPricePerHour(v.pricePerHour);
          setMonthly(v.monthly);
        }}
        cta={
          <p className="text-center text-xs text-muted-foreground">
            Ajuste os valores e veja a simulação acima
          </p>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm mx-auto rounded-2xl border border-border bg-card p-6 space-y-4"
      >
        <div className="space-y-1.5">
          <h2 className="font-bold text-lg leading-tight">
            Comece a anunciar{' '}
            <span className="text-rose-500">gratuitamente</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Criar o perfil não tem custo. Só paga se quiser mais destaque.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium">
            O seu número de telefone profissional
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+351 900 000 000"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500/40"
          />
          <p className="text-xs text-muted-foreground">
            Esta informação ficará visível no seu perfil.
          </p>
        </div>

        <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={acceptsMarketing}
            onChange={(e) => setAcceptsMarketing(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-rose-600 shrink-0"
          />
          <span>Aceito receber informações sobre o meu registo e promoções.</span>
        </label>

        <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={acceptsTerms}
            onChange={(e) => setAcceptsTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-rose-600 shrink-0"
          />
          <span>
            Concordo com os{' '}
            <Link href="/termos-e-condicoes" className="underline hover:text-foreground">
              Termos de uso
            </Link>{' '}
            e a{' '}
            <Link href="/politica-de-privacidade" className="underline hover:text-foreground">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>

        <div className="flex items-center gap-2 rounded-lg bg-rose-500/5 border border-rose-500/20 px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-rose-500 shrink-0" />
          <span className="text-xs text-muted-foreground">
            Registo <strong className="text-foreground">rápido, gratuito e seguro</strong>
          </span>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm inline-flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar anúncio grátis →
        </button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">ou</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Link
          href="/checkout"
          className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver planos de destaque
        </Link>

        <p className="text-center text-xs text-muted-foreground">
          Procura acompanhantes?{' '}
          <Link href="/location" className="underline hover:text-foreground">
            Ver perfis
          </Link>
        </p>
      </form>
    </div>
  );
}
