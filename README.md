# Stockmeter MVP

Automated stock valuation platform that calculates fair value using multiple financial models including DCF, DDM, P/E ratios, and Graham Number.

## Features

### Free Tier
- Single stock analysis
- Basic fair value models (DCF, DDM, P/E, Graham Number)
- Up to 5 watchlist stocks
- Stock search and profile viewing

### Pro Tier
- Batch comparison (up to 50 stocks)
- Detailed model breakdowns with assumptions
- Unlimited watchlist
- Price alerts and notifications
- Export to CSV/PDF
- Advanced analytics

## Technology Stack

### Backend
- **Runtime**: Node.js 20.x LTS
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 16.x with Prisma ORM
- **Cache**: Redis 7.x with ioredis
- **Authentication**: Passport.js (Local, Google OAuth, Facebook)
- **Payments**: Stripe, PayPal, Midtrans
- **Data Sources**: Yahoo Finance, Financial Modeling Prep, Alpha Vantage

### Frontend
- **Framework**: Next.js 16.x with App Router
- **Language**: TypeScript 5.x
- **Styling**: TailwindCSS 4.x
- **State Management**: Zustand 5.x
- **Data Fetching**: TanStack Query (React Query) 5.x
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI, Headless UI
- **Internationalization**: next-intl 4.x

## Quick Start

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- Docker and Docker Compose (for local database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stockmeter-mvp
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   
   # Frontend
   cp frontend/.env.example frontend/.env.local
   # Edit frontend/.env.local with your configuration
   ```

4. **Start database services**
   ```bash
   npm run docker:up
   ```

5. **Setup database**
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   cd ..
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API on http://localhost:3001
   - Frontend on http://localhost:3000

### Available Scripts

#### Root Level
- `npm run dev` - Start both backend and frontend in development mode
- `npm run build` - Build both applications for production
- `npm run test` - Run tests for both applications
- `npm run docker:up` - Start PostgreSQL and Redis containers
- `npm run docker:down` - Stop database containers
- `npm run clean` - Clean all node_modules and build artifacts

#### Validation & Testing Scripts
- `./scripts/validate-setup.sh` - Validate local development setup
- `./scripts/test-local.sh` - Run comprehensive local tests
- `./scripts/validate-cloud.sh` - Validate cloud deployment setup
- `./scripts/health-check.sh` - Quick health check for running services

#### Backend (`cd backend`)
- `npm run dev` - Start backend in development mode with hot reload
- `npm run build` - Build backend for production
- `npm run start` - Start production backend
- `npm run test` - Run backend tests
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio

#### Frontend (`cd frontend`)
- `npm run dev` - Start frontend in development mode
- `npm run build` - Build frontend for production
- `npm run start` - Start production frontend
- `npm run test` - Run frontend tests
- `npm run lint` - Run ESLint

## Project Structure

```
stockmeter-mvp/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── adapters/       # External API integrations
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Application entry point
│   ├── prisma/             # Database schema and migrations
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # Next.js application
│   ├── app/                # Next.js 16 App Router pages
│   ├── components/         # Reusable React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── stores/             # Zustand state stores
│   ├── types/              # TypeScript type definitions
│   ├── package.json
│   └── next.config.ts
├── docker-compose.yml      # Local development database
├── package.json            # Root package.json with workspace scripts
└── README.md
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Email/password login
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/facebook` - Facebook OAuth login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Stock Data Endpoints
- `GET /api/stocks/search?q={query}` - Search stocks
- `GET /api/stocks/{ticker}` - Get stock profile
- `GET /api/stocks/{ticker}/financials` - Get financial statements
- `GET /api/stocks/{ticker}/fairvalue` - Calculate fair value
- `GET /api/stocks/{ticker}/modeldetails` - Detailed model breakdown (Pro)

### User Endpoints
- `GET /api/user/profile` - Get user profile
- `GET /api/user/watchlist` - Get user's watchlist
- `POST /api/user/watchlist` - Add stock to watchlist
- `DELETE /api/user/watchlist/{ticker}` - Remove from watchlist

### Comparison & Export
- `POST /api/stocks/compare` - Batch stock comparison (Pro)
- `GET /api/download?format={csv|pdf}` - Export data (Pro)

### Payments
- `POST /api/payments/subscribe` - Create subscription
- `GET /api/user/subscription` - Get subscription status
- `POST /api/payments/webhook/{provider}` - Payment webhooks

### Alerts (Pro)
- `GET /api/alerts` - Get user's alerts
- `POST /api/alerts` - Create new alert
- `DELETE /api/alerts/{id}` - Delete alert

## Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://stockmeter:dev_password@localhost:5432/stockmeter_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=your-refresh-secret

# Financial Data Providers
FMP_API_KEY=your-fmp-api-key
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key

# Payment Providers
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=your-paypal-client-id
MIDTRANS_SERVER_KEY=your-midtrans-key

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

### Testing
- Write unit tests for business logic
- Use Jest for backend testing
- Use Vitest + Testing Library for frontend
- Maintain >80% code coverage

### Database
- Use Prisma migrations for schema changes
- Never edit migration files directly
- Always backup before major changes

## Deployment

### Local Development
1. Start database: `npm run docker:up`
2. Run migrations: `cd backend && npm run db:migrate`
3. Start services: `npm run dev`

### Production (Google Cloud)
1. Build Docker images
2. Deploy to Cloud Run
3. Configure Cloud SQL (PostgreSQL)
4. Configure Memorystore (Redis)
5. Set environment variables

## Additional Documentation

More detailed documentation is available in the `docs/` folder:
- [ABOUT.md](docs/ABOUT.md) - Detailed technical overview
- [VERSIONS.md](docs/VERSIONS.md) - All technology versions
- [READY_TO_USE.md](docs/READY_TO_USE.md) - Quick start guide
- [PREFLIGHT_CHECKLIST.md](docs/PREFLIGHT_CHECKLIST.md) - Pre-deployment checklist
- [APPLICATION_STATUS.md](docs/APPLICATION_STATUS.md) - Current status report

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For support, email support@stockmeter.com or create an issue in the repository.