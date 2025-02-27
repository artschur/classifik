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
}

export function InstagramButton({
  instagramHandle,
  companionId,
  className,
}: InstagramButtonProps) {
  const { trackEvent } = useAnalytics();
  const handleClick = () => {
    trackEvent(companionId, 'instagram_click');
  };
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
      onClick={handleClick}
    >
      <IconBrandInstagram className="w-4 h-4 mr-2" />
      Ver instagram
    </Link>
  );
}
