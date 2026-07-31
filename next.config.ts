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
        // Cache de 1h conforme solicitado: perfis têm fotos actualizáveis.
        source: '/(.*\\.(?:ico|png|jpg|jpeg|svg|webp|avif|woff|woff2|ttf|otf)$)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Headers de segurança globais aplicados a todas as rotas.
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
          {
            // FIX SEO: adiciona Content-Security-Policy.
            // Resolve: Security: Missing Content-Security-Policy Header (LOW, 52 URLs).
            // Política permissiva mas segura para a stack actual:
            //   - self: origem própria (Next.js chunks, API routes)
            //   - clerk.onesugar.pt: SDK de autenticação Clerk
            //   - *.supabase.co: base de dados e storage
            //   - images.ctfassets.net: Contentful (imagens do CMS)
            //   - googletagmanager.com + google-analytics.com: GA4
            //   - vercel.live + va.vercel-scripts.com: Speed Insights e Analytics
            //   - youtube-nocookie.com + ytimg.com: LiteYouTube embeds
            //   - blob: permite object URLs gerados no cliente (uploads de imagens)
            //   - data: permite inline data URIs (ícones SVG inline)
            // NOTA: 'unsafe-inline' em style-src é necessário para o Tailwind
            // e styled-components injectarem estilos dinâmicos via <style>.
            // 'unsafe-eval' em script-src é necessário para o Next.js em dev
            // (eval é usado pelo hot reload); em produção pode ser removido
            // se confirmado que nenhuma lib o usa.
            key: 'Content-Security-Policy',
            value: [
              // Origem padrão para tudo o que não tem directiva própria
              "default-src 'self'",

              // Scripts: Next.js chunks (self), inline scripts do ThemeProvider
              // e Schema.org (unsafe-inline), Clerk SDK, GA4, Vercel Analytics.
              // unsafe-eval: necessário para Next.js dev HMR e algumas libs.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.onesugar.pt https://www.googletagmanager.com https://va.vercel-scripts.com",

              // Estilos: Tailwind injeta <style> tags dinâmicas (unsafe-inline obrigatório)
              "style-src 'self' 'unsafe-inline'",

              // Imagens: self (OG, favicons, logo), Supabase storage (perfis),
              // Contentful (imagens do CMS), Clerk (avatares), YouTube thumbnails
              "img-src 'self' blob: data: https://vacjsnuttfzgcdaaqjxd.supabase.co https://images.ctfassets.net https://img.clerk.com https://i.ytimg.com",

              // Fontes: Geist é servida de /_next/static/media/ (self)
              "font-src 'self'",

              // Fetch/XHR/WebSocket: self, Clerk API, Supabase DB + storage,
              // GA4 beacon hits (googletagmanager + google-analytics),
              // Vercel Speed Insights
              "connect-src 'self' https://clerk.onesugar.pt https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://vitals.vercel-insights.com",

              // Iframes: YouTube embeds + Clerk OAuth (popups de login social
              // podem abrir iframes de clerk.onesugar.pt)
              "frame-src https://www.youtube-nocookie.com https://clerk.onesugar.pt",

              // Media: self + Supabase storage (vídeos de verificação das companions)
              "media-src 'self' https://vacjsnuttfzgcdaaqjxd.supabase.co",

              // Service workers: self para SW do próprio domínio, blob para
              // workers criados via URL.createObjectURL()
              "worker-src 'self' blob:",

              // Segurança adicional: bloqueia plugins (Flash, Silverlight)
              "object-src 'none'",

              // Previne ataques de injecção via <base> tag
              "base-uri 'self'",

              // Limita destinos de formulários: self e Clerk para login/signup
              "form-action 'self' https://clerk.onesugar.pt",
            ].join('; '),
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
