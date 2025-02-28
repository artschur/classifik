'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function AnalyticsTimeframe({ days }: { days: number }) {
  const router = useRouter();

  const changeTimeRange = (selectedDays: number) => {
    router.push(`/profile?days=${selectedDays}`);
  };

  return (
    <div className="flex gap-4 mb-6">
      <Button
        variant={days === 7 ? 'default' : 'outline'}
        onClick={() => changeTimeRange(7)}
      >
        7 dias
      </Button>
      <Button
        variant={days === 30 ? 'default' : 'outline'}
        onClick={() => changeTimeRange(30)}
      >
        30 dias
      </Button>
      <Button
        variant={days === 90 ? 'default' : 'outline'}
        onClick={() => changeTimeRange(90)}
      >
        90 dias
      </Button>
    </div>
  );
}
