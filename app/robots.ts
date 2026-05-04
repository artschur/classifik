import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/location/', '/companions/', '/blog/'],
        disallow: [
          '/_next/static/',
          '/_next/image',
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
