import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // FIX: '/location' e '/location/' ambos necessários.
        // '/location/' cobre /location/lisboa, /location/porto, etc.
        // '/location' sem trailing slash cobre a listagem /location.
        // O Next.js MetadataRoute.Robots gera os valores exactos sem normalização.
        allow: [
          '/',
          '/location',
          '/location/',
          '/companions',
          '/companions/',
          '/blog/',
          // Landings de SEO: topo de funil, têm de ser indexáveis. A regra
          // Disallow do /checkout não se aplica aqui — é para páginas
          // transaccionais, sem valor de pesquisa.
          '/ajuda-anunciantes',
          '/quanto-ganha-acompanhante',
        ],
        disallow: [
          // FIX SEO: /_next/static/ e /_next/image removidos do disallow.
          // Bloquear esses paths impedia o Googlebot de aceder aos chunks JS/CSS
          // necessários para renderizar as páginas, causando:
          //   - Internal Blocked by Robots.txt (HIGH, 66 URLs)
          //   - Internal Blocked Resource (HIGH, 50 URLs)
          //   - Pages with Blocked Resources (HIGH, 48 URLs)
          // Os assets em /_next/static/ têm hash imutável no nome — não existe
          // risco de indexação de conteúdo indesejado. O next.config já define
          // Cache-Control: public, max-age=31536000, immutable para esses paths.
          '/checkout',
          '/onboarding',
          '/login',
          '/register',
          '/admin',
          '/api/',
          '/profile/',
          '/*?s=',
          '/*?search=',
        ],
      },
    ],
    sitemap: 'https://www.onesugar.pt/sitemap.xml',
  };
}
