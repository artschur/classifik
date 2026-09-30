import type { Metadata } from 'next';
import Link from 'next/link';

import { getAllActiveCompanions } from '@/db/queries/companions';
import { CompanionsIndexList } from '@/components/companions-index-list';

const SITE = 'https://www.onesugar.pt';
const PAGE_SIZE = 24;

const TITULO = 'Acompanhantes verificadas em Portugal';
const DESCRICAO =
  'Todos os perfis verificados da Onesugar num só lugar. Acompanhantes de norte a sul de Portugal, com verificação de identidade, discrição e contacto directo.';

/** O endereço da primeira página não leva ?page=1, para não a duplicar. */
function urlDaPagina(page: number): string {
  return page <= 1 ? `${SITE}/companions` : `${SITE}/companions?page=${page}`;
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
  const { page: pageParam } = await searchParams;
  const page = lerPagina(pageParam);

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
  const title = page > 1 ? `${TITULO}, página ${page}` : TITULO;

  return {
    title,
    description: DESCRICAO,
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
      canonical: foraDoIntervalo ? urlDaPagina(1) : urlDaPagina(page),
    },
    openGraph: {
      title,
      description: DESCRICAO,
      url: urlDaPagina(page),
      siteName: 'OneSugar',
      locale: 'pt_PT',
      type: 'website',
    },
  };
}

export default async function CompanionsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = lerPagina(pageParam);

  const { companions, total } = await getAllActiveCompanions(page, PAGE_SIZE);

  // Dados estruturados da listagem: diz ao buscador que isto é uma lista
  // ordenada de perfis e qual o endereço de cada um.
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: TITULO,
    numberOfItems: total,
    itemListElement: companions.map((c, i) => ({
      '@type': 'ListItem',
      position: (page - 1) * PAGE_SIZE + i + 1,
      url: `${SITE}/companions/${c.id}`,
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
        <h1 className="text-3xl font-bold mb-3">{TITULO}</h1>
        <p className="text-base text-muted-foreground">
          Reunimos aqui todos os perfis verificados da plataforma. Cada
          acompanhante passou por verificação de identidade antes de o anúncio
          ficar visível. Pode percorrer a lista completa ou{' '}
          <Link href="/location" className="text-primary hover:underline">
            procurar por distrito
          </Link>
          .
        </p>
        {total > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {total} {total === 1 ? 'perfil verificado' : 'perfis verificados'}
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
