import { LocaleLink } from '@/components/locale-link';
import { getTotaisPorDistrito } from '@/db/queries/catalog';
import { nomeDistrito } from '@/lib/districts';
import type { Locale } from '@/lib/i18n';

/**
 * Os distritos da página principal, agrupados por região, cada um com o
 * número de perfis no ar. Substitui os quatro blocos de texto por região
 * (mais de 2.300 px no telemóvel), que diziam coisas que o catálogo não
 * confirmava ("Porto e Braga lideram", "perfis ativos na Madeira").
 *
 * Dentro de cada região, os distritos com mais perfis vêm primeiro.
 */
const REGIOES: { pt: string; en: string; slugs: string[] }[] = [
  { pt: 'Norte', en: 'North', slugs: ['porto', 'braga', 'viana-do-castelo', 'vila-real', 'braganca'] },
  {
    pt: 'Centro',
    en: 'Centre',
    slugs: ['coimbra', 'aveiro', 'leiria', 'viseu', 'guarda', 'castelo-branco'],
  },
  { pt: 'Lisboa e Vale do Tejo', en: 'Lisbon and the Tagus Valley', slugs: ['lisboa', 'setubal', 'santarem'] },
  { pt: 'Alentejo e Algarve', en: 'Alentejo and the Algarve', slugs: ['faro', 'evora', 'beja', 'portalegre'] },
  { pt: 'Ilhas', en: 'Islands', slugs: ['madeira'] },
];

const TEXT = {
  pt: {
    perfis: (n: number) => (n === 1 ? '1 perfil' : `${n} perfis`),
    breve: 'Novos perfis em breve',
    acompanhantes: (slug: string) =>
      slug === 'porto' ? 'Acompanhantes no ' : slug === 'guarda' || slug === 'madeira' ? 'Acompanhantes na ' : 'Acompanhantes em ',
    todos: 'Ver todos os distritos',
  },
  en: {
    perfis: (n: number) => (n === 1 ? '1 profile' : `${n} profiles`),
    breve: 'New profiles soon',
    acompanhantes: (_slug: string) => 'Escorts in ',
    todos: 'See all districts',
  },
} as const;

export async function DistritosPorRegiao({
  locale,
  titulo,
  subtitulo,
}: {
  locale: Locale;
  titulo: string;
  subtitulo: string;
}) {
  const t = TEXT[locale];
  // Se a contagem falhar, a lista aparece na mesma, só sem os números.
  const totais = await getTotaisPorDistrito().catch(() => null);

  return (
    <section className="py-12 px-4 md:px-6">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold text-center mb-2">{titulo}</h2>
        <p className="text-base text-muted-foreground text-center mb-8 max-w-2xl mx-auto">{subtitulo}</p>

        <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
          {REGIOES.map((regiao) => {
            const slugs = [...regiao.slugs].sort(
              (a, b) => (totais?.[b]?.todos ?? 0) - (totais?.[a]?.todos ?? 0),
            );
            return (
              <div key={regiao.pt}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-rose-500">
                  {locale === 'en' ? regiao.en : regiao.pt}
                </h3>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                  {slugs.map((slug) => {
                    const nome = nomeDistrito(slug, locale);
                    const total = totais?.[slug]?.todos ?? 0;
                    return (
                      <li key={slug}>
                        {/* O texto da ligação continua a ser "Acompanhantes em
                            X": o início fica só para leitores de ecrã e para o
                            buscador; no ecrã aparece o nome do distrito e o
                            número de perfis. */}
                        <LocaleLink
                          locale={locale}
                          href={`/location/${slug}`}
                          className="flex h-full flex-col rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-rose-500"
                        >
                          <span className="text-sm font-semibold">
                            <span className="sr-only">{t.acompanhantes(slug)}</span>
                            {nome}
                          </span>
                          {totais && (
                            <span className="text-xs text-muted-foreground">
                              {total > 0 ? t.perfis(total) : t.breve}
                            </span>
                          )}
                        </LocaleLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <LocaleLink
            locale={locale}
            href="/location"
            className="inline-block bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3 rounded-full transition-colors text-sm"
          >
            {t.todos}
          </LocaleLink>
        </div>
      </div>
    </section>
  );
}
