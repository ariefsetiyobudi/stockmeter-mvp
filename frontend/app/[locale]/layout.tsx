import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/lib/providers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Navigation from '@/components/Navigation';
import { WebVitals } from './web-vitals';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

// Requirements: 12.1, 12.4, 12.5 - Mobile optimization
export const metadata: Metadata = {
  title: 'Stockmeter - Automated Stock Valuation',
  description: 'Calculate fair value of stocks using multiple valuation models including DCF, DDM, P/E ratios, and Graham Number.',
  keywords: 'stock valuation, DCF, dividend discount model, Graham number, financial analysis',
  authors: [{ name: 'Stockmeter Team' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  robots: 'index, follow',
  openGraph: {
    title: 'Stockmeter - Automated Stock Valuation',
    description: 'Calculate fair value of stocks using multiple valuation models',
    type: 'website',
    locale: 'en_US',
  },
  themeColor: '#000000',
  manifest: '/manifest.json',
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const { locale } = await params;
  
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <ErrorBoundary>
              <WebVitals />
              <Navigation />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              <div id="root">
                {children}
              </div>
            </ErrorBoundary>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}