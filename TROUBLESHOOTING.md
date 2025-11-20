# Stockmeter Troubleshooting Guide

This guide helps you diagnose and fix common issues with Stockmeter.

## Table of Contents

1. [Local Development Issues](#local-development-issues)
2. [Database Issues](#database-issues)
3. [Redis/Cache Issues](#rediscache-issues)
4. [API Integration Issues](#api-integration-issues)
5. [Authentication Issues](#authentication-issues)
6. [Payment Integration Issues](#payment-integration-issues)
7. [Docker Issues](#docker-issues)
8. [Production Deployment Issues](#production-deployment-issues)
9. [Performance Issues](#performance-issues)
10. [Build and Compilation Issues](#build-and-compilation-issues)

---

## Local Development Issues

### Backend Won't Start

**Symptom**: Backend fails to start or crashes immediately

**Possible Causes & Solutions**:

1. **Port 3001 already in use**
   ```bash
   # Find process using port 3001
   lsof -i :3001
   # or on Windows
   netstat -ano | findstr :3001
   
   # Kill the process
   kill -9 <PID>
   # or on Windows
   taskkill /PID <PID> /F
   ```

2. **Missing environment variables**
   ```bash
   # Check if .env file exists
   ls backend/.env
   
   # If not, copy from example
   cp backend/.env.example backend/.env
   
   # Verify required variables are set
   cat backend/.env | grep -E "DATABASE_URL|REDIS_HOST|JWT_SECRET"
   ```

3. **Database not running**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps
   
   # Start database if not running
   docker-compose up -d postgres
   ```

4. **Prisma client not generated**
   ```bash
   cd backend
   npm run db:generate
   ```

### Frontend Won't Start

**Symptom**: Frontend fails to start or shows errors

**Possible Causes & Solutions**:

1. **Port 3000 already in use**
   ```bash
   # Find and kill process
   lsof -i :3000
   kill -9 <PID>
   ```

2. **Missing .env.local file**
   ```bash
   # Copy from example
   cp frontend/.env.example frontend/.env.local
   ```

3. **Node modules corrupted**
   ```bash
   cd frontend
   rm -rf node_modules .next
   npm install
   ```

4. **Next.js cache issues**
   ```bash
   cd frontend
   npm run clean
   rm -rf .next
   npm run dev
   ```

### Module Not Found Errors

**Symptom**: `Cannot find module 'xyz'` errors

**Solutions**:

```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# If using workspaces, clean all
npm run clean
npm install
```

---

## Database Issues

### Cannot Connect to PostgreSQL

**Symptom**: `ECONNREFUSED` or connection timeout errors

**Diagnostic Steps**:

```bash
# 1. Check if PostgreSQL container is running
docker-compose ps

# 2. Check PostgreSQL logs
docker-compose logs postgres

# 3. Test connection directly
docker exec -it stockmeter-postgres psql -U stockmeter -d stockmeter_dev

# 4. Verify DATABASE_URL in .env
cat backend/.env | grep DATABASE_URL
```

**Solutions**:

1. **Container not running**
   ```bash
   docker-compose up -d postgres
   ```

2. **Wrong credentials**
   ```bash
   # Check docker-compose.yml for correct credentials
   # Update backend/.env to match
   DATABASE_URL="postgresql://stockmeter:password@localhost:5432/stockmeter_dev"
   ```

3. **Port conflict**
   ```bash
   # Check if port 5432 is available
   lsof -i :5432
   
   # If another PostgreSQL is running, stop it or change port in docker-compose.yml
   ```

### Migration Errors

**Symptom**: Prisma migration fails

**Solutions**:

1. **Reset database (development only)**
   ```bash
   cd backend
   npm run db:reset
   npm run db:migrate
   ```

2. **Manual migration**
   ```bash
   # Generate migration without applying
   npx prisma migrate dev --create-only
   
   # Review and edit migration file if needed
   # Then apply
   npx prisma migrate deploy
   ```

3. **Database out of sync**
   ```bash
   # Force reset (WARNING: deletes all data)
   npx prisma migrate reset --force
   ```

### Prisma Client Issues

**Symptom**: Type errors or "PrismaClient is not a constructor"

**Solutions**:

```bash
cd backend

# Regenerate Prisma client
npm run db:generate

# If still failing, clear and regenerate
rm -rf node_modules/.prisma
npm run db:generate

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

---

## Redis/Cache Issues

### Cannot Connect to Redis

**Symptom**: Redis connection errors in backend logs

**Diagnostic Steps**:

```bash
# 1. Check if Redis is running
docker-compose ps redis

# 2. Test Redis connection
docker exec -it stockmeter-redis redis-cli ping
# Should return: PONG

# 3. Check Redis logs
docker-compose logs redis
```

**Solutions**:

1. **Start Redis**
   ```bash
   docker-compose up -d redis
   ```

2. **Verify Redis configuration**
   ```bash
   # Check backend/.env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

3. **Clear Redis cache**
   ```bash
   docker exec -it stockmeter-redis redis-cli FLUSHALL
   ```

### Cache Not Working

**Symptom**: API calls not being cached, slow responses

**Diagnostic Steps**:

```bash
# Check if data is being cached
docker exec -it stockmeter-redis redis-cli
> KEYS *
> GET stock:price:AAPL
```

**Solutions**:

1. **Verify cache service is initialized**
   - Check backend logs for cache connection messages
   - Ensure CacheService is properly instantiated

2. **Check TTL settings**
   - Verify cache TTL values in code
   - Ensure TTL is not set too low

---

## API Integration Issues

### Financial Data Provider Errors

**Symptom**: "Provider error" or "No data available" messages

**Diagnostic Steps**:

```bash
# Check backend logs for provider errors
docker-compose logs backend | grep -i "provider"

# Test provider directly
curl "https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=YOUR_KEY"
```

**Solutions**:

1. **API key not set or invalid**
   ```bash
   # Verify API keys in backend/.env
   cat backend/.env | grep -E "FMP_API_KEY|ALPHA_VANTAGE_API_KEY"
   
   # Test keys are valid
   # Visit provider dashboard to verify
   ```

2. **Rate limit exceeded**
   - Check provider dashboard for usage
   - Wait for rate limit reset
   - Implement caching to reduce calls
   - Switch to backup provider

3. **Provider failover not working**
   - Check ProviderManager logs
   - Verify multiple providers are configured
   - Test each provider individually

### API Response Errors

**Symptom**: 500 errors, timeout errors

**Solutions**:

1. **Check backend logs**
   ```bash
   docker-compose logs -f backend
   ```

2. **Test API endpoints directly**
   ```bash
   # Test health endpoint
   curl http://localhost:3001/health
   
   # Test stock search
   curl http://localhost:3001/api/stocks/search?q=AAPL
   ```

3. **Verify CORS configuration**
   ```bash
   # Check backend CORS settings
   # Ensure frontend URL is in CORS_ORIGIN
   ```

---

## Authentication Issues

### Cannot Login

**Symptom**: Login fails with 401 or 500 error

**Diagnostic Steps**:

```bash
# Check backend logs
docker-compose logs backend | grep -i "auth"

# Test login endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Solutions**:

1. **JWT secret not set**
   ```bash
   # Verify JWT_SECRET in backend/.env
   cat backend/.env | grep JWT_SECRET
   
   # If missing, add it
   echo "JWT_SECRET=$(openssl rand -base64 32)" >> backend/.env
   ```

2. **User doesn't exist**
   ```bash
   # Create test user via registration
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
   ```

3. **Password hash mismatch**
   - Ensure bcrypt is working correctly
   - Check salt rounds configuration (should be 10)

### OAuth Not Working

**Symptom**: Google/Facebook login fails or redirects incorrectly

**Solutions**:

1. **OAuth credentials not configured**
   ```bash
   # Check backend/.env
   cat backend/.env | grep -E "GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET"
   ```

2. **Callback URL mismatch**
   - Verify callback URLs in OAuth provider console
   - Should match: `http://localhost:3001/api/auth/google/callback`
   - Update backend/.env if needed

3. **OAuth consent screen not configured**
   - Complete OAuth consent screen setup in provider console
   - Add test users if in development mode

### Session/Token Issues

**Symptom**: User logged out unexpectedly, token expired errors

**Solutions**:

1. **Token expiry too short**
   ```bash
   # Check token expiry settings
   cat backend/.env | grep -E "JWT_EXPIRY|REFRESH_TOKEN_EXPIRY"
   
   # Adjust if needed
   JWT_EXPIRY=1h
   REFRESH_TOKEN_EXPIRY=30d
   ```

2. **Refresh token not working**
   - Check refresh token endpoint
   - Verify refresh token is stored correctly
   - Test refresh flow

---

## Payment Integration Issues

### Stripe Webhook Failures

**Symptom**: Payments succeed but subscription not activated

**Diagnostic Steps**:

```bash
# Check webhook logs
docker-compose logs backend | grep -i "webhook"

# Test webhook endpoint
curl -X POST http://localhost:3001/api/payments/webhook/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

**Solutions**:

1. **Webhook secret not configured**
   ```bash
   # Get webhook secret from Stripe dashboard
   # Add to backend/.env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Webhook signature verification failing**
   - Ensure webhook secret matches Stripe dashboard
   - Check Stripe webhook logs for delivery status
   - Verify endpoint is publicly accessible (for production)

3. **Test webhook locally with Stripe CLI**
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Login
   stripe login
   
   # Forward webhooks to local server
   stripe listen --forward-to localhost:3001/api/payments/webhook/stripe
   
   # Trigger test event
   stripe trigger payment_intent.succeeded
   ```

### PayPal Integration Issues

**Symptom**: PayPal payments fail or redirect incorrectly

**Solutions**:

1. **Sandbox vs Production mode**
   ```bash
   # Check PayPal mode in backend/.env
   PAYPAL_MODE=sandbox  # or 'live' for production
   ```

2. **Credentials mismatch**
   - Verify client ID and secret match mode (sandbox/live)
   - Check PayPal developer dashboard

---

## Docker Issues

### Container Won't Start

**Symptom**: Docker container exits immediately

**Diagnostic Steps**:

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs <service-name>

# Inspect container
docker inspect <container-id>
```

**Solutions**:

1. **Port conflict**
   ```bash
   # Check which ports are in use
   docker-compose ps
   lsof -i :5432
   lsof -i :6379
   
   # Stop conflicting services or change ports in docker-compose.yml
   ```

2. **Volume permission issues**
   ```bash
   # Remove volumes and recreate
   docker-compose down -v
   docker-compose up -d
   ```

3. **Image build failed**
   ```bash
   # Rebuild images
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Docker Compose Issues

**Symptom**: Services can't communicate

**Solutions**:

```bash
# Check network
docker network ls
docker network inspect stockmeter-mvp_default

# Recreate network
docker-compose down
docker-compose up -d
```

---

## Production Deployment Issues

### Cloud Run Deployment Fails

**Symptom**: Deployment fails or service won't start

**Diagnostic Steps**:

```bash
# Check Cloud Run logs
gcloud run services logs read <service-name> --region=us-central1 --limit=100

# Check service status
gcloud run services describe <service-name> --region=us-central1
```

**Solutions**:

1. **Image not found**
   ```bash
   # Verify image exists in Artifact Registry
   gcloud artifacts docker images list us-central1-docker.pkg.dev/$PROJECT_ID/stockmeter
   
   # Rebuild and push
   docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/stockmeter/backend:latest .
   docker push us-central1-docker.pkg.dev/$PROJECT_ID/stockmeter/backend:latest
   ```

2. **Environment variables missing**
   ```bash
   # Check current env vars
   gcloud run services describe <service-name> \
     --region=us-central1 \
     --format="yaml(spec.template.spec.containers[0].env)"
   
   # Update env vars
   gcloud run services update <service-name> \
     --region=us-central1 \
     --set-env-vars="KEY=value"
   ```

3. **Health check failing**
   - Verify /health endpoint works
   - Check startup time (may need to increase timeout)
   - Review application logs for startup errors

### Cloud SQL Connection Issues

**Symptom**: Backend can't connect to Cloud SQL

**Solutions**:

1. **VPC connector not configured**
   ```bash
   # Verify VPC connector exists
   gcloud compute networks vpc-access connectors describe stockmeter-connector \
     --region=us-central1
   
   # Update Cloud Run service to use connector
   gcloud run services update <service-name> \
     --region=us-central1 \
     --vpc-connector=stockmeter-connector
   ```

2. **Cloud SQL instance not added**
   ```bash
   # Add Cloud SQL instance to Cloud Run
   gcloud run services update <service-name> \
     --region=us-central1 \
     --add-cloudsql-instances=$PROJECT_ID:us-central1:stockmeter-db
   ```

3. **Connection string incorrect**
   ```bash
   # For Cloud SQL, use Unix socket
   DATABASE_URL="postgresql://user:pass@/dbname?host=/cloudsql/PROJECT:REGION:INSTANCE"
   ```

### Cloud Build Failures

**Symptom**: Build fails in Cloud Build

**Solutions**:

```bash
# View build logs
gcloud builds list --limit=5
gcloud builds log <BUILD_ID>

# Common issues:
# 1. Insufficient permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com \
  --role=roles/run.admin

# 2. Timeout - increase in cloudbuild.yaml
timeout: 1200s

# 3. Build context too large - add .dockerignore
```

---

## Performance Issues

### Slow API Responses

**Diagnostic Steps**:

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/stocks/AAPL

# Create curl-format.txt:
cat > curl-format.txt << EOF
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
EOF
```

**Solutions**:

1. **Cache not working**
   - Verify Redis is running and connected
   - Check cache hit rates in logs
   - Ensure cache TTL is appropriate

2. **Database queries slow**
   ```bash
   # Enable query logging in Prisma
   # Add to backend/src/index.ts:
   # log: ['query', 'info', 'warn', 'error']
   
   # Check for missing indexes
   # Review slow queries and add indexes
   ```

3. **External API calls slow**
   - Check provider response times
   - Implement timeout handling
   - Use faster provider as primary

### High Memory Usage

**Solutions**:

```bash
# Monitor memory usage
docker stats

# Increase memory limit in docker-compose.yml
services:
  backend:
    mem_limit: 1g
    
# For Cloud Run, increase memory
gcloud run services update <service-name> \
  --memory=1Gi
```

---

## Build and Compilation Issues

### TypeScript Compilation Errors

**Solutions**:

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
rm -rf dist

# Rebuild
npm run build

# Check for type errors
npm run type-check
```

### Next.js Build Failures

**Solutions**:

```bash
cd frontend

# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules
npm install

# Build with verbose output
npm run build -- --debug
```

### Prisma Generation Errors

**Solutions**:

```bash
cd backend

# Clear Prisma cache
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma

# Reinstall Prisma
npm install @prisma/client prisma --save-dev

# Regenerate
npm run db:generate
```

---

## Getting Additional Help

### Collect Diagnostic Information

Before asking for help, collect:

```bash
# System information
node --version
npm --version
docker --version

# Service status
docker-compose ps

# Recent logs
docker-compose logs --tail=100 > logs.txt

# Environment (sanitized)
cat backend/.env | sed 's/=.*/=***/' > env-sanitized.txt
```

### Enable Debug Logging

```bash
# Backend
# Add to backend/.env
LOG_LEVEL=debug

# Frontend
# Add to frontend/.env.local
NEXT_PUBLIC_LOG_LEVEL=debug
```

### Common Log Locations

- **Backend logs**: `docker-compose logs backend`
- **Frontend logs**: `docker-compose logs frontend`
- **PostgreSQL logs**: `docker-compose logs postgres`
- **Redis logs**: `docker-compose logs redis`
- **Cloud Run logs**: `gcloud run services logs read <service-name>`

---

## Quick Reference

### Health Check Commands

```bash
# Backend health
curl http://localhost:3001/health

# Database connection
docker exec -it stockmeter-postgres psql -U stockmeter -c "SELECT 1"

# Redis connection
docker exec -it stockmeter-redis redis-cli ping

# All services
docker-compose ps
```

### Reset Everything (Development)

```bash
# Stop all services
docker-compose down -v

# Clean all build artifacts
npm run clean

# Reinstall dependencies
npm install

# Restart services
docker-compose up -d
cd backend && npm run db:migrate && cd ..
npm run dev
```

### Emergency Database Backup

```bash
# Backup
docker exec stockmeter-postgres pg_dump -U stockmeter stockmeter_dev > backup.sql

# Restore
docker exec -i stockmeter-postgres psql -U stockmeter stockmeter_dev < backup.sql
```

---

## Still Having Issues?

1. Check the [README.md](README.md) for setup instructions
2. Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment details
3. Check [QUICKSTART.md](QUICKSTART.md) for quick setup
4. Search existing GitHub issues
5. Create a new issue with diagnostic information
6. Contact support team

## Contributing to This Guide

Found a solution to a problem not listed here? Please contribute by:
1. Adding the issue and solution to this guide
2. Submitting a pull request
3. Helping others with similar issues
