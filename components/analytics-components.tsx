'use client';

import { usePageViewAnalytics } from '@/hooks/analytics';

export function PageViewTracker({ companionId }: { companionId: number }) {
  usePageViewAnalytics(companionId);

  // This component doesn't render anything
  return null;
}
