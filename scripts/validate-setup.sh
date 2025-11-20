#!/bin/bash

# Stockmeter Setup Validation Script
# This script validates the local development environment setup

set -e

echo "🔍 Stockmeter Setup Validation"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to print info
info() {
    echo -e "ℹ $1"
}

# Check Node.js version
echo "1. Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        success "Node.js $(node -v) installed"
    else
        error "Node.js version must be 20 or higher (found: $(node -v))"
        exit 1
    fi
else
    error "Node.js is not installed"
    exit 1
fi

# Check npm version
echo "2. Checking npm version..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v | cut -d'.' -f1)
    if [ "$NPM_VERSION" -ge 10 ]; then
        success "npm $(npm -v) installed"
    else
        warning "npm version should be 10 or higher (found: $(npm -v))"
    fi
else
    error "npm is not installed"
    exit 1
fi

# Check Docker
echo "3. Checking Docker..."
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        success "Docker is installed and running"
    else
        error "Docker is installed but not running"
        exit 1
    fi
else
    error "Docker is not installed"
    exit 1
fi

# Check Docker Compose
echo "4. Checking Docker Compose..."
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    success "Docker Compose is available"
else
    error "Docker Compose is not available"
    exit 1
fi

# Check if docker-compose.yml exists
echo "5. Checking docker-compose.yml..."
if [ -f "docker-compose.yml" ]; then
    success "docker-compose.yml found"
else
    error "docker-compose.yml not found"
    exit 1
fi

# Check backend directory
echo "6. Checking backend directory..."
if [ -d "backend" ]; then
    success "Backend directory exists"
    
    # Check backend package.json
    if [ -f "backend/package.json" ]; then
        success "Backend package.json found"
    else
        error "Backend package.json not found"
        exit 1
    fi
    
    # Check backend .env.example
    if [ -f "backend/.env.example" ]; then
        success "Backend .env.example found"
    else
        warning "Backend .env.example not found"
    fi
    
    # Check if backend .env exists
    if [ -f "backend/.env" ]; then
        success "Backend .env found"
    else
        warning "Backend .env not found (will need to be created)"
    fi
    
    # Check Prisma schema
    if [ -f "backend/prisma/schema.prisma" ]; then
        success "Prisma schema found"
    else
        error "Prisma schema not found"
        exit 1
    fi
else
    error "Backend directory not found"
    exit 1
fi

# Check frontend directory
echo "7. Checking frontend directory..."
if [ -d "frontend" ]; then
    success "Frontend directory exists"
    
    # Check frontend package.json
    if [ -f "frontend/package.json" ]; then
        success "Frontend package.json found"
    else
        error "Frontend package.json not found"
        exit 1
    fi
    
    # Check frontend .env.example
    if [ -f "frontend/.env.example" ]; then
        success "Frontend .env.example found"
    else
        warning "Frontend .env.example not found"
    fi
    
    # Check if frontend .env.local exists
    if [ -f "frontend/.env.local" ]; then
        success "Frontend .env.local found"
    else
        warning "Frontend .env.local not found (will need to be created)"
    fi
    
    # Check next.config.ts
    if [ -f "frontend/next.config.ts" ]; then
        success "Next.js config found"
    else
        error "Next.js config not found"
        exit 1
    fi
else
    error "Frontend directory not found"
    exit 1
fi

# Check if node_modules exist
echo "8. Checking dependencies..."
if [ -d "backend/node_modules" ]; then
    success "Backend dependencies installed"
else
    warning "Backend dependencies not installed (run: cd backend && npm install)"
fi

if [ -d "frontend/node_modules" ]; then
    success "Frontend dependencies installed"
else
    warning "Frontend dependencies not installed (run: cd frontend && npm install)"
fi

# Check Docker containers
echo "9. Checking Docker containers..."
if docker ps | grep -q "stockmeter-postgres"; then
    success "PostgreSQL container is running"
else
    warning "PostgreSQL container is not running (run: docker-compose up -d)"
fi

if docker ps | grep -q "stockmeter-redis"; then
    success "Redis container is running"
else
    warning "Redis container is not running (run: docker-compose up -d)"
fi

# Check Dockerfiles
echo "10. Checking Dockerfiles..."
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

# Check Cloud Build config
echo "11. Checking Cloud Build configuration..."
if [ -f "cloudbuild.yaml" ]; then
    success "cloudbuild.yaml found"
else
    warning "cloudbuild.yaml not found (needed for GCP deployment)"
fi

echo ""
echo "================================"
echo "✅ Validation Complete!"
echo ""
echo "Next steps:"
echo "1. If .env files are missing, copy from .env.example:"
echo "   cp backend/.env.example backend/.env"
echo "   cp frontend/.env.example frontend/.env.local"
echo ""
echo "2. Start Docker services:"
echo "   docker-compose up -d"
echo ""
echo "3. Install dependencies (if not already installed):"
echo "   cd backend && npm install"
echo "   cd frontend && npm install"
echo ""
echo "4. Run database migrations:"
echo "   cd backend && npm run db:migrate"
echo ""
echo "5. Start development servers:"
echo "   npm run dev"
echo ""
