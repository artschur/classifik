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
  description: 'as mais doces acompanhantes de portugal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={geistSans.className}>
        <body className="min-h-screen flex flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Analytics />
            <Toaster />
            <Navbar />
            <main className="flex-grow">{children}</main>
            <SpeedInsights />
            <Footer />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
