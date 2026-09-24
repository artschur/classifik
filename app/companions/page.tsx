import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

import { getAllActiveCompanions } from '@/db/queries/companions';
import { framingStyle, mediaUrl, mediaFraming } from '@/lib/image-framing';

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
  const title = page > 1 ? `${TITULO} — página ${page}` : TITULO;

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
      siteName: 'Onesugar',
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
  const ultimaPagina = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
            {ultimaPagina > 1 && ` · página ${page} de ${ultimaPagina}`}
          </p>
        )}
      </header>

      {companions.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">
          Ainda não há perfis nesta página.{' '}
          <Link href="/companions" className="text-primary hover:underline">
            Voltar ao início da lista
          </Link>
        </p>
      ) : (
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {companions.map((companion) => {
            const capa = companion.images?.[0];
            return (
              <li key={companion.id}>
                <Link
                  href={`/companions/${companion.id}`}
                  className="group block overflow-hidden rounded-xl border transition-shadow hover:shadow-lg"
                >
                  {/* overflow-hidden é obrigatório aqui: o enquadramento das
                      fotos aplica uma ampliação por transformação, e sem
                      recorte nesta caixa a foto transbordava e tapava o nome
                      e a idade por baixo. */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                    {capa ? (
                      <Image
                        src={mediaUrl(capa)}
                        alt={`${companion.name}, acompanhante verificada em ${companion.city}`}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        // Sem efeito de ampliação ao passar o rato: seria
                        // escrito por cima pela transformação do
                        // enquadramento, e só funcionaria nas fotos sem zoom.
                        className="object-cover"
                        style={framingStyle(mediaFraming(capa))}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                        Sem fotografia
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h2 className="font-semibold truncate">{companion.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {companion.age} anos · {companion.city}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Paginação por ligação, para o buscador poder seguir as páginas
          seguintes sem depender de JavaScript. */}
      {ultimaPagina > 1 && (
        <nav
          className="mt-10 flex items-center justify-center gap-3"
          aria-label="Paginação"
        >
          {page > 1 && (
            <Link
              href={page === 2 ? '/companions' : `/companions?page=${page - 1}`}
              rel="prev"
              className="rounded-full border px-4 py-2 text-sm hover:bg-accent"
            >
              ← Anterior
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Página {page} de {ultimaPagina}
          </span>
          {page < ultimaPagina && (
            <Link
              href={`/companions?page=${page + 1}`}
              rel="next"
              className="rounded-full border px-4 py-2 text-sm hover:bg-accent"
            >
              Seguinte →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
