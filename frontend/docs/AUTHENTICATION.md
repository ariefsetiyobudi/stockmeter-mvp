# Frontend Authentication Implementation

This document describes the frontend authentication implementation for Stockmeter.

## Overview

The authentication system provides user registration, login, and session management with support for:
- Email/password authentication
- Google OAuth
- Facebook OAuth
- JWT token management with auto-refresh
- Protected routes with middleware

## Components

### 1. Auth Store (`stores/auth.ts`)

Pinia store that manages authentication state:
- `user`: Current user object
- `accessToken`: JWT access token
- `isLoading`: Loading state for auth operations
- `isAuthenticated`: Computed getter for auth status
- `isPro`: Computed getter for Pro subscription status

### 2. Auth Composable (`composables/useAuth.ts`)

Main composable for authentication operations:

**Methods:**
- `login(credentials)`: Login with email/password
- `register(credentials)`: Register new user
- `logout()`: Logout and clear session
- `refreshToken()`: Refresh JWT token
- `loginWithGoogle()`: Redirect to Google OAuth
- `loginWithFacebook()`: Redirect to Facebook OAuth
- `checkAuth()`: Check and restore session on app load

**Features:**
- Auto-refresh token every 45 minutes
- Automatic session restoration on app load
- Error handling with user-friendly messages
- Cookie-based token storage (httpOnly)

### 3. Pages

#### Login Page (`pages/login.vue`)
- Email/password form with validation
- Google OAuth button
- Facebook OAuth button
- Form validation using Zod
- Error/success toast notifications
- Redirect to home on success

#### Register Page (`pages/register.vue`)
- Registration form with name, email, password
- Password confirmation validation
- Social login options
- Auto-login after successful registration
- Form validation using Zod

### 4. Middleware

#### Auth Middleware (`middleware/auth.ts`)
Protects routes that require authentication. Redirects to `/login` if not authenticated.

**Usage:**
```vue
<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>
```

#### Pro Middleware (`middleware/pro.ts`)
Protects routes that require Pro subscription. Redirects to `/pricing` if not Pro.

**Usage:**
```vue
<script setup>
definePageMeta({
  middleware: 'pro'
})
</script>
```

### 5. Plugin (`plugins/auth.ts`)

Initializes authentication on app load by attempting to restore the session from cookies.

## API Integration

The authentication system integrates with the backend API:

**Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/google` - Google OAuth initiation
- `GET /api/auth/facebook` - Facebook OAuth initiation

**Token Management:**
- Access tokens stored in memory (Pinia store)
- Refresh tokens stored in httpOnly cookies
- Auto-refresh every 45 minutes
- Tokens included in API requests via Authorization header

## Security Features

1. **HttpOnly Cookies**: Refresh tokens stored in httpOnly cookies to prevent XSS attacks
2. **Token Expiry**: Access tokens expire after 1 hour
3. **Auto-refresh**: Tokens automatically refreshed before expiry
4. **CSRF Protection**: Credentials included in requests for cookie handling
5. **Form Validation**: Client-side validation using Zod schema

## Usage Examples

### Protecting a Route

```vue
<script setup>
definePageMeta({
  middleware: 'auth' // or 'pro' for Pro-only routes
})
</script>
```

### Using Auth in Components

```vue
<script setup>
const { isAuthenticated, isPro, user, login, logout } = useAuth()

const handleLogin = async () => {
  try {
    await login({ email: 'user@example.com', password: 'password' })
    // Success - user is now logged in
  } catch (error) {
    // Handle error
  }
}
</script>

<template>
  <div v-if="isAuthenticated">
    <p>Welcome, {{ user?.name }}</p>
    <span v-if="isPro">PRO User</span>
    <button @click="logout">Logout</button>
  </div>
  <div v-else>
    <NuxtLink to="/login">Login</NuxtLink>
  </div>
</template>
```

### Checking Auth Status

```vue
<script setup>
const { isAuthenticated, isPro } = useAuth()
</script>

<template>
  <div v-if="isAuthenticated">
    <p v-if="isPro">You have Pro access</p>
    <p v-else>Upgrade to Pro for more features</p>
  </div>
</template>
```

## Internationalization

Authentication UI supports multiple languages through i18n:

**Translation Keys:**
- `auth.signIn` - Sign in text
- `auth.signUp` - Sign up text
- `auth.email` - Email label
- `auth.password` - Password label
- `auth.name` - Name label
- `auth.loginSuccess` - Login success message
- `auth.loginError` - Login error message
- `auth.registerSuccess` - Registration success message
- `auth.registerError` - Registration error message

## Testing

To test the authentication flow:

1. Install dependencies: `npm install`
2. Start the backend server
3. Start the frontend: `npm run dev`
4. Navigate to `/register` to create an account
5. Navigate to `/login` to sign in
6. Try accessing protected routes

## Requirements Fulfilled

This implementation fulfills the following requirements:

- **7.1**: Email/password registration and authentication
- **7.2**: Google OAuth integration
- **7.3**: Facebook OAuth integration
- **7.4**: Session management with JWT tokens (30-day refresh tokens)
- **7.6**: Default Free Tier assignment on registration

## Next Steps

- Implement password reset functionality
- Add email verification
- Implement remember me functionality
- Add rate limiting for login attempts
- Add two-factor authentication (optional)
