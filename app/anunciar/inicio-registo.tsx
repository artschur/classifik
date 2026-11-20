'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useClerk } from '@clerk/nextjs';
import { Loader2, ShieldCheck } from 'lucide-react';
import { LocaleLink } from '@/components/locale-link';
import { captureCalculatorLead } from '@/app/actions/calculator-lead';
import { gaEvent } from '@/lib/ga';
import { localizeHref, type Locale } from '@/lib/i18n';
import type { TextosAnunciar } from './textos';

/** Id do campo de telefone: a barra fixa do telemóvel leva o foco para ele. */
export const CAMPO_TELEFONE = 'anunciar-telefone';

/**
 * Início do registo na página /anunciar: o mesmo fluxo da calculadora.
 *
 * Ela deixa o telefone (que é o primeiro dado do formulário), o lead vai para
 * o RD se consentiu, e a janela de criar conta do Clerk abre a apontar para
 * /companions/register com o telefone já preenchido. Quem já tem sessão segue
 * direto para o formulário, porque o Clerk não abre a janela a quem já entrou.
 */
export function InicioRegisto({ t, locale }: { t: TextosAnunciar['form']; locale: Locale }) {
  const { openSignUp, openSignIn } = useClerk();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [aceitaMarketing, setAceitaMarketing] = useState(true);
  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState('');

  const telefoneValido = phone.replace(/\D/g, '').length >= 9;

  const destino = (comTelefone: boolean) => {
    const params = new URLSearchParams();
    if (comTelefone && telefoneValido) params.set('phone', phone.trim());
    const query = params.toString();
    return localizeHref(`/companions/register${query ? `?${query}` : ''}`, locale);
  };

  const seguir = () => {
    const alvo = destino(true);
    if (isSignedIn) {
      router.push(alvo);
      return;
    }
    openSignUp({ forceRedirectUrl: alvo, signInForceRedirectUrl: alvo });
  };

  const entrar = () => {
    const alvo = destino(false);
    gaEvent('anunciar_entrar');
    if (isSignedIn) {
      router.push(alvo);
      return;
    }
    openSignIn({ forceRedirectUrl: alvo, signUpForceRedirectUrl: alvo });
  };

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!telefoneValido) {
      setErro(t.erroTelefone);
      return;
    }
    if (!aceitaTermos) {
      setErro(t.erroAceitar);
      return;
    }

    gaEvent('lead_anunciar', { aceita_marketing: aceitaMarketing });

    setAEnviar(true);
    try {
      // Só vai para o RD Station se ela consentiu receber comunicações.
      if (aceitaMarketing) {
        await captureCalculatorLead({ phone: phone.trim(), origem: 'anunciar' });
      }
    } finally {
      setAEnviar(false);
      seguir();
    }
  };

  return (
    <form
      onSubmit={submeter}
      noValidate
      className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/5 sm:p-7"
    >
      <div>
        <h2 className="text-xl font-bold leading-tight">{t.titulo}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={CAMPO_TELEFONE} className="text-sm font-semibold">
          {t.telefone}
        </label>
        <input
          id={CAMPO_TELEFONE}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+351 912 345 678"
          aria-describedby={`${CAMPO_TELEFONE}-ajuda`}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30"
        />
        <p id={`${CAMPO_TELEFONE}-ajuda`} className="text-xs text-muted-foreground">
          {t.telefoneAjuda}
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={aceitaTermos}
          onChange={(e) => setAceitaTermos(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-rose-600"
        />
        <span>
          {t.aceito}{' '}
          <LocaleLink locale={locale} href="/termos-e-condicoes" className="underline hover:text-foreground">
            {t.termos}
          </LocaleLink>{' '}
          {t.e}{' '}
          <LocaleLink locale={locale} href="/politica-de-privacidade" className="underline hover:text-foreground">
            {t.privacidade}
          </LocaleLink>
          .
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={aceitaMarketing}
          onChange={(e) => setAceitaMarketing(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-rose-600"
        />
        <span>{t.marketing}</span>
      </label>

      {erro && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={aEnviar}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-rose-950/30 transition-colors hover:bg-rose-500 disabled:opacity-60"
      >
        {aEnviar && <Loader2 className="h-4 w-4 animate-spin" />}
        {t.botao}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          {t.semCartao}
        </span>
        <span className="text-muted-foreground">
          {t.jaTem}{' '}
          <button type="button" onClick={entrar} className="font-semibold text-rose-500 hover:underline">
            {t.entrar}
          </button>
        </span>
      </div>
    </form>
  );
}
