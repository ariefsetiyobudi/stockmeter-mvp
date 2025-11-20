# Stockmeter Technology Stack Versions

This document lists all major dependencies and their current versions.

## Runtime & Core

- **Node.js**: 20.x LTS
- **npm**: 10.x or higher
- **TypeScript**: 5.7.2

## Backend Stack

### Framework & Server
- **Express.js**: 5.1.0
- **Prisma ORM**: 7.0.0
- **PostgreSQL**: 16.x
- **Redis**: 7.x (ioredis 5.4.2)

### Authentication & Security
- **Passport.js**: 0.7.0
- **passport-local**: 1.0.0
- **passport-google-oauth20**: 2.0.0
- **passport-facebook**: 3.0.0
- **passport-jwt**: 4.0.1
- **bcryptjs**: 2.4.3
- **jsonwebtoken**: 9.0.2
- **helmet**: 8.0.0
- **cors**: 2.8.5
- **express-rate-limit**: 7.5.0

### Payment Providers
- **Stripe**: 17.5.0
- **PayPal SDK**: 1.0.3
- **Midtrans**: 1.3.1

### Utilities
- **axios**: 1.7.9
- **zod**: 3.24.1
- **winston**: 3.17.0
- **node-cron**: 3.0.3
- **@sendgrid/mail**: 8.1.4
- **dotenv**: 16.4.7
- **compression**: 1.7.4
- **morgan**: 1.10.0

### Testing
- **Jest**: 29.7.0
- **ts-jest**: 29.2.5

## Frontend Stack

### Framework & Core
- **Next.js**: 16.0.3
- **React**: 19.2.0
- **React DOM**: 19.2.0

### Styling
- **TailwindCSS**: 4.1.17
- **@tailwindcss/forms**: 0.5.9
- **@tailwindcss/typography**: 0.5.15
- **@tailwindcss/postcss**: 4.1.17
- **PostCSS**: 8.4.49
- **Autoprefixer**: 10.4.20
- **clsx**: 2.1.1
- **tailwind-merge**: 2.6.0
- **class-variance-authority**: 0.7.1

### State Management & Data Fetching
- **Zustand**: 5.0.8
- **TanStack Query (React Query)**: 5.90.2
- **TanStack Query Devtools**: 5.90.2
- **axios**: 1.7.9

### UI Components
- **Radix UI Dialog**: 1.1.4
- **Radix UI Dropdown Menu**: 2.1.4
- **Radix UI Select**: 2.1.4
- **Radix UI Tooltip**: 1.1.6
- **Headless UI**: 2.2.9
- **Heroicons**: 2.2.0

### Forms & Validation
- **React Hook Form**: 7.54.2
- **@hookform/resolvers**: 3.9.1
- **zod**: 3.24.1

### Data Visualization
- **Recharts**: 2.15.0
- **TanStack Table**: 8.21.3

### Internationalization
- **next-intl**: 4.5.5

### Utilities
- **react-hot-toast**: 2.4.1
- **use-debounce**: 10.0.4

### Testing
- **Vitest**: 2.1.8
- **@vitest/ui**: 2.1.8
- **@vitest/coverage-v8**: 2.1.8
- **@vitejs/plugin-react**: 4.3.4
- **@testing-library/react**: 16.1.0
- **@testing-library/jest-dom**: 6.6.3
- **@testing-library/user-event**: 14.5.2
- **jsdom**: 25.0.1

### Development Tools
- **ESLint**: 9.18.0
- **eslint-config-next**: 16.0.3
- **@typescript-eslint/eslint-plugin**: 8.20.0
- **@typescript-eslint/parser**: 8.20.0

## Infrastructure

### Containerization
- **Docker**: Latest
- **Docker Compose**: Latest

### Cloud Services (Google Cloud Platform)
- **Cloud Run**: Latest
- **Cloud SQL (PostgreSQL)**: 16.x
- **Memorystore (Redis)**: 7.x
- **Cloud Build**: Latest
- **Artifact Registry**: Latest
- **Secret Manager**: Latest

## External APIs

### Financial Data Providers
- **Yahoo Finance**: Free tier
- **Financial Modeling Prep (FMP)**: API v3
- **Alpha Vantage**: Latest

### Email Service
- **SendGrid**: Latest API

## Version Update Policy

- **Major versions**: Review breaking changes before updating
- **Minor versions**: Update regularly for new features
- **Patch versions**: Update immediately for security fixes
- **Dependencies**: Run `npm audit` regularly and address vulnerabilities

## Updating Dependencies

### Check for updates
```bash
# Backend
cd backend
npm outdated

# Frontend
cd frontend
npm outdated
```

### Update all dependencies
```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

### Update to latest (including major versions)
```bash
# Use npm-check-updates
npx npm-check-updates -u
npm install
```

## Compatibility Notes

- **Next.js 16** requires React 19
- **React 19** is stable and production-ready
- **TailwindCSS 4** uses new PostCSS plugin architecture
- **Express 5** has breaking changes from Express 4
- **Prisma 7** requires PostgreSQL 12+
- **Node.js 20** is LTS until April 2026

## Last Updated

December 2024
