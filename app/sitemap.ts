import { MetadataRoute } from 'next';
import { getAvailableCities } from '@/db/queries';
import { getSitemapCompanions } from '@/db/queries/companions';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.onesugar.pt';

  const [cities, companions] = await Promise.all([
    getAvailableCities().catch(() => []),
    getSitemapCompanions().catch(() => []),
  ]);

  const cityUrls = cities.map(city => ({
    url: `${baseUrl}/location/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Os perfis são a parte mais forte do site e não constavam do mapa: a lista
  // entregue ao buscador tinha 24 endereços fixos e não crescia com cada
  // acompanhante nova.
  const companionUrls = companions.map(companion => ({
    url: `${baseUrl}/companions/${companion.id}`,
    lastModified: companion.updatedAt ?? new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/location`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ajuda-anunciantes`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/quanto-ganha-acompanhante`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/companions`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    ...cityUrls,
    ...companionUrls,
  ];
}