'use client';

import * as React from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { X, Heart, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEngagement } from '@/hooks/use-engagement';
import { useLocale } from '@/components/locale-provider';
import { LocaleLink } from '@/components/locale-link';

const TEXT = {
  pt: {
    close: 'Fechar',
    ageTitle: 'Verificação de Idade',
    ageBody:
      'Você precisa ter 18 anos ou mais para acessar este site. Ao clicar em confirmar, você declara que tem 18 anos ou mais.',
    leave: 'Sair',
    confirm: 'Confirmar, tenho 18 anos ou mais',
    welcome: 'Bem-vindo ao OneSugar!',
    choose: 'Escolha como deseja continuar:',
    sugarTitle: 'Sou Sugar',
    sugarBody: 'Simule os seus ganhos e crie o seu anúncio gratuitamente',
    sugarPoints: ['Perfil verificado e destaque', '100% do valor do encontro é seu', 'Plataforma segura e discreta'],
    clientTitle: 'Sou Cliente',
    clientBody: 'Encontre sugars verificadas em Portugal',
    clientPoints: ['Acesso a perfis verificados', 'Avaliações e comentários reais', 'Total privacidade garantida'],
    footer: 'Escolha seu perfil para continuar navegando no OneSugar',
  },
  en: {
    close: 'Close',
    ageTitle: 'Age verification',
    ageBody:
      'You must be 18 or older to access this site. By clicking confirm, you declare that you are 18 or older.',
    leave: 'Leave',
    confirm: 'Confirm, I am 18 or older',
    welcome: 'Welcome to OneSugar!',
    choose: 'How would you like to continue?',
    sugarTitle: 'I am a companion',
    sugarBody: 'Estimate your earnings and create your listing for free',
    sugarPoints: ['Verified and featured profile', 'You keep 100% of what you earn', 'Safe and discreet platform'],
    clientTitle: 'I am a client',
    clientBody: 'Find verified escorts in Portugal',
    clientPoints: ['Access to verified profiles', 'Real reviews and comments', 'Complete privacy'],
    footer: 'Choose your profile to keep browsing OneSugar',
  },
} as const;

/** Marca que a escolha Sugar/Cliente já foi mostrada a este navegador. */
const LEAD_CHOICE_KEY = 'lead-choice-seen';

export function TwoStepModal() {
  const locale = useLocale();
  const t = TEXT[locale];
  const { isSignedIn, isLoaded } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2>(1);

  // A escolha Sugar/Cliente espera que a pessoa mostre interesse. A
  // verificação de idade não espera por nada: é obrigação legal e tem de vir
  // antes do conteúdo.
  const engaged = useEngagement({ afterMs: 8000, afterScrollPx: 300 });

  React.useEffect(() => {
    if (!isLoaded || isSignedIn) {
      return;
    }

    if (typeof window !== 'undefined' && /bot|crawler|spider|crawling/i.test(navigator.userAgent)) {
      return;
    }

    const ageVerified = localStorage.getItem('age-verified') === "true";

    // A verificação de idade continua a aparecer até ser confirmada: é o
    // passo que não pode ser saltado.
    if (!ageVerified) {
      setStep(1);
      setOpen(true);
      return;
    }

    // A escolha Sugar/Cliente é mostrada uma vez só, e só depois de a pessoa
    // ter começado a explorar. Antes reabria a cada carregamento de página e
    // saltava à frente antes de se ver seja o que for.
    if (engaged && localStorage.getItem(LEAD_CHOICE_KEY) !== "true") {
      setStep(2);
      setOpen(true);
    }
  }, [isSignedIn, isLoaded, engaged]); // Re-run when auth state changes

  // Marca no momento em que a escolha chega ao ecrã, e não apenas quando é
  // clicada, para que fechar no X ou recarregar a página também não a repita.
  React.useEffect(() => {
    if (open && step === 2) {
      localStorage.setItem(LEAD_CHOICE_KEY, "true");
    }
  }, [open, step]);

  if (isSignedIn) {
    return null;
  }
  const handleAgeConfirm = () => {
    localStorage.setItem('age-verified', 'true');

    // Quem já tinha visto a escolha antes não a leva outra vez: confirmada a
    // idade, o modal fecha.
    if (localStorage.getItem(LEAD_CHOICE_KEY) === 'true') {
      setOpen(false);
      return;
    }

    setStep(2);
  };

  const handleAgeDecline = () => {
    // Redirect away
    window.location.href = 'https://www.google.com';
  };

  const handleClose = () => {
    setOpen(false);
  };

  // A verificação de idade não se fecha: sair sem responder não é uma das
  // respostas possíveis. Antes havia dois X sobrepostos, o desta caixa e o
  // que o DialogContent desenha sozinho, e qualquer um deles abria o site
  // inteiro sem ninguém ter confirmado nada.
  const bloquearFecho = step === 1;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(aberto) => {
          if (bloquearFecho && !aberto) return;
          setOpen(aberto);
        }}
      >
        <DialogContent
          className="sm:max-w-[500px] p-0 overflow-hidden"
          showCloseButton={!bloquearFecho}
          onEscapeKeyDown={(e) => {
            if (bloquearFecho) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (bloquearFecho) e.preventDefault();
          }}
        >
          {/* Fechar: só na escolha de perfil, nunca na verificação de idade */}
          {!bloquearFecho && (
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">{t.close}</span>
            </button>
          )}

          {step === 1 ? (
            // Step 1: Age Verification
            <>
              <div className="p-8">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-bold text-center mb-2">
                    {t.ageTitle}
                  </DialogTitle>
                  <DialogDescription className="text-center text-lg">
                    {t.ageBody}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-8 pt-0 flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleAgeDecline}
                >
                  {t.leave}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAgeConfirm}
                >
                  {t.confirm}
                </Button>
              </div>
            </>
          ) : (
            // Step 2: Lead Selection
            <>
              {/* Header Section */}
              <div className="p-8">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-bold text-center mb-2">
                    {t.welcome}
                  </DialogTitle>
                  <DialogDescription className="text-center text-lg">
                    {t.choose}
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* Content Section */}
              <div className="p-8 pt-0 space-y-4">
                {/* Sugar Option — passa pela calculadora antes de criar conta */}
                <LocaleLink
                  locale={locale}
                  href="/quanto-ganha-acompanhante"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block w-full group relative overflow-hidden rounded-xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 dark:border-pink-800 p-6 text-left transition-all duration-300",
                    "hover:border-pink-400 hover:shadow-lg hover:scale-[1.02] dark:hover:border-pink-600"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-full bg-pink-500 p-3 text-white shadow-lg">
                      <Heart className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-pink-900 dark:text-pink-100 mb-1">
                        {t.sugarTitle}
                      </h3>
                      <p className="text-sm text-pink-700 dark:text-pink-300 mb-3">
                        {t.sugarBody}
                      </p>
                      <ul className="text-xs text-pink-600 dark:text-pink-400 space-y-1">
                        {t.sugarPoints.map((p) => <li key={p}>• {p}</li>)}
                      </ul>
                    </div>
                  </div>
                </LocaleLink>

                {/* Client Option */}
                <LocaleLink
                  locale={locale}
                  href="/location"
                  onClick={() => setOpen(false)}
                  className={cn(
                    // O `block` é necessário porque isto é um <a>, que por
                    // omissão é inline: sem ele o w-full não pega e o fundo
                    // parte-se em fragmentos.
                    "block w-full group relative overflow-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 dark:border-blue-800 p-6 text-left transition-all duration-300",
                    "hover:border-blue-400 hover:shadow-lg hover:scale-[1.02] dark:hover:border-blue-600"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-full bg-blue-500 p-3 text-white shadow-lg">
                      <UserCircle className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                        {t.clientTitle}
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        {t.clientBody}
                      </p>
                      <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                        {t.clientPoints.map((p) => <li key={p}>• {p}</li>)}
                      </ul>
                    </div>
                  </div>
                </LocaleLink>

                <p className="text-xs text-center text-muted-foreground pt-2">
                  {t.footer}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
