import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { IconBrandInstagram } from '@tabler/icons-react';

interface InstagramButtonProps {
  instagramHandle: string;
  className?: string;
}

export function InstagramButton({
  instagramHandle,
  className,
}: InstagramButtonProps) {
  return (
    <Link
      href={`https://instagram.com/${instagramHandle}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ variant: 'default' }),
        'w-full bg-stone-950 hover:bg-stone-800 text-white flex items-center justify-start mt-2',
        className
      )}
    >
      <IconBrandInstagram className="w-4 h-4 mr-2" />
      Ver instagram
    </Link>
  );
}
