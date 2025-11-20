# Project: Stockmeter Web Application

**Stockmeter**, a modern web application designed to help investors quickly and confidently assess the fair value of global stocks using automated, industry-standard valuation models. The app makes stock analysis accessible and transparent for users of all levels.

### Key Features and How It Works

- **Stock Search and Discovery**
    - Instantly search for stocks by ticker or company name from global exchanges.
    - See relevant stock information, including ticker, name, and exchange, with autocomplete for faster results.
- **Automated Fair Value Calculation**
    - For each stock, the system automatically collects financial data from trusted APIs.
    - It runs up to four different calculations: Discounted Cash Flow (DCF), Dividend Discount Model (DDM), Price/Earnings (PE, PB, PS ratios), and the Graham Number.
    - Results show whether a stock is undervalued, fairly priced, or overvalued, using clear color indicators.
    - Users can view the assumptions and full calculation breakdowns for transparency.
- **Side-by-side Stock Comparison**
    - Compare multiple stocks at once in a single table (Pro users: up to 50 stocks, Free users: single stock).
- **Personal Watchlist**
    - Users can save stocks they want to monitor.
    - Free users can add up to 5 stocks; Pro users get unlimited watchlist entries.
- **Email Alerts (Pro)**
    - Set up custom alerts for when a stock’s valuation hits your target.
    - Get notified by email when conditions are met.
- **Flexible Account System**
    - Register and log in via email, Google, or social platforms.
    - Secure authentication with passwords encrypted for your safety.
- **Subscription and Payments**
    - Free and Pro (paid) tiers for access to additional features.
    - Pro subscription supports payments by Stripe, PayPal, or Midtrans.
    - Easy account upgrades and transparent billing.
- **Export Results (Pro)**
    - Download fair value analyses as CSV or PDF for use in your own workflows.


### Technology and Security

- **User-Friendly Interface:** Built with Next.js for fast, responsive performance on desktop and mobile.
- **Reliable Backend:** Node.js/Express server, PostgreSQL database, and integration with multiple financial data sources.
- **Robust API Integration:** Automatically switches to backup data sources if one provider fails, ensuring reliable service.
- **Caching and Performance:** Uses Redis to cache data for efficiency and cost savings.
- **Security:** Follows best practices for password protection, API security, and payment handling. No sensitive payment data is stored by Stockmeter.


### User Experience

- **Mobile-Ready:** Fully responsive design, works smoothly on phones and tablets.
- **Localization:** Supports English and Indonesian languages, displays prices in your preferred currency.
- **Clear Flows:**
    - Easy onboarding and account management
    - Straightforward stock search and analysis process
    - Fast, reliable performance


### Summary

- A professional, secure, and scalable web application
- All core features as listed above for both Free and Pro subscription levels
- Documentation for deployment, development, and user operation
- Scalable cloud deployment ready for real-world use
- Clean, modern design tailored to your branding needs



# Technical Overview - Stockmeter

### System Architecture

- **Full-Stack Web App** utilizing a three-tier structure (presentation, application, data layers).
    - **Frontend:** Next.js 16 (React 19, TailwindCSS 4, Recharts, Zustand, next-intl, Vitest)
    - **Backend:** Node.js 20 + Express.js 5 (TypeScript), RESTful API, JWT Auth, Passport.js (Email, Google OAuth), Zod schema validation
    - **Database:** PostgreSQL 16 (via Prisma ORM)
    - **Caching:** Redis (ioredis)
    - **Payment Integration:** Stripe, PayPal, Midtrans
    - **Financial Data Providers:** Yahoo Finance (main, free), Financial Modeling Prep, Alpha Vantage (as failover/backup)
    - **Mail Service:** SendGrid/AWS SES for email notifications
    - **Cloud Infrastructure:** Google Cloud Run (Docker serverless), Google Cloud SQL (PostgreSQL), Google Memorystore (Redis), Cloud Build (CI/CD)
    - **Deployment:** All services are containerized (Docker) for consistency and scalability

### Core Workflow

1. **Stock Search:**
    - Frontend sends GET to `/api/stocks/search?q=query` → backend checks Redis cache (TTL 5 min) or fetches from provider via adapter pattern → returns to user, updates cache if needed.
2. **Stock Valuation:**
    - Frontend requests stock details/financials → backend checks cache (24h), runs automated calculations for DCF, DDM, PE/PB/PS, Graham Number (all logic automated, provider API failover supported).
    - Results with valuation state (undervalued/fair/overvalued) and breakdown are shown in UI; breakdown detail is available for Pro users.
3. **Batch Compare \& Watchlist:**
    - Pro users can request batch calculation (up to 50 tickers at once, special endpoint, throttled/parallelized, cache-aware).
    - Watchlist is a relational DB entity linked to User, with tier limit enforced at backend.
4. **User \& Auth:**
    - JWT (1 hour access, 30 days refresh, httpOnly cookie).
    - Passport.js supports email, Google, Facebook logins.
    - Passwords hashed (bcrypt 10 rounds), full CSRF protection.
5. **Payments \& Pro Subscription:**
    - Subscription recorded in DB, verified by payment provider webhook, status updated automatically.
    - Payment flow is strictly frontend → backend API → provider redirect → verified by webhook.
    - Refund, cancellation, and expiry managed via webhook automation.
6. **Alerts:**
    - Backend cron runs alert evaluation daily, triggers email for Pro users when target met.
    - All alert configs are in DB, dynamic email templates are used for notifications.

### Database Design (Key Schemas)

- **User:** id, email, name, passwordHash, subscriptionStatus, expiry, preferences (lang/currency), timestamps
- **Watchlist, Alert, Transaction, StockCache, ProviderStatus:** All related entities with indexed references, minimizing duplicate records.
- **StockCache:** Layered model for search, prices, financials, fair value, with specific TTL for each data type.

### Security

- Passwords stored hashed (bcrypt); access \& refresh tokens managed separately.
- No credit card data is stored—fully PCI DSS compliant.
- All connections (db, redis) are encrypted/env-protected.
- Payment only processed through secure redirect \& webhook signature verification.

### Failover \& Optimization Strategy

- Extensive caching via Redis: stock prices (5m), financials (24h), fair value (1h), peer data (24h).
- Adapter manager enables instant failover between providers: health check logs, retry mechanism, provider switch within 5 seconds if an outage is detected.
- API provider rate limit monitoring.
- Optimized response via gzip, pagination, SSR, lazy loading, and frontend code splitting.

### Testing \& Quality Assurance

- Backend test coverage minimum 80% (Jest), frontend with Vitest and React Testing Library.
- Automated integration testing: API, payments, auth, batch compare, alerts.
- Complete manual QA checklist, separate staging environment.

### DevOps \& Deployment

- Local development via Docker Compose (PostgreSQL, Redis, backend, frontend).
- Automated build pipeline (Google Cloud Build): pushes container image and deploys to Cloud Run (auto-scaling for frontend and backend).
- All secrets managed via environment variables; CI/CD; logging and error monitoring with Google Cloud and Sentry.

