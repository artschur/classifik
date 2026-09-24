import type { NextConfig } from 'next';

/**
 * Origens do Clerk autorizadas pela política de segurança.
 *
 * Em produção o Clerk é servido do nosso próprio domínio. Em
 * desenvolvimento as chaves de teste servem-no de *.clerk.accounts.dev, e
 * sem esta excepção o navegador bloqueia o script: a página abre mas não há
 * forma de iniciar sessão em localhost, o que torna impossível experimentar
 * localmente qualquer coisa que dependa de estar autenticado.
 *
 * A excepção existe apenas quando se corre em desenvolvimento; o que vai
 * para produção continua restrito ao domínio próprio.
 */
const clerkOrigins = [
  'https://clerk.onesugar.pt',
  // Abrange os dois anfitriões que o Clerk usa em desenvolvimento: o SDK vem
  // de <instância>.clerk.accounts.dev e as páginas de entrada de
  // <instância>.accounts.dev.
  ...(process.env.NODE_ENV === 'development' ? ['https://*.accounts.dev'] : []),
].join(' ');

const nextConfig: NextConfig = {
  trailingSlash: false,

  // ── Metadata dentro do <head> ────────────────────────────────────────────
  // FIX SEO: title, description, canonical e meta robots estavam a ser
  // emitidos fora do <head> (Screaming Frog: Outside <head>).
  //
  // Causa: o layout raiz renderiza o <Navbar />, que chama auth() do Clerk,
  // e /location/[city] e /contos lêem searchParams. Isso torna as rotas
  // dinâmicas (x-vercel-cache: MISS). Com o app/loading.tsx a abrir um
  // Suspense e o generateMetadata a esperar pelo Supabase, o Next.js faz
  // "streaming metadata": envia o <head> logo e o metadata depois, dentro do
  // <body>. Só os
  // user agents em htmlLimitedBots recebem o metadata bloqueante no <head>,
  // e a lista padrão não inclui o Googlebot. Por isso o generateStaticParams
  // não resolvia: as rotas nunca chegam a ser estáticas.
  //
  // /.*/ desliga o streaming metadata para todos os user agents: o servidor
  // espera pelo generateMetadata e escreve tudo no <head>.
  // Doc: https://nextjs.org/docs/app/api-reference/config/next-config-js/htmlLimitedBots
  htmlLimitedBots: /.*/,

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
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${clerkOrigins} https://www.googletagmanager.com https://va.vercel-scripts.com`,

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
              `connect-src 'self' ${clerkOrigins} https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://vitals.vercel-insights.com`,

              // Iframes: YouTube embeds + Clerk OAuth (popups de login social
              // podem abrir iframes de clerk.onesugar.pt)
              `frame-src https://www.youtube-nocookie.com ${clerkOrigins}`,

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
              `form-action 'self' ${clerkOrigins}`,
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
