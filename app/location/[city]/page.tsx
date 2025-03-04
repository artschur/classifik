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

export default async function CompanionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<FilterTypesCompanions>;
}) {
  const [{ city }, sParams] = await Promise.all([params, searchParams]);
  const totalPages = await countCompanionsPages(city, 9, sParams);
  const capitalizedCity =
    city.charAt(0).toUpperCase() + city.slice(1).replaceAll('-', ' ');
  const page = parseInt(sParams.page ?? '1');

  return (
    <div className="container mx-auto px-10 py-8">
      <h1 className="text-3xl font-bold mb-6">
        Companions in {capitalizedCity}
      </h1>
      <CompanionFilters initialFilters={sParams} />
      <Suspense
        key={JSON.stringify(sParams)}
        fallback={<CompanionsListSkeleton />}
      >
        <CompanionsList location={city} page={page} filters={sParams} />
      </Suspense>
      <Pagination totalPages={totalPages} />
    </div>
  );
}
