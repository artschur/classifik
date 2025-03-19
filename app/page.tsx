import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  MessageSquare,
  CheckCircle,
  Shield,
  MapPin,
  Clock,
  Star,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CityCard } from '@/components/v0/city-card';
import { NurseCard } from '@/components/v0/companion-card';
import { FeatureItem } from '@/components/v0/feature-tem';
import { ProcessStep } from '@/components/v0/process-step';
import { SectionHeading } from '@/components/v0/section-heading';
import { ServiceCard } from '@/components/v0/service-card-private-chat';

export const metadata: Metadata = {
  title: 'Onesugar - O site de acompanhantes premium em Portugal',
  description:
    'Encontre acompanhantes premium e discretas em Portugal. Serviços exclusivos em Lisboa, Porto e outras cidades com verificação e privacidade garantida.',
  applicationName: 'Onesugar',
  keywords: [
    'Acompanhantes Portugal',
    'Acompanhantes premium',
    'Escorts Lisboa',
    'Escorts Porto',
    'Serviços de acompanhantes',
    'Encontros discretos',
    'Acompanhantes verificadas',
  ],
  authors: [{ name: 'Onesugar' }],
  creator: 'Onesugar',
  publisher: 'Onesugar',
  metadataBase: new URL('https://onesugar.pt'),
  alternates: {
    canonical: '/',
    languages: {
      'pt-PT': '/pt',
      'en-US': '/en',
    },
  },
  openGraph: {
    title: 'Onesugar - Acompanhantes Premium em Portugal',
    description:
      'Serviços de acompanhantes premium e discretas em Lisboa, Porto e todo Portugal.',
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

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section
          className="w-full py-12 md:py-24 lg:py-32 bg-muted"
          aria-labelledby="hero-heading"
        >
          <div className="container mx-auto md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1
                    id="hero-heading"
                    className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none"
                  >
                    Encontre enfermeiros qualificados em Portugal
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Serviços de enfermagem em Lisboa, Porto e outras cidades com
                    verificação garantida.
                  </p>
                </div>
                <div className="w-full max-w-sm space-y-2">
                  <div className="bg-background rounded-lg shadow-lg p-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">O que você precisa?</h3>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Tipo de serviço"
                            className="flex-1"
                            aria-label="Tipo de serviço"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-medium">Onde?</h3>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Cidade ou código postal"
                            className="flex-1"
                            aria-label="Cidade ou código postal"
                          />
                        </div>
                      </div>
                      <Button className="w-full">
                        <Search className="mr-2 h-4 w-4" />
                        Pesquisar enfermeiros
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mx-auto aspect-video overflow-hidden rounded-xl object-cover lg:aspect-square">
                <Image
                  src="/placeholder.svg?height=800&width=800"
                  width={800}
                  height={800}
                  alt="Enfermeiros qualificados prestando serviços em Portugal"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className="w-full py-12 md:py-24 lg:py-32"
          aria-labelledby="how-it-works-heading"
        >
          <div className="container mx-auto md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <SectionHeading
                title="Como o mynurses funciona"
                description="Encontre o enfermeiro ideal para suas necessidades em apenas três passos simples."
              />
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-3 md:gap-12">
              <ProcessStep
                icon={Search}
                title="Pesquise"
                description="Encontre enfermeiros qualificados na sua área com base nas suas necessidades específicas."
              />
              <ProcessStep
                icon={MessageSquare}
                title="Contacte"
                description="Comunique diretamente com os enfermeiros para discutir os seus requisitos e agendar serviços."
              />
              <ProcessStep
                icon={CheckCircle}
                title="Receba cuidados"
                description="Receba cuidados de enfermagem de qualidade no conforto da sua casa ou local preferido."
              />
            </div>
          </div>
        </section>

        <section
          className="w-full py-12 md:py-24 lg:py-32 bg-muted"
          aria-labelledby="services-heading"
        >
          <div className="container mx-auto md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <SectionHeading
                title="Serviços de enfermagem populares"
                description="Descubra os serviços mais procurados na nossa plataforma."
              />
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {/* {services.map((service, index) => ( */}
              {/* <ServiceCard key={index} title={service} /> */}
              {/* ))} */}
            </div>
          </div>
        </section>

        <section
          className="w-full py-12 md:py-24 lg:py-32"
          aria-labelledby="why-choose-heading"
        >
          <div className="container mx-auto md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <SectionHeading
                  title="Por que escolher o mynurses?"
                  description="Conectamos você com enfermeiros qualificados e verificados em toda Portugal."
                  centered={false}
                />
                <div className="space-y-4">
                  <FeatureItem
                    icon={Shield}
                    title="Verificação garantida"
                    description="Todos os enfermeiros são verificados quanto às suas credenciais e experiência."
                  />
                  <FeatureItem
                    icon={MapPin}
                    title="Cobertura nacional"
                    description="Serviços disponíveis em Lisboa, Porto e outras cidades em todo o país."
                  />
                  <FeatureItem
                    icon={Clock}
                    title="Disponibilidade flexível"
                    description="Encontre enfermeiros disponíveis quando você precisar, incluindo serviços de urgência."
                  />
                  <FeatureItem
                    icon={Star}
                    title="Avaliações transparentes"
                    description="Leia avaliações de outros pacientes para escolher o melhor profissional."
                  />
                </div>
              </div>
              <Image
                src="/placeholder.svg?height=800&width=800"
                width={800}
                height={800}
                alt="Enfermeiro qualificado prestando cuidados a um paciente"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>

        <section
          className="w-full py-12 md:py-24 lg:py-32 bg-muted"
          aria-labelledby="featured-nurses-heading"
        >
          <div className="container mx-auto md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <SectionHeading
                title="Enfermeiros em destaque"
                description="Conheça alguns dos nossos profissionais mais bem avaliados."
              />
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {/* {nurses.map((nurse) => (
                <NurseCard
                  key={nurse.id}
                  id={nurse.id}
                  name={nurse.name}
                  location={nurse.location}
                  specialty={nurse.specialty}
                  rating={nurse.rating}
                  hourlyRate={nurse.hourlyRate}
                  imageUrl={nurse.imageUrl}
                />
              ))} */}
            </div>
            <div className="flex justify-center">
              <Button variant="outline" className="gap-1">
                Ver mais enfermeiros
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section
          className="w-full py-12 md:py-24 lg:py-32"
          aria-labelledby="cities-heading"
        >
          <div className="container mx-auto md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <SectionHeading
                title="Cidades populares"
                description="Encontre enfermeiros nas principais cidades de Portugal."
              />
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {/* {cities.map((city) => (
                <CityCard
                  key={city.name}
                  name={city.name}
                  count={city.count}
                  imageUrl={city.imageUrl}
                />
              ))} */}
            </div>
          </div>
        </section>

        <section
          className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground"
          aria-labelledby="join-community-heading"
        >
          <div className="container mx-auto md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2
                    id="join-community-heading"
                    className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
                  >
                    Junte-se à nossa comunidade de enfermeiros
                  </h2>
                  <p className="max-w-[600px] md:text-xl">
                    Aumente sua visibilidade, encontre novos pacientes e
                    gerencie sua agenda de forma eficiente.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button variant="secondary">Saiba mais</Button>
                  <Button
                    variant="outline"
                    className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  >
                    Registar como enfermeiro
                  </Button>
                </div>
              </div>
              <Image
                src="/placeholder.svg?height=600&width=600"
                width={600}
                height={600}
                alt="Grupo de enfermeiros profissionais da comunidade mynurses"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover"
              />
            </div>
          </div>
        </section>

        <section
          className="w-full py-12 md:py-24 lg:py-32"
          aria-labelledby="cta-heading"
        >
          <div className="container grid items-center justify-center gap-4 mx-auto text-center md:px-6">
            <div className="space-y-3">
              <h2
                id="cta-heading"
                className="text-3xl font-bold tracking-tighter md:text-4xl/tight"
              >
                Pronto para encontrar o enfermeiro ideal?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
                Registe-se hoje e conecte-se com profissionais de enfermagem
                qualificados em toda Portugal.
              </p>
            </div>
            <div className="mx-auto flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" className="gap-1">
                Começar agora
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Saber mais
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
