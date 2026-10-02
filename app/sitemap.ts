import { MetadataRoute } from 'next';
import { getAvailableCities } from '@/db/queries';
import { getSitemapCompanions } from '@/db/queries/companions';
import { getAllDbStories } from '@/db/queries/stories';
import { stories as staticStories } from '@/lib/stories';
import { absoluteUrl, hasEnglish } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

type Entry = MetadataRoute.Sitemap[number];

/**
 * Para cada página com versão em inglês: as duas versões entram no mapa e
 * cada uma declara a outra (hreflang em xhtml:link), como o Google pede.
 * As páginas só em português ficam como estavam.
 */
function withEnglish(entries: Entry[]): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = [];
  for (const entry of entries) {
    const path = new URL(entry.url).pathname;
    if (!hasEnglish(path)) {
      out.push(entry);
      continue;
    }
    const alternates = {
      languages: {
        'pt-PT': absoluteUrl(path, 'pt'),
        en: absoluteUrl(path, 'en'),
        'x-default': absoluteUrl(path, 'pt'),
      },
    };
    out.push({ ...entry, alternates });
    out.push({ ...entry, url: absoluteUrl(path, 'en'), alternates });
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.onesugar.pt';

  const [cities, companions, dbStories] = await Promise.all([
    getAvailableCities().catch(() => []),
    getSitemapCompanions().catch(() => []),
    getAllDbStories().catch(() => []),
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

  // Contos: os da base de dados mais os estáticos que ainda não foram
  // migrados para ela, a mesma regra da listagem em /contos. Cada conto tem
  // canonical próprio desde o PR #88 e precisa de estar aqui para ser
  // descoberto sem depender só das ligações internas.
  const dbSlugs = new Set(dbStories.map(story => story.slug));
  const storyUrls = [
    ...dbStories.map(story => ({
      url: `${baseUrl}/contos/${story.slug}`,
      lastModified: story.published_at,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...staticStories
      .filter(story => !dbSlugs.has(story.slug))
      .map(story => ({
        url: `${baseUrl}/contos/${story.slug}`,
        lastModified: new Date(story.publishedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
  ];

  return withEnglish([
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
    // /blog não entra: responde 301 para blog.onesugar.pt, que tem o seu
    // próprio sitemap. Um sitemap só deve listar endereços que respondem 200.
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
    {
      url: `${baseUrl}/contos`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    },
    ...cityUrls,
    ...companionUrls,
    ...storyUrls,
  ]);
}