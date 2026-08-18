import type { Metadata } from 'next';
import { SearchableCities } from '@/components/searchableCities';
import { getAvailableCitiesSummary } from '@/db/queries';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Acompanhantes em Portugal por Distrito',
  description:
    'Encontre acompanhantes verificadas nos 18 distritos de Portugal — Lisboa, '
    + 'Porto, Braga, Faro e mais. Perfis reais e disponibilidade actualizada.',
  alternates: {
    canonical: 'https://www.onesugar.pt/location',
  },
  openGraph: {
    title: 'Acompanhantes em Portugal por Distrito | Onesugar',
    description:
      'Encontre acompanhantes verificadas em todos os distritos de Portugal. '
      + 'Perfis reais e disponibilidade actualizada.',
    url: '/location',
    siteName: 'Onesugar',
    locale: 'pt_PT',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Onesugar - Acompanhantes Premium em Portugal',
      },
    ],
  },
};

async function CitiesList() {
  const cities = await getAvailableCitiesSummary();

  return <SearchableCities cities={cities} />;
}

export default function LocationsPage() {
  return (
    <div className="flex flex-col justify-center items-center px-4 py-8 w-full h-full">
      <div className="flex flex-col items-left justify-center gap-x-4 min-h-[80vh]">
        <h1 className="text-3xl flex font-bold mb-6 px-2">
          Nossas localizações
        </h1>
        <Suspense
          fallback={
            <div className="flex flex-col gap-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 w-full flex flex-row bg-neutral-200 animate-pulse rounded-md"
                ></div>
              ))}
            </div>
          }
        >
          <CitiesList />
        </Suspense>
      </div>
    </div>
  );
}
