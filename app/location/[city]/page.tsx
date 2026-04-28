import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import type { FilterTypesCompanions } from '@/types/types';
import {
  CompanionsList,
  CompanionsListSkeleton,
} from '@/components/companionsList';
import { CompanionFilters } from '@/components/companionFilters';
import CompanionsLayout from '@/app/companions/layout';
import { stringify } from 'querystring';
import Pagination from '@/components/ui/pagination';
import { countCompanionsPages } from '@/db/queries/companions';
import { HeroCarouselWrapper } from '@/components/hero-carousel-wrapper';
import { PlanType } from '@/db/queries/kv';

const cityMetadata: Record<string, { title: string; description: string; h1: string }> = {
  lisboa: {
    title: 'Acompanhantes em Lisboa | Perfis Verificados | Onesugar',
    description: 'Encontre as melhores acompanhantes em Lisboa. Perfis verificados, total discrição e segurança na Onesugar. Descubra acompanhantes premium em Lisboa.',
    h1: 'Acompanhantes em Lisboa',
  },
  porto: {
    title: 'Acompanhantes no Porto | Perfis Verificados | Onesugar',
    description: 'Procura acompanhantes no Porto? Descubra perfis verificados para encontros privados e seguros através da Onesugar.',
    h1: 'Acompanhantes no Porto',
  },
  braga: {
    title: 'Acompanhantes em Braga | Perfis Verificados | Onesugar',
    description: 'Navegue pelos perfis de acompanhantes verificadas em Braga. Descubra companheiras e desfrute de encontros privados com perfis de confiança.',
    h1: 'Acompanhantes em Braga',
  },
  coimbra: {
    title: 'Acompanhantes em Coimbra | Perfis Verificados | Onesugar',
    description: 'Encontre acompanhantes em Coimbra. Explore perfis premium e marque encontros discretos hoje mesmo na Onesugar.',
    h1: 'Acompanhantes em Coimbra',
  },
  faro: {
    title: 'Acompanhantes em Faro | Perfis Verificados no Algarve | Onesugar',
    description: 'Descubra acompanhantes em Faro e na região do Algarve. Navegue por perfis verificados para experiências discretas e inesquecíveis.',
    h1: 'Acompanhantes em Faro',
  },
  aveiro: {
    title: 'Acompanhantes em Aveiro | Perfis Verificados | Onesugar',
    description: 'Encontre acompanhantes em Aveiro. Navegue por perfis verificados e agende encontros privados com acompanhantes de alto nível na Onesugar.',
    h1: 'Acompanhantes em Aveiro',
  },
  viseu: {
    title: 'Acompanhantes em Viseu | Perfis Verificados | Onesugar',
    description: 'Encontre acompanhantes em Viseu. Navegue pelos perfis verificados para experiências discretas e privadas na Onesugar.',
    h1: 'Acompanhantes em Viseu',
  },
  leiria: {
    title: 'Acompanhantes em Leiria | Perfis Verificados | Onesugar',
    description: 'Procura acompanhantes em Leiria? Explore perfis verificados e desfrute de experiências privadas com acompanhantes de confiança na Onesugar.',
    h1: 'Acompanhantes em Leiria',
  },
  setubal: {
    title: 'Acompanhantes em Setúbal | Perfis Verificados | Onesugar',
    description: 'Explore o catálogo de acompanhantes em Setúbal. Descubra companheiras e desfrute de encontros seguros e discretos na Onesugar.',
    h1: 'Acompanhantes em Setúbal',
  },
  evora: {
    title: 'Acompanhantes em Évora | Perfis Verificados | Onesugar',
    description: 'Procura acompanhantes em Évora? Descubra perfis verificados que oferecem experiências privadas e inesquecíveis na Onesugar.',
    h1: 'Acompanhantes em Évora',
  },
  guarda: {
    title: 'Acompanhantes na Guarda | Perfis Verificados | Onesugar',
    description: 'Descubra acompanhantes na Guarda. Encontre perfis de confiança e desfrute de encontros discretos na Onesugar.',
    h1: 'Acompanhantes na Guarda',
  },
  braganca: {
    title: 'Acompanhantes em Bragança | Perfis Verificados | Onesugar',
    description: 'Descubra acompanhantes em Bragança. Navegue pelos perfis verificados e desfrute de encontros privados e discretos na Onesugar.',
    h1: 'Acompanhantes em Bragança',
  },
  'castelo-branco': {
    title: 'Acompanhantes em Castelo Branco | Perfis Verificados | Onesugar',
    description: 'Encontre acompanhantes em Castelo Branco. Navegue por perfis verificados e combine encontros seguros e privados na Onesugar.',
    h1: 'Acompanhantes em Castelo Branco',
  },
  santarem: {
    title: 'Acompanhantes em Santarém | Perfis Verificados | Onesugar',
    description: 'Descubra acompanhantes em Santarém. Navegue por perfis verificados e agende encontros privados com facilidade na Onesugar.',
    h1: 'Acompanhantes em Santarém',
  },
  'vila-real': {
    title: 'Acompanhantes em Vila Real | Perfis Verificados | Onesugar',
    description: 'Procura acompanhantes em Vila Real? Explore perfis verificados e desfrute de encontros privados e seguros na Onesugar.',
    h1: 'Acompanhantes em Vila Real',
  },
  'viana-do-castelo': {
    title: 'Acompanhantes em Viana do Castelo | Perfis Verificados | Onesugar',
    description: 'Descubra acompanhantes em Viana do Castelo. Navegue pelos perfis verificados e desfrute de experiências privadas na Onesugar.',
    h1: 'Acompanhantes em Viana do Castelo',
  },
  portalegre: {
    title: 'Acompanhantes em Portalegre | Perfis Verificados | Onesugar',
    description: 'Encontre acompanhantes em Portalegre. Perfis verificados, total discrição e segurança na Onesugar.',
    h1: 'Acompanhantes em Portalegre',
  },
  beja: {
    title: 'Acompanhantes em Beja | Perfis Verificados | Onesugar',
    description: 'Encontre acompanhantes em Beja. Perfis verificados, total discrição e segurança na Onesugar.',
    h1: 'Acompanhantes em Beja',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const cityKey = city.toLowerCase();
  const capitalizedCity =
    city.charAt(0).toUpperCase() + city.slice(1).replaceAll('-', ' ');

  const current = cityMetadata[cityKey] || {
    title: `Acompanhantes em ${capitalizedCity} | Onesugar`,
    description: `Encontre as melhores acompanhantes em ${capitalizedCity}. Perfis verificados, total discrição e segurança na Onesugar.`,
    h1: `Acompanhantes em ${capitalizedCity}`,
  };

  return {
    title: current.title,
    description: current.description,
    alternates: {
      canonical: `https://www.onesugar.pt/location/${cityKey}`,
    },
    openGraph: {
      title: current.title,
      description: current.description,
      url: `https://www.onesugar.pt/location/${cityKey}`,
      siteName: 'Onesugar',
      locale: 'pt_PT',
      type: 'website',
    },
  };
}

async function PaginationComponent({
  location,
  filters,
  limit,
}: {
  location: string;
  filters: FilterTypesCompanions;
  limit: number;
}) {
  const totalPages = await countCompanionsPages(location, limit, filters);
  return <Pagination totalPages={totalPages} />;
}

function LocationH1({ citySlug }: { citySlug: string }) {
  const cityKey = citySlug.toLowerCase();
  const capitalizedCity =
    citySlug.charAt(0).toUpperCase() + citySlug.slice(1).replaceAll('-', ' ');

  const h1Text =
    cityMetadata[cityKey]?.h1 || `Acompanhantes em ${capitalizedCity}`;

  return <h1 className="text-3xl font-bold mb-6">{h1Text}</h1>;
}

export default async function CompanionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<FilterTypesCompanions>;
}) {
  const [{ city }, sParams] = await Promise.all([params, searchParams]);
  const page = parseInt(sParams.page ?? '1');

  return (
    <div className="container mx-auto px-10 py-8">
      <LocationH1 citySlug={city} />
      <div className="mb-8 text-sm text-muted-foreground flex gap-2">
        Explorar:
        <Link href="/location/lisboa" className="hover:underline text-rose-500">Lisboa</Link> |
        <Link href="/location/porto" className="hover:underline text-rose-500">Porto</Link> |
        <Link href="/location/braga" className="hover:underline text-rose-500">Braga</Link>
      </div>
      <div className="mb-8">
        <HeroCarouselWrapper
          citySlug={city}
          plans={[PlanType.VIP]}
        />
      </div>
      <CompanionFilters initialFilters={sParams} />
      <Suspense
        key={JSON.stringify(sParams)}
        fallback={<CompanionsListSkeleton />}
      >
        <CompanionsList location={city} page={page} filters={sParams} />
      </Suspense>

      <Suspense
        key={JSON.stringify(sParams)}
        fallback={
          <div className="z-20 fixed bottom-4 min-h-14 min-w-36 left-1/2 transform -translate-x-1/2 bg-stone-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"></div>
        }
      >
        <PaginationComponent location={city} filters={sParams} limit={5} />
      </Suspense>
    </div>
  );
}

