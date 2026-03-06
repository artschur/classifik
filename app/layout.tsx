import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
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

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.onesugar.pt'),
  title: {
    default: 'Onesugar | Acompanhantes em Portugal',
    template: '%s | Onesugar',
  },
  description: 'A sua escolha segura para acompanhantes premium em Portugal. Privacidade garantida e perfis verificados com rigor. Encontre a discrição que merece na Onesugar.',
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
        alt: 'Onesugar - Acompanhantes Premium',
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
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Onesugar",
                "url": "https://www.onesugar.pt",
                "logo": "https://www.onesugar.pt/logo_classifik.png",
                "description": "A sua escolha segura para acompanhantes premium em Portugal.",
                "address": [
                  {
                    "@type": "PostalAddress",
                    "addressLocality": "Lisboa",
                    "addressCountry": "PT"
                  },
                  {
                    "@type": "PostalAddress",
                    "addressLocality": "Porto",
                    "addressCountry": "PT"
                  }
                ],
                "contactPoint": {
                  "@type": "ContactPoint",
                  "telephone": "+351-123-456-789",
                  "contactType": "customer service"
                }
              })
            }}
          />
        </head>
        <body className="min-h-screen flex flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Analytics />
            <Toaster />
            <TwoStepModal />
            {/* Global Popup - Uncomment and customize as needed */}

            <GlobalPopupWrapper
              isEnabled={false}
              title="Ganhe 2 meses grátis no seu Plano!"
              description="Por tempo limitado! Aproveite!"
              confirmText="Mostre-me!"
              cancelText="Não quero"
              showCloseButton={true}
            />

            {/* Custom Toaster - Alternative toaster positioned at bottom right */}

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
