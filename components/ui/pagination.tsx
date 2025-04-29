'use client';

import { usePathname, useSearchParams } from 'next/navigation';

export default function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams?.get('page') ?? 1) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="z-20 fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-stone-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
      <button
        disabled={currentPage <= 1}
        onClick={() => (window.location.href = createPageURL(currentPage - 1))}
        className="p-2 hover:bg-stone-800 rounded-full disabled:opacity-50 disabled:hover:bg-transparent"
      >
        ←
      </button>
      <span className="px-2">
        {currentPage} / {totalPages}
      </span>
      <button
        disabled={currentPage >= totalPages}
        onClick={() => (window.location.href = createPageURL(currentPage + 1))}
        className="p-2 hover:bg-stone-800 rounded-full disabled:opacity-50 disabled:hover:bg-transparent"
      >
        →
      </button>
    </div>
  );
}
