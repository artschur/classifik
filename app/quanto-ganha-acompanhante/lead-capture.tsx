'use client';

import { useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useLocale } from '@/components/locale-provider';
import { LocaleLink } from '@/components/locale-link';
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
const TEXT = {
  pt: {
    invalidPhone: 'Introduza um número de telefone válido.',
    mustAccept: 'É necessário aceitar os Termos e a Política de Privacidade.',
    adjust: 'Ajuste os valores e veja a simulação acima',
    titleA: 'Comece a anunciar',
    titleB: 'gratuitamente',
    subtitle: 'Criar o perfil não tem custo. Só paga se quiser mais destaque.',
    phoneLabel: 'O seu número de telefone profissional',
    phoneHint: 'Esta informação ficará visível no seu perfil.',
    marketing: 'Aceito receber informações sobre o meu registo e promoções.',
    agree: 'Concordo com os',
    terms: 'Termos de uso',
    and: 'e a',
    privacy: 'Política de Privacidade',
    safeA: 'Registo',
    safeB: 'rápido, gratuito e seguro',
    submit: 'Criar anúncio grátis →',
    or: 'ou',
    plans: 'Ver planos de destaque',
    looking: 'Procura acompanhantes?',
    profiles: 'Ver perfis',
  },
  en: {
    invalidPhone: 'Please enter a valid phone number.',
    mustAccept: 'You need to accept the Terms and the Privacy Policy.',
    adjust: 'Adjust the numbers to see your estimate above',
    titleA: 'Start advertising',
    titleB: 'for free',
    subtitle: 'Creating your profile costs nothing. You only pay if you want more visibility.',
    phoneLabel: 'Your work phone number',
    phoneHint: 'This number will be shown on your profile.',
    marketing: 'I agree to receive updates about my sign up and promotions.',
    agree: 'I agree to the',
    terms: 'Terms of Use',
    and: 'and the',
    privacy: 'Privacy Policy',
    safeA: 'Sign up is',
    safeB: 'quick, free and secure',
    submit: 'Create my free listing →',
    or: 'or',
    plans: 'See featured plans (in Portuguese)',
    looking: 'Looking for a companion?',
    profiles: 'Browse profiles',
  },
} as const;

export function LeadCapture() {
  const { openSignUp } = useClerk();
  const locale = useLocale();
  const t = TEXT[locale];

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
      setError(t.invalidPhone);
      return;
    }
    if (!acceptsTerms) {
      setError(t.mustAccept);
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
            {t.adjust}
          </p>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm mx-auto rounded-2xl border border-border bg-card p-6 space-y-4"
      >
        <div className="space-y-1.5">
          <h2 className="font-bold text-lg leading-tight">
            {t.titleA}{' '}
            <span className="text-rose-500">{t.titleB}</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.subtitle}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium">
            {t.phoneLabel}
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
            {t.phoneHint}
          </p>
        </div>

        <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={acceptsMarketing}
            onChange={(e) => setAcceptsMarketing(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-rose-600 shrink-0"
          />
          <span>{t.marketing}</span>
        </label>

        <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={acceptsTerms}
            onChange={(e) => setAcceptsTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-rose-600 shrink-0"
          />
          <span>
            {t.agree}{' '}
            <LocaleLink locale={locale} href="/termos-e-condicoes" className="underline hover:text-foreground">
              {t.terms}
            </LocaleLink>{' '}
            {t.and}{' '}
            <LocaleLink locale={locale} href="/politica-de-privacidade" className="underline hover:text-foreground">
              {t.privacy}
            </LocaleLink>
            .
          </span>
        </label>

        <div className="flex items-center gap-2 rounded-lg bg-rose-500/5 border border-rose-500/20 px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-rose-500 shrink-0" />
          <span className="text-xs text-muted-foreground">
            {t.safeA} <strong className="text-foreground">{t.safeB}</strong>
          </span>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm inline-flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {t.submit}
        </button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.or}</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <LocaleLink
          locale={locale}
          href="/checkout"
          className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t.plans}
        </LocaleLink>

        <p className="text-center text-xs text-muted-foreground">
          {t.looking}{' '}
          <LocaleLink locale={locale} href="/location" className="underline hover:text-foreground">
            {t.profiles}
          </LocaleLink>
        </p>
      </form>
    </div>
  );
}
