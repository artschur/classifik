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

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-30XJX7BT9D';

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
  // CANONICAL: define o canonical da homepage e serve de fallback para rotas
  // sem metadata próprio. Páginas de localidade (/location/[city]) sobrescrevem
  // este valor via alternates.canonical no seu próprio generateMetadata —
  // o Next.js App Router faz merge de metadata, e a página filha tem precedência.
  // NÃO remover daqui: sem este campo, a homepage fica sem canonical após o
  // merge com as páginas filhas que definem o seu próprio.
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
    <html
      lang="pt"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://vacjsnuttfzgcdaaqjxd.supabase.co" />
        <link rel="preconnect" href="https://images.ctfassets.net" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />
        <link
          rel="preload"
          as="image"
          href="/onesugar-mobile.jpeg"
          media="(max-width: 768px)"
          fetchPriority="high"
        />
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
                telephone: '+351 913 895 353',
                contactType: 'customer service',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <ClerkProvider>
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
            <GlobalPopupWrapper
              isEnabled={false}
              title="Ganhe 2 meses grátis no seu Plano!"
              description="Por tempo limitado! Aproveite!"
              confirmText="Mostre-me!"
              cancelText="Não quero"
              showCloseButton={true}
            />
          </ThemeProvider>

          <Analytics />
          <SpeedInsights />
        </ClerkProvider>
      </body>
    </html>
  );
}
