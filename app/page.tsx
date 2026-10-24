import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  BadgeCheck,
  Calculator,
  ChevronRight,
  Heart,
  MapPin,
  ScrollText,
  ShoppingBag,
  Star,
  UserCheck,
} from 'lucide-react';
import { getDoDiaCompanion } from '@/db/queries/companions';
import { getCatalogCompanions, getFeaturedCompanions } from '@/db/queries/catalog';
import { CompanionFilters } from '@/components/companionFilters';
import { ProfileCard } from '@/components/home/profile-card';
import { FeaturedRow } from '@/components/home/featured-row';
import { DistrictSearch } from '@/components/home/district-search';
import { CatalogPagination } from '@/components/home/catalog-pagination';
import { ScrollToCatalog } from '@/components/home/scroll-to-catalog';
import { HomeRest } from '@/components/home/home-rest';
import { framingStyle } from '@/lib/image-framing';
import { kv } from '@/db/index';
import { HomeEn } from '@/components/en/home-en';
import { getLocale } from '@/lib/locale.server';
import { OG_LOCALE, pageAlternates } from '@/lib/i18n';
import type { FilterTypesCompanions } from '@/types/types';

// ── Metadata ──────────────────────────────────────────────────────────────────
// Igual à versão anterior da home: só o corpo da página mudou, o que o
// buscador vê sobre o endereço "/" continua o mesmo.

const metadataPt: Metadata = {
  title: 'OneSugar | Acompanhantes em Portugal',
  description:
    'Encontre as acompanhantes premium em Portugal com privacidade garantida e perfis verificados na Onesugar.',
  keywords: [
    'Acompanhantes Portugal',
    'Acompanhantes premium',
    'Escorts Lisboa',
    'Acompanhante Lisboa',
    'Acompanhantes Porto',
    'Escorts Porto',
    'Serviços de Acompanhantes',
    'Encontros discretos',
    'Acompanhantes verificadas',
  ],
  authors: [{ name: 'OneSugar' }],
  creator: 'OneSugar',
  publisher: 'OneSugar',
  metadataBase: new URL('https://www.onesugar.pt'),
  alternates: pageAlternates('/', 'pt'),
  openGraph: {
    title: 'OneSugar | Acompanhantes premium em Portugal',
    description: 'Serviços de Acompanhantes premium e discretas em Lisboa, Porto e todo Portugal.',
    url: 'https://www.onesugar.pt',
    siteName: 'OneSugar',
    locale: 'pt_PT',
    type: 'website',
    images: [
      {
        url: 'https://www.onesugar.pt/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'OneSugar, acompanhantes premium em Portugal',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'adult services',
};

const descriptionEn =
  'Verified escorts in Lisbon, Porto, the Algarve and across Portugal. Profiles with the Verified badge have passed an identity check, and you contact companions directly, with full discretion.';

/** A versão inglesa (/en) usa o mesmo conteúdo base com texto, hreflang e OG próprios. */
const metadataEn: Metadata = {
  ...metadataPt,
  title: 'OneSugar | Verified Escorts in Portugal',
  description: descriptionEn,
  keywords: undefined,
  alternates: pageAlternates('/', 'en'),
  openGraph: {
    title: 'OneSugar | Verified Escorts in Portugal',
    description: descriptionEn,
    url: 'https://www.onesugar.pt/en',
    siteName: 'OneSugar',
    locale: OG_LOCALE.en,
    alternateLocale: [OG_LOCALE.pt],
    type: 'website',
    images: [
      {
        url: 'https://www.onesugar.pt/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'OneSugar, verified escorts in Portugal',
      },
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return (await getLocale()) === 'en' ? metadataEn : metadataPt;
}

// ── Banner ────────────────────────────────────────────────────────────────────

/**
 * Foto de fundo do banner, como no oje.pt. Enquanto não houver uma foto
 * horizontal própria em /public, o banner usa o fundo de cor da marca.
 */
const BANNER_IMAGE: string | null = null;

const CATALOG_PAGE_SIZE = 15;

/**
 * Cores do texto do banner. Sobre uma foto o texto é sempre branco; sem foto o
 * banner acompanha o tema, com texto escuro no claro.
 */
const T = BANNER_IMAGE
  ? {
      texto: 'text-white',
      destaque: 'text-rose-400',
      sub: 'text-white/65',
      botao: 'border-white/30 bg-white/5 text-white hover:border-white/60 hover:bg-white/10',
      rotulo: 'text-white/50',
      atalho: 'border-white/15 bg-white/[0.07] text-white/90 hover:bg-white/15 hover:text-white',
    }
  : {
      texto: 'text-neutral-900 dark:text-white',
      destaque: 'text-rose-600 dark:text-rose-400',
      sub: 'text-neutral-600 dark:text-white/65',
      botao:
        'border-neutral-300 bg-white/70 text-neutral-900 hover:border-rose-400 hover:bg-white dark:border-white/30 dark:bg-white/5 dark:text-white dark:hover:border-white/60 dark:hover:bg-white/10',
      rotulo: 'text-neutral-500 dark:text-white/50',
      atalho:
        'border-neutral-200 bg-white/70 text-neutral-800 hover:bg-white hover:text-rose-600 dark:border-white/15 dark:bg-white/[0.07] dark:text-white/90 dark:hover:bg-white/15 dark:hover:text-white',
    };

/** Atalhos do menu do hero — cobrem os dois públicos e as landings de topo de funil. */
const popularLinks = [
  { href: '/location', label: 'Ver acompanhantes', icon: Heart },
  { href: '/quanto-ganha-acompanhante', label: 'Calculadora de ganhos', icon: Calculator },
  { href: '/ajuda-anunciantes', label: 'Como ser acompanhante', icon: UserCheck },
  { href: '/contos', label: 'Contos', icon: ScrollText },
  { href: '/checkout', label: 'Planos de destaque', icon: ShoppingBag },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // Mantém a ligação ao Redis acordada: no plano gratuito do Upstash, sem
  // tráfego a base "adormece" e o primeiro pedido a seguir fica lento.
  kv.ping().catch(() => null);

  const [rawParams, doDia, locale] = await Promise.all([
    searchParams,
    getDoDiaCompanion(),
    getLocale(),
  ]);

  // A versão inglesa continua com o design próprio (components/en/home-en):
  // o redesenho em inglês fica para depois, à parte.
  if (locale === 'en') return <HomeEn doDia={doDia} />;

  const page = Math.max(1, parseInt(rawParams.page ?? '1', 10) || 1);

  // Como na página de distrito: abre em feminino, e "Todos" no filtro grava
  // `todos`, que não filtra nada.
  const filtros: FilterTypesCompanions = {
    ...(rawParams as FilterTypesCompanions),
    gender: (rawParams.gender as FilterTypesCompanions['gender']) ?? 'feminino',
  };

  const [destaques, catalogo] = await Promise.all([
    getFeaturedCompanions(12),
    getCatalogCompanions(page, CATALOG_PAGE_SIZE, filtros),
  ]);
  const totalPaginas = Math.ceil(catalogo.total / CATALOG_PAGE_SIZE);

  return (
    <main className="flex min-h-screen flex-col">
      <ScrollToCatalog />

      {/* ── BANNER ── */}
      <section className="relative isolate overflow-hidden">
        {BANNER_IMAGE ? (
          <>
            <Image src={BANNER_IMAGE} alt="" fill priority className="-z-20 object-cover object-center" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
          </>
        ) : (
          <>
            {/* Tema claro: tons rosa suaves. Tema escuro: o fundo de sempre. */}
            <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_80%_40%,_#fecdd3_0%,_#fff1f2_42%,_#ffffff_75%)] dark:bg-[radial-gradient(ellipse_at_80%_40%,_#9f1239_0%,_#4c0519_38%,_#000000_72%)]" />
            <div className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-black/70 via-transparent to-black/30 dark:block" />
          </>
        )}

        <div className="mx-auto grid w-full max-w-screen-xl items-center gap-10 px-4 py-12 md:px-8 lg:min-h-[78vh] lg:grid-cols-[1.25fr_1fr] lg:py-16">
          {/* Esquerda: título, provas, botões, pesquisa e links */}
          <div className={`space-y-6 ${T.texto}`}>
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              A plataforma de <span className={T.destaque}>acompanhantes</span> verificadas de Portugal
            </h1>

            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                { valor: '18', texto: 'distritos cobertos' },
                { valor: '100%', texto: 'perfis revistos pela equipa' },
                { valor: '0 €', texto: 'para anunciar' },
              ].map((p) => (
                <li key={p.texto}>
                  <span className="block text-2xl font-bold lg:text-3xl">{p.valor}</span>
                  <span className={`text-sm lg:text-base ${T.sub}`}>{p.texto}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/quanto-ganha-acompanhante"
                className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-950/40 transition-colors hover:bg-rose-500 sm:text-base"
              >
                Anunciar como acompanhante
              </Link>
              <Link
                href="/location"
                className={`inline-flex items-center justify-center rounded-xl border px-6 py-3.5 text-sm font-semibold backdrop-blur-sm transition-colors sm:text-base ${T.botao}`}
              >
                Procurar acompanhante por distrito
              </Link>
            </div>

            <DistrictSearch />

            <div>
              <p className={`mb-2 text-xs font-bold uppercase tracking-widest ${T.rotulo}`}>Links populares</p>
              <div className="flex flex-wrap gap-2">
                {popularLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm backdrop-blur-sm transition-colors ${T.atalho}`}
                  >
                    <Icon className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Direita: sugar do dia, num cartão como os do oje.pt */}
          <div className="flex justify-center lg:justify-end">
            <Link
              href={doDia ? `/companions/${doDia.id}` : '/location'}
              className={`group relative block ${doDia ? 'aspect-[3/4]' : 'aspect-square'} w-full max-w-[19rem] overflow-hidden rounded-2xl shadow-[0_0_50px_-8px_rgba(244,63,94,0.55)] ring-1 ring-rose-500/40 lg:max-w-sm`}
            >
              <Image
                src={doDia?.imageUrl ?? '/banner-square.jpeg'}
                alt={doDia ? `${doDia.name}, sugar do dia` : 'OneSugar'}
                fill
                priority
                sizes="(max-width: 1024px) 80vw, 384px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                style={
                  doDia
                    ? framingStyle({
                        focalX: doDia.focalX ?? undefined,
                        focalY: doDia.focalY ?? undefined,
                        zoom: doDia.zoom ?? undefined,
                      })
                    : undefined
                }
              />
              {doDia && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pt-16 text-white">
                  <span className="mb-2 block h-0.5 w-8 bg-rose-500" />
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-rose-300">
                    <Star className="h-3 w-3 fill-rose-400 text-rose-400" />
                    Sugar do dia
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-xl font-bold">
                    {doDia.name}
                    {doDia.identityVerified && <BadgeCheck className="h-5 w-5 text-emerald-400" />}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-white/80">
                    {doDia.age} anos
                    <span className="text-white/30">·</span>
                    <MapPin className="h-3.5 w-3.5" />
                    {doDia.city}
                  </span>
                  {doDia.shortDescription && (
                    <p className="mt-1 line-clamp-2 text-sm italic text-white/70">“{doDia.shortDescription}”</p>
                  )}
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-rose-300 group-hover:text-rose-200">
                    Ver perfil <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              )}
            </Link>
          </div>
        </div>
      </section>

      {/* ── DESTAQUES ── */}
      {destaques.length > 0 && (
        <section className="mx-auto w-full max-w-screen-xl px-4 pt-10 md:px-8">
          <div className="mb-4 flex items-center justify-between gap-4 sm:pr-24">
            <h2 className="text-xl font-bold sm:text-2xl">Sugars em destaque</h2>
            <Link href="/companions" className="text-sm font-semibold text-rose-500 hover:underline">
              Ver todos
            </Link>
          </div>
          <FeaturedRow>
            {destaques.map((s, i) => (
              <div key={s.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[19%]">
                <ProfileCard sugar={s} priority={i < 5} />
              </div>
            ))}
          </FeaturedRow>
        </section>
      )}

      {/* ── CATÁLOGO ── */}
      <section id="catalogo" className="mx-auto w-full max-w-screen-xl scroll-mt-20 px-4 pb-16 pt-10 md:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold sm:text-2xl">
            {catalogo.total.toLocaleString('pt-PT')} {catalogo.total === 1 ? 'acompanhante' : 'acompanhantes'}
          </h2>
          <DistrictSearch variant="inline" />
          <Link
            href="/companions"
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-600/30 transition-colors hover:bg-rose-500"
          >
            Ver tudo
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Os mesmos filtros da página de distrito. */}
        <CompanionFilters initialFilters={filtros} />

        {catalogo.companions.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {catalogo.companions.map((s) => (
              <ProfileCard key={s.id} sugar={s} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-muted-foreground">
            Nenhuma acompanhante corresponde a estes filtros.
          </p>
        )}

        <CatalogPagination page={page} totalPages={totalPaginas} params={rawParams} />
      </section>

      {/* ── RESTO: vídeo, recursos, como funciona, distritos, FAQ, CTAs ── */}
      <HomeRest />
    </main>
  );
}
