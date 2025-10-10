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
import { AgeVerificationModal } from '@/components/age-verification-modal';
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
  title: 'onesugar',
  description: 'as mais doces sugars de portugal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={geistSans.className} suppressHydrationWarning>
        <body className="min-h-screen flex flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Analytics />
            <Toaster />
            <AgeVerificationModal />
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
