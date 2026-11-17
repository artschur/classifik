import { ChevronRight } from 'lucide-react';

/**
 * Perguntas frequentes em acordeão, com <details> e <summary> do próprio
 * HTML: abre e fecha sem JavaScript, e as respostas continuam no código da
 * página, por isso o Google lê-as como antes (e o FAQPage de cada página
 * não muda). O mesmo desenho do FAQ da calculadora e da ajuda a anunciantes.
 */
export function FaqAcordeao({
  itens,
  className = '',
}: {
  itens: { q: string; a: string }[];
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border overflow-hidden divide-y divide-border ${className}`}>
      {itens.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex items-center justify-between gap-4 px-4 py-4 cursor-pointer select-none hover:bg-muted/30 transition-colors list-none [&::-webkit-details-marker]:hidden">
            <h3 className="text-sm font-medium text-foreground">{item.q}</h3>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 group-open:rotate-90" />
          </summary>
          <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
