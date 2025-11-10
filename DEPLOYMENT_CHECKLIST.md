# Stockmeter Deployment Checklist

Use this checklist to ensure all steps are completed for a successful deployment.

## Pre-Deployment

### Local Development
- [ ] All tests passing (`npm test` in backend and frontend)
- [ ] No TypeScript errors (`npm run build` in both directories)
- [ ] Application runs locally without errors
- [ ] Database migrations are up to date
- [ ] Environment variables documented in `.env.example`

### Code Quality
- [ ] Code reviewed and approved
- [ ] No sensitive data in code (API keys, passwords)
- [ ] All console.log statements removed or replaced with proper logging
- [ ] Error handling implemented for all critical paths
- [ ] API rate limiting configured

### Documentation
- [ ] README.md updated
- [ ] API documentation current
- [ ] Environment variables documented
- [ ] Deployment guide reviewed

## Google Cloud Setup

### Initial Configuration
- [ ] Google Cloud project created
- [ ] Billing enabled
- [ ] gcloud CLI installed and authenticated
- [ ] Project ID set in gcloud config

### APIs Enabled
- [ ] Cloud Build API
- [ ] Cloud Run API
- [ ] Cloud SQL Admin API
- [ ] Memorystore for Redis API
- [ ] Artifact Registry API
- [ ] VPC Access API
- [ ] Secret Manager API
- [ ] Compute Engine API

### Artifact Registry
- [ ] Repository created (`stockmeter`)
- [ ] Docker authentication configured
- [ ] Permissions set for Cloud Build

### Cloud SQL (PostgreSQL)
- [ ] Instance created (`stockmeter-db`)
- [ ] Database created (`stockmeter`)
- [ ] User created with strong password
- [ ] Backups enabled
- [ ] Connection name noted
- [ ] No public IP (security)

### Memorystore (Redis)
- [ ] Instance created (`stockmeter-redis`)
- [ ] Size appropriate for workload
- [ ] Host IP address noted
- [ ] In same region as Cloud Run

### VPC Connector
- [ ] Connector created (`stockmeter-connector`)
- [ ] IP range configured (10.8.0.0/28)
- [ ] In same region as services

### Secret Manager
- [ ] JWT secret created
- [ ] Stripe keys stored
- [ ] SendGrid API key stored
- [ ] Other sensitive keys stored
- [ ] Cloud Run service account has access

## Docker Images

### Backend Image
- [ ] Dockerfile tested locally
- [ ] Multi-stage build optimized
- [ ] Health check configured
- [ ] Non-root user configured
- [ ] Image built successfully
- [ ] Image pushed to Artifact Registry

### Frontend Image
- [ ] Dockerfile tested locally
- [ ] Multi-stage build optimized
- [ ] Health check configured
- [ ] Non-root user configured
- [ ] Image built successfully
- [ ] Image pushed to Artifact Registry

## Cloud Run Deployment

### Backend Service
- [ ] Service deployed
- [ ] Environment variables set
- [ ] Cloud SQL connection configured
- [ ] VPC connector attached
- [ ] Memory and CPU allocated appropriately
- [ ] Min/max instances configured
- [ ] Timeout set (60s)
- [ ] Health endpoint responding
- [ ] Service URL noted

### Frontend Service
- [ ] Service deployed
- [ ] API URL environment variable set
- [ ] Memory and CPU allocated appropriately
- [ ] Min/max instances configured
- [ ] Timeout set (60s)
- [ ] Health endpoint responding
- [ ] Service URL noted

## Database

### Migrations
- [ ] Cloud SQL Proxy installed
- [ ] Connection to Cloud SQL successful
- [ ] Migrations run successfully
- [ ] Prisma client generated
- [ ] Seed data loaded (if needed)
- [ ] Database schema verified

### Verification
- [ ] Can connect from Cloud Run
- [ ] Queries executing successfully
- [ ] Indexes created
- [ ] Backup schedule verified

## External Services

### Payment Providers
- [ ] Stripe account in production mode
- [ ] Stripe webhook endpoint configured
- [ ] Stripe webhook secret set
- [ ] PayPal account configured
- [ ] PayPal webhook configured
- [ ] Midtrans account configured
- [ ] Test transactions successful

### Email Service
- [ ] SendGrid account configured
- [ ] API key generated and stored
- [ ] Sender email verified
- [ ] Email templates tested
- [ ] Test email sent successfully

### OAuth Providers
- [ ] Google OAuth app created
- [ ] Google callback URL configured
- [ ] Facebook app created
- [ ] Facebook callback URL configured
- [ ] OAuth flows tested

### Financial Data APIs
- [ ] FMP API key obtained
- [ ] Alpha Vantage key obtained
- [ ] API keys stored securely
- [ ] Rate limits understood
- [ ] Failover logic tested

## Security

### Access Control
- [ ] Cloud Run services have minimal permissions
- [ ] Service accounts configured properly
- [ ] IAM roles reviewed
- [ ] No overly permissive access

### Network Security
- [ ] HTTPS enforced
- [ ] CORS configured for production domain only
- [ ] VPC connector used for private resources
- [ ] No public IPs on databases

### Secrets Management
- [ ] All secrets in Secret Manager
- [ ] No secrets in code or environment variables
- [ ] Secrets rotated regularly
- [ ] Access to secrets logged

### Application Security
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention
- [ ] CSRF protection enabled
- [ ] JWT tokens properly secured

## Monitoring

### Logging
- [ ] Cloud Logging enabled
- [ ] Log levels configured
- [ ] Error logs reviewed
- [ ] No sensitive data in logs

### Metrics
- [ ] Cloud Monitoring enabled
- [ ] Custom metrics configured
- [ ] Dashboards created
- [ ] Key metrics tracked

### Alerts
- [ ] Error rate alerts configured
- [ ] Latency alerts configured
- [ ] Resource usage alerts configured
- [ ] Budget alerts configured
- [ ] Alert notification channels set

### Health Checks
- [ ] Backend health endpoint working
- [ ] Frontend health endpoint working
- [ ] Database health monitored
- [ ] Redis health monitored

## Domain and SSL

### Domain Configuration
- [ ] Domain purchased/available
- [ ] DNS provider configured
- [ ] Domain mapped to Cloud Run services
- [ ] DNS records updated
- [ ] SSL certificates provisioned
- [ ] HTTPS working

### URLs
- [ ] Frontend URL: _______________
- [ ] Backend API URL: _______________
- [ ] Both URLs accessible
- [ ] Redirects working

## CI/CD

### Cloud Build
- [ ] cloudbuild.yaml configured
- [ ] Build triggers created
- [ ] GitHub repository connected
- [ ] Build permissions granted
- [ ] Test build successful
- [ ] Automated deployment working

### Version Control
- [ ] Main branch protected
- [ ] Pull request reviews required
- [ ] CI checks passing
- [ ] Deployment tags used

## Testing

### Smoke Tests
- [ ] Homepage loads
- [ ] Stock search works
- [ ] Stock details display
- [ ] Fair value calculations work
- [ ] User registration works
- [ ] User login works
- [ ] Watchlist functions
- [ ] Payment flow works (test mode)
- [ ] Email notifications work

### Performance Tests
- [ ] Page load times acceptable
- [ ] API response times < 2s
- [ ] Database queries optimized
- [ ] Cache hit rate acceptable
- [ ] No memory leaks

### Load Tests
- [ ] Application handles expected load
- [ ] Auto-scaling works
- [ ] No errors under load
- [ ] Database performance acceptable

## Post-Deployment

### Verification
- [ ] All features working in production
- [ ] No errors in logs
- [ ] Monitoring dashboards showing healthy metrics
- [ ] Users can access application
- [ ] Payment processing working

### Documentation
- [ ] Deployment documented
- [ ] Runbook created
- [ ] Team notified
- [ ] Support team trained

### Backup and Recovery
- [ ] Database backups verified
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] RTO/RPO defined

## Rollback Plan

### Preparation
- [ ] Previous version images tagged
- [ ] Rollback procedure documented
- [ ] Database migration rollback plan
- [ ] Team knows rollback process

### If Issues Occur
- [ ] Monitor error rates
- [ ] Check logs immediately
- [ ] Rollback if critical issues
- [ ] Communicate with stakeholders

## Cost Management

### Budget
- [ ] Monthly budget defined
- [ ] Budget alerts configured
- [ ] Cost allocation tags set
- [ ] Resource usage monitored

### Optimization
- [ ] Right-sized instances
- [ ] Auto-scaling configured
- [ ] Unused resources deleted
- [ ] Cost optimization reviewed

## Compliance

### Data Protection
- [ ] GDPR compliance reviewed
- [ ] Data retention policy defined
- [ ] User data deletion process
- [ ] Privacy policy updated

### Legal
- [ ] Terms of service updated
- [ ] Privacy policy published
- [ ] Cookie consent implemented
- [ ] Legal review completed

## Sign-off

- [ ] Technical lead approval: _________________ Date: _______
- [ ] Product owner approval: _________________ Date: _______
- [ ] Security review: _________________ Date: _______
- [ ] Deployment completed: _________________ Date: _______

## Notes

Additional notes or issues encountered during deployment:

_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
