# Implementation Plan

This implementation plan breaks down the Stockmeter MVP into discrete, actionable coding tasks. Each task builds incrementally on previous work, with all code integrated into the application. Tasks reference specific requirements from the requirements document.

## Task List

- [x] 1. Initialize project structure and development environment
  - Create monorepo structure with backend and frontend directories
  - Initialize backend: Express.js 5.1.x with TypeScript, configure tsconfig.json, setup folder structure (src/routes, src/services, src/adapters, src/middleware, src/types)
  - Initialize frontend: Next.js 16.x with TypeScript and App Router, configure next.config.ts, setup folder structure (app, components, hooks, stores, lib)
  - Create docker-compose.yml for PostgreSQL 16 and Redis 7
  - Create .env.example files for both backend and frontend with all required variables
  - Setup package.json scripts for development (dev, build, test)
  - _Requirements: 14.1, 14.2, 14.3, 14.5, 14.6_

- [x] 2. Setup database and ORM
  - [x] 2.1 Configure Prisma 7.x with PostgreSQL
    - Install Prisma dependencies (latest v7.0.0)
    - Create prisma/schema.prisma with User, Watchlist, Alert, Transaction, StockCache, ProviderStatus models
    - Configure database connection string from environment variables
    - Create initial migration
    - Generate Prisma Client
    - _Requirements: 14.1, 14.2_
  
  - [x] 2.2 Create database seed script
    - Write seed.ts to populate initial data (provider status, test users for development)
    - Add seed command to package.json
    - _Requirements: 14.1_

- [x] 3. Implement Redis caching service
  - [x] 3.1 Create CacheService class with ioredis
    - Install ioredis dependency
    - Implement CacheService with get, set, del methods
    - Configure Redis connection with retry strategy
    - Add connection error handling and logging
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [x] 3.2 Create cache key generation utilities
    - Write utility functions for consistent cache key naming (stock:price:{ticker}, stock:financials:{ticker}, etc.)
    - Implement TTL constants for different data types
    - _Requirements: 11.1, 11.2_

- [x] 4. Build financial data provider adapter layer
  - [x] 4.1 Define provider interfaces and types
    - Create IFinancialDataProvider interface with all required methods
    - Define TypeScript types: StockSearchResult, StockProfile, StockPrice, FinancialStatements, FinancialStatement, IndustryPeer
    - _Requirements: 10.1, 10.6_
  
  - [x] 4.2 Implement Yahoo Finance provider adapter
    - Create YahooFinanceProvider class implementing IFinancialDataProvider
    - Implement searchStocks method using Yahoo Finance API
    - Implement getStockProfile, getStockPrice methods
    - Implement getFinancials method for income statement, balance sheet, cash flow
    - Implement getIndustryPeers method
    - Add error handling and response parsing
    - _Requirements: 10.2, 1.1, 1.2, 2.1_
  
  - [x] 4.3 Implement Financial Modeling Prep provider adapter
    - Create FMPProvider class implementing IFinancialDataProvider
    - Implement all interface methods using FMP API endpoints
    - Add API key authentication
    - _Requirements: 10.3_
  
  - [x] 4.4 Implement Alpha Vantage provider adapter
    - Create AlphaVantageProvider class implementing IFinancialDataProvider
    - Implement all interface methods using Alpha Vantage API endpoints
    - Add API key authentication
    - _Requirements: 10.4_
  
  - [x] 4.5 Create ProviderManager with failover logic
    - Implement ProviderManager class to manage multiple providers
    - Add executeWithFailover method that tries providers in sequence
    - Implement provider health tracking and automatic failover
    - Add rate limit tracking per provider
    - Log provider failures and switches
    - _Requirements: 10.5, 11.4, 11.5_

- [x] 5. Implement valuation calculation services
  - [x] 5.1 Create DCF valuation calculator
    - Implement calculateDCF method in ValuationService
    - Calculate historical revenue CAGR from 5-year data
    - Calculate historical FCF margin average
    - Project 10-year revenue and FCF
    - Determine WACC based on sector (8-12% range)
    - Calculate terminal value with 2-3% perpetual growth
    - Discount cash flows to present value
    - Return DCFResult with fair value and assumptions
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_
  
  - [x] 5.2 Create DDM valuation calculator
    - Implement calculateDDM method in ValuationService
    - Check if stock pays dividends (last 3 years)
    - Calculate dividend CAGR
    - Apply Gordon Growth Model formula
    - Use 8-12% required return
    - Return DDMResult with fair value or null if not applicable
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  
  - [x] 5.3 Create relative valuation calculator
    - Implement calculateRelativeValue method in ValuationService
    - Fetch industry peer data (minimum 10 companies)
    - Calculate median P/E, P/B, P/S ratios
    - Apply medians to company metrics
    - Calculate fair values for each ratio
    - Return RelativeValueResult with all metrics
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_
  
  - [x] 5.4 Create Graham Number calculator
    - Implement calculateGrahamNumber method in ValuationService
    - Extract EPS and book value per share from financials
    - Apply Graham formula: √(22.5 × EPS × BVPS)
    - Return null if EPS or book value is negative
    - Return GrahamResult with fair value
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_
  
  - [x] 5.5 Create unified fair value calculation method
    - Implement calculateAllModels method that calls all calculators
    - Determine valuation status (undervalued/fair/overvalued) based on 10% threshold
    - Integrate with cache service to store results for 1 hour
    - Return FairValueResult with all model outputs
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 6. Implement authentication system
  - [x] 6.1 Setup Passport.js with strategies
    - Install passport, passport-local, passport-google-oauth20, passport-facebook dependencies
    - Configure Passport with local strategy for email/password
    - Configure Google OAuth2 strategy
    - Configure Facebook strategy
    - Implement serialization and deserialization
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 6.2 Create AuthService with user management
    - Implement registerUser method with bcrypt password hashing (10 rounds)
    - Implement loginUser method with password verification
    - Implement loginWithGoogle method
    - Implement loginWithSocial method for Facebook
    - Generate JWT access tokens (1 hour expiry) and refresh tokens (30 days)
    - Implement verifyToken and refreshToken methods
    - _Requirements: 7.4, 7.5, 7.6_
  
  - [x] 6.3 Create authentication middleware
    - Implement requireAuth middleware to protect routes
    - Implement requirePro middleware to check subscription status
    - Add JWT token verification in middleware
    - Handle authentication errors with proper status codes
    - _Requirements: 7.4, 4.4, 6.4, 8.4, 9.4_
  
  - [x] 6.4 Create auth API endpoints
    - POST /api/auth/register - user registration
    - POST /api/auth/login - email/password login
    - GET /api/auth/google - initiate Google OAuth
    - GET /api/auth/google/callback - Google OAuth callback
    - GET /api/auth/facebook - initiate Facebook OAuth
    - GET /api/auth/facebook/callback - Facebook OAuth callback
    - POST /api/auth/refresh - refresh access token
    - POST /api/auth/logout - logout user
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 7. Implement stock search and data endpoints
  - [x] 7.1 Create stock search endpoint
    - Implement GET /api/stocks/search with query parameter
    - Integrate with ProviderManager to search stocks
    - Check cache first (5 min TTL)
    - Return up to 20 results with ticker, name, exchange
    - Add response time optimization (< 2 seconds)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 7.2 Create stock profile endpoint
    - Implement GET /api/stocks/:ticker
    - Fetch stock profile from provider via ProviderManager
    - Cache result for 5 minutes
    - Return company profile with sector, industry, description
    - _Requirements: 2.1_
  
  - [x] 7.3 Create stock financials endpoint
    - Implement GET /api/stocks/:ticker/financials
    - Fetch financial statements from provider
    - Cache result for 24 hours
    - Return income statement, balance sheet, cash flow data
    - _Requirements: 2.1, 15.1_
  
  - [x] 7.4 Create fair value calculation endpoint
    - Implement GET /api/stocks/:ticker/fairvalue
    - Call ValuationService.calculateAllModels
    - Return all model results with current price
    - Include valuation status and color coding
    - Cache result for 1 hour
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 7.5 Create model details endpoint
    - Implement GET /api/stocks/:ticker/modeldetails
    - Require Pro subscription (use requirePro middleware)
    - Return detailed calculation steps and assumptions
    - Include projected cash flows, growth rates, all inputs
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 8. Implement batch comparison feature
  - [x] 8.1 Create batch comparison endpoint
    - Implement POST /api/stocks/compare with array of tickers
    - Require Pro subscription (use requirePro middleware)
    - Limit to 50 stocks for Pro users
    - Calculate fair values for all tickers in parallel
    - Return comparison table data within 10 seconds
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 8.2 Add free tier limitation logic
    - Check user subscription status
    - Return upgrade prompt for free users attempting batch compare
    - Allow single stock view for free users
    - _Requirements: 4.4_

- [x] 9. Implement watchlist functionality
  - [x] 9.1 Create watchlist API endpoints
    - Implement GET /api/user/watchlist - fetch user's watchlist
    - Implement POST /api/user/watchlist - add stock to watchlist
    - Implement DELETE /api/user/watchlist/:ticker - remove stock
    - Require authentication for all endpoints
    - _Requirements: 5.1, 5.2, 5.5_
  
  - [x] 9.2 Add watchlist tier limitations
    - Check subscription status when adding stocks
    - Limit free users to 5 stocks
    - Allow unlimited for Pro users
    - Return appropriate error messages
    - _Requirements: 5.3, 5.4_
  
  - [x] 9.3 Implement watchlist data enrichment
    - Fetch current prices for all watchlist stocks
    - Calculate valuation status for each
    - Return enriched watchlist data
    - _Requirements: 5.2_

- [x] 10. Implement payment and subscription system
  - [x] 10.1 Setup payment provider SDKs
    - Install and configure Stripe SDK with API keys
    - Install and configure PayPal SDK
    - Install and configure Midtrans SDK
    - Create payment provider configuration module
    - _Requirements: 8.1_
  
  - [x] 10.2 Create PaymentService
    - Implement createSubscription method for Stripe
    - Implement createSubscription method for PayPal
    - Implement createSubscription method for Midtrans
    - Support monthly ($10-15) and yearly ($99-129) plans
    - Return payment session with checkout URL
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 10.3 Implement subscription endpoint
    - Create POST /api/payments/subscribe
    - Accept plan type and payment provider
    - Call PaymentService.createSubscription
    - Return checkout URL for redirect
    - _Requirements: 8.1_
  
  - [x] 10.4 Implement payment webhooks
    - Create POST /api/payments/webhook/stripe
    - Create POST /api/payments/webhook/paypal
    - Create POST /api/payments/webhook/midtrans
    - Verify webhook signatures
    - Update user subscription status on successful payment
    - Update subscription expiry date
    - Handle payment failures
    - _Requirements: 8.4, 8.5, 8.6_
  
  - [x] 10.5 Create subscription status endpoint
    - Implement GET /api/user/subscription
    - Return current subscription status, expiry, auto-renew
    - Require authentication
    - _Requirements: 8.4_

- [x] 11. Implement alert and notification system
  - [x] 11.1 Create alert API endpoints
    - Implement POST /api/alerts - create new alert
    - Implement GET /api/alerts - fetch user's alerts
    - Implement DELETE /api/alerts/:id - delete alert
    - Implement PATCH /api/alerts/:id - update alert status
    - Require Pro subscription for all alert endpoints
    - _Requirements: 6.1, 6.4, 6.5_
  
  - [x] 11.2 Implement AlertService
    - Create checkAlerts method to evaluate all active alerts
    - Fetch fair values for all watched stocks
    - Compare against threshold conditions
    - Identify triggered alerts
    - _Requirements: 6.2, 6.3_
  
  - [x] 11.3 Setup email notification service
    - Configure SendGrid or AWS SES
    - Create email templates for alert notifications
    - Implement sendNotification method
    - Include stock details, fair value, threshold in email
    - _Requirements: 6.2_
  
  - [x] 11.4 Create scheduled alert checker
    - Setup node-cron job to run every 24 hours
    - Call AlertService.checkAlerts
    - Send notifications for triggered alerts
    - Log notification history
    - _Requirements: 6.3_

- [x] 12. Implement export functionality
  - [x] 12.1 Create CSV export service
    - Implement generateCSV method
    - Format fair value data as CSV
    - Include ticker, name, price, all fair values, status
    - _Requirements: 9.1, 9.3_
  
  - [x] 12.2 Create PDF export service
    - Install PDF generation library (pdfkit or puppeteer)
    - Implement generatePDF method
    - Format fair value data as PDF table
    - Include branding and formatting
    - _Requirements: 9.2, 9.3_
  
  - [x] 12.3 Create export endpoint
    - Implement GET /api/download with format parameter (csv/pdf)
    - Require Pro subscription
    - Generate file within 5 seconds
    - Return downloadable file
    - _Requirements: 9.4, 9.5_

- [x] 13. Build frontend authentication UI
  - [x] 13.1 Setup Zustand auth store
    - Install Zustand 5.x (v5.0.8) and create stores/authStore.ts
    - Implement auth state management (user, isAuthenticated, isPro)
    - Add login, logout, register actions
    - Handle JWT token storage in httpOnly cookies
    - Implement auto-refresh token logic
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 13.2 Create login page
    - Build app/[locale]/login/page.tsx with email/password form
    - Add Google OAuth button
    - Add Facebook OAuth button
    - Implement form validation with Zod and react-hook-form
    - Handle login errors with toast notifications (react-hot-toast)
    - Redirect to home on success using Next.js router
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 13.3 Create registration page
    - Build app/[locale]/register/page.tsx with registration form
    - Add email, password, name fields
    - Implement form validation with react-hook-form
    - Handle registration errors
    - Auto-login after successful registration
    - _Requirements: 7.1, 7.6_
  
  - [x] 13.4 Create auth middleware
    - Implement middleware.ts to protect routes
    - Check authentication status from cookies
    - Redirect to login if not authenticated
    - Use Next.js 16 middleware API
    - _Requirements: 7.4_

- [x] 14. Build frontend stock search and display
  - [x] 14.1 Setup React Query and create stock data hooks
    - Install @tanstack/react-query 5.x (v5.90.2) and setup QueryClientProvider
    - Create hooks/useStockData.ts with React Query hooks
    - Implement useStockSearch hook with debouncing (300ms) using use-debounce
    - Implement useStockDetail and useFairValue hooks
    - Configure caching and stale time
    - _Requirements: 1.1, 1.2, 2.1_
  
  - [x] 14.2 Create StockSearchBar component
    - Build components/StockSearchBar.tsx
    - Implement autocomplete dropdown with @headlessui/react 2.x
    - Show ticker, name, exchange in results
    - Handle click to navigate to stock detail using Next.js Link
    - Add loading spinner
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 14.3 Create home page with search
    - Build app/[locale]/page.tsx
    - Add hero section with StockSearchBar
    - Add call-to-action for registration
    - Style with TailwindCSS 4.x (v4.1.17)
    - _Requirements: 1.1_
  
  - [x] 14.4 Create FairValueCard component
    - Build components/FairValueCard.tsx
    - Display model name and fair value
    - Add valuation status badge with color coding (soft green/red/white)
    - Implement tooltip for assumptions on hover using @radix-ui/react-tooltip
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 3.1_
  
  - [x] 14.5 Create stock detail page
    - Build app/[locale]/stocks/[ticker]/page.tsx
    - Display company profile and current price
    - Show all fair value models using FairValueCard
    - Add "Add to Watchlist" button
    - Add link to detailed model breakdown (Pro only)
    - Fetch data using React Query hooks
    - _Requirements: 2.1, 2.2, 2.3, 3.2_
  
  - [x] 14.6 Create model details page
    - Build app/[locale]/stocks/[ticker]/details/page.tsx
    - Require Pro subscription (show upgrade prompt for free users)
    - Display detailed calculation steps
    - Show all assumptions and inputs
    - Display projected cash flows table
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 15. Build frontend comparison and watchlist features
  - [x] 15.1 Create StockTable component
    - Build components/StockTable.tsx
    - Display ticker, name, price, fair values, status columns
    - Implement sortable columns using @tanstack/react-table 8.x
    - Add color coding for valuation status
    - Make responsive for mobile
    - Add pagination if needed
    - _Requirements: 4.2, 4.3_
  
  - [x] 15.2 Create comparison page
    - Build app/[locale]/compare/page.tsx
    - Add interface to add/remove stocks (up to 50)
    - Use StockTable component for display
    - Add export button (Pro only)
    - Show upgrade prompt for free users
    - Fetch comparison data using React Query
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 15.3 Create watchlist Zustand store
    - Create stores/watchlist.ts
    - Add methods: addToWatchlist, removeFromWatchlist, loadWatchlist
    - Manage watchlist state with Zustand 5.x
    - Handle tier limitations (5 for free, unlimited for Pro)
    - _Requirements: 5.1, 5.3, 5.4, 5.5_
  
  - [x] 15.4 Create watchlist page
    - Build app/[locale]/watchlist/page.tsx
    - Display user's watchlist stocks with StockTable
    - Show current prices and valuation status
    - Add remove button for each stock
    - Show limit indicator for free users
    - Add upgrade prompt when limit reached
    - _Requirements: 5.2, 5.3, 5.4_

- [x] 16. Build frontend subscription and payment UI
  - [x] 16.1 Create pricing page
    - Build app/[locale]/pricing/page.tsx
    - Display free vs Pro feature comparison
    - Show monthly and yearly plan options with pricing
    - Add "Subscribe" buttons for each plan
    - Style with TailwindCSS 4.x
    - _Requirements: 8.2, 8.3_
  
  - [x] 16.2 Create SubscriptionModal component
    - Build components/SubscriptionModal.tsx
    - Show payment provider selection (Stripe, PayPal, Midtrans)
    - Handle subscription initiation
    - Redirect to payment provider checkout
    - Use @radix-ui/react-dialog 1.x for modal
    - _Requirements: 8.1_
  
  - [x] 16.3 Create payment success/failure pages
    - Build app/[locale]/payment/success/page.tsx for successful payments
    - Build app/[locale]/payment/cancel/page.tsx for cancelled payments
    - Update user subscription status on success page
    - Show appropriate messages
    - _Requirements: 8.4, 8.5_
  
  - [x] 16.4 Create profile page with subscription info
    - Build app/[locale]/profile/page.tsx
    - Display user information
    - Show subscription status and expiry
    - Add upgrade button for free users
    - Show payment history
    - Add language and currency preference settings
    - _Requirements: 8.4, 13.4_

- [x] 17. Implement alerts UI
  - [x] 17.1 Create AlertForm component
    - Build components/AlertForm.tsx
    - Add ticker input with autocomplete
    - Add threshold type selection (undervalued/overvalued/fair)
    - Add threshold value input
    - Implement form validation with react-hook-form 7.x and Zod 3.x
    - Handle save/cancel actions
    - _Requirements: 6.1_
  
  - [x] 17.2 Create alerts page
    - Build app/[locale]/alerts/page.tsx
    - Require Pro subscription (show upgrade prompt for free users)
    - Display list of user's alerts
    - Add "Create Alert" button opening AlertForm
    - Add delete and activate/deactivate buttons for each alert
    - _Requirements: 6.1, 6.4, 6.5_

- [x] 18. Implement internationalization
  - [x] 18.1 Setup i18n for Next.js
    - Use next-intl 3.x for Next.js 16 internationalization
    - Configure in next.config.ts and create i18n configuration
    - Create locales folder with en.json and id.json locale files
    - Define translation keys for all UI text
    - Setup middleware for locale detection
    - _Requirements: 13.1, 13.2_
  
  - [x] 18.2 Add language switcher
    - Create LanguageSwitcher.tsx component
    - Add to header/navigation
    - Use i18n hooks for switching languages
    - Persist language preference to user profile
    - _Requirements: 13.2, 13.4_
  
  - [x] 18.3 Implement currency conversion
    - Create currency conversion utility in lib/currency.ts
    - Fetch exchange rates from API (cache for 24 hours)
    - Add currency selector to profile page
    - Convert all displayed prices based on user preference
    - _Requirements: 13.3, 13.4, 13.5_

- [x] 19. Implement responsive design and mobile optimization
  - [x] 19.1 Review TailwindCSS configuration
    - Verify TailwindCSS 4.x configuration in tailwind.config.ts
    - Ensure custom color palette is configured (black, white, soft green, soft red)
    - Verify responsive breakpoints (sm, md, lg, xl, 2xl)
    - _Requirements: 12.1_
  
  - [x] 19.2 Make all components responsive
    - Update all components with responsive classes (sm:, md:, lg:)
    - Test on mobile viewports (320px - 768px)
    - Optimize touch targets for mobile (minimum 44px)
    - Ensure tables are scrollable on mobile
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [x] 19.3 Optimize mobile performance
    - Implement lazy loading for images using next/image
    - Use React.lazy and Suspense for component code splitting
    - Test page load time on 4G connection (< 3 seconds)
    - Support portrait and landscape orientations
    - _Requirements: 12.4, 12.5_

- [x] 20. Setup Docker and deployment configuration
  - [x] 20.1 Create backend Dockerfile
    - Write Dockerfile for Express.js backend
    - Use Node 20 Alpine base image
    - Multi-stage build for optimization
    - Configure for production
    - _Requirements: 19.1_
  
  - [x] 20.2 Create frontend Dockerfile
    - Write Dockerfile for Next.js 16 frontend
    - Use Node 20 Alpine base image
    - Build standalone output for optimal size
    - Configure for production with output: 'standalone'
    - _Requirements: 19.2_
  
  - [x] 20.3 Create Cloud Build configuration
    - Write cloudbuild.yaml for CI/CD
    - Configure build steps for backend and frontend
    - Push images to Google Artifact Registry
    - Deploy to Cloud Run
    - _Requirements: 19.6_
  
  - [x] 20.4 Create deployment documentation
    - Write README with setup instructions
    - Document environment variables
    - Add local development setup guide
    - Add production deployment guide
    - Include troubleshooting section
    - _Requirements: 14.6, 19.5_

- [x] 21. Integration and final wiring
  - [x] 21.1 Connect all frontend pages to backend APIs
    - Verify all API calls are working with React Query
    - Test authentication flow end-to-end
    - Test stock search and detail flow
    - Test watchlist functionality
    - Test comparison feature
    - Test payment flow with test mode
    - Test alert creation
    - _Requirements: All_
  
  - [x] 21.2 Implement global error handling
    - Add React Error Boundary components
    - Setup toast notification system with react-hot-toast
    - Configure axios interceptors for API errors
    - Add retry logic for transient failures in React Query
    - _Requirements: All_
  
  - [x] 21.3 Add loading states throughout app
    - Implement loading spinners for all async operations
    - Add skeleton loaders using React Suspense
    - Use Next.js loading.tsx files for route transitions
    - Ensure smooth user experience
    - _Requirements: All_
  
  - [x] 21.4 Final testing and bug fixes
    - Test all user flows manually
    - Test tier limitations (free vs Pro)
    - Test payment webhooks with test events
    - Test provider failover logic
    - Fix any discovered bugs
    - _Requirements: All_
