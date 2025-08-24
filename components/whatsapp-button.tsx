'use client';

import { IconBrandWhatsapp } from '@tabler/icons-react';
import Link from 'next/link';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
}

export const WhatsAppButton = ({
  phoneNumber = '351913895353',
  message = '',
}: WhatsAppButtonProps) => {
  const whatsappUrl = `https://wa.me/${phoneNumber}${
    message ? `?text=${encodeURIComponent(message)}` : ''
  }`;

  return (
    <Link
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 ease-in-out z-50 flex items-center justify-center"
    >
      <IconBrandWhatsapp />
      <span className="ml-2">Contato</span>
    </Link>
  );
};

export default WhatsAppButton;
