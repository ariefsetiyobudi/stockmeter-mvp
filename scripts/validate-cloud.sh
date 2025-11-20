#!/bin/bash

# Stockmeter Cloud Deployment Validation Script
# This script validates the Google Cloud Platform deployment setup

set -e

echo "☁️  Stockmeter Cloud Deployment Validation"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success() { echo -e "${GREEN}✓${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }
warning() { echo -e "${YELLOW}⚠${NC} $1"; }
info() { echo -e "${BLUE}ℹ${NC} $1"; }

# Check if gcloud is installed
info "Checking gcloud CLI..."
if command -v gcloud &> /dev/null; then
    success "gcloud CLI is installed ($(gcloud version | head -n 1))"
else
    error "gcloud CLI is not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
info "Checking gcloud authentication..."
if gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1)
    if [ -n "$ACCOUNT" ]; then
        success "Authenticated as: $ACCOUNT"
    else
        warning "Not authenticated. Run: gcloud auth login"
    fi
else
    warning "Not authenticated. Run: gcloud auth login"
fi

# Check current project
info "Checking current GCP project..."
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -n "$PROJECT_ID" ]; then
    success "Current project: $PROJECT_ID"
else
    warning "No project set. Run: gcloud config set project PROJECT_ID"
fi

# Check required files
info "Checking deployment files..."

if [ -f "cloudbuild.yaml" ]; then
    success "cloudbuild.yaml found"
else
    error "cloudbuild.yaml not found"
    exit 1
fi

if [ -f "backend/Dockerfile" ]; then
    success "Backend Dockerfile found"
else
    error "Backend Dockerfile not found"
    exit 1
fi

if [ -f "frontend/Dockerfile" ]; then
    success "Frontend Dockerfile found"
else
    error "Frontend Dockerfile not found"
    exit 1
fi

# Check if required APIs are enabled (if project is set)
if [ -n "$PROJECT_ID" ]; then
    info "Checking enabled APIs..."
    
    REQUIRED_APIS=(
        "cloudbuild.googleapis.com"
        "run.googleapis.com"
        "sqladmin.googleapis.com"
        "redis.googleapis.com"
        "artifactregistry.googleapis.com"
        "vpcaccess.googleapis.com"
        "secretmanager.googleapis.com"
    )
    
    for api in "${REQUIRED_APIS[@]}"; do
        if gcloud services list --enabled --filter="name:$api" --format="value(name)" 2>/dev/null | grep -q "$api"; then
            success "$api is enabled"
        else
            warning "$api is not enabled. Enable with: gcloud services enable $api"
        fi
    done
fi

# Check Docker images can be built
info "Validating Dockerfiles..."

# Validate backend Dockerfile syntax
if docker build -f backend/Dockerfile --no-cache --target builder backend -t test-backend-build &> /dev/null; then
    success "Backend Dockerfile is valid"
    docker rmi test-backend-build &> /dev/null || true
else
    warning "Backend Dockerfile may have issues"
fi

# Validate frontend Dockerfile syntax
if docker build -f frontend/Dockerfile --no-cache --target deps frontend -t test-frontend-deps &> /dev/null; then
    success "Frontend Dockerfile is valid"
    docker rmi test-frontend-deps &> /dev/null || true
else
    warning "Frontend Dockerfile may have issues"
fi

# Check environment variables documentation
info "Checking environment documentation..."
if [ -f "backend/.env.example" ]; then
    success "Backend .env.example found"
else
    warning "Backend .env.example not found"
fi

if [ -f "frontend/.env.example" ]; then
    success "Frontend .env.example found"
else
    warning "Frontend .env.example not found"
fi

# Check deployment documentation
info "Checking deployment documentation..."
if [ -f "DEPLOYMENT.md" ]; then
    success "DEPLOYMENT.md found"
else
    warning "DEPLOYMENT.md not found"
fi

echo ""
echo "=========================================="
echo "✅ Cloud validation complete!"
echo ""

if [ -n "$PROJECT_ID" ]; then
    echo "Next steps for deployment:"
    echo ""
    echo "1. Enable required APIs (if not already enabled):"
    echo "   gcloud services enable cloudbuild.googleapis.com run.googleapis.com sqladmin.googleapis.com"
    echo ""
    echo "2. Create Artifact Registry:"
    echo "   gcloud artifacts repositories create stockmeter --repository-format=docker --location=us-central1"
    echo ""
    echo "3. Setup Cloud SQL:"
    echo "   gcloud sql instances create stockmeter-db --database-version=POSTGRES_16 --tier=db-f1-micro --region=us-central1"
    echo ""
    echo "4. Setup Redis:"
    echo "   gcloud redis instances create stockmeter-redis --size=1 --region=us-central1"
    echo ""
    echo "5. Deploy with Cloud Build:"
    echo "   gcloud builds submit --config=cloudbuild.yaml"
    echo ""
    echo "See DEPLOYMENT.md for detailed instructions."
else
    echo "Set your GCP project first:"
    echo "  gcloud config set project YOUR_PROJECT_ID"
fi
echo ""
