import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
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
  robots: 'index, follow',
  openGraph: {
    title: 'Stockmeter - Automated Stock Valuation',
    description: 'Calculate fair value of stocks using multiple valuation models',
    type: 'website',
    locale: 'en_US',
  },
  manifest: '/manifest.json',
};

// Viewport configuration (Next.js 14+ requirement)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
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
  
  // Load messages directly from the locale file
  const messages = (await import(`../../locales/${locale}.json`)).default;

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
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