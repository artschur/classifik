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
  async headers() {
    return [
      {
        // Chunks JS e CSS gerados pelo Next.js build — nomes com hash imutável.
        // Safe para cache de 1 ano + immutable: o nome do ficheiro muda a cada
        // build, tornando impossível servir versão antiga ao utilizador.
        // IMPORTANTE: este bloco não pode ser removido — sem ele o PageSpeed
        // continua a sinalizar ausência de cache policy nos assets estáticos.
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Imagens, fontes e ficheiros estáticos em /public.
        // Cache reduzido para 1h conforme solicitado pelo Sandri: perfis de
        // acompanhantes têm fotos que podem ser actualizadas a qualquer momento,
        // por isso cache longo causaria utilizadores a ver imagens desactualizadas.
        // stale-while-revalidate: serve a versão em cache enquanto busca nova em background.
        source: '/(.*\\.(?:ico|png|jpg|jpeg|svg|webp|avif|woff|woff2|ttf|otf)$)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Headers de segurança globais — resolve 949 issues de segurança
        // identificados na auditoria técnica inicial (1 deploy cobre todas as rotas).
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
