'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === locale) return;

    startTransition(() => {
      // Remove the current locale from the pathname
      const pathnameWithoutLocale = (pathname || '/').replace(`/${locale}`, '') || '/';
      
      // Navigate to the new locale
      const newPath = newLocale === 'en' 
        ? pathnameWithoutLocale 
        : `/${newLocale}${pathnameWithoutLocale}`;
      
      router.push(newPath);
    });

    // Persist language preference to user profile if authenticated
    try {
      const response = await fetch(`${process.env['NEXT_PUBLIC_API_BASE_URL']}/api/user/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ languagePreference: newLocale }),
      });

      if (!response.ok) {
        console.warn('Failed to save language preference to profile');
      }
    } catch (error) {
      // User might not be authenticated, that's okay
      console.debug('Could not save language preference:', error);
    }
  };

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  return (
    <Select.Root value={locale} onValueChange={handleLanguageChange} disabled={isPending}>
      <Select.Trigger
        className="inline-flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
        aria-label="Select language"
      >
        <span className="flex items-center gap-2">
          <Select.Value />
        </span>
        <Select.Icon>
          <ChevronDownIcon className="h-4 w-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="overflow-hidden bg-gray-800 rounded-lg shadow-lg border border-gray-700"
          position="popper"
          sideOffset={5}
        >
          <Select.Viewport className="p-1">
            {languages.map((language) => (
              <Select.Item
                key={language.code}
                value={language.code}
                className="relative flex items-center gap-2 px-8 py-2 text-sm text-white rounded cursor-pointer hover:bg-gray-700 focus:bg-gray-700 focus:outline-none select-none"
              >
                <Select.ItemText>
                  <span className="flex items-center gap-2">
                    <span>{language.flag}</span>
                    <span>{language.name}</span>
                  </span>
                </Select.ItemText>
                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                  <CheckIcon className="h-4 w-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
