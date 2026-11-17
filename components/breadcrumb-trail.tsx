import { LocaleLink } from '@/components/locale-link';
import { absoluteUrl, hasEnglish, type Locale } from '@/lib/i18n';

export type Passo = {
  nome: string;
  /** Caminho em português ('/location/lisboa'). O último passo é a página actual e não leva ligação. */
  caminho: string;
};

/**
 * Caminho até à página (breadcrumb) com o BreadcrumbList correspondente.
 *
 * O que se vê e o que vai nos dados estruturados saem da mesma lista, para
 * nunca dizerem coisas diferentes. Os caminhos são em português; em /en as
 * ligações e os URLs passam para a versão inglesa quando ela existe.
 */
export function BreadcrumbTrail({ passos, locale }: { passos: Passo[]; locale: Locale }) {
  // Mesmo URL que o canonical: a home em português é "https://www.onesugar.pt/".
  const urlDe = (caminho: string) => {
    const url = absoluteUrl(caminho, locale === 'en' && hasEnglish(caminho) ? 'en' : 'pt');
    return caminho === '/' && !url.endsWith('/en') ? `${url}/` : url;
  };
  const dados = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: passos.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.nome,
      item: urlDe(p.caminho),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, '\\u003c') }}
      />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          {passos.map((p, i) => {
            const ultimo = i === passos.length - 1;
            return (
              <li key={p.caminho} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden="true">›</span>}
                {ultimo ? (
                  <span aria-current="page" className="text-foreground">
                    {p.nome}
                  </span>
                ) : (
                  <LocaleLink locale={locale} href={p.caminho} className="hover:underline">
                    {p.nome}
                  </LocaleLink>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
