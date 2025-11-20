# Design Document

## Overview

Stockmeter is a full-stack web application built with a Node.js/Express backend and Next.js 16 frontend. The system architecture follows a three-tier pattern: presentation layer (Next.js), application layer (Express.js API), and data layer (PostgreSQL). The application integrates with multiple financial data providers through an adapter pattern, performs automated valuation calculations using industry-standard models, and supports both free and premium subscription tiers with payment processing.

### Technology Stack

**Backend:**
- Node.js 20.x LTS (latest LTS)
- Express.js 5.1.x (latest stable - v5.1.0)
- TypeScript 5.x (latest)
- PostgreSQL 16.x (latest stable)
- Prisma 7.x (latest ORM - v7.0.0)
- ioredis 5.x for Redis caching (more performant than node-cache)
- Passport.js 0.7.x for authentication (local, Google OAuth, social)
- stripe 17.x (latest Stripe SDK)
- @paypal/checkout-server-sdk 1.x (latest PayPal SDK)
- midtrans-client 1.x (latest Midtrans SDK)
- node-cron 3.x for scheduled tasks
- axios 1.x for HTTP requests
- Zod 3.x for schema validation (more modern than Joi)
- Winston 3.x for logging

**Frontend:**
- Next.js 16.x (latest with App Router - v16.0.3)
- React 19.2.x (latest stable - v19.2.0)
- TypeScript 5.x (latest)
- TailwindCSS 4.x (latest stable - v4.1.17)
- Zustand 5.x for state management (lightweight alternative to Redux - v5.0.8)
- React Query (TanStack Query) 5.x for data fetching and caching (v5.90.2)
- Recharts 2.x for data visualization
- @headlessui/react 2.x for accessible UI components
- @radix-ui/react-tooltip 1.x for tooltips
- @heroicons/react 2.x for icons
- react-hook-form 7.x for form handling
- zod 3.x for schema validation
- axios 1.x for HTTP requests
- react-hot-toast 2.x for notifications

**Infrastructure:**
- Docker 27.x (latest)
- Google Cloud Run (serverless containers)
- Google Cloud SQL for PostgreSQL 16
- Google Cloud Memorystore for Redis (production caching)
- Google Cloud Build for CI/CD
- Local PostgreSQL 16 + Redis 7 for development

## Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end
    
    subgraph "Presentation Layer"
        Next[Next.js Frontend<br/>Port 3000]
    end
    
    subgraph "Application Layer"
        Express[Express.js API<br/>Port 3001]
        Auth[Auth Service]
        Valuation[Valuation Service]
        Alert[Alert Service]
        Payment[Payment Service]
    end
    
    subgraph "Data Access Layer"
        Prisma[Prisma ORM]
        Cache[Node-Cache]
        Adapter[Provider Adapter]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
    end
    
    subgraph "External Services"
        Yahoo[Yahoo Finance API]
        FMP[Financial Modeling Prep]
        Alpha[Alpha Vantage]
        Stripe[Stripe]
        PayPal[PayPal]
        Midtrans[Midtrans]
        Email[Email Service]
    end
    
    Browser --> Next
    Mobile --> Next
    Next --> Express
    Express --> Auth
    Express --> Valuation
    Express --> Alert
    Express --> Payment
    Auth --> Prisma
    Valuation --> Cache
    Valuation --> Adapter
    Alert --> Prisma
    Payment --> Stripe
    Payment --> PayPal
    Payment --> Midtrans
    Alert --> Email
    Adapter --> Yahoo
    Adapter --> FMP
    Adapter --> Alpha
    Prisma --> DB
    Cache --> DB
```

### Request Flow

1. **Stock Search Flow:**
   - User enters search query in frontend
   - Frontend sends GET request to `/api/stocks/search?q={query}`
   - Backend checks cache for recent search results
   - If cache miss, backend calls provider adapter
   - Provider adapter queries Yahoo Finance (primary)
   - Results cached for 5 minutes
   - Response returned to frontend with ticker, name, exchange

2. **Fair Value Calculation Flow:**
   - User selects stock from search results
   - Frontend requests `/api/stocks/{ticker}` and `/api/stocks/{ticker}/financials`
   - Backend checks cache for stock data (5 min) and financials (24 hours)
   - If cache miss, provider adapter fetches from financial API
   - Valuation service calculates DCF, DDM, P/E, Graham Number
   - Results include fair values, current price, valuation status
   - Frontend displays results with color coding

3. **Authentication Flow:**
   - User clicks login/register
   - Frontend redirects to auth endpoint
   - Passport.js handles authentication (local/OAuth)
   - JWT token generated and returned
   - Frontend stores token in httpOnly cookie
   - Subsequent requests include token in Authorization header

4. **Payment Flow:**
   - User selects subscription plan
   - Frontend calls `/api/payments/subscribe` with plan details
   - Backend creates payment session with Stripe/PayPal/Midtrans
   - User redirected to payment provider
   - Payment provider sends webhook to `/api/payments/webhook`
   - Backend updates user subscription status
   - Frontend refreshes user profile

## Components and Interfaces

### Backend Components

#### 1. Provider Adapter Layer

**Purpose:** Abstract financial data provider integration to allow easy switching and failover

**Interface:**
```typescript
interface IFinancialDataProvider {
  searchStocks(query: string): Promise<StockSearchResult[]>;
  getStockProfile(ticker: string): Promise<StockProfile>;
  getStockPrice(ticker: string): Promise<StockPrice>;
  getFinancials(ticker: string, period: 'annual' | 'quarterly'): Promise<FinancialStatements>;
  getIndustryPeers(ticker: string): Promise<IndustryPeer[]>;
}

interface StockSearchResult {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
}

interface StockProfile {
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  description: string;
  marketCap: number;
  sharesOutstanding: number;
}

interface StockPrice {
  ticker: string;
  price: number;
  currency: string;
  timestamp: Date;
}

interface FinancialStatements {
  ticker: string;
  period: 'annual' | 'quarterly';
  statements: FinancialStatement[];
}

interface FinancialStatement {
  date: string;
  revenue: number;
  netIncome: number;
  ebitda: number;
  eps: number;
  totalAssets: number;
  totalLiabilities: number;
  bookValue: number;
  freeCashFlow: number;
  capex: number;
  workingCapital: number;
  dividendPerShare: number;
}
```

**Implementations:**
- `YahooFinanceProvider` - Primary provider (free, good coverage)
- `FMPProvider` - Secondary provider (paid, comprehensive)
- `AlphaVantageProvider` - Tertiary provider (free tier available)

**Provider Manager:**
```typescript
class ProviderManager {
  private providers: IFinancialDataProvider[];
  private currentProviderIndex: number;
  
  async executeWithFailover<T>(
    operation: (provider: IFinancialDataProvider) => Promise<T>
  ): Promise<T> {
    // Try current provider, failover to next on error
    // Log provider health status
    // Track rate limits
  }
}
```

#### 2. Valuation Service

**Purpose:** Calculate fair value using multiple valuation models

**Interface:**
```typescript
interface IValuationService {
  calculateDCF(ticker: string, financials: FinancialStatements): Promise<DCFResult>;
  calculateDDM(ticker: string, financials: FinancialStatements): Promise<DDMResult>;
  calculateRelativeValue(ticker: string, financials: FinancialStatements, peers: IndustryPeer[]): Promise<RelativeValueResult>;
  calculateGrahamNumber(ticker: string, financials: FinancialStatements): Promise<GrahamResult>;
  calculateAllModels(ticker: string): Promise<FairValueResult>;
}

interface DCFResult {
  fairValue: number;
  assumptions: {
    revenueGrowthRate: number;
    wacc: number;
    terminalGrowthRate: number;
    projectionYears: number;
  };
  projectedCashFlows: number[];
}

interface DDMResult {
  fairValue: number | null;
  assumptions: {
    dividendGrowthRate: number;
    discountRate: number;
  };
  applicable: boolean;
}

interface RelativeValueResult {
  peRatioFairValue: number;
  pbRatioFairValue: number;
  psRatioFairValue: number;
  companyMetrics: {
    pe: number;
    pb: number;
    ps: number;
  };
  industryMedians: {
    pe: number;
    pb: number;
    ps: number;
  };
}

interface GrahamResult {
  fairValue: number | null;
  assumptions: {
    eps: number;
    bookValuePerShare: number;
  };
  applicable: boolean;
}

interface FairValueResult {
  ticker: string;
  currentPrice: number;
  dcf: DCFResult;
  ddm: DDMResult;
  relativeValue: RelativeValueResult;
  graham: GrahamResult;
  valuationStatus: 'undervalued' | 'fairly_priced' | 'overvalued';
  calculatedAt: Date;
}
```

**DCF Calculation Logic:**
1. Retrieve 5-10 years of historical financials
2. Calculate historical revenue CAGR (5-year)
3. Calculate historical FCF margin average
4. Project revenue for 10 years using growth rate
5. Project FCF using revenue × FCF margin
6. Determine WACC (8-12% based on sector/risk)
7. Calculate terminal value (FCF × (1 + g) / (WACC - g))
8. Discount all cash flows to present value
9. Divide by shares outstanding for per-share value

**DDM Calculation Logic:**
1. Check if stock pays dividends (last 3 years)
2. Calculate dividend CAGR
3. Apply Gordon Growth Model: D1 / (r - g)
4. Use required return 8-12%

**Relative Value Logic:**
1. Fetch industry peers (minimum 10)
2. Calculate median P/E, P/B, P/S
3. Apply medians to company metrics
4. Fair Value = Metric × Industry Median

**Graham Number Logic:**
1. Graham Number = √(22.5 × EPS × Book Value per Share)
2. Return null if EPS or book value negative

#### 3. Authentication Service

**Purpose:** Handle user registration, login, and session management

**Interface:**
```typescript
interface IAuthService {
  registerUser(email: string, password: string, name: string): Promise<User>;
  loginUser(email: string, password: string): Promise<AuthResult>;
  loginWithGoogle(googleToken: string): Promise<AuthResult>;
  loginWithSocial(provider: string, token: string): Promise<AuthResult>;
  verifyToken(token: string): Promise<User>;
  refreshToken(refreshToken: string): Promise<AuthResult>;
}

interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  subscriptionStatus: 'free' | 'pro' | 'expired';
  subscriptionExpiry: Date | null;
  createdAt: Date;
}
```

**Implementation:**
- Use Passport.js with local strategy for email/password
- Use Passport.js Google OAuth2 strategy
- JWT tokens with 1-hour expiry for access, 30-day for refresh
- Bcrypt for password hashing (10 rounds)

#### 4. Payment Service

**Purpose:** Handle subscription purchases and webhook processing

**Interface:**
```typescript
interface IPaymentService {
  createSubscription(userId: string, plan: SubscriptionPlan, provider: PaymentProvider): Promise<PaymentSession>;
  handleWebhook(provider: PaymentProvider, payload: any, signature: string): Promise<void>;
  cancelSubscription(userId: string): Promise<void>;
  getSubscriptionStatus(userId: string): Promise<SubscriptionStatus>;
}

interface SubscriptionPlan {
  type: 'monthly' | 'yearly';
  price: number;
  currency: string;
}

interface PaymentSession {
  sessionId: string;
  checkoutUrl: string;
}

type PaymentProvider = 'stripe' | 'paypal' | 'midtrans';

interface SubscriptionStatus {
  status: 'free' | 'pro' | 'expired';
  expiryDate: Date | null;
  autoRenew: boolean;
}
```

**Implementation:**
- Stripe: Use Checkout Sessions for subscription
- PayPal: Use Subscriptions API
- Midtrans: Use Snap for payment page
- Webhook verification using provider signatures
- Update user subscription status on successful payment
- Handle subscription renewals and cancellations

#### 5. Alert Service

**Purpose:** Monitor stocks and send notifications when conditions met

**Interface:**
```typescript
interface IAlertService {
  createAlert(userId: string, alert: AlertConfig): Promise<Alert>;
  deleteAlert(alertId: string): Promise<void>;
  checkAlerts(): Promise<void>;
  sendNotification(userId: string, alert: Alert, stock: FairValueResult): Promise<void>;
}

interface AlertConfig {
  ticker: string;
  thresholdType: 'undervalued' | 'overvalued' | 'fair';
  thresholdValue: number;
}

interface Alert {
  id: string;
  userId: string;
  ticker: string;
  thresholdType: string;
  thresholdValue: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}
```

**Implementation:**
- Cron job runs every 24 hours
- Fetch all active alerts
- Calculate fair values for watched stocks
- Compare against thresholds
- Send email via SendGrid/AWS SES
- Log notification history

#### 6. Cache Service

**Purpose:** Reduce API calls and improve performance using Redis

**Implementation:**
```typescript
import Redis from 'ioredis';

class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });
  }
  
  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }
  
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

**Cache Strategy:**
- Stock prices: 5 minutes TTL (300 seconds)
- Financial statements: 24 hours TTL (86400 seconds)
- Search results: 5 minutes TTL (300 seconds)
- Fair value calculations: 1 hour TTL (3600 seconds)
- Industry peer data: 24 hours TTL (86400 seconds)

**Local Development:** Use Redis Docker container or local Redis installation
**Production:** Use Google Cloud Memorystore for Redis (managed service)

### Frontend Components

#### 1. Page Components (App Router)

**HomePage (`app/page.tsx`):**
- Hero section with StockSearchBar component
- Feature comparison (Free vs Pro)
- Call-to-action for registration
- How it works section

**StockDetailPage (`app/stocks/[ticker]/page.tsx`):**
- Current price and company profile
- Fair value calculations from all models using FairValueCard
- Valuation status indicators
- Model assumptions tooltips
- Add to watchlist button
- Link to detailed model breakdown (Pro only)

**ModelDetailsPage (`app/stocks/[ticker]/details/page.tsx`):**
- Detailed calculation steps (Pro only)
- All assumptions and inputs
- Projected cash flows table
- Upgrade prompt for free users

**ComparePage (`app/compare/page.tsx`):**
- Multi-stock comparison table
- Add/remove stocks interface
- Export button (Pro only)
- Upgrade prompt for free users

**WatchlistPage (`app/watchlist/page.tsx`):**
- User's saved stocks
- Current prices and valuation status
- Quick actions (view detail, remove)
- Limit indicator for free users

**ProfilePage (`app/profile/page.tsx`):**
- User information
- Subscription status
- Payment history
- Language and currency preferences

**PricingPage (`app/pricing/page.tsx`):**
- Free vs Pro comparison
- Subscription plans
- Payment options

**LoginPage (`app/login/page.tsx`):**
- Email/password login form
- Google OAuth button
- Facebook OAuth button
- Link to registration

**RegisterPage (`app/register/page.tsx`):**
- Registration form
- Email, password, name fields
- Auto-login after registration

#### 2. Component Library

**StockSearchBar (`components/StockSearchBar.tsx`):**
- Input with autocomplete using @headlessui/react Combobox
- Debounced search (300ms) using use-debounce
- Dropdown results showing ticker, name, exchange
- Loading spinner
- Navigation to stock detail on selection

**FairValueCard (`components/FairValueCard.tsx`):**
- Model name and fair value display
- Valuation status badge with soft color coding (green/red/white)
- Assumptions tooltip using @radix-ui/react-tooltip
- Price difference percentage
- Responsive design

**StockTable (`components/StockTable.tsx`):**
- Sortable columns using @tanstack/react-table
- Color-coded valuation status
- Responsive design
- Pagination

**SubscriptionModal (`components/SubscriptionModal.tsx`):**
- Plan selection
- Payment provider selection using @radix-ui/react-dialog
- Checkout flow

**AlertForm (`components/AlertForm.tsx`):**
- Ticker input with autocomplete
- Threshold configuration
- Form validation using react-hook-form and zod
- Save/cancel actions

**LoadingSpinner (`components/LoadingSpinner.tsx`):**
- Reusable loading indicator
- Different sizes

**ToastContainer (`components/ToastContainer.tsx`):**
- Toast notifications using react-hot-toast
- Success, error, warning, info types

#### 3. Custom Hooks and State Management

**Stock Data Hooks (`hooks/useStockData.ts` - React Query):**
```typescript
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
});

// Search stocks with 300ms debouncing
export function useStockSearch(query: string) {
  const [debouncedQuery] = useDebounce(query, 300);
  
  return useQuery({
    queryKey: ['stocks', 'search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const response = await apiClient.get('/api/stocks/search', {
        params: { q: debouncedQuery },
      });
      return response.data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get stock detail
export function useStockDetail(ticker: string) {
  return useQuery({
    queryKey: ['stocks', ticker, 'detail'],
    queryFn: async () => {
      const response = await apiClient.get(`/api/stocks/${ticker}`);
      return response.data;
    },
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000,
  });
}

// Get fair value
export function useFairValue(ticker: string) {
  return useQuery({
    queryKey: ['stocks', ticker, 'fairvalue'],
    queryFn: async () => {
      const response = await apiClient.get(`/api/stocks/${ticker}/fairvalue`);
      return response.data;
    },
    enabled: !!ticker,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Get model details (Pro only)
export function useModelDetails(ticker: string) {
  return useQuery({
    queryKey: ['stocks', ticker, 'modeldetails'],
    queryFn: async () => {
      const response = await apiClient.get(`/api/stocks/${ticker}/modeldetails`);
      return response.data;
    },
    enabled: !!ticker,
    staleTime: 60 * 60 * 1000,
  });
}
```

**React Query Provider (`lib/providers.tsx`):**
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          gcTime: 5 * 60 * 1000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Auth Store (`stores/auth.ts` - Zustand):**
```typescript
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isPro: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isPro: false,
  login: async (email, password) => { /* implementation */ },
  logout: async () => { /* implementation */ },
  register: async (email, password, name) => { /* implementation */ },
}));
```

**Watchlist Store (`stores/watchlist.ts` - Zustand):**
```typescript
import { create } from 'zustand';

interface WatchlistState {
  watchlist: string[];
  addToWatchlist: (ticker: string) => Promise<void>;
  removeFromWatchlist: (ticker: string) => Promise<void>;
  loadWatchlist: () => Promise<void>;
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  watchlist: [],
  addToWatchlist: async (ticker) => { /* implementation */ },
  removeFromWatchlist: async (ticker) => { /* implementation */ },
  loadWatchlist: async () => { /* implementation */ },
}));
```

## Data Models

### Database Schema (PostgreSQL with Prisma)

```prisma
model User {
  id                  String    @id @default(uuid())
  email               String    @unique
  name                String
  passwordHash        String?
  authProvider        String    @default("email")
  subscriptionStatus  String    @default("free")
  subscriptionExpiry  DateTime?
  languagePreference  String    @default("en")
  currencyPreference  String    @default("USD")
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  watchlist           Watchlist[]
  alerts              Alert[]
  transactions        Transaction[]
  
  @@index([email])
}

model Watchlist {
  id        String   @id @default(uuid())
  userId    String
  ticker    String
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, ticker])
  @@index([userId])
}

model Alert {
  id             String   @id @default(uuid())
  userId         String
  ticker         String
  thresholdType  String
  thresholdValue Float
  status         String   @default("active")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
}

model Transaction {
  id          String   @id @default(uuid())
  userId      String
  provider    String
  plan        String
  amount      Float
  currency    String   @default("USD")
  status      String
  externalId  String?
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
}

model StockCache {
  id          String   @id @default(uuid())
  ticker      String   @unique
  data        Json
  dataType    String
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([ticker, dataType])
  @@index([expiresAt])
}

model ProviderStatus {
  id             String   @id @default(uuid())
  provider       String   @unique
  status         String
  remainingCalls Int?
  lastChecked    DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([provider])
}
```

## Error Handling

### Error Types

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, message);
  }
}

class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}

class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(429, message);
  }
}

class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(503, `${service} error: ${message}`);
  }
}
```

### Error Handling Strategy

**Backend:**
1. Global error handler middleware
2. Async error wrapper for route handlers
3. Specific error types for different scenarios
4. Logging with Winston or Pino
5. Error responses with consistent format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid ticker symbol",
    "details": {}
  }
}
```

**Frontend:**
1. Axios interceptor for API errors
2. Toast notifications for user-facing errors
3. Error boundaries for component errors
4. Retry logic for transient failures
5. Fallback UI for critical errors

**Provider Failover:**
1. Catch provider errors
2. Log failure and provider status
3. Attempt next provider in list
4. Return error if all providers fail
5. Update provider health status

## Testing Strategy

### Backend Testing

**Unit Tests (Jest):**
- Valuation service calculations
- Provider adapter methods
- Authentication logic
- Payment webhook processing
- Cache service operations
- Target: 80% code coverage

**Integration Tests:**
- API endpoint responses
- Database operations with test DB
- Provider adapter with mocked APIs
- Authentication flows
- Payment flows with test mode

**Test Structure:**
```
backend/
  src/
    services/
      valuation.service.ts
      valuation.service.test.ts
    adapters/
      yahoo-finance.adapter.ts
      yahoo-finance.adapter.test.ts
```

### Frontend Testing

**Unit Tests (Vitest):**
- Hook logic (useStockData, useAuth)
- Utility functions
- Type definitions

**Component Tests (Vitest + React Testing Library):**
- User interactions
- Form submissions with react-hook-form
- Conditional rendering
- State management with Zustand

**Integration Tests:**
- API integration with React Query
- Authentication flows
- Watchlist operations

**E2E Tests (Playwright - Optional):**
- Critical user flows
- Authentication
- Stock search and detail view
- Subscription purchase

### Testing Commands

```bash
# Backend
cd backend
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report

# Frontend
cd frontend
npm run test              # Run all tests (vitest --run)
npm run test:watch        # Watch mode (vitest)
npm run test:ui           # Vitest UI
npm run test:coverage     # Coverage report
```

## Deployment Architecture

### Local Development

```
┌─────────────────┐
│  Developer      │
│  Workstation    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│Next  │  │Express│
│:3000 │  │:3001  │
└──────┘  └───┬───┘
              │
         ┌────┴────┐
         │         │
    ┌────▼────┐ ┌─▼────┐
    │PostgreSQL│ │Redis │
    │:5432     │ │:6379 │
    └──────────┘ └──────┘
```

**Setup:**
1. Install PostgreSQL 16 locally or use Docker
2. Install Redis locally or use Docker
3. Create database: `stockmeter_dev`
4. Run migrations: `npx prisma migrate dev`
5. Configure `.env` files
6. Start Redis: `redis-server` or `docker run -p 6379:6379 redis:7-alpine`
7. Start backend: `npm run dev`
8. Start frontend: `npm run dev`

**Docker Compose for Local Development:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: stockmeter_dev
      POSTGRES_USER: stockmeter
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Production (Google Cloud)

```
┌──────────────┐
│   Users      │
└──────┬───────┘
       │
┌──────▼────────┐
│ Cloud Load    │
│ Balancer      │
└──────┬────────┘
       │
   ┌───┴────┐
   │        │
┌──▼──┐  ┌─▼───┐
│Next │  │Express│
│Cloud│  │Cloud  │
│Run  │  │Run    │
└─────┘  └───┬───┘
             │
        ┌────┴─────┐
        │          │
   ┌────▼────┐ ┌──▼────────┐
   │Cloud SQL│ │Memorystore│
   │PostgreSQL│ │Redis      │
   └─────────┘ └───────────┘
```

**Deployment Steps:**
1. Build Docker images for backend and frontend
2. Push to Google Artifact Registry (newer than Container Registry)
3. Deploy backend to Cloud Run with Cloud SQL and Memorystore connections
4. Deploy frontend to Cloud Run
5. Configure Cloud SQL (PostgreSQL 16) instance
6. Configure Memorystore (Redis 7) instance
7. Set environment variables via Cloud Run secrets
8. Configure custom domain with Cloud Load Balancer
9. Enable HTTPS with managed SSL certificates
10. Set up Cloud Build triggers for CI/CD

### Environment Variables

**Backend (.env):**
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://stockmeter:dev_password@localhost:5432/stockmeter_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=30d

# Financial Data Providers
YAHOO_FINANCE_API_KEY=
FMP_API_KEY=
ALPHA_VANTAGE_API_KEY=
TWELVE_DATA_API_KEY=

# Payment Providers
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false

# Email (SendGrid or AWS SES)
SENDGRID_API_KEY=
FROM_EMAIL=noreply@stockmeter.com

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=http://localhost:3001/auth/facebook/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

## Security Considerations

1. **Authentication:**
   - JWT tokens with short expiry
   - Refresh token rotation
   - HttpOnly cookies for token storage
   - CSRF protection

2. **API Security:**
   - Rate limiting (express-rate-limit)
   - Input validation (Joi or Zod)
   - SQL injection prevention (Prisma parameterized queries)
   - CORS configuration

3. **Payment Security:**
   - Webhook signature verification
   - No storage of credit card data
   - PCI compliance through payment providers
   - Secure payment redirect flows

4. **Data Protection:**
   - Password hashing with bcrypt
   - Environment variables for secrets
   - Encrypted database connections
   - HTTPS only in production

5. **Provider API Keys:**
   - Stored in environment variables
   - Never exposed to frontend
   - Rotated regularly
   - Rate limit monitoring

## Performance Optimization

1. **Caching:**
   - In-memory cache for frequent queries
   - Database query optimization
   - CDN for static assets

2. **Database:**
   - Indexes on frequently queried fields
   - Connection pooling
   - Query optimization

3. **API:**
   - Response compression (gzip)
   - Pagination for large datasets
   - Batch operations where possible

4. **Frontend:**
   - Code splitting
   - Lazy loading components
   - Image optimization
   - SSR for initial page load

## Monitoring and Logging

1. **Application Logging:**
   - Winston or Pino for structured logs
   - Log levels: error, warn, info, debug
   - Request/response logging
   - Error stack traces

2. **Metrics:**
   - API response times
   - Provider API call counts
   - Cache hit/miss rates
   - User subscription conversions

3. **Alerts:**
   - Provider API failures
   - Database connection issues
   - High error rates
   - Payment processing failures

4. **Tools:**
   - Google Cloud Logging
   - Google Cloud Monitoring
   - Sentry for error tracking (optional)
