# Stockmeter MVP - Quick Start Testing Guide

## Prerequisites

Ensure you have:
- Node.js 20.x installed
- PostgreSQL 16 running
- Redis 7 running
- Environment variables configured

## Quick Setup

### 1. Start Services

```bash
# Terminal 1: Start PostgreSQL (if not running)
# macOS with Homebrew:
brew services start postgresql@16

# Or with Docker:
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine

# Terminal 2: Start Redis (if not running)
# macOS with Homebrew:
brew services start redis

# Or with Docker:
docker run -d -p 6379:6379 redis:7-alpine
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies (if not done)
npm install

# Setup database
npx prisma migrate dev
npx prisma db seed

# Start backend server
npm run dev
```

Backend should be running on `http://localhost:3001`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies (if not done)
npm install

# Start frontend server
npm run dev
```

Frontend should be running on `http://localhost:3000`

## Quick Tests

### 1. Health Check

```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok","timestamp":"..."}`

### 2. Run Integration Tests

```bash
./scripts/test-integration.sh
```

Expected: All tests pass ✓

### 3. Test in Browser

1. Open `http://localhost:3000`
2. Open browser console (F12)
3. Run API tests:
```javascript
// Copy and paste this in console
fetch('/api/stocks/search?q=AAPL')
  .then(r => r.json())
  .then(d => console.log('✓ Search works:', d))
  .catch(e => console.error('✗ Search failed:', e));
```

## Manual Testing Checklist

### Quick Smoke Test (5 minutes)

- [ ] Open homepage - loads without errors
- [ ] Search for "AAPL" - results appear
- [ ] Click on AAPL - detail page loads
- [ ] Register new account - success
- [ ] Login with account - success
- [ ] Add AAPL to watchlist - success
- [ ] View watchlist - AAPL appears
- [ ] Logout - success

### Authentication Test (10 minutes)

- [ ] Register with email/password
- [ ] Login with credentials
- [ ] Verify session persists on refresh
- [ ] Logout successfully
- [ ] Try accessing protected route when logged out
- [ ] Verify redirect to login

### Stock Features Test (15 minutes)

- [ ] Search for multiple stocks
- [ ] View stock detail pages
- [ ] Check fair value calculations
- [ ] Verify all 4 models display (DCF, DDM, P/E, Graham)
- [ ] Check valuation status colors
- [ ] Test model details (Pro only)

### Watchlist Test (10 minutes)

- [ ] Add stocks to watchlist
- [ ] Remove stocks from watchlist
- [ ] Verify free tier limit (5 stocks)
- [ ] Check watchlist persistence
- [ ] Test watchlist page display

### Pro Features Test (15 minutes)

- [ ] Navigate to pricing page
- [ ] View Pro features
- [ ] Test batch comparison (Pro only)
- [ ] Test alert creation (Pro only)
- [ ] Test export functionality (Pro only)
- [ ] Verify upgrade prompts for free users

### Error Handling Test (10 minutes)

- [ ] Disconnect internet - verify error toast
- [ ] Reconnect - verify retry works
- [ ] Try invalid stock ticker - verify error message
- [ ] Access Pro feature as free user - verify upgrade prompt
- [ ] Test with expired session - verify redirect to login

### Mobile Test (10 minutes)

- [ ] Resize browser to 375px width
- [ ] Navigate through all pages
- [ ] Test touch interactions
- [ ] Verify responsive layouts
- [ ] Test both portrait and landscape

## Common Issues & Solutions

### Backend won't start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>

# Check database connection
psql -U postgres -c "SELECT 1"
```

### Frontend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Clear Nuxt cache
rm -rf .nuxt .output node_modules/.cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database errors
```bash
# Reset database
cd backend
npx prisma migrate reset

# Run migrations
npx prisma migrate dev

# Seed data
npx prisma db seed
```

### Redis errors
```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG

# Restart Redis
brew services restart redis
# or
docker restart <redis-container-id>
```

## Test Accounts

After running seed script, you'll have:

**Free User:**
- Email: `free@example.com`
- Password: `password123`

**Pro User:**
- Email: `pro@example.com`
- Password: `password123`

## API Testing

### Using curl

```bash
# Search stocks
curl "http://localhost:3001/api/stocks/search?q=AAPL"

# Get stock profile
curl "http://localhost:3001/api/stocks/AAPL"

# Get fair value
curl "http://localhost:3001/api/stocks/AAPL/fairvalue"

# Login (get token)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"free@example.com","password":"password123"}'

# Use token for authenticated requests
curl http://localhost:3001/api/user/watchlist \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Browser Console

```javascript
// Test search
await $fetch('/api/stocks/search?q=AAPL', {
  baseURL: 'http://localhost:3001'
});

// Test with authentication
const { accessToken } = await $fetch('/api/auth/login', {
  baseURL: 'http://localhost:3001',
  method: 'POST',
  body: {
    email: 'free@example.com',
    password: 'password123'
  }
});

// Use token
await $fetch('/api/user/watchlist', {
  baseURL: 'http://localhost:3001',
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});
```

## Performance Monitoring

### Check Response Times

```bash
# Stock search
time curl -s "http://localhost:3001/api/stocks/search?q=AAPL" > /dev/null

# Fair value calculation
time curl -s "http://localhost:3001/api/stocks/AAPL/fairvalue" > /dev/null
```

### Monitor Cache Hit Rates

Check backend logs for cache hits/misses:
```bash
cd backend
tail -f logs/app.log | grep cache
```

## Next Steps

After quick testing:

1. **If all tests pass:**
   - Proceed to comprehensive testing (see `TESTING_GUIDE.md`)
   - Test payment webhooks with test mode
   - Perform load testing
   - Review security checklist

2. **If tests fail:**
   - Check error logs in backend console
   - Check browser console for frontend errors
   - Review `INTEGRATION_CHECKLIST.md` for missing items
   - Consult troubleshooting section

## Getting Help

- **Backend logs:** Check terminal running `npm run dev`
- **Frontend logs:** Check browser console (F12)
- **Database issues:** Check PostgreSQL logs
- **Cache issues:** Check Redis logs
- **API issues:** Use browser Network tab

## Useful Commands

```bash
# View backend logs
cd backend && npm run dev

# View frontend logs  
cd frontend && npm run dev

# Check database
psql -U postgres -d stockmeter_dev -c "SELECT * FROM \"User\" LIMIT 5;"

# Check Redis
redis-cli
> KEYS *
> GET stock:price:AAPL

# Run tests
./scripts/test-integration.sh

# Build for production
cd backend && npm run build
cd frontend && npm run build
```

---

**Ready to test?** Start with the Quick Smoke Test above, then move to comprehensive testing in `TESTING_GUIDE.md`.
