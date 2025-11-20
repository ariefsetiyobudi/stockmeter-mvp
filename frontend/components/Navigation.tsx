'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  HomeIcon, 
  ChartBarIcon, 
  BellIcon, 
  UserCircleIcon,
  CurrencyDollarIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

export default function Navigation() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { isAuthenticated, isPro } = useAuthStore();

  const navItems = [
    { href: '/', label: t('home'), icon: HomeIcon, public: true },
    { href: '/watchlist', label: t('watchlist'), icon: BookmarkIcon, auth: true },
    { href: '/compare', label: t('compare'), icon: ChartBarIcon, auth: true },
    { href: '/alerts', label: t('alerts'), icon: BellIcon, pro: true },
    { href: '/pricing', label: t('pricing'), icon: CurrencyDollarIcon, public: true },
    { href: '/profile', label: t('profile'), icon: UserCircleIcon, auth: true },
  ];

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') {
      return pathname === '/' || pathname === '/en' || pathname === '/id';
    }
    return pathname.includes(href);
  };

  return (
    <nav className="bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-white">Stockmeter</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              // Hide auth-required items if not authenticated
              if (item.auth && !isAuthenticated) return null;
              // Hide pro-required items if not pro
              if (item.pro && !isPro) return null;

              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Language Switcher */}
            <div className="ml-4">
              <LanguageSwitcher />
            </div>

            {/* Auth Buttons */}
            {!isAuthenticated && (
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-white hover:text-gray-300 transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
