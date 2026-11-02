'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/locale-provider';
import { localizeHref } from '@/lib/i18n';

const TEXT = {
  pt: { dias: (n: number) => `${n} dias` },
  en: { dias: (n: number) => `${n} days` },
} as const;

export function AnalyticsTimeframe({ days }: { days: number }) {
  const router = useRouter();
  const locale = useLocale();
  const t = TEXT[locale];

  const changeTimeRange = (selectedDays: number) => {
    router.push(localizeHref(`/profile?days=${selectedDays}`, locale));
  };

  return (
    <div className="flex gap-4 mb-6">
      <Button
        variant={days === 7 ? 'default' : 'outline'}
        onClick={() => changeTimeRange(7)}
      >
        {t.dias(7)}
      </Button>
      <Button
        variant={days === 30 ? 'default' : 'outline'}
        onClick={() => changeTimeRange(30)}
      >
        {t.dias(30)}
      </Button>
      <Button
        variant={days === 90 ? 'default' : 'outline'}
        onClick={() => changeTimeRange(90)}
      >
        {t.dias(90)}
      </Button>
    </div>
  );
}
