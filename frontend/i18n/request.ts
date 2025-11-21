import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'id'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : 'en';

  return {
    locale: validLocale as string,
    messages: (await import(`../locales/${validLocale}.json`)).default,
  };
});
