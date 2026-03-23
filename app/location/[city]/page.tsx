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

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const [{ city }, sParams] = await Promise.all([params, searchParams]);
  const capitalizedCity =
    city.charAt(0).toUpperCase() + city.slice(1).replaceAll('-', ' ');

  const adj = (sParams.adj as string) || 'Premium';

  const cityMetadata: Record<string, { title: string; description: string }> = {
    viseu: {
      title: 'Garotas de programa em Viseu | Acompanhantes verificadas | Onesugar',
      description: 'Encontre acompanhantes de luxo em Viseu. Navegue pelos perfis de acompanhantes para experiências discretas e privadas.',
    },
    lisboa: {
      title: 'Garotas de programa de luxo em Lisboa | Acompanhantes verificadas | Onesugar',
      description: 'Encontre as melhores acompanhantes de luxo em Lisboa. Navegue por perfis verificados de acompanhantes e desfrute de experiências discretas e inesquecíveis.',
    },
    porto: {
      title: 'Garotas de programa de luxo no Porto | Acompanhantes verificadas | Onesugar',
      description: 'Procura acompanhantes no Porto? Descubra acompanhantes verificadas para encontros privados e seguros através do Onesugar.',
    },
    braga: {
      title: 'Garotas de programa em Braga | Acompanhantes Premium | Onesugar',
      description: 'Navegue pelos perfis de acompanhantes verificadas em Braga. Descubra belas companheiras e desfrute de encontros privados com perfis confiáveis.',
    },
    coimbra: {
      title: 'Garotas de programa em Coimbra | Acompanhantes de luxo | Onesugar',
      description: 'Encontre acompanhantes elegantes em Coimbra. Explore perfis de acompanhantes premium e marque encontros discretos hoje mesmo.',
    },
    faro: {
      title: 'Garotas de programa em Faro | Acompanhantes Premium no Algarve | Onesugar',
      description: 'Descubra acompanhantes encantadoras em Faro e na região do Algarve. Navegue por perfis verificados de acompanhantes para experiências inesquecíveis.',
    },
    leiria: {
      title: 'Garotas de programa em Leiria | Acompanhantes verificadas | Onesugar',
      description: 'Procura acompanhantes em Leiria? Explore perfis verificados de acompanhantes e desfrute de experiências privadas com acompanhantes de confiança.',
    },
    setubal: {
      title: 'Garotas de programa em Setúbal | Acompanhantes de luxo | Onesugar',
      description: 'Explore o catálogo de acompanhantes de luxo em Setúbal. Descubra belas companheiras e desfrute de encontros seguros e discretos.',
    },
    aveiro: {
      title: 'Garotas de programa em Aveiro | Acompanhantes verificadas | Onesugar',
      description: 'Encontre acompanhantes deslumbrantes em Aveiro. Navegue por perfis verificados e agende encontros privados com acompanhantes de alto nível.',
    },
    braganca: {
      title: 'Garotas de programa em Bragança | Acompanhantes de luxo verificadas | Onesugar',
      description: 'Descubra acompanhantes verificadas em Bragança. Navegue pelos perfis de acompanhantes premium e desfrute de encontros privados e discretos.',
    },
    'castelo-branco': {
      title: 'Acompanhantes em Castelo Branco | Companheiros de Luxo | Um açúcar',
      description: 'Encontre acompanhantes lindas em Castelo Branco. Navegue por perfis verificados de acompanhantes e combine encontros seguros e privados.',
    },
    evora: {
      title: 'Garotas de programa em Évora | Acompanhantes Premium | Onesugar',
      description: 'Procura acompanhantes em Évora? Descubra acompanhantes verificadas que oferecem experiências privadas e inesquecíveis.',
    },
    guarda: {
      title: 'Garotas de programa em Guarda | Acompanhantes verificadas | Onesugar',
      description: 'Descubra acompanhantes deslumbrantes em Guarda. Encontre perfis de acompanhantes confiáveis ​​e desfrute de encontros discretos.',
    },
    santarem: {
      title: 'Acompanhantes em Santarém | Companheiros de Luxo | Um açúcar',
      description: 'Descubra acompanhantes de luxo em Santarém. Navegue por perfis verificados e agende encontros privados com facilidade.',
    },
    'vila-real': {
      title: 'Garotas de programa em Vila Real | Acompanhantes Premium | Onesugar',
      description: 'Procura acompanhantes em Vila Real? Explore acompanhantes verificadas e desfrute de encontros privados e seguros.',
    },
    'viana-do-castelo': {
      title: 'Acompanhantes em Viana do Castelo | Companheiros de Luxo | Um açúcar',
      description: 'Descubra acompanhantes verificadas em Viana do Castelo. Navegue pelos perfis de belas acompanhantes e desfrute de experiências privadas.',
    },
  };

  const currentMetadata = cityMetadata[city.toLowerCase()] || {
    title: `Acompanhantes ${adj} em ${capitalizedCity} | Onesugar`,
    description: `Encontre as melhores acompanhantes ${adj.toLowerCase()} em ${capitalizedCity}. Perfis verificados, total discrição e segurança na Onesugar. Descubra acompanhantes premium em ${capitalizedCity}.`,
  };

  return {
    title: currentMetadata.title,
    description: currentMetadata.description,
    alternates: {
      canonical: `https://www.onesugar.pt/location/${city}`,
    },
    openGraph: {
      title: currentMetadata.title,
      description: currentMetadata.description,
      url: `https://www.onesugar.pt/location/${city}`,
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

async function LocationH1({ citySlug }: { citySlug: string }) {
  const capitalizedCity =
    citySlug.charAt(0).toUpperCase() + citySlug.slice(1).replaceAll('-', ' ');

  const adjectives = ['Premium', 'Verificadas', 'Elegantes', 'de Luxo', 'Alto Padrão'];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const h1Text = `Acompanhantes ${randomAdjective} em ${capitalizedCity}`;

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
