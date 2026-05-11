import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  trailingSlash: false,

  // ── Redirects ────────────────────────────────────────────────────────────
  async redirects() {
    return [
      {
        source: '/blog',
        destination: 'https://blog.onesugar.pt',
        permanent: true,
      },
      {
        source: '/blog/:path*',
        destination: 'https://blog.onesugar.pt/:path*',
        permanent: true,
      },
    ];
  },

  // ── Cache headers ────────────────────────────────────────────────────────
  // Assets estáticos do Next.js usam hashes no nome do ficheiro, por isso
  // é seguro aplicar cache longo (immutable). O Google PageSpeed penaliza
  // ausência de cache policy — este bloco elimina esse aviso.
  async headers() {
    return [
      {
        // Chunks JS e CSS com hash gerados pelo Next.js build
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Imagens, fontes e ficheiros estáticos em /public
        source: '/:path*\\.(ico|png|jpg|jpeg|svg|webp|avif|woff|woff2|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Headers de segurança — resolve 949 issues identificados na auditoria
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  // ── Image optimization ───────────────────────────────────────────────────
  // Adiciona AVIF e WebP como formatos de saída do Next.js Image.
  // O browser recebe o formato mais eficiente que suporta.
  // Reduz o payload das imagens em 25-40% vs JPEG — impacto direto no LCP
  // e no PageSpeed "Improve Image Delivery".
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'akns-images.eonline.com',
      },
      {
        protocol: 'https',
        hostname: 'vacjsnuttfzgcdaaqjxd.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
      },
    ],
  },
};

export default nextConfig;
