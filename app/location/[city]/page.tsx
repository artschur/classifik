import type { Metadata } from 'next';
import { Suspense } from 'react';
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

  return {
    title: `Acompanhantes ${adj} em ${capitalizedCity} | Onesugar`,
    description: `Encontre as melhores acompanhantes ${adj.toLowerCase()} em ${capitalizedCity}. Perfis verificados, total discrição e segurança na Onesugar. Descubra acompanhantes premium em ${capitalizedCity}.`,
    alternates: {
      canonical: `https://www.onesugar.pt/location/${city}`,
    },
    openGraph: {
      title: `Acompanhantes ${adj} em ${capitalizedCity} | Onesugar`,
      description: `As melhores acompanhantes ${adj.toLowerCase()} em ${capitalizedCity} estão na Onesugar.`,
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

export default async function CompanionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<FilterTypesCompanions>;
}) {
  const [{ city }, sParams] = await Promise.all([params, searchParams]);
  const capitalizedCity =
    city.charAt(0).toUpperCase() + city.slice(1).replaceAll('-', ' ');
  const page = parseInt(sParams.page ?? '1');

  const adjectives = ['Premium', 'Verificadas', 'Elegantes', 'de Luxo', 'Alto Padrão'];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const h1Text = `Acompanhantes ${randomAdjective} em ${capitalizedCity}`;

  return (
    <div className="container mx-auto px-10 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {h1Text}
      </h1>
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
