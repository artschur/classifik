'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { CompanionFiltered, FilterTypesCompanions, Media } from '@/types/types';
import { framingStyle, isVideoMedia, mediaFraming, mediaUrl } from '@/lib/image-framing';
import { Skeleton } from '@/components/ui/skeleton';
import { getCompanionsToFilter } from '@/db/queries/companions';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BadgeCheck, Camera, MapPin } from 'lucide-react';
import { useLocale } from '@/components/locale-provider';
import { LocaleLink } from '@/components/locale-link';
import { nomeDistrito } from '@/lib/districts';
import { TAMANHO_LISTA } from '@/lib/listagem';
import { precoCartao } from '@/lib/preco';
import { etiquetaGenero, seloVerificacao } from '@/lib/genero';

/**
 * Grelha da listagem: dois perfis por linha no telemóvel, três entre md e
 * xl (com o painel de filtros ao lado a partir de lg) e quatro a partir de xl.
 */
const GRELHA = 'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4';

export function CompanionsList({
  location,
  page,
  filters,
  initialCompanions,
  pageSize = TAMANHO_LISTA,
}: {
  location: string;
  page: number;
  filters?: FilterTypesCompanions;
  // Lista já buscada no servidor. Quando vem preenchida, os cartões (e as
  // ligações /companions/<id>) saem no HTML entregue ao buscador, sem esperar
  // pelo JavaScript. Sem ela, o componente continua a buscar no navegador.
  initialCompanions?: CompanionFiltered[];
  /** Quantos vêm de cada vez. Serve para saber quando a lista acabou. */
  pageSize?: number;
}) {
  const searchParams = useSearchParams();
  const [companions, setCompanions] = useState<CompanionFiltered[]>(
    initialCompanions ?? [],
  );
  const [loading, setLoading] = useState(initialCompanions === undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(page + 1);
  // Uma primeira página cheia significa que pode haver mais. Se vier
  // incompleta, já se sabe que acabou e nem se tenta.
  const [hasMore, setHasMore] = useState(
    (initialCompanions?.length ?? pageSize) >= pageSize,
  );
  const sentinela = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Os dados do servidor já correspondem a esta cidade, página e filtros:
    // cada mudança de filtro ou de página muda a key do Suspense na página e
    // o servidor volta a entregar a lista certa. Buscar de novo aqui só
    // repetiria o pedido.
    if (initialCompanions !== undefined) return;

    const fetchCompanions = async () => {
      setLoading(true);
      try {
        const data = await getCompanionsToFilter(location, page, filters);
        setCompanions(data);
        setHasMore(data.length >= pageSize);
      } catch (error) {
        console.error('Failed to fetch companions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanions();
  }, [location, page, filters, initialCompanions, pageSize]);

  const carregarMais = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await getCompanionsToFilter(location, nextPage, filters);

      setCompanions((anteriores) => {
        // A consulta ordena por plano depois de cortar a página, por isso a
        // mesma acompanhante pode reaparecer numa página seguinte. Sem este
        // filtro, aparecia duas vezes no ecrã.
        const vistos = new Set(anteriores.map((c) => c.id));
        return [...anteriores, ...data.filter((c) => !vistos.has(c.id))];
      });

      setNextPage((n) => n + 1);
      if (data.length < pageSize) setHasMore(false);
    } catch (error) {
      console.error('Failed to load more companions:', error);
      // Não desliga o carregamento: a pessoa pode tentar outra vez no botão,
      // em vez de a lista ficar presa por uma falha de rede passageira.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, location, nextPage, filters, pageSize]);

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

  // O gatilho é uma ligação verdadeira, com o endereço da página seguinte e
  // os filtros actuais. Quem tem JavaScript nunca chega a carregar nela
  // porque o rolar já trouxe os perfis; o buscador segue-a e descobre o resto
  // da lista, que é o que evita perder o que a paginação por endereço dava.
  const locale = useLocale();
  const proximoEndereco = (() => {
    const p = new URLSearchParams(searchParams?.toString() ?? '');
    p.set('page', String(nextPage));
    return `?${p.toString()}`;
  })();

  if (loading) {
    return <CompanionsListSkeleton />;
  }

  return (
    <>
      <div className={GRELHA}>
        {companions.map((companion: CompanionFiltered) => (
          <CompanionCard key={companion.id} companion={companion} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinela} className="flex justify-center py-10">
          {loadingMore ? (
            <div className={`${GRELHA} w-full`}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <Link
              href={proximoEndereco}
              onClick={(e) => {
                e.preventDefault();
                carregarMais();
              }}
              className="rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              {locale === 'en' ? 'See more profiles' : 'Ver mais perfis'}
            </Link>
          )}
        </div>
      )}
    </>
  );
}

/** Rótulo do plano no cartão, igual ao da página principal. */
const PLANO: Record<string, { pt: string; en: string; className: string }> = {
  vip: { pt: 'VIP', en: 'VIP', className: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-950' },
  plus: { pt: 'Plus', en: 'Plus', className: 'bg-gradient-to-r from-orange-400 to-rose-500 text-white' },
  classic: { pt: 'Clássico', en: 'Classic', className: 'bg-rose-600 text-white' },
};

/**
 * Cartão compacto da listagem (distritos e /companions): a foto de capa em
 * pé, no formato das fotos dos anúncios, com o plano e o número de fotos, e
 * por baixo nome, idade, zona e preço.
 *
 * Antes era um cartão por linha no telemóvel, com a foto deitada (4:3), que
 * cortava quase metade de uma foto em pé, um carrossel com todas as fotos,
 * a descrição e as características. A galeria e a descrição continuam no
 * perfil. O selo "Não verificada" saiu da listagem (decisão de 25/11): o
 * selo "Verificada" continua e a falta dele já informa quem procura.
 */
export function CompanionCard({ companion }: { companion: CompanionFiltered }) {
  const locale = useLocale();
  const en = locale === 'en';
  const selo = seloVerificacao(companion.gender, locale);
  const etiqueta = etiquetaGenero(companion.gender, locale);
  // Mantém o objecto em vez de reduzir ao URL, senão perdia-se o
  // enquadramento que a anunciante escolheu para a capa.
  const images = companion.images.filter(
    (media): media is string | Media => !isVideoMedia(media),
  );
  const capa = images[0];
  const plano = PLANO[(companion.planType ?? '').toLowerCase()];
  const cidade = companion.city ? nomeDistrito(companion.city, locale) : '';

  return (
    <LocaleLink
      locale={locale}
      href={`/companions/${companion.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Image
          src={(capa && mediaUrl(capa)) || '/image.png'}
          alt={
            cidade
              ? en ? `${companion.name}, escort in ${cidade}` : `${companion.name}, acompanhante em ${cidade}`
              : companion.name
          }
          fill={true}
          // Duas colunas no telemóvel, três entre md e xl, quatro a partir
          // daí (com o painel de filtros ao lado). O navegador escolhe a foto
          // pela largura real do cartão e pela densidade do ecrã: a nitidez
          // fica igual à de antes, sem descarregar fotos maiores do que o
          // cartão.
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          style={capa ? framingStyle(mediaFraming(capa)) : undefined}
        />
        <Image
          src={'/watermark.png'}
          width={100}
          height={100}
          alt=""
          className="absolute inset-0 m-auto h-12 w-12 opacity-80 invert"
        />
        {plano && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide shadow ${plano.className}`}
          >
            {en ? plano.en : plano.pt}
          </span>
        )}
        {/* Só nos perfis masculinos e trans (lib/genero.ts). */}
        {etiqueta && (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {etiqueta}
          </span>
        )}
        {images.length > 0 && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
            <Camera className="h-3 w-3" />
            {images.length}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-semibold">{companion.name}</h3>
          {/* O selo é só para quem confirmou a identidade com documento. */}
          {companion.identityVerified && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-label={selo.verificado} />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {companion.age} {en ? 'years old' : 'anos'}
        </p>
        {cidade && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 text-rose-500" />
            {cidade}
          </p>
        )}
        <p className="mt-auto pt-1.5 text-sm font-bold">{precoCartao(companion.price, locale)}</p>
      </div>
    </LocaleLink>
  );
}

export function CompanionsListSkeleton() {
  return (
    <div className={GRELHA}>
      {[...Array(8)].map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-border bg-card">
          <Skeleton className="w-full aspect-[3/4]" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
