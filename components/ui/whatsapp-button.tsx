'use client';

import Link from 'next/link';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/analytics';
interface WhatsAppButtonProps {
  phone: string;
  className?: string;
  companionId: number;
}

export function WhatsAppButton({
  phone,
  className,
  companionId,
}: WhatsAppButtonProps) {
  const sanitizedPhone = phone.replace(/\D/g, '');
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent(companionId, 'whatsapp_click');
  };

  return (
    <Link
      href={`https://wa.me/${sanitizedPhone}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        buttonVariants({ variant: 'default' }),
        'w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-start',
        className
      )}
    >
      <IconBrandWhatsapp className="w-4 h-4 mr-2" />
      Conversar no WhatsApp
    </Link>
  );
}
