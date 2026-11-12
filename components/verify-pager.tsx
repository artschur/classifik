import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Paginação das listas grandes do /verify (?aba=…&pag=…). */
export function VerifyPager({
  aba,
  pagina,
  total,
  porPagina,
}: {
  aba: string;
  pagina: number;
  total: number;
  porPagina: number;
}) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (paginas <= 1) return null;

  const href = (p: number) => `/verify?aba=${aba}${p > 1 ? `&pag=${p}` : ''}`;
  const de = (pagina - 1) * porPagina + 1;
  const ate = Math.min(total, pagina * porPagina);

  return (
    <nav aria-label="Páginas" className="flex flex-wrap items-center justify-between gap-2 py-2">
      <p className="text-sm text-muted-foreground">
        {de}–{ate} de {total}
      </p>
      <div className="flex items-center gap-2">
        {pagina > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={href(pagina - 1)} prefetch={false}>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
        )}
        <span className="text-sm">
          Página {pagina} de {paginas}
        </span>
        {pagina < paginas ? (
          <Button asChild variant="outline" size="sm">
            <Link href={href(pagina + 1)} prefetch={false}>
              Seguinte <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Seguinte <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </nav>
  );
}
