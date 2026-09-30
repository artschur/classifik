'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getAllActiveCompanions } from '@/db/queries/companions';
import { framingStyle, mediaFraming, mediaUrl } from '@/lib/image-framing';
import type { CompanionPreview } from '@/types/types';

/**
 * A grelha da listagem geral, que cresce ao rolar.
 *
 * A primeira leva vem desenhada no servidor (`initialCompanions`), por isso os
 * perfis e as ligações /companions/<id> estão no HTML entregue ao buscador. As
 * seguintes chegam por acção de servidor quando a sentinela se aproxima do
 * ecrã.
 */
export function CompanionsIndexList({
  initialCompanions,
  page,
  pageSize,
  total,
}: {
  initialCompanions: CompanionPreview[];
  page: number;
  pageSize: number;
  total: number;
}) {
  const [companions, setCompanions] = useState(initialCompanions);
  const [nextPage, setNextPage] = useState(page + 1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(page * pageSize < total);
  const sentinela = useRef<HTMLDivElement>(null);

  const carregarMais = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { companions: mais } = await getAllActiveCompanions(
        nextPage,
        pageSize,
      );

      setCompanions((anteriores) => {
        const vistos = new Set(anteriores.map((c) => c.id));
        return [...anteriores, ...mais.filter((c) => !vistos.has(c.id))];
      });

      setNextPage((n) => n + 1);
      if (mais.length < pageSize) setHasMore(false);
    } catch (error) {
      console.error('Failed to load more companions:', error);
      // Não desliga o carregamento: a pessoa pode tentar outra vez na
      // ligação, em vez de a lista ficar presa por uma falha passageira.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, nextPage, pageSize]);

  useEffect(() => {
    if (!hasMore) return;
    const alvo = sentinela.current;
    if (!alvo) return;

    // Começa a buscar antes de a sentinela entrar no ecrã, para a lista
    // crescer sem a pessoa ficar a olhar para um vazio.
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting) carregarMais();
      },
      { rootMargin: '600px' },
    );

    observador.observe(alvo);
    return () => observador.disconnect();
  }, [hasMore, carregarMais]);

  if (companions.length === 0) {
    return (
      <p className="text-muted-foreground py-16 text-center">
        Ainda não há perfis nesta página.{' '}
        <Link href="/companions" className="text-primary hover:underline">
          Voltar ao início da lista
        </Link>
      </p>
    );
  }

  return (
    <>
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

      {/* O gatilho é uma ligação verdadeira para a página seguinte: quem tem
          JavaScript nunca chega a carregar nela porque o rolar já trouxe os
          perfis, e o buscador segue-a para descobrir o resto da lista. */}
      {hasMore && (
        <div ref={sentinela} className="mt-10 flex justify-center">
          {loadingMore ? (
            <span className="text-sm text-muted-foreground">
              A carregar mais perfis…
            </span>
          ) : (
            <Link
              href={`/companions?page=${nextPage}`}
              rel="next"
              onClick={(e) => {
                e.preventDefault();
                carregarMais();
              }}
              className="rounded-full border px-6 py-3 text-sm font-medium hover:bg-accent"
            >
              Ver mais perfis
            </Link>
          )}
        </div>
      )}
    </>
  );
}
