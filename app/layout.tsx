import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import Footer from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/header';
import { ThemeProvider } from '@/components/theme-provider';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { TwoStepModal } from '@/components/two-step-modal';
import { GlobalPopupWrapper } from '@/components/global-popup-wrapper';
import { CustomToaster } from '@/components/custom-toaster';

// GA via env (com fallback). Evita hardcode e permite IDs diferentes
// por ambiente (preview vs produção). Define NEXT_PUBLIC_GA_MEASUREMENT_ID.
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-30XJX7BT9D';

// display: 'swap' elimina o FOIT durante o carregamento da fonte.
// Usamos .variable em ambas para expor as CSS vars e mapear via Tailwind.
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.onesugar.pt'),
  title: {
    default: 'Onesugar | Acompanhantes em Portugal',
    template: '%s | Onesugar',
  },
  description:
    'A sua escolha segura para acompanhantes premium em Portugal. Privacidade garantida e perfis verificados com rigor. Encontre a discrição que merece na Onesugar.',
  alternates: {
    canonical: 'https://www.onesugar.pt',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Onesugar | Acompanhantes em Portugal',
    description: 'A sua escolha segura para acompanhantes premium em Portugal.',
    url: 'https://www.onesugar.pt',
    siteName: 'Onesugar',
    locale: 'pt_PT',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Onesugar - Acompanhantes Premium em Portugal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Onesugar | Acompanhantes em Portugal',
    description: 'A sua escolha segura para acompanhantes premium em Portugal.',
    images: ['/images/og-image.jpg'],
  },
};

// No App Router, themeColor/viewport vão no export `viewport`, não em metadata.
export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // FIX CRÍTICO (SEO): ClerkProvider foi movido para dentro de <body>.
    // Envolver <html> com ClerkProvider impede o Next.js App Router de injetar
    // os metadados do generateMetadata no <head> durante o SSR, fazendo com que
    // <title>, <meta name="description"> e <meta name="robots"> fiquem ausentes
    // do HTML entregue pelo servidor — confirmado via View Source em produção.
    // O ClerkProvider não precisa de envolver <html>: qualquer posição dentro
    // de <body> garante o contexto de autenticação a todos os componentes filhos.
    <html
      lang="pt"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Origens críticas (conteúdo/LCP): preconnect */}
        <link rel="preconnect" href="https://vacjsnuttfzgcdaaqjxd.supabase.co" />
        <link rel="preconnect" href="https://images.ctfassets.net" />

        {/* Diferidas (analytics em lazyOnload): dns-prefetch chega */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />

        {/* YouTube (LiteYouTube) — só usado se/quando houver play */}
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />

        {/* Preload da imagem LCP do hero — limitado ao viewport mobile.
            RECOMENDAÇÃO: mover para app/page.tsx com <Image priority> para
            que o Next gere o preload correcto com srcset responsivo. */}
        <link
          rel="preload"
          as="image"
          href="/onesugar-mobile.jpeg"
          media="(max-width: 768px)"
          fetchPriority="high"
        />

        {/* Schema.org Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Onesugar',
              url: 'https://www.onesugar.pt',
              logo: 'https://www.onesugar.pt/logo.png',
              description:
                'A sua escolha segura para acompanhantes premium em Portugal.',
              address: [
                {
                  '@type': 'PostalAddress',
                  addressLocality: 'Lisboa',
                  addressCountry: 'PT',
                },
                {
                  '@type': 'PostalAddress',
                  addressLocality: 'Porto',
                  addressCountry: 'PT',
                },
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+351 934 600 827',
                contactType: 'customer service',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <ClerkProvider>
          {/* GA em lazyOnload: adia para o idle do browser.
              Os eventos são preservados via fila dataLayer. */}
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="lazyOnload"
          />
          <Script id="google-analytics" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>

          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
            <WhatsAppButton />

            {/* Overlays / toasts / modais */}
            <Toaster />
            <CustomToaster
              isEnabled={true}
              autoShow={true}
              autoShowDelay={2000}
              title="2 Meses Grátis em Qualquer Plano!"
              description="Comece seu período de teste gratuito hoje. Sem compromisso!"
              type="info"
              buttonText="Começar Teste Grátis"
              buttonUrl="/checkout"
              persistent={true}
              cookieKey="trial-toaster-dismissed"
            />
            <TwoStepModal />
            {/* isEnabled={false}: considera não montar de todo enquanto desactivado */}
            <GlobalPopupWrapper
              isEnabled={false}
              title="Ganhe 2 meses grátis no seu Plano!"
              description="Por tempo limitado! Aproveite!"
              confirmText="Mostre-me!"
              cancelText="Não quero"
              showCloseButton={true}
            />
          </ThemeProvider>

          {/* Telemetria não visual — fora do ThemeProvider, no fim do body */}
          <Analytics />
          <SpeedInsights />
        </ClerkProvider>
      </body>
    </html>
  );
}