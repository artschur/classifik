import type { Metadata } from 'next';
import { SearchableCities } from '@/components/searchableCities';
import PortugalMap from '@/components/PortugalMap';
import { getAvailableCitiesSummary } from '@/db/queries';
import { Suspense } from 'react';
import { getLocale } from '@/lib/locale.server';
import { OG_LOCALE, absoluteUrl, pageAlternates } from '@/lib/i18n';

const metadataPt: Metadata = {
  title: 'Acompanhantes em Portugal por Distrito',
  description:
    'Encontre acompanhantes verificadas nos 18 distritos de Portugal — Lisboa, '
    + 'Porto, Braga, Faro e mais. Perfis reais e disponibilidade actualizada.',
  alternates: pageAlternates('/location', 'pt'),
  openGraph: {
    title: 'Acompanhantes em Portugal por Distrito | OneSugar',
    description:
      'Encontre acompanhantes verificadas em todos os distritos de Portugal. '
      + 'Perfis reais e disponibilidade actualizada.',
    url: '/location',
    siteName: 'OneSugar',
    locale: 'pt_PT',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'OneSugar, acompanhantes premium em Portugal',
      },
    ],
  },
};

const metadataEn: Metadata = {
  title: 'Escorts in Portugal by District',
  description:
    'Find verified escorts in every district of Portugal: Lisbon, Porto, the '
    + 'Algarve, Madeira and more. Real profiles with up to date availability.',
  alternates: pageAlternates('/location', 'en'),
  openGraph: {
    title: 'Escorts in Portugal by District | OneSugar',
    description:
      'Find verified escorts in every district of Portugal. Real profiles '
      + 'with up to date availability.',
    url: absoluteUrl('/location', 'en'),
    siteName: 'OneSugar',
    locale: OG_LOCALE.en,
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg',
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

async function CitiesList() {
  const cities = await getAvailableCitiesSummary();

  return <SearchableCities cities={cities} />;
}

export default async function LocationsPage() {
  const en = (await getLocale()) === 'en';
  return (
    <div className="flex flex-col justify-center items-center px-4 py-8 w-full h-full">
      <div className="flex flex-col items-left justify-center gap-x-4 min-h-[80vh] w-full max-w-5xl">
        <h1 className="text-3xl flex font-bold mb-6 px-2">
          {en ? 'Escorts in Portugal by district' : 'Nossas localizações'}
        </h1>
        {en && (
          <p className="text-base text-muted-foreground mb-8 px-2 max-w-3xl">
            Choose a district on the map or in the list to see the verified
            companions available there. OneSugar covers every district of
            mainland Portugal, from Lisbon and Porto to the Algarve, plus
            Madeira.
          </p>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start w-full">
          <PortugalMap />
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
    </div>
  );
}
