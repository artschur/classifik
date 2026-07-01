import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import {
  Shield,
  MapPin,
  Clock,
  Star,
  Mic,
  ShieldCheck,
  Video,
  UserCheck,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureItem } from '@/components/v0/feature-tem';
import { SectionHeading } from '@/components/v0/section-heading';
import { CitySelectionModal } from '@/components/city-selection-modal';
import { HeroCarouselWrapper } from '@/components/hero-carousel-wrapper';
import { LiteYouTube } from '@/components/lite-youtube';
import { getDoDiaCompanion } from '@/db/queries/companions';
import { PlanType } from '@/db/queries/kv';
import { kv } from '@/db/index';

// ── Schema JSON-LD ────────────────────────────────────────────────────────────

function HomeSchemas() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Onesugar',
    url: 'https://www.onesugar.pt',
    description:
      'A plataforma de referência para acompanhantes verificadas em Portugal. Perfis reais nos 18 distritos do país.',
    inLanguage: 'pt-PT',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.onesugar.pt/location/{search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'O que é a Onesugar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A Onesugar é a plataforma portuguesa de referência para quem procura acompanhantes verificadas em Portugal. Opera nos 18 distritos do país e distingue-se pelo rigoroso processo de verificação de identidade e disponibilidade antes de publicar qualquer perfil.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como funciona a verificação de perfis na Onesugar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cada acompanhante passa por verificação de identidade, fotografia actual e disponibilidade confirmada antes de o perfil ser publicado. A plataforma utiliza verificação por áudio, vídeo e documentos para garantir autenticidade. Perfis que não passam na verificação não são publicados.',
        },
      },
      {
        '@type': 'Question',
        name: 'A Onesugar tem acompanhantes verificadas em todo o Portugal?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. A Onesugar tem perfis activos nos 18 distritos de Portugal: Lisboa, Porto, Braga, Coimbra, Aveiro, Faro, Setúbal, Leiria, Santarém, Viana do Castelo, Vila Real, Viseu, Guarda, Castelo Branco, Évora, Beja, Portalegre e Bragança.',
        },
      },
      {
        '@type': 'Question',
        name: 'É seguro contactar acompanhantes pela Onesugar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. A Onesugar não guarda histórico de contactos entre utilizadores e acompanhantes, nem partilha dados pessoais com terceiros. A verificação prévia de todos os perfis elimina os principais riscos associados a portais sem moderação.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como posso anunciar como acompanhante na Onesugar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Pode criar o seu perfil em onesugar.pt/companions/register. O processo inclui verificação de identidade e disponibilidade. Após aprovação, o perfil fica visível na página do distrito correspondente e nos resultados de pesquisa.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

// ── District data ─────────────────────────────────────────────────────────────

const districts = {
  norte: [
    { slug: 'porto',            label: 'Acompanhantes no Porto' },
    { slug: 'braga',            label: 'Acompanhantes em Braga' },
    { slug: 'viana-do-castelo', label: 'Acompanhantes em Viana do Castelo' },
    { slug: 'braganca',         label: 'Acompanhantes em Bragança' },
    { slug: 'vila-real',        label: 'Acompanhantes em Vila Real' },
  ],
  centro: [
    { slug: 'coimbra',        label: 'Acompanhantes em Coimbra' },
    { slug: 'aveiro',         label: 'Acompanhantes em Aveiro' },
    { slug: 'leiria',         label: 'Acompanhantes em Leiria' },
    { slug: 'viseu',          label: 'Acompanhantes em Viseu' },
    { slug: 'guarda',         label: 'Acompanhantes na Guarda' },
    { slug: 'castelo-branco', label: 'Acompanhantes em Castelo Branco' },
  ],
  sul: [
    { slug: 'lisboa',     label: 'Acompanhantes em Lisboa' },
    { slug: 'setubal',    label: 'Acompanhantes em Setúbal' },
    { slug: 'santarem',   label: 'Acompanhantes em Santarém' },
    { slug: 'evora',      label: 'Acompanhantes em Évora' },
    { slug: 'beja',       label: 'Acompanhantes em Beja' },
    { slug: 'faro',       label: 'Acompanhantes no Algarve' },
    { slug: 'portalegre', label: 'Acompanhantes em Portalegre' },
  ],
  ilhas: [
    { slug: 'madeira', label: 'Acompanhantes na Madeira' },
  ],
};

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Onesugar | Acompanhantes em Portugal',
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
  authors: [{ name: 'Onesugar' }],
  creator: 'Onesugar',
  publisher: 'Onesugar',
  metadataBase: new URL('https://www.onesugar.pt'),
  alternates: {
    canonical: 'https://www.onesugar.pt',
  },
  openGraph: {
    title: 'Onesugar - Sugars Premium em Portugal',
    description: 'Serviços de Acompanhantes premium e discretas em Lisboa, Porto e todo Portugal.',
    url: 'https://www.onesugar.pt',
    siteName: 'Onesugar',
    locale: 'pt_PT',
    type: 'website',
    images: [
      {
        url: 'https://www.onesugar.pt/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Onesugar - Acompanhantes Premium',
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  kv.ping().catch(() => null);

  const doDia = await getDoDiaCompanion();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">

        {/* ── HERO ── */}
        {/* Desktop: full-bleed background image (anchored right), text overlay on the left */}
        {/* Mobile: image on top, text block below */}
        <section aria-labelledby="hero-heading">

          {/* ── DESKTOP (md+): gradient background, two-column layout ── */}
          <div className="relative hidden md:flex items-center w-full min-h-[52vh] lg:min-h-[80vh] overflow-hidden">
            {/* Background: black on the left bleeding into rose/red on the right */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,_#9f1239_0%,_#4c0519_35%,_#000000_70%)]" />
            {/* Extra vignette to deepen the edges */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/40" />
            {/* Subtle noise/grain texture feel via a soft radial bloom */}
            <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_70%_40%,_#f43f5e22_0%,_transparent_70%)]" />

            {/* Two-column content */}
            <div className="relative z-10 w-full max-w-screen-xl mx-auto py-12 grid grid-cols-2 gap-12 items-center">

              {/* LEFT: text */}
              <div className="space-y-6">
                <h1
                  id="hero-heading"
                  className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tighter text-white"
                >
                  Sugar do dia
                </h1>
                {doDia ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white">{doDia.name}</span>
                      {doDia.verified && <ShieldCheck className="h-8 w-8 text-rose-400 shrink-0" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/80 text-xl lg:text-2xl font-medium">
                      <span>{doDia.age} anos</span>
                      <span className="text-white/30">·</span>
                      <span className="flex items-center gap-2"><MapPin className="h-5 w-5" />{doDia.city}</span>
                      <span className="text-white/30">·</span>
                      <span className="text-rose-300 font-semibold">€{doDia.price}/hora</span>
                    </div>
                    {doDia.shortDescription && (
                      <p className="text-white/60 text-lg lg:text-xl max-w-sm leading-relaxed">{doDia.shortDescription}</p>
                    )}
                    <Link href={`/companions/${doDia.id}`} className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-base lg:text-lg font-semibold px-7 py-3.5 rounded-md transition-colors">
                      Ver perfil
                    </Link>
                  </div>
                ) : (
                  <h2 className="text-base md:text-lg text-white/70 max-w-md">
                    Descubra as acompanhantes mais sofisticadas de Portugal com total discrição e segurança.
                  </h2>
                )}
                <Suspense
                  fallback={
                    <Button disabled variant="outline" className="gap-2 text-base py-6 px-7">
                      <MapPin className="h-5 w-5" />
                      Carregando distritos...
                    </Button>
                  }
                >
                  <CitySelectionModal
                    triggerButton={
                      <Button variant="default" className="gap-2 py-6 px-7 text-base">
                        <MapPin className="h-5 w-5" />
                        Encontrar por distrito
                      </Button>
                    }
                  />
                </Suspense>
              </div>

              {/* RIGHT: companion photo as square card with glow */}
              <div className="flex items-center justify-center w-full">
                <div className="relative w-full max-w-sm lg:max-w-xl xl:max-w-2xl">
                  <div className="absolute -inset-4 rounded-[2.5rem] bg-rose-600/30 blur-2xl" />
                  <div className="absolute -inset-8 rounded-[3rem] bg-rose-900/20 blur-3xl" />
                  <Link
                    href={doDia ? `/companions/${doDia.id}` : '#'}
                    className="block relative rounded-[1rem] overflow-hidden ring-1 ring-rose-500/40 shadow-[0_0_40px_-4px_rgba(244,63,94,0.5)] aspect-square w-full group"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/60 to-transparent z-10" />
                    <Image
                      src={doDia?.imageUrl ?? '/banner-square.jpeg'}
                      alt={doDia ? `${doDia.name} — Sugar do dia` : 'Curadoria Cris Galera — Embaixadora de Qualidade'}
                      fill
                      className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent z-10" />
                  </Link>
                </div>
              </div>

            </div>
          </div>

          {/* ── MOBILE (< md): gradient background, badge on top, text below ── */}
          <div className="flex flex-col md:hidden overflow-hidden">
            {/* Gradient background — same palette as desktop */}
            <div className="relative bg-[radial-gradient(ellipse_at_60%_30%,_#9f1239_0%,_#4c0519_40%,_#000000_75%)] px-6 pt-10 pb-8 flex flex-col items-center gap-6">
              {/* Ambient bloom */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/50 pointer-events-none" />
              <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-[radial-gradient(ellipse_at_70%_30%,_#f43f5e22_0%,_transparent_70%)] pointer-events-none" />

              {/* Companion photo — square, clickable */}
              <div className="relative z-10 w-full max-w-xs">
                <div className="absolute -inset-4 rounded-[2.5rem] bg-rose-600/30 blur-2xl" />
                <div className="absolute -inset-8 rounded-[3rem] bg-rose-900/20 blur-3xl" />
                <Link
                  href={doDia ? `/companions/${doDia.id}` : '#'}
                  className="block relative rounded-[2rem] overflow-hidden ring-1 ring-rose-500/40 shadow-[0_0_40px_-4px_rgba(244,63,94,0.5)] aspect-square group"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/60 to-transparent z-10" />
                  <Image
                    src={doDia?.imageUrl ?? '/onesugar-mobile.jpeg'}
                    alt={doDia ? `${doDia.name} — Sugar do dia` : 'Bem vindo a Onesugar'}
                    fill
                    className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent z-10" />
                </Link>
              </div>

              {/* Text + CTA */}
              <div className="relative z-10 w-full space-y-4 text-center">
                <h1
                  id="hero-heading-mobile"
                  className="text-2xl sm:text-3xl font-bold tracking-tighter text-white"
                >
                  Sugar do dia
                </h1>
                {doDia ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl font-bold text-white">{doDia.name}</span>
                      {doDia.verified && <ShieldCheck className="h-5 w-5 text-rose-400 shrink-0" />}
                    </div>
                    <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 text-white/80 text-sm font-medium">
                      <span>{doDia.age} anos</span>
                      <span className="text-white/30">·</span>
                      <span>{doDia.city}</span>
                      <span className="text-white/30">·</span>
                      <span className="text-rose-300 font-semibold">€{doDia.price}/hora</span>
                    </div>
                    {doDia.shortDescription && (
                      <p className="text-white/60 text-sm">{doDia.shortDescription}</p>
                    )}
                    <Link href={`/companions/${doDia.id}`} className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors mx-auto">
                      Ver perfil
                    </Link>
                  </div>
                ) : (
                  <h2 className="text-sm sm:text-base text-white/70">
                    Descubra as acompanhantes mais sofisticadas de Portugal com total discrição e segurança.
                  </h2>
                )}
                <Suspense
                  fallback={
                    <Button disabled variant="outline" className="gap-2 w-full">
                      <MapPin className="h-4 w-4" />
                      Carregando distritos...
                    </Button>
                  }
                >
                  <CitySelectionModal
                    triggerButton={
                      <Button variant="default" className="gap-2 w-full py-5">
                        <MapPin className="h-4 w-4" />
                        Encontrar por distrito
                      </Button>
                    }
                  />
                </Suspense>
              </div>
            </div>
          </div>

        </section>

        {/* ── CAROUSEL ── */}
        <HeroCarouselWrapper
          plans={[PlanType.VIP, PlanType.PLUS, PlanType.CLASSIC]}
        />

        {/* ── VIDEO ── */}
        <div className="flex justify-center w-full px-4 py-8">
          <div className="w-full max-w-4xl">
            <LiteYouTube videoId="t9drDCVVev0" title="Onesugar — Acompanhantes verificadas em Portugal" />
          </div>
        </div>

        {/* ── EDITORIAL INTRO ── */}
        <section className="py-10 px-6">
          <div className="container mx-auto max-w-3xl text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A Onesugar é a plataforma de referência para quem procura
              acompanhantes verificadas em Portugal. Com presença activa nos 18
              distritos do país, da Linha de Cascais ao Algarve, de Bragança ao
              Alentejo, a plataforma centraliza a oferta com um nível de
              verificação que a maioria dos portais não oferece: identidade
              confirmada, fotografia actual e disponibilidade real antes de
              qualquer publicação.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Se está à procura de uma{' '}
              <Link href="/location/lisboa" className="text-rose-500 hover:underline">
                acompanhante em Lisboa
              </Link>
              , de{' '}
              <Link href="/location/porto" className="text-rose-500 hover:underline">
                escorts no Porto
              </Link>{' '}
              ou de companhia verificada em qualquer outro ponto do país, a
              Onesugar tem perfis activos nas principais cidades e capitais de
              distrito de Portugal. Navegue por distrito, filtre por preferência
              e entre em contacto directamente, sem intermediários.
            </p>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-12 px-6 bg-card/50">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">
              Recursos exclusivos da Onesugar para acompanhantes em Portugal
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-10">
              Oferecemos ferramentas inovadoras para garantir a sua satisfação e
              confiança.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Mic className="w-6 h-6 text-rose-500" />,
                  title: 'Audios de verificacao',
                  desc: 'Confirme a autenticidade através de mensagens de voz exclusivas das Sugars.',
                },
                {
                  icon: <ShieldCheck className="w-6 h-6 text-rose-500" />,
                  title: 'Verificacao completa',
                  desc: 'Documentos verificados para garantir a sua segurança e tranquilidade.',
                },
                {
                  icon: <Video className="w-6 h-6 text-rose-500" />,
                  title: 'Videos exclusivos',
                  desc: 'Visualize videos de verificacao para confirmar a autenticidade dos perfis.',
                },
                {
                  icon: <Star className="w-6 h-6 text-rose-500" />,
                  title: 'Avaliacoes reais',
                  desc: 'Consulte opinioes genuinas de outros clientes sobre cada Sugar.',
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3"
                >
                  {f.icon}
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-12 px-6">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">
              Como funciona a Onesugar
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-10">
              Encontre a sua acompanhante ideal em apenas tres passos simples.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <MapPin className="w-7 h-7 text-rose-500" />,
                  step: '1',
                  title: 'Escolha o seu distrito',
                  desc: 'Selecione a sua localização e descubra as Sugars verificadas disponíveis na sua região. A Onesugar cobre os 18 distritos de Portugal, desde Lisboa e Porto até Bragança e ao Algarve.',
                },
                {
                  icon: <UserCheck className="w-7 h-7 text-rose-500" />,
                  step: '2',
                  title: 'Conheça o perfil da acompanhante',
                  desc: 'Explore fotografias autênticas, avaliações reais de outros clientes e todas as informações essenciais. Cada perfil foi verificado pela Onesugar antes de ser publicado. Com segurança e discrição.',
                },
                {
                  icon: <MessageCircle className="w-7 h-7 text-rose-500" />,
                  step: '3',
                  title: 'Entre em contacto directamente',
                  desc: 'Contacte a Sugar escolhida de forma totalmente privada e segura. Sem intermediários. A Onesugar não guarda histórico de contactos nem partilha dados pessoais com terceiros.',
                },
              ].map((s, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-rose-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                      {s.step}
                    </span>
                    {s.icon}
                  </div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REGISTER CTA ── */}
        <section className="py-8 px-6 text-center">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold mb-3">
              Seja uma Sugar na Onesugar
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Aumente a sua visibilidade, conquiste clientes e promova-se de
              forma segura. A plataforma com maior crescimento de acompanhantes
              verificadas em Portugal.
            </p>
            <Link
              href="/companions/register"
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3 rounded-full transition-colors"
            >
              Registar como Sugar
            </Link>
          </div>
        </section>

        {/* ── WHY CHOOSE ── */}
        <section className="w-full py-4" aria-labelledby="why-choose-heading">
          <div className="container px-4 mx-auto md:px-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <SectionHeading
                  title="Por que escolher a Onesugar?"
                  description="A plataforma número um para encontros premium em Portugal com total segurança e discrição."
                  centered={false}
                />
                <div className="space-y-4">
                  <FeatureItem
                    icon={Shield}
                    title="Verificação exclusiva da Onesugar"
                    description="Todas as Sugars passam por um rigoroso processo de verificação para garantir autenticidade e qualidade."
                  />
                  <FeatureItem
                    icon={MapPin}
                    title="Presença nacional em Portugal"
                    description="Encontre sugars de alto padrão em Lisboa, Porto e nos principais distrito de Portugal."
                  />
                  <FeatureItem
                    icon={Clock}
                    title="Disponibilidade flexível para acompanhantes"
                    description="Agende encontros que se adaptam à sua rotina, com opções para todos os momentos."
                  />
                  <FeatureItem
                    icon={Star}
                    title="Avaliações genuínas"
                    description="Acesse avaliações reais de outros clientes sobre cada Sugar."
                  />
                </div>
              </div>
              <Image
                src="/selecione-onesugar.png"
                width={800}
                height={800}
                alt="Sugar sofisticada sorrindo para a câmera"
                className="mx-auto aspect-square overflow-hidden rounded-xl object-cover mt-6 lg:mt-0 w-full max-w-[400px] lg:max-w-none"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
              />
            </div>
          </div>
        </section>

        {/* ── DISTRICT GRID ── */}
        <section className="py-12 px-6">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">
              Acompanhantes Verificadas nos 18 Distritos de Portugal
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
              A Onesugar tem perfis activos em todos os distritos de Portugal
              continental. Selecione a sua região e encontre acompanhantes
              verificadas perto de si.
            </p>

            <div className="mb-10">
              <h3 className="text-base font-semibold mb-2 text-rose-500">
                Norte de Portugal
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                O norte concentra os dois maiores mercados da plataforma. Porto e
                Braga lideram em volume de perfis activos, com uma oferta
                diversificada que inclui acompanhantes de luxo, escorts
                verificadas e companhia para eventos sociais. Viana do Castelo,
                Bragança e Vila Real completam a cobertura nortenha.
              </p>
              <div className="flex flex-wrap gap-3">
                {districts.norte.map((d) => (
                  <Link
                    key={d.slug}
                    href={`/location/${d.slug}`}
                    className="bg-card border border-border hover:border-rose-500 hover:text-rose-500 text-sm px-4 py-2 rounded-full transition-colors"
                  >
                    {d.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mb-10">
              <h3 className="text-base font-semibold mb-2 text-rose-500">
                Centro de Portugal
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Coimbra e Aveiro destacam-se no centro, com Leiria a crescer
                rapidamente pela sua posição entre Lisboa e o norte. A região
                Centro cobre também Viseu, Guarda e Castelo Branco, com perfis
                verificados e disponibilidade actualizada em cada distrito.
              </p>
              <div className="flex flex-wrap gap-3">
                {districts.centro.map((d) => (
                  <Link
                    key={d.slug}
                    href={`/location/${d.slug}`}
                    className="bg-card border border-border hover:border-rose-500 hover:text-rose-500 text-sm px-4 py-2 rounded-full transition-colors"
                  >
                    {d.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mb-10">
              <h3 className="text-base font-semibold mb-2 text-rose-500">
                Lisboa, Alentejo e Algarve
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Lisboa tem o maior volume de perfis activos da plataforma,
                seguida de Setúbal que cobre toda a Margem Sul e a Península de
                Setúbal. O Algarve, com destaque para Faro, concentra uma
                procura significativa de visitantes internacionais ao longo de
                todo o ano. Évora, Beja, Portalegre e Santarém completam a
                cobertura a sul.
              </p>
              <div className="flex flex-wrap gap-3">
                {districts.sul.map((d) => (
                  <Link
                    key={d.slug}
                    href={`/location/${d.slug}`}
                    className="bg-card border border-border hover:border-rose-500 hover:text-rose-500 text-sm px-4 py-2 rounded-full transition-colors"
                  >
                    {d.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-base font-semibold mb-2 text-rose-500">
                Ilhas
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                A Madeira é um destino internacional com procura crescente por
                acompanhantes verificadas. A Onesugar tem perfis activos na ilha
                com disponibilidade actualizada.
              </p>
              <div className="flex flex-wrap gap-3">
                {districts.ilhas.map((d) => (
                  <Link
                    key={d.slug}
                    href={`/location/${d.slug}`}
                    className="bg-card border border-border hover:border-rose-500 hover:text-rose-500 text-sm px-4 py-2 rounded-full transition-colors"
                  >
                    {d.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="text-center mt-8">
              <Link
                href="/location"
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3 rounded-full transition-colors text-sm"
              >
                Ver todos os distritos disponíveis
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-12 px-6 bg-card/50">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-center mb-10">
              Perguntas frequentes sobre a Onesugar
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: 'O que é a Onesugar?',
                  a: 'A Onesugar é a plataforma portuguesa de referência para quem procura acompanhantes verificadas em Portugal. Opera nos 18 distritos do país e distingue-se pelo rigoroso processo de verificação de identidade e disponibilidade antes de publicar qualquer perfil.',
                },
                {
                  q: 'Como funciona a verificação de perfis na Onesugar?',
                  a: 'Cada acompanhante passa por verificação de identidade, fotografia actual e disponibilidade confirmada antes de o perfil ser publicado. A plataforma utiliza verificação por audio, video e documentos para garantir autenticidade. Perfis que nao passam na verificação nao sao publicados.',
                },
                {
                  q: 'A Onesugar tem acompanhantes verificadas em todo o Portugal?',
                  a: 'Sim. A Onesugar tem perfis activos nos 18 distritos de Portugal: Lisboa, Porto, Braga, Coimbra, Aveiro, Faro, Setúbal, Leiria, Santarém, Viana do Castelo, Vila Real, Viseu, Guarda, Castelo Branco, Évora, Beja, Portalegre e Bragança.',
                },
                {
                  q: 'É seguro contactar acompanhantes pela Onesugar?',
                  a: 'Sim. A Onesugar nao guarda histórico de contactos entre utilizadores e acompanhantes, nem partilha dados pessoais com terceiros. A verificação prévia de todos os perfis elimina os principais riscos associados a portais sem moderação.',
                },
                {
                  q: 'Como posso anunciar como acompanhante na Onesugar?',
                  a: 'Pode criar o seu perfil em onesugar.pt/companions/register. O processo inclui verificação de identidade e disponibilidade. Apos aprovação, o perfil fica visível na página do distrito correspondente e nos resultados de pesquisa da plataforma.',
                },
              ].map((item, i) => (
                <div key={i} className="border-b border-border pb-5">
                  <h3 className="font-semibold text-sm mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER CTA ── */}
        <section className="py-12 px-6 bg-card/50 text-center">
          <div className="container mx-auto max-w-2xl">
            <h3 className="text-xl font-bold mb-3">
              Pronto para uma experiência inesquecível em Portugal?
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Descubra as acompanhantes mais requintadas de Portugal e viva
              momentos únicos com total discrição. Perfis verificados nos 18
              distritos do país.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/location"
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm"
              >
                Explorar agora
              </Link>
              <Link
                href="/location"
                className="border border-rose-600 text-rose-500 hover:bg-rose-600 hover:text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm"
              >
                Pesquisar por distrito
              </Link>
            </div>
          </div>
        </section>

        {/* ── SCHEMAS ── */}
        <HomeSchemas />

      </main>
    </div>
  );
}
