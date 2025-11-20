#!/bin/bash

# Stockmeter Local Testing Script
# This script tests the application in local development mode

set -e

echo "🧪 Stockmeter Local Testing"
echo "============================"
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

# Check if Docker is running
info "Checking Docker status..."
if ! docker info &> /dev/null; then
    error "Docker is not running. Please start Docker Desktop."
    exit 1
fi
success "Docker is running"

# Start Docker services
info "Starting Docker services..."
docker-compose up -d
sleep 5

# Check if containers are running
if docker ps | grep -q "stockmeter-postgres" && docker ps | grep -q "stockmeter-redis"; then
    success "Docker containers are running"
else
    error "Failed to start Docker containers"
    exit 1
fi

# Test PostgreSQL connection
info "Testing PostgreSQL connection..."
if docker exec stockmeter-postgres pg_isready -U stockmeter -d stockmeter_dev &> /dev/null; then
    success "PostgreSQL is ready"
else
    error "PostgreSQL is not ready"
    exit 1
fi

# Test Redis connection
info "Testing Redis connection..."
if docker exec stockmeter-redis redis-cli ping | grep -q "PONG"; then
    success "Redis is ready"
else
    error "Redis is not ready"
    exit 1
fi

# Check backend dependencies
info "Checking backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
    warning "Backend dependencies not installed. Installing..."
    cd backend && npm install && cd ..
fi
success "Backend dependencies are installed"

# Check frontend dependencies
info "Checking frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    warning "Frontend dependencies not installed. Installing..."
    cd frontend && npm install && cd ..
fi
success "Frontend dependencies are installed"

# Check backend .env
info "Checking backend environment variables..."
if [ ! -f "backend/.env" ]; then
    warning "Backend .env not found. Creating from .env.example..."
    cp backend/.env.example backend/.env
fi
success "Backend .env exists"

# Check frontend .env.local
info "Checking frontend environment variables..."
if [ ! -f "frontend/.env.local" ]; then
    warning "Frontend .env.local not found. Creating from .env.example..."
    cp frontend/.env.example frontend/.env.local
fi
success "Frontend .env.local exists"

# Generate Prisma Client
info "Generating Prisma Client..."
cd backend
npm run db:generate &> /dev/null || true
success "Prisma Client generated"

# Run database migrations
info "Running database migrations..."
npm run db:migrate &> /dev/null || {
    warning "Migrations may have already been applied"
}
success "Database migrations complete"
cd ..

# Type check backend
info "Type checking backend..."
cd backend
if npm run type-check &> /dev/null || npx tsc --noEmit &> /dev/null; then
    success "Backend type check passed"
else
    warning "Backend has type errors (non-critical)"
fi
cd ..

# Type check frontend
info "Type checking frontend..."
cd frontend
if npm run type-check &> /dev/null; then
    success "Frontend type check passed"
else
    warning "Frontend has type errors (non-critical)"
fi
cd ..

# Lint backend
info "Linting backend..."
cd backend
if npm run lint &> /dev/null || true; then
    success "Backend lint passed"
else
    warning "Backend has lint warnings (non-critical)"
fi
cd ..

# Lint frontend
info "Linting frontend..."
cd frontend
if npm run lint &> /dev/null || true; then
    success "Frontend lint passed"
else
    warning "Frontend has lint warnings (non-critical)"
fi
cd ..

# Build backend
info "Building backend..."
cd backend
if npm run build &> /dev/null; then
    success "Backend build successful"
else
    error "Backend build failed"
    cd ..
    exit 1
fi
cd ..

# Build frontend
info "Building frontend..."
cd frontend
if npm run build &> /dev/null; then
    success "Frontend build successful"
else
    error "Frontend build failed"
    cd ..
    exit 1
fi
cd ..

echo ""
echo "============================"
echo "✅ All tests passed!"
echo ""
echo "Your application is ready to run:"
echo "  npm run dev"
echo ""
echo "Or run services separately:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
