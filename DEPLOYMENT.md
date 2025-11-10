# Stockmeter Deployment Guide

This guide provides detailed instructions for deploying Stockmeter to production using Google Cloud Platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Deployment](#docker-deployment)
4. [Google Cloud Production Deployment](#google-cloud-production-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **Node.js 20.x LTS** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Google Cloud SDK** - [Install Guide](https://cloud.google.com/sdk/docs/install)
- **Git** - [Download](https://git-scm.com/)

### Google Cloud Requirements

- Google Cloud account with billing enabled
- Project created in Google Cloud Console
- Sufficient permissions to create resources (Owner or Editor role)

### External Services

- **Stripe Account** - For payment processing
- **PayPal Business Account** - For PayPal payments
- **Midtrans Account** - For Indonesian payments
- **SendGrid Account** - For email notifications
- **Financial Data API Keys:**
  - Financial Modeling Prep (FMP)
  - Alpha Vantage
  - Yahoo Finance (optional)

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/ariefsetiyobudi/stockmeter-mvp.git
cd stockmeter-mvp
```

### 2. Start Infrastructure Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

Expected output:
```
NAME                    STATUS    PORTS
stockmeter-postgres     Up        0.0.0.0:5432->5432/tcp
stockmeter-redis        Up        0.0.0.0:6379->6379/tcp
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your local configuration

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed

# Start development server
npm run dev
```

Backend should now be running at http://localhost:3001

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your local configuration

# Start development server
npm run dev
```

Frontend should now be running at http://localhost:3000

### 5. Verify Setup

- Visit http://localhost:3000 in your browser
- Try searching for a stock
- Check backend logs for any errors

## Docker Deployment

### Building Images

#### Backend Image

```bash
cd backend
docker build -t stockmeter-backend:latest .

# Test the image
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://stockmeter:password@host.docker.internal:5432/stockmeter_dev" \
  -e REDIS_HOST="host.docker.internal" \
  -e REDIS_PORT="6379" \
  -e JWT_SECRET="test-secret" \
  stockmeter-backend:latest
```

#### Frontend Image

```bash
cd frontend
docker build -t stockmeter-frontend:latest .

# Test the image
docker run -p 3000:3000 \
  -e NUXT_PUBLIC_API_BASE_URL="http://localhost:3001" \
  stockmeter-frontend:latest
```

### Docker Compose (Full Stack)

Create a `docker-compose.prod.yml` for running the full stack:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: stockmeter
      POSTGRES_USER: stockmeter
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - stockmeter-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - stockmeter-network

  backend:
    image: stockmeter-backend:latest
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://stockmeter:${POSTGRES_PASSWORD}@postgres:5432/stockmeter
      REDIS_HOST: redis
      REDIS_PORT: 6379
      NODE_ENV: production
    env_file:
      - backend/.env
    ports:
      - "3001:3001"
    networks:
      - stockmeter-network

  frontend:
    image: stockmeter-frontend:latest
    depends_on:
      - backend
    environment:
      NUXT_PUBLIC_API_BASE_URL: http://backend:3001
      NODE_ENV: production
    ports:
      - "3000:3000"
    networks:
      - stockmeter-network

volumes:
  postgres_data:
  redis_data:

networks:
  stockmeter-network:
    driver: bridge
```

Run with:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Google Cloud Production Deployment

### Step 1: Initial Google Cloud Setup

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  artifactregistry.googleapis.com \
  vpcaccess.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com
```

### Step 2: Create Artifact Registry

```bash
# Create repository for Docker images
gcloud artifacts repositories create stockmeter \
  --repository-format=docker \
  --location=us-central1 \
  --description="Stockmeter Docker images"

# Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### Step 3: Setup Cloud SQL (PostgreSQL)

```bash
# Create Cloud SQL instance
gcloud sql instances create stockmeter-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password="$(openssl rand -base64 32)" \
  --backup \
  --backup-start-time=03:00

# Create database
gcloud sql databases create stockmeter \
  --instance=stockmeter-db

# Create database user
gcloud sql users create stockmeter_user \
  --instance=stockmeter-db \
  --password="$(openssl rand -base64 32)"

# Get connection name (save this)
gcloud sql instances describe stockmeter-db --format="value(connectionName)"
```

### Step 4: Setup Memorystore (Redis)

```bash
# Create Redis instance
gcloud redis instances create stockmeter-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0 \
  --tier=basic

# Get Redis host (save this)
gcloud redis instances describe stockmeter-redis \
  --region=us-central1 \
  --format="value(host)"
```

### Step 5: Create VPC Connector

```bash
# Create VPC connector for Cloud Run to access Cloud SQL and Redis
gcloud compute networks vpc-access connectors create stockmeter-connector \
  --region=us-central1 \
  --range=10.8.0.0/28 \
  --network=default
```

### Step 6: Setup Secret Manager

```bash
# Create secrets for sensitive data
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
echo -n "your-stripe-key" | gcloud secrets create stripe-secret-key --data-file=-
echo -n "your-stripe-webhook-secret" | gcloud secrets create stripe-webhook-secret --data-file=-
echo -n "your-sendgrid-key" | gcloud secrets create sendgrid-api-key --data-file=-

# Grant Cloud Run access to secrets
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 7: Build and Push Images

```bash
# Build and push backend
cd backend
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/stockmeter/backend:latest .
docker push us-central1-docker.pkg.dev/$PROJECT_ID/stockmeter/backend:latest

# Build and push frontend
cd ../frontend
docker build -t us-central1-docker.pkg.dev/$PROJECT_ID/stockmeter/frontend:latest .
docker push us-central1-docker.pkg.dev/$PROJECT_ID/stockmeter/frontend:latest
```

### Step 8: Deploy to Cloud Run

#### Deploy Backend

```bash
gcloud run deploy stockmeter-backend \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/stockmeter/backend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=3001 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=60s \
  --set-env-vars="NODE_ENV=production" \
  --add-cloudsql-instances=$PROJECT_ID:us-central1:stockmeter-db \
  --vpc-connector=stockmeter-connector \
  --vpc-egress=all-traffic
```

#### Deploy Frontend

```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe stockmeter-backend \
  --region=us-central1 \
  --format="value(status.url)")

gcloud run deploy stockmeter-frontend \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/stockmeter/frontend:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=60s \
  --set-env-vars="NODE_ENV=production,NUXT_PUBLIC_API_BASE_URL=$BACKEND_URL"
```

### Step 9: Run Database Migrations

```bash
# Install Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy

# Start proxy
./cloud-sql-proxy $PROJECT_ID:us-central1:stockmeter-db &

# Run migrations
cd backend
DATABASE_URL="postgresql://stockmeter_user:PASSWORD@localhost:5432/stockmeter" \
  npm run prisma:migrate deploy

# Stop proxy
pkill cloud-sql-proxy
```

### Step 10: Configure Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service=stockmeter-frontend \
  --domain=yourdomain.com \
  --region=us-central1

gcloud run domain-mappings create \
  --service=stockmeter-backend \
  --domain=api.yourdomain.com \
  --region=us-central1

# Follow instructions to update DNS records
```

## Environment Configuration

### Backend Environment Variables

Required variables for production:

```bash
# Database
DATABASE_URL=postgresql://user:password@/dbname?host=/cloudsql/PROJECT:REGION:INSTANCE

# Redis
REDIS_HOST=10.x.x.x
REDIS_PORT=6379

# JWT
JWT_SECRET=<from-secret-manager>
JWT_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=30d

# Payment Providers
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=live
MIDTRANS_SERVER_KEY=...
MIDTRANS_IS_PRODUCTION=true

# Email
SENDGRID_API_KEY=<from-secret-manager>
FROM_EMAIL=noreply@yourdomain.com

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/auth/google/callback
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
FACEBOOK_CALLBACK_URL=https://api.yourdomain.com/auth/facebook/callback

# CORS
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Financial APIs
FMP_API_KEY=...
ALPHA_VANTAGE_API_KEY=...
```

### Frontend Environment Variables

```bash
NUXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

## CI/CD Pipeline

### Setup Cloud Build Trigger

```bash
# Grant Cloud Build permissions
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/run.admin

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser

gcloud iam service-accounts add-iam-policy-binding \
  ${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser
```

### Manual Build

```bash
# Submit build manually
gcloud builds submit --config=cloudbuild.yaml
```

### GitHub Integration

1. Connect GitHub repository in Cloud Build
2. Create trigger for main branch
3. Configure trigger to use `cloudbuild.yaml`
4. Push to main branch to trigger deployment

## Monitoring and Maintenance

### View Logs

```bash
# Backend logs
gcloud run services logs read stockmeter-backend \
  --region=us-central1 \
  --limit=100

# Frontend logs
gcloud run services logs read stockmeter-frontend \
  --region=us-central1 \
  --limit=100

# Stream logs
gcloud run services logs tail stockmeter-backend --region=us-central1
```

### Monitor Performance

```bash
# View service metrics
gcloud run services describe stockmeter-backend \
  --region=us-central1 \
  --format="yaml(status)"

# Check Cloud SQL metrics
gcloud sql operations list --instance=stockmeter-db

# Check Redis metrics
gcloud redis instances describe stockmeter-redis --region=us-central1
```

### Database Backup

```bash
# Create manual backup
gcloud sql backups create \
  --instance=stockmeter-db \
  --description="Manual backup $(date +%Y%m%d)"

# List backups
gcloud sql backups list --instance=stockmeter-db

# Restore from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=stockmeter-db \
  --backup-id=BACKUP_ID
```

### Scaling

```bash
# Update backend scaling
gcloud run services update stockmeter-backend \
  --region=us-central1 \
  --min-instances=1 \
  --max-instances=20 \
  --memory=2Gi \
  --cpu=2

# Update Cloud SQL tier
gcloud sql instances patch stockmeter-db \
  --tier=db-custom-2-7680
```

## Troubleshooting

### Check Service Health

```bash
# Test backend health
curl https://BACKEND_URL/health

# Test frontend
curl https://FRONTEND_URL

# Check Cloud Run service status
gcloud run services describe stockmeter-backend --region=us-central1
```

### Common Issues

#### 1. Database Connection Failed

```bash
# Check Cloud SQL instance status
gcloud sql instances describe stockmeter-db

# Verify VPC connector
gcloud compute networks vpc-access connectors describe stockmeter-connector \
  --region=us-central1

# Test connection from Cloud Shell
gcloud sql connect stockmeter-db --user=stockmeter_user
```

#### 2. Redis Connection Failed

```bash
# Check Redis instance
gcloud redis instances describe stockmeter-redis --region=us-central1

# Verify VPC connector has access
# Redis must be in same VPC as connector
```

#### 3. Build Failures

```bash
# View build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID

# Check Artifact Registry permissions
gcloud artifacts repositories get-iam-policy stockmeter --location=us-central1
```

#### 4. Deployment Failures

```bash
# Check Cloud Run logs
gcloud run services logs read stockmeter-backend \
  --region=us-central1 \
  --limit=50

# Verify environment variables
gcloud run services describe stockmeter-backend \
  --region=us-central1 \
  --format="yaml(spec.template.spec.containers[0].env)"
```

### Debug Mode

Enable debug logging:

```bash
# Update service with debug logging
gcloud run services update stockmeter-backend \
  --region=us-central1 \
  --set-env-vars="LOG_LEVEL=debug"
```

## Cost Optimization

### Development Environment

- Use smallest Cloud SQL tier (db-f1-micro)
- Use smallest Redis size (1GB)
- Set Cloud Run min-instances to 0
- Delete unused images from Artifact Registry

### Production Environment

- Enable Cloud SQL automatic backups
- Use Cloud Run autoscaling
- Set up budget alerts
- Monitor API usage and costs

```bash
# Set up budget alert
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Stockmeter Budget" \
  --budget-amount=100USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90
```

## Security Checklist

- [ ] All secrets stored in Secret Manager
- [ ] Database uses strong passwords
- [ ] Cloud SQL has no public IP
- [ ] VPC connector configured correctly
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled on API
- [ ] HTTPS enforced on all endpoints
- [ ] OAuth callback URLs use HTTPS
- [ ] Payment webhooks verify signatures
- [ ] Regular security updates applied

## Support

For issues and questions:
- Check logs first
- Review this documentation
- Check Google Cloud status page
- Contact support team

## Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Memorystore Documentation](https://cloud.google.com/memorystore/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
