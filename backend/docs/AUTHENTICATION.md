# Authentication System Documentation

## Overview

The authentication system for Stockmeter MVP has been fully implemented with support for:
- Email/password authentication
- Google OAuth2
- Facebook OAuth
- JWT-based token authentication
- Role-based access control (Free vs Pro tier)

## Components

### 1. Passport Configuration (`src/config/passport.ts`)
- Configures Passport.js with three strategies:
  - **Local Strategy**: Email/password authentication with bcrypt
  - **Google OAuth2 Strategy**: Google sign-in integration
  - **Facebook Strategy**: Facebook sign-in integration
- Handles user serialization/deserialization
- Automatically creates users on first OAuth login

### 2. Auth Service (`src/services/auth.service.ts`)
Core authentication business logic:
- `registerUser()`: Register new users with bcrypt password hashing (10 rounds)
- `loginUser()`: Authenticate with email/password
- `loginWithGoogle()`: Handle Google OAuth authentication
- `loginWithSocial()`: Handle other social provider authentication
- `verifyToken()`: Verify JWT access tokens
- `refreshToken()`: Refresh expired access tokens

**Token Configuration:**
- Access tokens: 1 hour expiry
- Refresh tokens: 30 days expiry
- JWT secret from environment variable

### 3. Auth Middleware (`src/middleware/auth.middleware.ts`)
Two middleware functions for route protection:

#### `requireAuth`
- Verifies JWT token from Authorization header
- Attaches user object to request
- Returns 401 for invalid/expired tokens

#### `requirePro`
- Checks if user has Pro subscription
- Must be used after `requireAuth`
- Returns 403 for non-Pro users
- Automatically updates expired subscriptions

### 4. Auth Routes (`src/routes/auth.routes.ts`)
RESTful API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/facebook` | Initiate Facebook OAuth |
| GET | `/api/auth/facebook/callback` | Facebook OAuth callback |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (client-side) |

## API Usage Examples

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "subscriptionStatus": "free",
      "subscriptionExpiry": null
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Protected Route Example
```bash
GET /api/protected-endpoint
Authorization: Bearer eyJhbGc...
```

### Refresh Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

## Environment Variables Required

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3001/api/auth/facebook/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## Using Middleware in Routes

### Require Authentication
```typescript
import { requireAuth } from '../middleware/auth.middleware';

router.get('/protected', requireAuth, async (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});
```

### Require Pro Subscription
```typescript
import { requireAuth, requirePro } from '../middleware/auth.middleware';

router.get('/pro-feature', requireAuth, requirePro, async (req, res) => {
  // Only Pro users can access this
  res.json({ message: 'Pro feature accessed' });
});
```

## Error Handling

The authentication system returns standardized error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

Common error codes:
- `UNAUTHORIZED`: No token or invalid token
- `TOKEN_EXPIRED`: Access token has expired
- `INVALID_TOKEN`: Malformed token
- `USER_NOT_FOUND`: User doesn't exist
- `PRO_SUBSCRIPTION_REQUIRED`: Feature requires Pro tier
- `SUBSCRIPTION_EXPIRED`: Pro subscription has expired
- `VALIDATION_ERROR`: Invalid input data
- `AUTHENTICATION_FAILED`: Invalid credentials

## Security Features

1. **Password Security**
   - Bcrypt hashing with 10 salt rounds
   - Passwords never stored in plain text

2. **Token Security**
   - JWT with expiration
   - Separate access and refresh tokens
   - Token type validation

3. **Input Validation**
   - Zod schema validation
   - Email format validation
   - Password minimum length (8 characters)

4. **OAuth Security**
   - Secure callback URLs
   - Email verification from OAuth providers
   - Automatic user creation on first login

## Testing

To test the authentication system:

1. Ensure PostgreSQL is running
2. Run migrations: `npm run prisma:migrate`
3. Start the server: `npm run dev`
4. Use the API endpoints with tools like Postman or curl

## Next Steps

The authentication system is complete and ready for integration with:
- Stock search and data endpoints (Task 7)
- Batch comparison feature (Task 8)
- Watchlist functionality (Task 9)
- Payment and subscription system (Task 10)
- Alert and notification system (Task 11)
