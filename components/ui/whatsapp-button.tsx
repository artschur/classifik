'use client';

import Link from 'next/link';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/analytics';
import { gaEvent } from '@/lib/ga';
interface WhatsAppButtonProps {
  phone: string;
  className?: string;
  companionId: number;
  /**
   * Perfil de demonstração: o botão continua igual, mas não leva a lado
   * nenhum. O número guardado nesses perfis é o da própria Onesugar, e
   * carregar aqui punha quem procura a falar connosco a pensar que falava
   * com a acompanhante.
   */
  inert?: boolean;
}

export function WhatsAppButton({
  phone,
  className,
  companionId,
  inert = false,
}: WhatsAppButtonProps) {
  const sanitizedPhone = phone.replace(/\D/g, '');
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent(companionId, 'whatsapp_click');
    // Contacto com a acompanhante no GA4, com o ID do perfil. Distingue-se do
    // botão flutuante de suporte, que usa o número da própria OneSugar.
    gaEvent('contato_whatsapp', { companion_id: companionId, metodo: 'whatsapp' });
  };

  const classes = cn(
    buttonVariants({ variant: 'default' }),
    'w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-start',
    className
  );

  const conteudo = (
    <>
      <IconBrandWhatsapp className="w-4 h-4 mr-2" />
      Conversar no WhatsApp
    </>
  );

  // Sem href e sem registo de clique: um clique aqui não é um contacto, e
  // contá-lo enchia as estatísticas de conversas que nunca aconteceram.
  if (inert) {
    return (
      <button type="button" className={classes}>
        {conteudo}
      </button>
    );
  }

  return (
    <Link
      href={`https://wa.me/${sanitizedPhone}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={classes}
    >
      {conteudo}
    </Link>
  );
}
