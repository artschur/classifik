import type { Metadata } from 'next';
import Link from 'next/link';

import { getAllActiveCompanions } from '@/db/queries/companions';
import { CompanionsIndexList } from '@/components/companions-index-list';
import { LocaleLink } from '@/components/locale-link';
import { getLocale } from '@/lib/locale.server';
import { OG_LOCALE, absoluteUrl, hasEnglish, type Locale } from '@/lib/i18n';

const PAGE_SIZE = 24;

const TEXT = {
  pt: {
    title: 'Acompanhantes verificadas em Portugal',
    description:
      'Todos os perfis verificados da OneSugar num só lugar. Acompanhantes de norte a sul de Portugal, com verificação de identidade, discrição e contacto directo.',
    page: 'página',
  },
  en: {
    title: 'Verified Escorts in Portugal',
    description:
      'Every verified escort profile on OneSugar in one place. Companions from Lisbon and Porto to the Algarve, with identity checks, discretion and direct contact.',
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

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const [{ page: pageParam }, locale] = await Promise.all([searchParams, getLocale()]);
  const page = lerPagina(pageParam);
  const t = TEXT[locale];

  // Uma página para lá da última não tem conteúdo nenhum. Responder 200 com a
  // lista vazia e apontá-la como endereço oficial fazia o buscador guardar
  // páginas em branco. Como o redireccionamento do servidor já não muda o
  // estado da resposta quando a página é entregue aos pedaços, o que a mantém
  // fora do índice é dizê-lo aqui: não indexar, e o endereço oficial é o da
  // lista.
  const { total } = await getAllActiveCompanions(page, PAGE_SIZE);
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

export default async function CompanionsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ page: pageParam }, locale] = await Promise.all([searchParams, getLocale()]);
  const page = lerPagina(pageParam);
  const t = TEXT[locale];

  const { companions, total } = await getAllActiveCompanions(page, PAGE_SIZE);

  // Dados estruturados da listagem: diz ao buscador que isto é uma lista
  // ordenada de perfis e qual o endereço de cada um.
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t.title,
    inLanguage: locale === 'en' ? 'en' : 'pt-PT',
    numberOfItems: total,
    itemListElement: companions.map((c, i) => ({
      '@type': 'ListItem',
      position: (page - 1) * PAGE_SIZE + i + 1,
      url: absoluteUrl(`/companions/${c.id}`, locale),
      name: c.name,
    })),
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-3">{t.title}</h1>
        {locale === 'en' ? (
          <p className="text-base text-muted-foreground">
            Every verified profile on the platform, in one list. Each companion
            went through an identity check before her listing went live. Browse
            the full list or{' '}
            <LocaleLink locale={locale} href="/location" className="text-primary hover:underline">
              search by district
            </LocaleLink>
            .
          </p>
        ) : (
          <p className="text-base text-muted-foreground">
            Reunimos aqui todos os perfis verificados da plataforma. Cada
            acompanhante passou por verificação de identidade antes de o anúncio
            ficar visível. Pode percorrer a lista completa ou{' '}
            <Link href="/location" className="text-primary hover:underline">
              procurar por distrito
            </Link>
            .
          </p>
        )}
        {total > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {locale === 'en'
              ? `${total} verified ${total === 1 ? 'profile' : 'profiles'}`
              : `${total} ${total === 1 ? 'perfil verificado' : 'perfis verificados'}`}
          </p>
        )}
      </header>

      {/* A grelha cresce ao rolar. A primeira leva vem daqui, do servidor, para
          os perfis estarem no HTML; o resto chega por acção de servidor. */}
      <CompanionsIndexList
        initialCompanions={companions}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
      />
    </div>
  );
}
