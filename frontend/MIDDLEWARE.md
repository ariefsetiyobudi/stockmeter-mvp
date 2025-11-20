# Next.js Authentication Middleware

This middleware implements route protection for the Stockmeter application using Next.js 16 middleware API.

## Overview

The middleware runs on every request and checks authentication status from httpOnly cookies to protect routes and manage access control.

## Protected Routes

Routes that require authentication:
- `/watchlist` - User's stock watchlist
- `/alerts` - Price alert management (Pro only)
- `/compare` - Batch stock comparison (Pro only)
- `/profile` - User profile and settings
- `/payment` - Payment and subscription management

## Public Routes

Routes that redirect to home if user is already authenticated:
- `/login` - Login page
- `/register` - Registration page

## Pro Routes

Routes that require Pro subscription (checked on page level):
- `/alerts` - Alert management
- `/compare` - Batch comparison

Note: Pro subscription check is done on the page itself since it requires fetching user data from the API. The middleware only handles authentication (logged in vs not logged in).

## How It Works

1. **Authentication Check**: Reads `accessToken` cookie to determine if user is authenticated
2. **Route Protection**: 
   - If accessing protected route without auth → redirect to `/login?redirect={pathname}`
   - If accessing public route with auth → redirect to `/`
3. **Pass Through**: For all other routes, request continues normally

## Cookie-Based Authentication

The middleware relies on httpOnly cookies set by the backend:
- `accessToken`: JWT access token (1 hour expiry)
- `refreshToken`: JWT refresh token (30 days expiry)

These cookies are automatically included in requests and cannot be accessed by client-side JavaScript, providing better security.

## Redirect Flow

When an unauthenticated user tries to access a protected route:
1. User is redirected to `/login?redirect=/original-path`
2. After successful login, user is redirected back to the original path
3. This provides a seamless user experience

## Configuration

The middleware runs on all routes except:
- `/api/*` - API routes
- `/_next/static/*` - Static files
- `/_next/image/*` - Image optimization
- `/favicon.ico` - Favicon
- Static assets (svg, png, jpg, etc.)

## Requirements Satisfied

- **Requirement 7.4**: Session management and route protection
- **Task 13.4**: Auth middleware using Next.js 16 middleware API

## Related Files

- `/stores/auth.ts`: Auth store with token management
- `/app/login/page.tsx`: Login page
- `/app/register/page.tsx`: Registration page
- `/composables/useAuth.ts`: Auth composable hook

## Future Enhancements

- Add rate limiting for login attempts
- Implement CSRF token validation
- Add device fingerprinting for security
- Support for remember me functionality
