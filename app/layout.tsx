import type { Metadata } from 'next';
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

const GA_MEASUREMENT_ID = 'G-30XJX7BT9D';

// display: 'swap' elimina o FOIT (flash de texto invisível) durante o
// carregamento da fonte, melhorando o FCP e reduzindo o CLS de fontes.
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="pt" className={geistSans.className} suppressHydrationWarning>
        <head>
          {/* ── Preconnect para domínios críticos de terceiros ──────────────
              Instrui o browser a abrir a ligação TCP/TLS antes de precisar
              dos recursos, reduzindo a latência percebida (Network Dependency
              Tree). Impacto direto no TTFB e no LCP em redes móveis. */}
          <link rel="preconnect" href="https://www.googletagmanager.com" />
          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
          <link rel="preconnect" href="https://www.google-analytics.com" />
          <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          <link rel="preconnect" href="https://vacjsnuttfzgcdaaqjxd.supabase.co" />
          <link rel="dns-prefetch" href="https://vacjsnuttfzgcdaaqjxd.supabase.co" />
          <link rel="preconnect" href="https://images.ctfassets.net" />
          <link rel="dns-prefetch" href="https://images.ctfassets.net" />

          {/* ── Preload da imagem LCP do hero ──────────────────────────────
              Diz ao browser para buscar a imagem principal do hero com
              alta prioridade antes de processar o HTML completo. Melhora
              o LCP Request Discovery nas páginas com carrossel de imagens.
              Substitui o src pelo caminho real da imagem principal do hero. */}
          <link
            rel="preload"
            as="image"
            href="/onesugar-mobile.jpeg"
            fetchPriority="high"
          />

          {/* ── Schema.org Organization ────────────────────────────────── */}
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
          {/* ── Google Analytics 4 ──────────────────────────────────────── */}
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
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
            <Analytics />
            <Toaster />
            <TwoStepModal />
            <GlobalPopupWrapper
              isEnabled={false}
              title="Ganhe 2 meses grátis no seu Plano!"
              description="Por tempo limitado! Aproveite!"
              confirmText="Mostre-me!"
              cancelText="Não quero"
              showCloseButton={true}
            />
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
            <Navbar />
            <main className="flex-grow">{children}</main>
            <WhatsAppButton />
            <SpeedInsights />
            <Footer />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
