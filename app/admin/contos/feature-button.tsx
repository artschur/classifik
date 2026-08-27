'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setFeaturedStoryAction } from '@/app/actions/admin-stories';

export function FeatureStoryButton({
  id,
  featured,
}: {
  id: number;
  featured: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (featured) return; // já é o destaque — nada a fazer
    setLoading(true);
    const result = await setFeaturedStoryAction(id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
      setLoading(false);
    }
  };

  if (featured) {
    return (
      <span className="text-xs text-muted-foreground">Em destaque</span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-rose-500 hover:text-rose-400 transition-colors disabled:opacity-50"
    >
      {loading ? 'A marcar...' : 'Marcar destaque'}
    </button>
  );
}
