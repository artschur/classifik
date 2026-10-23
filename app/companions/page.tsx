import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { getAllActiveCompanions, getCompanionsToFilter } from '@/db/queries/companions';
import { CompanionFilters } from '@/components/companionFilters';
import { CompanionsList, CompanionsListSkeleton } from '@/components/companionsList';
import { HeroCarouselWrapper } from '@/components/hero-carousel-wrapper';
import { LocaleLink } from '@/components/locale-link';
import { PlanType } from '@/db/queries/kv';
import { getLocale } from '@/lib/locale.server';
import { OG_LOCALE, absoluteUrl, hasEnglish, type Locale } from '@/lib/i18n';
import { TODOS_OS_DISTRITOS } from '@/lib/districts';
import type { FilterTypesCompanions } from '@/types/types';
import type { CityData } from '@/app/location/[city]/types';

/**
 * Listagem geral: todas as acompanhantes de Portugal, com a mesma estrutura e
 * o mesmo funcionamento das páginas de distrito (título, atalhos, introdução,
 * carrossel VIP, filtros, lista que cresce ao rolar e o convite a anunciar).
 */

// O mesmo tamanho de leva das páginas de distrito (getCompanionsToFilter).
const PAGE_SIZE = 9;

const TEXT = {
  pt: {
    title: 'Acompanhantes verificadas em Portugal',
    description:
      'Todos os perfis da OneSugar num só lugar. Acompanhantes de norte a sul de Portugal, com discrição e contacto directo.',
    page: 'página',
  },
  en: {
    title: 'Verified Escorts in Portugal',
    description:
      'Every escort profile on OneSugar in one place. Companions from Lisbon and Porto to the Algarve, with discretion and direct contact.',
    page: 'page',
  },
} as const;

/** O endereço da primeira página não leva ?page=1, para não a duplicar. */
function urlDaPagina(page: number, locale: Locale = 'pt'): string {
  const base = absoluteUrl('/companions', locale);
  return page <= 1 ? base : `${base}?page=${page}`;
}

/**
 * Qualquer coisa que não seja um inteiro positivo vale como página 1.
 *
 * `Math.max(1, Number('abc'))` devolve NaN, não 1: o valor passava adiante e
 * chegava à base de dados como deslocamento inválido.
 */
function lerPagina(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

type Params = Record<string, string | undefined>;

/**
 * Filtros do endereço, como nos distritos: abre em feminino, e "Todos" no
 * filtro grava `todos`, que não filtra nada.
 */
function lerFiltros(params: Params): FilterTypesCompanions {
  return {
    ...(params as FilterTypesCompanions),
    gender: (params.gender as FilterTypesCompanions['gender']) ?? 'feminino',
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Params>;
}): Promise<Metadata> {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const page = lerPagina(params.page);
  const t = TEXT[locale];

  // Uma página para lá da última não tem conteúdo nenhum. Responder 200 com a
  // lista vazia e apontá-la como endereço oficial fazia o buscador guardar
  // páginas em branco. Como o redireccionamento do servidor já não muda o
  // estado da resposta quando a página é entregue aos pedaços, o que a mantém
  // fora do índice é dizê-lo aqui: não indexar, e o endereço oficial é o da
  // lista.
  const { total } = await getAllActiveCompanions(1, 1, lerFiltros(params));
  const ultimaPagina = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const foraDoIntervalo = page > ultimaPagina;

  // O título das páginas seguintes diz em que página se está, senão o
  // buscador vê várias páginas com o mesmo título e trata-as como repetidas.
  const title = page > 1 ? `${t.title}, ${t.page} ${page}` : t.title;

  // hreflang só na primeira página: as seguintes são continuação da lista e
  // têm o canonical próprio.
  const languages =
    page <= 1 && hasEnglish('/companions')
      ? {
          'pt-PT': urlDaPagina(1, 'pt'),
          en: urlDaPagina(1, 'en'),
          'x-default': urlDaPagina(1, 'pt'),
        }
      : undefined;

  return {
    title,
    description: t.description,
    robots: {
      index: !foraDoIntervalo,
      follow: true,
      googleBot: {
        index: !foraDoIntervalo,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: foraDoIntervalo ? urlDaPagina(1, locale) : urlDaPagina(page, locale),
      ...(languages ? { languages } : {}),
    },
    openGraph: {
      title,
      description: t.description,
      url: urlDaPagina(page, locale),
      siteName: 'OneSugar',
      locale: OG_LOCALE[locale],
      type: 'website',
    },
  };
}

/**
 * A lista, buscada no servidor para os perfis e as ligações estarem no HTML,
 * com os dados estruturados da página. Se a busca falhar, a lista volta a
 * tentar no navegador, como nos distritos.
 */
async function PortugalCompanionsList({
  page,
  filters,
  locale,
  title,
}: {
  page: number;
  filters: FilterTypesCompanions;
  locale: Locale;
  title: string;
}) {
  const companions = await getCompanionsToFilter(TODOS_OS_DISTRITOS, page, filters).catch((error) => {
    console.error('Failed to fetch companions:', error);
    return undefined;
  });

  // Diz ao buscador que isto é uma lista ordenada de perfis e o endereço de
  // cada um. "<" escapado: o nome é escrito pela própria anunciante.
  const itemList = companions && {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    inLanguage: locale === 'en' ? 'en' : 'pt-PT',
    itemListElement: companions.map((c, i) => ({
      '@type': 'ListItem',
      position: (page - 1) * PAGE_SIZE + i + 1,
      url: absoluteUrl(`/companions/${c.id}`, locale),
      name: c.name,
    })),
  };

  return (
    <>
      {itemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, '\\u003c') }}
        />
      )}
      <CompanionsList
        location={TODOS_OS_DISTRITOS}
        page={page}
        filters={filters}
        initialCompanions={companions}
        pageSize={PAGE_SIZE}
      />
    </>
  );
}

/**
 * Texto editorial e perguntas frequentes de Portugal, no mesmo formato dos
 * distritos (app/location/[city]), escritos para a listagem do país inteiro.
 */
const CONTEUDO: Record<Locale, Pick<CityData, 'editorial' | 'faq'>> = {
  pt: {
    editorial: {
      mainHeading: 'Acompanhantes em Portugal: perfis revistos de norte a sul',
      sections: [
        {
          paragraphs: [
            'A Onesugar reúne numa só lista as acompanhantes activas em todo o país, de Viana do Castelo ao Algarve e à Madeira. Cada perfil é revisto pela equipa antes de ser publicado, e o selo Verificada indica as acompanhantes que confirmaram a identidade com documento.',
            'Pode percorrer a lista completa, filtrar por idade, altura, características ou preço, ou procurar uma acompanhante pelo nome. Se já sabe onde vai estar, as páginas de cada distrito mostram apenas os perfis dessa região.',
          ],
        },
        {
          heading: 'Lisboa, Porto e Algarve',
          paragraphs: [
            'Lisboa e o Porto concentram a maior parte da procura, com perfis disponíveis tanto para residentes como para quem está de passagem em trabalho ou turismo. O Algarve, com Faro à cabeça, tem procura ao longo de todo o ano, sobretudo de visitantes internacionais.',
            'Braga, Coimbra, Aveiro, Setúbal e Leiria completam os principais centros, e os restantes distritos do interior e das ilhas têm também perfis activos.',
          ],
        },
        {
          heading: 'Discrição e contacto directo',
          paragraphs: [
            'O contacto é feito directamente com cada acompanhante, sem intermediários. A Onesugar não guarda o histórico desses contactos nem partilha dados pessoais com terceiros, e a navegação é possível sem registo.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Lisboa', slug: 'lisboa' },
        { city: 'Porto', slug: 'porto' },
        { city: 'Faro', slug: 'faro' },
        { city: 'Braga', slug: 'braga' },
        { city: 'Coimbra', slug: 'coimbra' },
      ],
    },
    faq: [
      {
        q: 'Como encontrar acompanhantes em Portugal com perfis revistos?',
        a: 'Na Onesugar, todos os perfis são revistos pela equipa antes de serem publicados. Use os filtros desta página ou escolha o distrito para ver apenas os perfis dessa região.',
      },
      {
        q: 'O que significa o selo Verificada?',
        a: 'O selo Verificada aparece nas acompanhantes que confirmaram a identidade com documento. Os restantes perfis também foram revistos pela equipa, mas ainda não enviaram o documento.',
      },
      {
        q: 'Em que distritos há acompanhantes na Onesugar?',
        a: 'A Onesugar tem perfis nos 18 distritos de Portugal continental e na Madeira. Lisboa, Porto, Faro e Braga são os distritos com mais perfis activos.',
      },
      {
        q: 'Posso procurar uma acompanhante pelo nome?',
        a: 'Sim. Escreva o nome na caixa de pesquisa por cima da lista; a pesquisa funciona em conjunto com os outros filtros.',
      },
      {
        q: 'Como anunciar como acompanhante na Onesugar?',
        a: 'Crie o perfil gratuitamente. Depois de revisto pela equipa, fica visível na página do seu distrito e nesta lista. Os planos pagos dão mais destaque ao anúncio.',
      },
    ],
  },
  en: {
    editorial: {
      mainHeading: 'Escorts in Portugal: reviewed profiles from north to south',
      sections: [
        {
          paragraphs: [
            'OneSugar brings together the companions active across the whole country in a single list, from Viana do Castelo to the Algarve and Madeira. Every profile is reviewed by our team before it goes live, and the Verified badge shows the companions who have confirmed their identity with a document.',
            'Browse the full list, filter by age, height, features or price, or look a companion up by name. If you already know where you will be, each district page shows only the profiles in that region.',
          ],
        },
        {
          heading: 'Lisbon, Porto and the Algarve',
          paragraphs: [
            'Lisbon and Porto account for most of the demand, with profiles for residents and for visitors in town on business or holiday. The Algarve, led by Faro, sees demand all year round, mostly from international visitors.',
            'Braga, Coimbra, Aveiro, Setúbal and Leiria round out the main cities, and the remaining inland districts and the islands also have active profiles.',
          ],
        },
        {
          heading: 'Discretion and direct contact',
          paragraphs: [
            'You contact each companion directly, with no middlemen. OneSugar does not keep a record of those contacts or share personal data with third parties, and you can browse without signing up.',
          ],
        },
      ],
      nearbyLinks: [
        { city: 'Lisbon', slug: 'lisboa' },
        { city: 'Porto', slug: 'porto' },
        { city: 'Faro', slug: 'faro' },
        { city: 'Braga', slug: 'braga' },
        { city: 'Coimbra', slug: 'coimbra' },
      ],
    },
    faq: [
      {
        q: 'How do I find reviewed escort profiles in Portugal?',
        a: 'On OneSugar every profile is reviewed by our team before it goes live. Use the filters on this page, or pick a district to see only the profiles in that region.',
      },
      {
        q: 'What does the Verified badge mean?',
        a: 'The Verified badge appears on companions who have confirmed their identity with a document. The other profiles have also been reviewed by our team but have not sent a document yet.',
      },
      {
        q: 'Which districts have escorts on OneSugar?',
        a: 'OneSugar has profiles in all 18 districts of mainland Portugal and in Madeira. Lisbon, Porto, Faro and Braga have the most active profiles.',
      },
      {
        q: 'Can I search for a companion by name?',
        a: 'Yes. Type the name in the search box above the list; the search works together with the other filters.',
      },
      {
        q: 'How do I advertise as a companion on OneSugar?',
        a: 'Create your profile for free. Once our team has reviewed it, it appears on your district page and in this list. Paid plans give your listing more visibility.',
      },
    ],
  },
};

/** Texto editorial, ligações para distritos e perguntas frequentes, como nos distritos. */
function PortugalEditorialAndFAQ({ locale }: { locale: Locale }) {
  const { editorial, faq } = CONTEUDO[locale];
  const en = locale === 'en';

  const faqSchema = faq && {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: en ? 'en' : 'pt-PT',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <div className="mt-10 mb-6">
      {editorial && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-5">{editorial.mainHeading}</h2>
          {editorial.sections.map((section, si) => (
            <div key={si} className="mb-5">
              {section.heading && (
                <h3 className="text-base font-semibold mb-2 text-foreground">{section.heading}</h3>
              )}
              {section.paragraphs.map((para, pi) => (
                <p key={pi} className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {para}
                </p>
              ))}
            </div>
          ))}
          {editorial.nearbyLinks.length > 0 && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              {en
                ? 'Looking for a specific region? See the profiles in '
                : 'Procura uma região em concreto? Veja os perfis em '}
              {editorial.nearbyLinks.map((link, idx) => (
                <span key={link.slug}>
                  <LocaleLink locale={locale} href={`/location/${link.slug}`} className="text-rose-500 hover:underline">
                    {link.city}
                  </LocaleLink>
                  {idx < editorial.nearbyLinks.length - 2
                    ? ', '
                    : idx === editorial.nearbyLinks.length - 2
                      ? en ? ' and ' : ' e '
                      : '.'}
                </span>
              ))}
            </p>
          )}
        </div>
      )}
      {faq && faq.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-5">{en ? 'Frequently asked questions' : 'Perguntas frequentes'}</h2>
          <div className="space-y-5">
            {faq.map((item, idx) => (
              <div key={idx}>
                <h3 className="text-sm font-semibold mb-1 text-foreground">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
          {faqSchema && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
            />
          )}
        </div>
      )}
    </div>
  );
}

/** A chamada final dos distritos, depois das perguntas frequentes. */
function RegistrationCTABottom({ locale }: { locale: Locale }) {
  if (locale === 'en') {
    return (
      <div className="my-10 rounded-2xl border-2 border-dashed border-rose-500 bg-rose-50/10 dark:bg-rose-950/20 px-6 py-7 text-center">
        <p className="font-semibold mb-1">Want to advertise in Portugal? Join OneSugar.</p>
        <p className="text-sm text-muted-foreground mb-5">
          Free listing, reviewed by our team, with paid plans for extra visibility.
        </p>
        <LocaleLink
          locale={locale}
          href="/quanto-ganha-acompanhante"
          className="inline-block bg-rose-600 hover:bg-rose-700 text-white font-semibold px-7 py-3 rounded-full transition-colors text-sm"
        >
          Sign up as a companion
        </LocaleLink>
      </div>
    );
  }
  return (
    <div className="my-10 rounded-2xl border-2 border-dashed border-rose-500 bg-rose-50/10 dark:bg-rose-950/20 px-6 py-7 text-center">
      <p className="font-semibold mb-1">Queres anunciar em Portugal? Junta-te à Onesugar.</p>
      <p className="text-sm text-muted-foreground mb-5">
        Perfil verificado, visibilidade imediata, planos a partir de €0.
      </p>
      <Link
        href="/checkout"
        className="inline-block bg-rose-600 hover:bg-rose-700 text-white font-semibold px-7 py-3 rounded-full transition-colors text-sm"
      >
        Quero registar-me como acompanhante
      </Link>
    </div>
  );
}

/** O mesmo convite dos distritos, para Portugal inteiro. */
function RegistrationCTAInline({ locale }: { locale: Locale }) {
  if (locale === 'en') {
    return (
      <div className="my-10 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/10 dark:bg-rose-950/20 dark:border-rose-900/60 px-6 py-5">
        <p className="font-semibold text-sm mb-1">Do you work as an escort in Portugal?</p>
        <p className="text-xs text-muted-foreground mb-4">
          Create your profile for free and reach visitors from Portugal and abroad.
        </p>
        <div className="flex flex-wrap gap-3">
          <LocaleLink
            locale={locale}
            href="/quanto-ganha-acompanhante"
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            Create a free profile
          </LocaleLink>
          <LocaleLink
            locale={locale}
            href="/checkout"
            className="border border-rose-600 text-rose-500 hover:bg-rose-600 hover:text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            See plans (in Portuguese)
          </LocaleLink>
        </div>
      </div>
    );
  }
  return (
    <div className="my-10 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/10 dark:bg-rose-950/20 dark:border-rose-900/60 px-6 py-5">
      <p className="font-semibold text-sm mb-1">Trabalhas como acompanhante em Portugal?</p>
      <p className="text-xs text-muted-foreground mb-4">
        Regista o teu perfil e aparece para milhares de utilizadores verificados.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/checkout"
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-colors"
        >
          Registar perfil gratuito
        </Link>
        <Link
          href="/checkout"
          className="border border-rose-600 text-rose-500 hover:bg-rose-600 hover:text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-colors"
        >
          Ver planos
        </Link>
      </div>
    </div>
  );
}

export default async function CompanionsIndexPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const page = lerPagina(params.page);
  const t = TEXT[locale];
  const filtros = lerFiltros(params);
  const en = locale === 'en';

  return (
    <div className="container mx-auto px-10 py-8">
      <h1 className="text-3xl font-bold mb-6">{t.title}</h1>

      <div className="mb-4 text-sm text-muted-foreground flex gap-2">
        {en ? 'Explore:' : 'Explorar:'}
        <LocaleLink locale={locale} href="/location/lisboa" className="hover:underline text-rose-500">
          {en ? 'Lisbon' : 'Lisboa'}
        </LocaleLink>{' '}
        |
        <LocaleLink locale={locale} href="/location/porto" className="hover:underline text-rose-500">
          Porto
        </LocaleLink>{' '}
        |
        <LocaleLink locale={locale} href="/location/braga" className="hover:underline text-rose-500">
          Braga
        </LocaleLink>
      </div>

      {/* Introdução, acima do carrossel, como nos distritos. */}
      <p className="mb-8 text-sm text-muted-foreground leading-relaxed max-w-3xl">
        {en ? (
          <>
            Every profile on the platform, in one list, each one reviewed by our team before going live.
            Browse the full list or{' '}
            <LocaleLink locale={locale} href="/location" className="text-rose-500 hover:underline">
              search by district
            </LocaleLink>
            .
          </>
        ) : (
          <>
            Reunimos aqui todos os perfis da plataforma, cada um revisto pela equipa antes de ficar visível.
            Pode percorrer a lista completa ou{' '}
            <Link href="/location" className="text-rose-500 hover:underline">
              procurar por distrito
            </Link>
            .
          </>
        )}
      </p>

      <div className="mb-8">
        <HeroCarouselWrapper plans={[PlanType.VIP]} />
      </div>

      <CompanionFilters initialFilters={filtros} />
      <Suspense key={JSON.stringify(filtros)} fallback={<CompanionsListSkeleton />}>
        <PortugalCompanionsList page={page} filters={filtros} locale={locale} title={t.title} />
      </Suspense>

      {/* CTA 1 - entre perfis e editorial */}
      <RegistrationCTAInline locale={locale} />

      {/* Editorial + FAQ - abaixo dos perfis */}
      <PortugalEditorialAndFAQ locale={locale} />

      {/* CTA 2 - após o FAQ */}
      <RegistrationCTABottom locale={locale} />
    </div>
  );
}
