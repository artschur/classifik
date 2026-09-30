'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { IconBrandInstagram } from '@tabler/icons-react';
import { useAnalytics } from '@/hooks/analytics';

interface InstagramButtonProps {
  instagramHandle: string;
  companionId: number;
  className?: string;
  /**
   * Perfil de demonstração: o botão continua igual, mas não leva a lado
   * nenhum. Os endereços guardados nesses perfis apontam para contas de
   * terceiros, que nada têm a ver com o perfil onde aparecem.
   */
  inert?: boolean;
}

/**
 * O campo é texto livre, por isso chega de tudo: "@nome", o link completo
 * colado do telemóvel, com barra no fim ou com ?igshid=... Sem limpar, o
 * botão gerava URLs mortas como instagram.com/@nome.
 */
function normalizeInstagramHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/^instagram\.com\//i, '')
    .replace(/^@+/, '')
    .replace(/[/?].*$/, '');
}

export function InstagramButton({
  instagramHandle,
  companionId,
  className,
  inert = false,
}: InstagramButtonProps) {
  const { trackEvent } = useAnalytics();
  const handleClick = () => {
    trackEvent(companionId, 'instagram_click');
  };

  const handle = normalizeInstagramHandle(instagramHandle);
  if (!handle) return null;

  const classes = cn(
    buttonVariants({ variant: 'default' }),
    'w-full bg-stone-950 hover:bg-stone-800 text-white flex items-center justify-start mt-2',
    className
  );

  const conteudo = (
    <>
      <IconBrandInstagram className="w-4 h-4 mr-2" />
      Ver instagram
    </>
  );

  // Sem href e sem registo de clique, pelo mesmo motivo do WhatsApp.
  if (inert) {
    return (
      <button type="button" className={classes}>
        {conteudo}
      </button>
    );
  }

  return (
    <Link
      href={`https://instagram.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      onClick={handleClick}
    >
      {conteudo}
    </Link>
  );
}
