import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Paginação numerada do catálogo. Cada número é uma ligação verdadeira, com os
 * filtros actuais e a âncora do catálogo, para o buscador seguir as páginas e
 * para quem carrega voltar ao catálogo em vez do topo da página.
 */
export function CatalogPagination({
  page,
  totalPages,
  params,
}: {
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (n: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== 'page') p.set(k, v);
    if (n > 1) p.set('page', String(n));
    const qs = p.toString();
    return `${qs ? `?${qs}` : '?'}#catalogo`;
  };

  // Até 5 números à volta da página actual, mais a primeira e a última.
  const inicio = Math.max(1, Math.min(page - 2, totalPages - 4));
  const fim = Math.min(totalPages, inicio + 4);
  const numeros = Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);

  const base = 'flex h-11 min-w-11 items-center justify-center rounded-xl border-2 px-3 text-base font-semibold transition-colors';
  // Páginas por escolher: brancas com contorno rosa, para se verem bem nos dois temas.
  const outra = 'border-rose-200 bg-white text-neutral-900 shadow-sm hover:border-rose-500 hover:text-rose-600 dark:border-rose-900/60 dark:bg-neutral-900 dark:text-white dark:hover:border-rose-500';

  return (
    <nav aria-label="Páginas do catálogo" className="mt-10 flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className={`${base} ${outra}`} aria-label="Página anterior">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}
        {inicio > 1 && (
          <>
            <Link href={href(1)} className={`${base} ${outra}`}>
              1
            </Link>
            {inicio > 2 && <span className="px-1 text-lg font-semibold text-muted-foreground">…</span>}
          </>
        )}
        {numeros.map((n) => (
          <Link
            key={n}
            href={href(n)}
            aria-current={n === page ? 'page' : undefined}
            className={`${base} ${n === page ? 'border-rose-600 bg-rose-600 text-white shadow-lg shadow-rose-600/30' : outra}`}
          >
            {n}
          </Link>
        ))}
        {fim < totalPages && (
          <>
            {fim < totalPages - 1 && <span className="px-1 text-lg font-semibold text-muted-foreground">…</span>}
            <Link href={href(totalPages)} className={`${base} ${outra}`}>
              {totalPages}
            </Link>
          </>
        )}
        {page < totalPages && (
          <Link href={href(page + 1)} className={`${base} ${outra}`} aria-label="Página seguinte">
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </p>
    </nav>
  );
}
