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
import { HeroCarouselWrapper } from '@/components/hero-carousel-wrapper';

export const metadata: Metadata = {
  title: 'Onesugar - O site de Acompanhantes premium em Portugal',
  description:
    'A sua escolha segura para sugars e acompanhantes premium em Portugal. Privacidade garantida e perfis verificados com rigor. Encontre a discreção que merece na Onesugar.',
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
  metadataBase: new URL('https://onesugar.app'),
  alternates: {
    canonical: '/',
    languages: {
      'pt-PT': '/pt',
      'en-US': '/en',
    },
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
        url: 'https://onesugar.app/images/og-image.jpg',
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
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section - Improved padding for mobile */}
        <section
          className="w-full py-12 sm:py-16 md:py-24 lg:py-32  min-h-[60vh] sm:min-h-[60vh] md:min-h-[78vh] flex items-center relative"
          aria-labelledby="hero-heading"
        >
          <div className="absolute inset-0">
            <Image src="/banner-onesugar.png" alt="Background Image" width={1920} height={1080} className="opacity-50" />
          </div>
          <div className="container px-4 mx-auto md:px-6 relative z-10">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <h1
                    id="hero-heading"
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tighter"
                  >
                    Sugars premium em Portugal.
                  </h1>
                  <p className="text-base sm:text-lg max-w-[600px] text-muted-foreground md:text-xl">
                    Descubra as Sugars mais sofisticadas de Portugal com total discrição e segurança.
                  </p>
                </div>
                <div className="w-full space-y-4 mt-2 sm:mt-4">
                  <Suspense
                    fallback={
                      <Button
                        disabled
                        variant="outline"
                        className="gap-2 w-full sm:w-auto py-4 sm:py-6 px-4 sm:px-6 text-sm sm:text-base"
                      >
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Carregando cidades...
                      </Button>
                    }
                  >
                    <CitySelectionModal
                      triggerButton={
                        <Button
                          variant="default"
                          className="gap-2 w-full sm:w-auto py-4 sm:py-6 px-4 sm:px-6 text-sm sm:text-base"
                        >
                          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          Encontrar por cidade
                        </Button>
                      }
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </section>

        <HeroCarouselWrapper
          plans={[PlanType.VIP, PlanType.PLUS, PlanType.BASICO]}
        />

        {/* Features Section - Improved grid for mobile */}
        <section className="w-full py-10 sm:py-12 md:py-20 lg:py-28" aria-labelledby="features-heading">
          <div className="container px-4 mx-auto mt-4 md:mt-12 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center">
              <SectionHeading
                title="Recursos exclusivos para sua segurança"
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
                title="Como funciona o OneSugar"
                description="Encontre sua Sugar ideal em apenas três passos simples."
              />
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-8 py-8 sm:py-10 md:py-12 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:gap-12">
              <ProcessStep
                icon={MapPin}
                title="Escolha sua cidade"
                description="Selecione sua localização e descubra as melhores Sugars disponíveis na sua região."
              />
              <ProcessStep
                icon={Search}
                title="Conheça seu perfil"
                description="Explore fotos autênticas, vídeos de verificação exclusivos e todas as informações essenciais."
              />
              <ProcessStep
                icon={Heart}
                title="Entre em contato"
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
                  title="Por que escolher o OneSugar?"
                  description="A plataforma número um para encontros premium em Portugal com total segurança e discrição."
                  centered={false}
                />
                <div className="space-y-4">
                  <FeatureItem
                    icon={Shield}
                    title="Verificação exclusiva"
                    description="Todas as Sugars passam por um rigoroso processo de verificação para garantir autenticidade e qualidade."
                  />
                  <FeatureItem
                    icon={MapPin}
                    title="Presença nacional"
                    description="Encontre sugars de alto padrão em Lisboa, Porto e nas principais cidades de Portugal."
                  />
                  <FeatureItem
                    icon={Clock}
                    title="Disponibilidade flexível"
                    description="Agende encontros que se adaptam à sua rotina, com opções para todos os momentos."
                  />
                  <FeatureItem
                    icon={Star}
                    title="Avaliações genuínas"
                    description="Acesse avaliações reais de outros clientes para escolher a experiência perfeita."
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
                title="Principais cidades"
                description="Explore sugars premium nas cidades mais procuradas de Portugal."
              />
            </div>
            <div className="flex justify-center mt-6 sm:mt-8">
              <Suspense
                fallback={
                  <Button disabled variant="outline" className="gap-2 w-full sm:w-auto">
                    <MapPin className="h-4 w-4" />
                    Carregando cidades...
                  </Button>
                }
              >
                <CitySelectionModal
                  triggerButton={
                    <Button variant="outline" className="gap-2 w-full sm:w-auto">
                      <MapPin className="h-4 w-4" />
                      Ver todas as cidades disponíveis
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
                    Seja uma sugar OneSugar
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
              <h2 id="cta-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter">
                Pronto para uma experiência inesquecível?
              </h2>
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
                      Buscar por cidade
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
