# Stockmeter Pre-Flight Checklist

This checklist ensures your Stockmeter application is ready for both local development and cloud deployment.

## ✅ Local Development Checklist

### Prerequisites
- [ ] Node.js 20.x or higher installed
- [ ] npm 10.x or higher installed
- [ ] Docker Desktop installed and running
- [ ] Git installed

### Project Setup
- [ ] Repository cloned
- [ ] All documentation reviewed (README.md, QUICKSTART.md)
- [ ] Environment variables understood

### Backend Setup
- [ ] `cd backend && npm install` completed
- [ ] `backend/.env` file created from `.env.example`
- [ ] Database URL configured in `.env`
- [ ] Redis connection configured in `.env`
- [ ] JWT secrets configured (change from defaults!)
- [ ] Prisma client generated: `npm run db:generate`
- [ ] Database migrations run: `npm run db:migrate`
- [ ] Backend builds successfully: `npm run build`
- [ ] Backend tests pass: `npm test`

### Frontend Setup
- [ ] `cd frontend && npm install` completed
- [ ] `frontend/.env.local` file created from `.env.example`
- [ ] API base URL configured
- [ ] Frontend builds successfully: `npm run build`
- [ ] Frontend tests pass: `npm test`
- [ ] No TypeScript errors: `npm run type-check`

### Docker Services
- [ ] Docker Compose file reviewed
- [ ] PostgreSQL container running: `docker ps | grep postgres`
- [ ] Redis container running: `docker ps | grep redis`
- [ ] PostgreSQL accessible: `docker exec stockmeter-postgres pg_isready`
- [ ] Redis accessible: `docker exec stockmeter-redis redis-cli ping`

### Development Servers
- [ ] Backend starts without errors: `cd backend && npm run dev`
- [ ] Frontend starts without errors: `cd frontend && npm run dev`
- [ ] Backend health check responds: `curl http://localhost:3001/health`
- [ ] Frontend loads in browser: `http://localhost:3000`
- [ ] No console errors in browser
- [ ] Hot reload works for both backend and frontend

### API Integration
- [ ] Backend API responds to requests
- [ ] Frontend can communicate with backend
- [ ] CORS configured correctly
- [ ] Authentication flow works (if implemented)

## ☁️ Cloud Deployment Checklist

### Google Cloud Prerequisites
- [ ] Google Cloud account created
- [ ] Billing enabled on GCP account
- [ ] gcloud CLI installed
- [ ] Authenticated with gcloud: `gcloud auth login`
- [ ] Project created in GCP Console
- [ ] Project ID set: `gcloud config set project PROJECT_ID`

### Required APIs Enabled
- [ ] Cloud Build API: `cloudbuild.googleapis.com`
- [ ] Cloud Run API: `run.googleapis.com`
- [ ] Cloud SQL Admin API: `sqladmin.googleapis.com`
- [ ] Memorystore for Redis API: `redis.googleapis.com`
- [ ] Artifact Registry API: `artifactregistry.googleapis.com`
- [ ] VPC Access API: `vpcaccess.googleapis.com`
- [ ] Secret Manager API: `secretmanager.googleapis.com`

Enable all at once:
```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com sqladmin.googleapis.com redis.googleapis.com artifactregistry.googleapis.com vpcaccess.googleapis.com secretmanager.googleapis.com
```

### Infrastructure Setup
- [ ] Artifact Registry repository created
- [ ] Cloud SQL (PostgreSQL 16) instance created
- [ ] Cloud SQL database created
- [ ] Cloud SQL user created
- [ ] Memorystore (Redis 7) instance created
- [ ] VPC connector created
- [ ] Secrets stored in Secret Manager (JWT, Stripe, SendGrid, etc.)

### Docker Images
- [ ] Backend Dockerfile validated
- [ ] Frontend Dockerfile validated
- [ ] Backend image builds successfully
- [ ] Frontend image builds successfully
- [ ] Images pushed to Artifact Registry

### Cloud Run Services
- [ ] Backend service deployed to Cloud Run
- [ ] Frontend service deployed to Cloud Run
- [ ] Backend service URL obtained
- [ ] Frontend service URL obtained
- [ ] Services are accessible via HTTPS
- [ ] Health checks passing

### Database Migration
- [ ] Cloud SQL Proxy installed
- [ ] Connected to Cloud SQL via proxy
- [ ] Prisma migrations deployed: `npm run db:migrate deploy`
- [ ] Database schema verified

### Environment Variables
- [ ] All backend environment variables configured in Cloud Run
- [ ] All frontend environment variables configured in Cloud Run
- [ ] Secrets properly referenced from Secret Manager
- [ ] Database connection string uses Cloud SQL socket
- [ ] Redis host points to Memorystore instance
- [ ] Frontend API URL points to backend Cloud Run service

### Security
- [ ] All secrets use Secret Manager (not plain text)
- [ ] Database uses strong passwords
- [ ] Cloud SQL has no public IP
- [ ] VPC connector properly configured
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled
- [ ] HTTPS enforced on all endpoints
- [ ] OAuth callback URLs use HTTPS
- [ ] Payment webhooks verify signatures

### CI/CD Pipeline
- [ ] cloudbuild.yaml reviewed and configured
- [ ] GitHub repository connected to Cloud Build (if using)
- [ ] Build triggers configured
- [ ] Cloud Build service account has necessary permissions
- [ ] Test deployment successful

### Monitoring & Logging
- [ ] Cloud Run logs accessible
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Uptime monitoring configured
- [ ] Budget alerts configured
- [ ] Performance monitoring enabled

### Domain & SSL (Optional)
- [ ] Custom domain configured
- [ ] DNS records updated
- [ ] SSL certificates provisioned
- [ ] Domain mapping verified

### Testing
- [ ] Backend health endpoint responds
- [ ] Frontend loads correctly
- [ ] API endpoints functional
- [ ] Authentication works
- [ ] Database operations work
- [ ] Redis caching works
- [ ] Payment integration works (test mode)
- [ ] Email notifications work

## 🔧 Validation Scripts

Run these scripts to automate validation:

### Local Development
```bash
# Validate setup
./scripts/validate-setup.sh

# Run comprehensive tests
./scripts/test-local.sh
```

### Cloud Deployment
```bash
# Validate cloud setup
./scripts/validate-cloud.sh
```

## 📋 Common Issues & Solutions

### Local Development

**Issue: Docker containers won't start**
- Solution: Ensure Docker Desktop is running
- Check: `docker info`

**Issue: Port already in use**
- Solution: Kill process using the port
- Check: `lsof -i :3000` or `lsof -i :3001`

**Issue: Database connection failed**
- Solution: Verify PostgreSQL container is running
- Check: `docker ps | grep postgres`
- Test: `docker exec stockmeter-postgres pg_isready`

**Issue: Prisma client not generated**
- Solution: Run `cd backend && npm run db:generate`

**Issue: Module not found errors**
- Solution: Delete node_modules and reinstall
- Run: `rm -rf node_modules && npm install`

### Cloud Deployment

**Issue: Build fails in Cloud Build**
- Check Cloud Build logs: `gcloud builds list`
- Verify Dockerfile syntax
- Ensure all dependencies are in package.json

**Issue: Cloud Run service won't start**
- Check Cloud Run logs: `gcloud run services logs read SERVICE_NAME`
- Verify environment variables
- Check health endpoint

**Issue: Database connection fails**
- Verify Cloud SQL instance is running
- Check VPC connector configuration
- Verify connection string format

**Issue: Redis connection fails**
- Verify Memorystore instance is running
- Check VPC connector has access
- Verify Redis host IP

## 📚 Additional Resources

- [README.md](README.md) - Project overview
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Troubleshooting guide
- [VERSIONS.md](VERSIONS.md) - Technology stack versions

## ✨ Ready to Launch

Once all items are checked:

**Local Development:**
```bash
npm run dev
```

**Cloud Deployment:**
```bash
gcloud builds submit --config=cloudbuild.yaml
```

---

**Last Updated:** December 2024
