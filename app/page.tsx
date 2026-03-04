import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Shield, MapPin, Clock, Star, Heart, ChevronRight, AudioLines, FileCheck, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureItem } from '@/components/v0/feature-tem';
import { ProcessStep } from '@/components/v0/process-step';
import { SectionHeading } from '@/components/v0/section-heading';
import { CitySelectionModal } from '@/components/city-selection-modal';
import { Suspense } from 'react';

import { PlanType } from '@/db/queries/kv';
import { kv } from '@/db/index';
import { HeroCarouselWrapper } from '@/components/hero-carousel-wrapper';

export const metadata: Metadata = {
  title: 'Onesugar | Acompanhantes em Portugal',
  description:
    'A sua escolha segura para acompanhantes premium em Portugal. Privacidade garantida e perfis verificados com rigor. Encontre a discrição que merece na Onesugar.',
  applicationName: 'Onesugar',
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
  metadataBase: new URL('https://onesugar.pt'),
  alternates: {
    canonical: 'https://onesugar.pt',
  },
  openGraph: {
    title: 'Onesugar - Sugars Premium em Portugal',
    description: 'Serviços de Acompanhantes premium e discretas em Lisboa, Porto e todo Portugal.',
    url: 'https://onesugar.pt',
    siteName: 'Onesugar',
    locale: 'pt_PT',
    type: 'website',
    images: [
      {
        url: 'https://onesugar.pt/images/og-image.jpg',
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
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'adult services',
};

export default async function HomePage() {
  // Keep Upstash alive — fire-and-forget, never blocks render
  kv.ping().catch(() => null);

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
            <div className="relative z-10 w-full max-w-screen-xl mx-auto px-8 lg:px-16 py-12 grid grid-cols-2 gap-12 items-center">

              {/* LEFT: text */}
              <div className="space-y-6">
                <h1
                  id="hero-heading"
                  className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tighter text-white"
                >
                  Onesugar — Acompanhantes em Portugal
                </h1>
                <h2 className="text-base md:text-lg text-white/70 max-w-md">
                  Descubra as acompanhantes mais sofisticadas de Portugal com total discrição e segurança.
                </h2>
                <Suspense
                  fallback={
                    <Button disabled variant="outline" className="gap-2">
                      <MapPin className="h-4 w-4" />
                      Carregando distritos...
                    </Button>
                  }
                >
                  <CitySelectionModal
                    triggerButton={
                      <Button variant="default" className="gap-2 py-5 px-6">
                        <MapPin className="h-4 w-4" />
                        Encontrar por distrito
                      </Button>
                    }
                  />
                </Suspense>
              </div>

              {/* RIGHT: badge as squircle with glow */}
              <div className="flex items-center justify-center">
                {/* Outer glow ring */}
                <div className="relative">
                  {/* Blurred rose glow behind the card */}
                  <div className="absolute -inset-4 rounded-[2.5rem] bg-rose-600/30 blur-2xl" />
                  {/* Softer wider ambient glow */}
                  <div className="absolute -inset-8 rounded-[3rem] bg-rose-900/20 blur-3xl" />
                  {/* The badge card itself */}
                  <div className="relative rounded-[1rem] overflow-hidden ring-1 ring-rose-500/40 shadow-[0_0_40px_-4px_rgba(244,63,94,0.5)]">
                    {/* Subtle inner top-edge highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/60 to-transparent" />
                    <Image
                      src="/banner-square.jpeg"
                      alt="Curadoria Cris Galera — Embaixadora de Qualidade"
                      width={1200}
                      height={700}
                      className="w-full max-w-sm lg:max-w-2xl object-cover"
                      priority
                    />
                    {/* Subtle inner bottom-edge shadow */}
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
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

              {/* Badge squircle */}
              <div className="relative z-10 w-full max-w-xs">
                {/* Blurred rose glow */}
                <div className="absolute -inset-4 rounded-[2.5rem] bg-rose-600/30 blur-2xl" />
                {/* Wide ambient glow */}
                <div className="absolute -inset-8 rounded-[3rem] bg-rose-900/20 blur-3xl" />
                {/* Card */}
                <div className="relative rounded-[2rem] overflow-hidden ring-1 ring-rose-500/40 shadow-[0_0_40px_-4px_rgba(244,63,94,0.5)]">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/60 to-transparent" />
                  <Image
                    src="/onesugar-mobile.jpeg"
                    alt="Bem vindo a Onesugar"
                    width={830}
                    height={1472}
                    className="w-full h-auto object-cover"
                    priority
                  />
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              </div>

              {/* Text + CTA */}
              <div className="relative z-10 w-full space-y-4 text-center">
                <h1
                  id="hero-heading-mobile"
                  className="text-2xl sm:text-3xl font-bold tracking-tighter text-white"
                >
                  Onesugar — Acompanhantes em Portugal
                </h1>
                <h2 className="text-sm sm:text-base text-white/70">
                  Descubra as acompanhantes mais sofisticadas de Portugal com total discrição e segurança.
                </h2>
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

        <HeroCarouselWrapper
          plans={[PlanType.VIP, PlanType.PLUS, PlanType.CLASSIC]}
        />
        <div className="flex justify-center w-full px-4">
          <div className="w-full max-w-4xl aspect-video">
            <iframe
              className="w-full h-full rounded-lg border shadow-sm"
              src="https://www.youtube.com/embed/t9drDCVVev0?si=6_99F1gh6o5ur1D5&autoplay=1&mute=1&loop=1&playlist=t9drDCVVev0"
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
        {/* Features Section - Improved grid for mobile */}
        <section className="w-full py-10 sm:py-12 md:py-20 lg:py-28" aria-labelledby="features-heading">
          <div className="container px-4 mx-auto mt-4 md:mt-12 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center">
              <SectionHeading
                title="Recursos exclusivos da Onesugar para acompanhantes em Portugal"
                description="Oferecemos ferramentas inovadoras para garantir sua satisfação e confiança."
              />
            </div>

            <div className="mx-auto grid max-w-5xl items-center gap-6 py-8 sm:py-10 md:py-12 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
              <FeatureItem
                icon={AudioLines}
                title="Áudios de verificação"
                description="Confirme a autenticidade através de mensagens de voz exclusivas das Sugars."
              />
              <FeatureItem
                icon={FileCheck}
                title="Verificação completa"
                description="Documentos verificados para garantir sua segurança e tranquilidade."
              />
              <FeatureItem
                icon={Video}
                title="Vídeos exclusivos"
                description="Assista a vídeos de verificação para ter certeza da autenticidade dos perfis."
              />
              <FeatureItem
                icon={Star}
                title="Avaliações reais"
                description="Acesse opiniões genuínas de outros clientes sobre cada Sugar."
              />
            </div>
          </div>
        </section>

        {/* How it works Section - Improved grid for mobile */}
        <section className="w-full py-10 sm:py-12 md:py-20 lg:py-28" aria-labelledby="how-it-works-heading">
          <div className="container px-4 mx-auto md:px-6">
            <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center">
              <SectionHeading
                title="Como funciona a Onesugar"
                description="Encontre sua acompanhante ideal em apenas três passos simples."
              />
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-8 py-8 sm:py-10 md:py-12 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:gap-12">
              <ProcessStep
                icon={MapPin}
                title="Escolha seu distrito"
                description="Selecione sua localização e descubra as melhores Sugars disponíveis na sua região."
              />
              <ProcessStep
                icon={Search}
                title="Conheça seu perfil de acompanhante na Onesugar"
                description="Explore fotos autênticas, e todas as informações essenciais. Com segurança e discrição."
              />
              <ProcessStep
                icon={Heart}
                title="Entre em contato com acompanhantes em Portugal"
                description="Conecte-se diretamente com a Sugar escolhida de forma totalmente privada e segura."
              />
            </div>
          </div>
        </section>

        {/* Why choose us Section - Improved layout for mobile */}
        <section className="w-full py-10 sm:py-12 md:py-20 lg:py-28" aria-labelledby="why-choose-heading">
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

        {/* Cities Section - Improved spacing for mobile */}
        <section className="w-full py-10 sm:py-12 md:py-20 lg:py-28" aria-labelledby="cities-heading">
          <div className="container px-4 mx-auto md:px-6">
            <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center">
              <SectionHeading
                title="Principais distritos"
                description="Explore sugars premium nos distritos mais procuradas de Portugal."
              />
            </div>
            <div className="flex justify-center mt-6 sm:mt-8">
              <Suspense
                fallback={
                  <Button disabled variant="outline" className="gap-2 w-full sm:w-auto">
                    <MapPin className="h-4 w-4" />
                    Carregando distritos...
                  </Button>
                }
              >
                <CitySelectionModal
                  triggerButton={
                    <Button variant="outline" className="gap-2 w-full sm:w-auto">
                      <MapPin className="h-4 w-4" />
                      Ver todas os distritos disponíveis
                    </Button>
                  }
                />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Join Section - Improved layout for mobile */}
        <section
          className="w-full py-10 sm:py-12 md:py-20 lg:py-28 bg-primary text-primary-foreground"
          aria-labelledby="join-onesugar-heading"
        >
          <div className="container px-4 mx-auto md:px-2">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2 sm:space-y-3">
                  <h2
                    id="join-community-heading"
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter"
                  >
                    Seja uma sugar na Onesugar
                  </h2>
                  <p className="max-w-[600px] text-base sm:text-lg md:text-xl">
                    Aumente sua visibilidade, conquiste clientes e se promova de forma segura.
                  </p>
                </div>
                <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-3 mt-2 sm:mt-4">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  >
                    <Link href="/onboarding" className="w-full">
                      Cadastrar como sugar
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="/acompanhantes-onesugar.jpg"
                width={800}
                height={800}
                alt="Acompanhante sofisticada sorrindo para a câmera"
                className="mx-auto overflow-hidden rounded-xl object-cover mt-6 lg:mt-0 w-full h-full"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
              />
            </div>
          </div>
        </section>

        {/* CTA Section - Improved button layout for mobile */}
        <section className="w-full py-10 sm:py-12 md:py-20 lg:py-28" aria-labelledby="cta-heading">
          <div className="container grid items-center justify-center gap-4 mx-auto text-center px-4 md:px-6">
            <div className="space-y-2 sm:space-y-3">
              <h3 id="cta-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter">
                Pronto para uma experiência inesquecível em Portugal?
              </h3>
              <p className="mx-auto max-w-[600px] text-muted-foreground text-base sm:text-lg md:text-xl">
                Descubra as sugars mais requintadas de Portugal e viva momentos únicos com total discrição.
              </p>
            </div>
            <div className="mx-auto flex flex-col sm:flex-row w-full sm:w-auto gap-3 mt-2 sm:mt-4">
              <Button size="lg" className="gap-1 w-full sm:w-auto">
                Explorar agora
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Suspense
                fallback={
                  <Button disabled size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                    <MapPin className="h-4 w-4" />
                    Carregando...
                  </Button>
                }
              >
                <CitySelectionModal
                  triggerButton={
                    <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                      <MapPin className="h-4 w-4" />
                      Buscar por distrito
                    </Button>
                  }
                />
              </Suspense>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
