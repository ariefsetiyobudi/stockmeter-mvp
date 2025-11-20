# Stockmeter Quick Start Guide

Get Stockmeter running locally in under 10 minutes.

## Prerequisites

- Node.js 20.x installed
- Docker Desktop installed and running
- Git installed

## Quick Setup

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/ariefsetiyobudi/stockmeter-mvp.git
cd stockmeter-mvp

# Start databases
docker-compose up -d

# Setup backend
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate

# Setup frontend (in new terminal)
cd frontend
npm install
cp .env.example .env.local
```

### 2. Configure Environment

Edit `backend/.env`:
```bash
# Minimum required for local development
DATABASE_URL="postgresql://stockmeter:password@localhost:5432/stockmeter_dev"
REDIS_HOST="localhost"
REDIS_PORT="6379"
JWT_SECRET="local-dev-secret-change-in-production"

# Optional: Add API keys for financial data
FMP_API_KEY="your-key-here"
ALPHA_VANTAGE_API_KEY="your-key-here"
```

Edit `frontend/.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001"
```

### 3. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 4. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Prisma Studio: `npm run prisma:studio` (in backend directory)

## Test the Application

1. Open http://localhost:3000
2. Search for a stock (e.g., "AAPL")
3. View stock details and fair value calculations
4. Register a new account
5. Add stocks to watchlist

## Common Commands

### Backend

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm start                  # Start production server

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio
npm run prisma:seed        # Seed database

# Testing
npm test                   # Run tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Frontend

```bash
# Development
npm run dev                # Start dev server
npm run build             # Build for production
npm start                 # Start production server

# Testing
npm test                  # Run tests
npm run test:watch        # Watch mode
npm run test:ui           # Vitest UI
```

### Docker

```bash
# Infrastructure
docker-compose up -d       # Start services
docker-compose down        # Stop services
docker-compose ps          # Check status
docker-compose logs -f     # View logs

# Database
docker exec -it stockmeter-postgres psql -U stockmeter -d stockmeter_dev

# Redis
docker exec -it stockmeter-redis redis-cli
```

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check connection
docker exec -it stockmeter-postgres psql -U stockmeter -l
```

### Redis Connection Error

```bash
# Check Redis is running
docker-compose ps

# Test Redis
docker exec -it stockmeter-redis redis-cli ping
# Should return: PONG
```

### Port Already in Use

```bash
# Find process using port 3000 or 3001
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 PID
```

### Module Not Found

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Review API documentation in `backend/docs/`
- Explore frontend documentation in `frontend/docs/`

## Getting Help

- Check logs for error messages
- Review environment variables
- Ensure all services are running
- Verify API keys are valid

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload
2. **Database Changes**: Run `npm run prisma:migrate` after schema changes
3. **API Testing**: Use Postman or curl to test API endpoints
4. **Debugging**: Use VS Code debugger or console.log
5. **Code Quality**: Run tests before committing

## Project Structure

```
stockmeter-mvp/
├── backend/              # Express.js API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── adapters/    # External APIs
│   │   └── middleware/  # Express middleware
│   └── prisma/          # Database schema
├── frontend/            # Next.js 16 app
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   └── stores/         # Zustand stores
└── docker-compose.yml  # Local infrastructure
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login
- POST `/api/auth/refresh` - Refresh token

### Stocks
- GET `/api/stocks/search?q=AAPL` - Search stocks
- GET `/api/stocks/:ticker` - Get stock details
- GET `/api/stocks/:ticker/fairvalue` - Get fair value

### Watchlist
- GET `/api/user/watchlist` - Get watchlist
- POST `/api/user/watchlist` - Add to watchlist
- DELETE `/api/user/watchlist/:ticker` - Remove from watchlist

### Payments
- POST `/api/payments/subscribe` - Create subscription
- GET `/api/user/subscription` - Get subscription status

## Environment Variables Reference

### Backend Required
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `JWT_SECRET` - JWT signing secret

### Backend Optional
- `FMP_API_KEY` - Financial Modeling Prep API key
- `ALPHA_VANTAGE_API_KEY` - Alpha Vantage API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `SENDGRID_API_KEY` - SendGrid API key

### Frontend Required
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL

## License

ISC
