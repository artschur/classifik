import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { IconBrandWhatsapp } from '@tabler/icons-react';

interface WhatsAppButtonProps {
  phone: string;
  className?: string;
}

export function WhatsAppButton({ phone, className }: WhatsAppButtonProps) {
  const sanitizedPhone = phone.replace(/\D/g, '');

  return (
    <Link
      href={`https://wa.me/${sanitizedPhone}`}
      target="_blank"
      rel="noopener noreferrer"
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
