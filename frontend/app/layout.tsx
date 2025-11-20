import type { ReactNode } from 'react';
import { locales } from '@/i18n/request';

type Props = {
  children: ReactNode;
};

// Since we have a `not-found.tsx` file at the root of the
// `app` folder, a layout file is required, even if it's
// just passing children through.
export default function RootLayout({ children }: Props) {
  return children;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
