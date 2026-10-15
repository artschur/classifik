'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { claimInvite } from '@/app/actions/convite';
import type { Locale } from '@/lib/i18n';

const TEXT = {
  pt: { ligar: 'Ligar este perfil à minha conta', aLigar: 'A ligar…' },
  en: { ligar: 'Link this profile to my account', aLigar: 'Linking…' },
} as const;

export function ClaimInviteButton({ codigo, locale }: { codigo: string; locale: Locale }) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const t = TEXT[locale];

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            // Em caso de sucesso a acção redirecciona para o registo.
            const res = await claimInvite(codigo, locale);
            if (res && !res.success) setErro(res.error);
          })
        }
      >
        {isPending ? t.aLigar : t.ligar}
      </Button>
      {erro && <p className="text-sm text-red-500">{erro}</p>}
    </div>
  );
}
