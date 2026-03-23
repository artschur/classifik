import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/location/',
        '/companions/',
        '/blog/',
        '/*?utm_',
      ],
      disallow: [
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
    sitemap: 'https://www.onesugar.pt/sitemap.xml',
  };
}
