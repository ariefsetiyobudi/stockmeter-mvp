# Stockmeter MVP

A web application that automatically calculates and displays the fair value of global stocks using multiple industry-standard financial valuation models.

## Project Structure

```
stockmeter-mvp/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── routes/      # API route handlers
│   │   ├── services/    # Business logic services
│   │   ├── adapters/    # External API adapters
│   │   ├── middleware/  # Express middleware
│   │   └── types/       # TypeScript type definitions
│   ├── package.json
│   └── tsconfig.json
├── frontend/         # Nuxt 4 application
│   ├── pages/          # Vue pages
│   ├── components/     # Vue components
│   ├── composables/    # Vue composables
│   ├── types/          # TypeScript type definitions
│   ├── locales/        # i18n translations
│   ├── package.json
│   └── nuxt.config.ts
└── docker-compose.yml  # PostgreSQL 16 + Redis 7
```

## Prerequisites

- Node.js 20.x LTS
- Docker and Docker Compose
- npm or yarn

## Local Development Setup

### 1. Start Database Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

Verify services are running:

```bash
docker-compose ps
```

Services:
- PostgreSQL 16: `localhost:5432`
- Redis 7: `localhost:6379`

**Alternative: Local Redis Installation**

If you prefer to run Redis locally without Docker:

```bash
# macOS
brew install redis
redis-server

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client (after Prisma schema is created)
npm run prisma:generate

# Run database migrations (after migrations are created)
npm run prisma:migrate

# Start development server
npm run dev
```

Backend will run on http://localhost:3001

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

Frontend will run on http://localhost:3000

## Available Scripts

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run generate` - Generate static site
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Open Vitest UI

## Technology Stack

### Backend
- Node.js 20.x
- Express.js 5.x
- TypeScript 5.x
- PostgreSQL 16.x
- Prisma 5.x ORM
- Redis (ioredis 5.x)
- Passport.js for authentication
- Jest for testing

### Frontend
- Nuxt 4.x
- Vue 3.5.x
- TypeScript 5.x
- TailwindCSS 4.x
- Pinia for state management
- VueUse for composables
- Vitest for testing

## Environment Variables

See `.env.example` files in both `backend/` and `frontend/` directories for required environment variables.

## Docker Deployment

### Building Docker Images

#### Backend
```bash
cd backend
docker build -t stockmeter-backend:latest .
```

#### Frontend
```bash
cd frontend
docker build -t stockmeter-frontend:latest .
```

### Running with Docker

#### Backend Container
```bash
docker run -d \
  --name stockmeter-backend \
  -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:password@host:5432/stockmeter" \
  -e REDIS_HOST="redis-host" \
  -e REDIS_PORT="6379" \
  -e JWT_SECRET="your-secret-key" \
  stockmeter-backend:latest
```

#### Frontend Container
```bash
docker run -d \
  --name stockmeter-frontend \
  -p 3000:3000 \
  -e NUXT_PUBLIC_API_BASE_URL="http://backend-url:3001" \
  stockmeter-frontend:latest
```

## Google Cloud Deployment

### Prerequisites

1. Google Cloud account with billing enabled
2. Google Cloud SDK (`gcloud`) installed
3. Project created in Google Cloud Console

### Initial Setup

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  artifactregistry.googleapis.com \
  vpcaccess.googleapis.com

# Create Artifact Registry repository
gcloud artifacts repositories create stockmeter \
  --repository-format=docker \
  --location=us-central1 \
  --description="Stockmeter Docker images"
```

### Database Setup

#### PostgreSQL (Cloud SQL)

```bash
# Create Cloud SQL instance
gcloud sql instances create stockmeter-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_ROOT_PASSWORD

# Create database
gcloud sql databases create stockmeter \
  --instance=stockmeter-db

# Create database user
gcloud sql users create stockmeter_user \
  --instance=stockmeter-db \
  --password=YOUR_USER_PASSWORD
```

#### Redis (Memorystore)

```bash
# Create Redis instance
gcloud redis instances create stockmeter-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0
```

### VPC Connector Setup

```bash
# Create VPC connector for Cloud Run to access Cloud SQL and Redis
gcloud compute networks vpc-access connectors create stockmeter-connector \
  --region=us-central1 \
  --range=10.8.0.0/28
```

### Cloud Build Setup

```bash
# Grant Cloud Build permissions
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/run.admin

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser

# Create Cloud Build trigger (manual or from GitHub)
gcloud builds submit --config=cloudbuild.yaml
```

### Environment Variables for Cloud Run

Create a `.env.yaml` file for backend secrets:

```yaml
# backend-env.yaml
DATABASE_URL: "postgresql://stockmeter_user:password@/stockmeter?host=/cloudsql/PROJECT_ID:us-central1:stockmeter-db"
REDIS_HOST: "REDIS_IP_ADDRESS"
REDIS_PORT: "6379"
JWT_SECRET: "your-production-secret"
JWT_EXPIRY: "1h"
REFRESH_TOKEN_EXPIRY: "30d"
STRIPE_SECRET_KEY: "sk_live_..."
STRIPE_WEBHOOK_SECRET: "whsec_..."
PAYPAL_CLIENT_ID: "your-paypal-client-id"
PAYPAL_CLIENT_SECRET: "your-paypal-secret"
PAYPAL_MODE: "live"
MIDTRANS_SERVER_KEY: "your-midtrans-key"
MIDTRANS_IS_PRODUCTION: "true"
SENDGRID_API_KEY: "your-sendgrid-key"
FROM_EMAIL: "noreply@yourdomain.com"
GOOGLE_CLIENT_ID: "your-google-client-id"
GOOGLE_CLIENT_SECRET: "your-google-secret"
GOOGLE_CALLBACK_URL: "https://api.yourdomain.com/auth/google/callback"
FACEBOOK_APP_ID: "your-facebook-app-id"
FACEBOOK_APP_SECRET: "your-facebook-secret"
FACEBOOK_CALLBACK_URL: "https://api.yourdomain.com/auth/facebook/callback"
FRONTEND_URL: "https://yourdomain.com"
CORS_ORIGIN: "https://yourdomain.com"
YAHOO_FINANCE_API_KEY: ""
FMP_API_KEY: "your-fmp-key"
ALPHA_VANTAGE_API_KEY: "your-alpha-vantage-key"
```

Deploy with environment variables:

```bash
# Deploy backend with env vars
gcloud run deploy stockmeter-backend \
  --image=us-central1-docker.pkg.dev/YOUR_PROJECT_ID/stockmeter/backend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=3001 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=60s \
  --env-vars-file=backend-env.yaml \
  --add-cloudsql-instances=YOUR_PROJECT_ID:us-central1:stockmeter-db \
  --vpc-connector=stockmeter-connector

# Deploy frontend
gcloud run deploy stockmeter-frontend \
  --image=us-central1-docker.pkg.dev/YOUR_PROJECT_ID/stockmeter/frontend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=60s \
  --set-env-vars=NUXT_PUBLIC_API_BASE_URL=https://BACKEND_URL
```

### Database Migrations

Run migrations on Cloud SQL:

```bash
# Connect to Cloud SQL via proxy
cloud_sql_proxy -instances=YOUR_PROJECT_ID:us-central1:stockmeter-db=tcp:5432

# In another terminal, run migrations
cd backend
DATABASE_URL="postgresql://stockmeter_user:password@localhost:5432/stockmeter" npm run prisma:migrate
```

### Custom Domain Setup

```bash
# Map custom domain to Cloud Run services
gcloud run domain-mappings create \
  --service=stockmeter-frontend \
  --domain=yourdomain.com \
  --region=us-central1

gcloud run domain-mappings create \
  --service=stockmeter-backend \
  --domain=api.yourdomain.com \
  --region=us-central1
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

**Problem:** Backend cannot connect to PostgreSQL

**Solutions:**
- Verify PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL in `.env` file
- Ensure database exists: `docker exec -it stockmeter-postgres psql -U stockmeter -l`
- Check Prisma schema is generated: `npm run prisma:generate`

#### Redis Connection Issues

**Problem:** Backend cannot connect to Redis

**Solutions:**
- Verify Redis is running: `docker-compose ps` or `redis-cli ping`
- Check REDIS_HOST and REDIS_PORT in `.env` file
- Test Redis connection: `redis-cli -h localhost -p 6379 ping`

#### Build Failures

**Problem:** TypeScript compilation errors

**Solutions:**
- Clear build cache: `rm -rf dist node_modules && npm install`
- Check TypeScript version: `npx tsc --version`
- Verify all dependencies are installed: `npm install`

#### Docker Build Issues

**Problem:** Docker build fails

**Solutions:**
- Check Docker daemon is running: `docker ps`
- Clear Docker cache: `docker system prune -a`
- Verify Dockerfile syntax
- Check .dockerignore is not excluding required files

#### Cloud Run Deployment Issues

**Problem:** Service fails to start

**Solutions:**
- Check Cloud Run logs: `gcloud run services logs read stockmeter-backend --region=us-central1`
- Verify environment variables are set correctly
- Check Cloud SQL connection string format
- Ensure VPC connector is properly configured
- Verify service account has necessary permissions

#### Migration Issues

**Problem:** Prisma migrations fail

**Solutions:**
- Check database connection
- Verify Prisma schema syntax: `npx prisma validate`
- Reset database (development only): `npx prisma migrate reset`
- Check migration history: `npx prisma migrate status`

### Performance Issues

**Problem:** Slow API responses

**Solutions:**
- Check Redis cache is working
- Monitor provider API rate limits
- Review database query performance
- Check Cloud Run instance scaling settings
- Enable Cloud Run request logging

### Authentication Issues

**Problem:** OAuth login fails

**Solutions:**
- Verify OAuth credentials in environment variables
- Check callback URLs match OAuth provider settings
- Ensure CORS is properly configured
- Check JWT_SECRET is set and consistent

## Monitoring and Logging

### Local Development

```bash
# View backend logs
cd backend
npm run dev

# View frontend logs
cd frontend
npm run dev

# View Docker logs
docker-compose logs -f
```

### Production (Google Cloud)

```bash
# View Cloud Run logs
gcloud run services logs read stockmeter-backend --region=us-central1 --limit=50

# Stream logs in real-time
gcloud run services logs tail stockmeter-backend --region=us-central1

# View Cloud SQL logs
gcloud sql operations list --instance=stockmeter-db

# View Redis metrics
gcloud redis instances describe stockmeter-redis --region=us-central1
```

## Security Best Practices

1. **Environment Variables:** Never commit `.env` files to version control
2. **Secrets Management:** Use Google Secret Manager for production secrets
3. **Database:** Use strong passwords and restrict network access
4. **API Keys:** Rotate API keys regularly
5. **HTTPS:** Always use HTTPS in production
6. **CORS:** Configure CORS to allow only trusted domains
7. **Rate Limiting:** Implement rate limiting on API endpoints
8. **Authentication:** Use secure JWT tokens with short expiry times

## Cost Optimization

### Google Cloud

1. **Cloud Run:** Set min-instances to 0 for development
2. **Cloud SQL:** Use smallest tier (db-f1-micro) for development
3. **Redis:** Use smallest size (1GB) for development
4. **Artifact Registry:** Clean up old images regularly
5. **Monitoring:** Set up budget alerts

```bash
# Clean up old images
gcloud artifacts docker images list us-central1-docker.pkg.dev/YOUR_PROJECT_ID/stockmeter/backend
gcloud artifacts docker images delete IMAGE_PATH --delete-tags
```

## License

ISC
