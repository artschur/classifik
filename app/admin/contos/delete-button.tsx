'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteStoryAction } from '@/app/actions/admin-stories';

export function DeleteStoryButton({
  id,
  storagePaths,
}: {
  id: number;
  storagePaths: string[];
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteStoryAction(id, storagePaths);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
      setLoading(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md font-semibold transition-colors"
        >
          {loading ? 'A eliminar...' : 'Confirmar'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs border border-border px-3 py-1.5 rounded-md transition-colors hover:bg-card"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-red-500 hover:text-red-400 transition-colors"
    >
      Eliminar
    </button>
  );
}
