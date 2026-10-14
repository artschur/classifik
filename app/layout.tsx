import type { Metadata, Viewport } from 'next';
import {
  BRAND_ALTERNATE_NAMES,
  BRAND_NAME,
  BRAND_OFFICIAL_PROFILES,
  ORGANIZATION_ID,
} from '@/lib/brand';
import { Geist, Geist_Mono } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import Footer from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/header';
import { RDLeadSync } from '@/components/rd-lead-sync';
import { ThemeProvider } from '@/components/theme-provider';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { TwoStepModal } from '@/components/two-step-modal';
import { GlobalPopupWrapper } from '@/components/global-popup-wrapper';
import { CustomToaster } from '@/components/custom-toaster';
import { CtaClickTracker } from '@/components/cta-click-tracker';
import { LocaleProvider } from '@/components/locale-provider';
import { getLocale } from '@/lib/locale.server';
import { HTML_LANG, OG_LOCALE } from '@/lib/i18n';

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-30XJX7BT9D';

// O GA4 só carrega no site oficial. Os previews da Vercel (um por PR) estavam
// a enviar visitas de teste para a mesma propriedade e apareciam no GA4 como
// domínios e páginas do site.
const LOAD_GA = process.env.VERCEL_ENV === 'production';

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

const baseMetadata: Metadata = {
  metadataBase: new URL('https://www.onesugar.pt'),
  title: {
    default: 'OneSugar | Acompanhantes em Portugal',
    // A marca entra só por aqui. Os títulos das páginas não a repetem, senão
    // o resultado fica "Página | OneSugar | OneSugar".
    template: '%s | OneSugar',
  },
  description:
    'A sua escolha segura para acompanhantes premium em Portugal. Privacidade garantida e perfis verificados com rigor. Encontre a discrição que merece na Onesugar.',
  // CANONICAL: não é definido aqui de propósito. O metadata do layout raiz é
  // herdado por todas as rotas, e um canonical neste ponto fazia com que
  // qualquer página sem canonical próprio (institucionais, contos) se
  // declarasse duplicada da homepage. Cada página indexável define o seu
  // próprio alternates.canonical; a homepage define o dela em app/page.tsx.
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
    title: 'OneSugar | Acompanhantes em Portugal',
    description: 'A sua escolha segura para acompanhantes premium em Portugal.',
    url: 'https://www.onesugar.pt',
    siteName: 'OneSugar',
    locale: 'pt_PT',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'OneSugar, acompanhantes premium em Portugal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OneSugar | Acompanhantes em Portugal',
    description: 'A sua escolha segura para acompanhantes premium em Portugal.',
    images: ['/images/og-image.jpg'],
  },
};

// Valores por omissão em inglês para as páginas /en/. Cada página define os
// seus próprios título, descrição, canonical e hreflang; isto só cobre o que
// uma página não definir.
const EN_DEFAULTS = {
  title: 'OneSugar | Verified Escorts in Portugal',
  description:
    'Verified escorts and companions in Lisbon, Porto, the Algarve and across Portugal. Real profiles, checked one by one, with full discretion.',
  ogDescription: 'Verified escorts and companions across Portugal.',
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  if (locale !== 'en') return baseMetadata;
  return {
    ...baseMetadata,
    title: { default: EN_DEFAULTS.title, template: '%s | OneSugar' },
    description: EN_DEFAULTS.description,
    openGraph: {
      ...baseMetadata.openGraph,
      title: EN_DEFAULTS.title,
      description: EN_DEFAULTS.ogDescription,
      url: 'https://www.onesugar.pt/en',
      locale: OG_LOCALE.en,
      images: [
        {
          url: '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'OneSugar, verified escorts in Portugal',
        },
      ],
    },
    twitter: {
      ...baseMetadata.twitter,
      title: EN_DEFAULTS.title,
      description: EN_DEFAULTS.ogDescription,
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={HTML_LANG[locale]}
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
              '@id': ORGANIZATION_ID,
              name: BRAND_NAME,
              alternateName: BRAND_ALTERNATE_NAMES,
              url: 'https://www.onesugar.pt',
              ...(BRAND_OFFICIAL_PROFILES.length
                ? { sameAs: BRAND_OFFICIAL_PROFILES }
                : {}),
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
          {/* afterInteractive em vez de lazyOnload: com lazyOnload o GA4 só
              carregava com a página ociosa, e quem saía depressa (comum em
              quem chega da pesquisa) não era contado. */}
          {LOAD_GA && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
              />
              <Script id="google-analytics" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  window.gtag = gtag;
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}');
                `}
              </Script>
            </>
          )}
          <CtaClickTracker />

          <LocaleProvider locale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            {/* Não desenha nada: garante que quem acaba de criar conta entra
                no RD Station, seja qual for a página por onde chegou. */}
            <RDLeadSync />
            <main className="flex-grow">{children}</main>
            <Footer />
            <WhatsAppButton />
            <Toaster />
            <CustomToaster
              // A oferta é para anunciantes, e os planos só existem em
              // português: não aparece nas páginas em inglês.
              isEnabled={locale === 'pt'}
              autoShow={true}
              // Espera antes de aparecer a quem não rolou nada; quem rolar
              // vê-o mais cedo.
              autoShowDelay={20000}
              title="1 Mês Grátis em Qualquer Plano!"
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
              title="Ganhe 1 mês grátis no seu Plano!"
              description="Por tempo limitado! Aproveite!"
              confirmText="Mostre-me!"
              cancelText="Não quero"
              showCloseButton={true}
            />
          </ThemeProvider>
          </LocaleProvider>

          <Analytics />
          <SpeedInsights />
        </ClerkProvider>
      </body>
    </html>
  );
}
