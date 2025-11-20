import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales } from './i18n/request';

// Define protected routes that require authentication
const protectedRoutes = [
  '/watchlist',
  '/alerts',
  '/compare',
  '/profile',
  '/payment',
];

// Define routes that require Pro subscription
const proRoutes = [
  '/alerts',
  '/compare',
];

// Define public routes that should redirect to home if authenticated
const publicRoutes = [
  '/login',
  '/register',
];

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'as-needed', // Don't add locale prefix for default locale
});

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get authentication status from cookies
  // The auth store uses httpOnly cookies set by the backend
  const accessToken = request.cookies.get('accessToken')?.value;
  const isAuthenticated = !!accessToken;
  
  // Remove locale prefix from pathname for route matching
  const pathnameWithoutLocale = pathname.replace(/^\/(en|id)/, '') || '/';
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathnameWithoutLocale.startsWith(route));
  const isProRoute = proRoutes.some(route => pathnameWithoutLocale.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathnameWithoutLocale.startsWith(route));
  
  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathnameWithoutLocale);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect authenticated users away from public routes (login/register)
  if (isPublicRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // For Pro routes, we'll check subscription status on the page itself
  // since we need to fetch user data from the API
  // The middleware only handles authentication, not authorization
  
  // Apply i18n middleware
  return intlMiddleware(request as any);
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
