#!/bin/bash

# Stockmeter Health Check Script
# Quick health check for running services

echo "🏥 Stockmeter Health Check"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

success() { echo -e "${GREEN}✓${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }
warning() { echo -e "${YELLOW}⚠${NC} $1"; }

# Check Docker containers
echo "Docker Services:"
if docker ps | grep -q "stockmeter-postgres"; then
    success "PostgreSQL is running"
else
    error "PostgreSQL is not running"
fi

if docker ps | grep -q "stockmeter-redis"; then
    success "Redis is running"
else
    error "Redis is not running"
fi

echo ""

# Check backend
echo "Backend Service:"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    success "Backend is responding at http://localhost:3001"
    BACKEND_STATUS=$(curl -s http://localhost:3001/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "  Status: $BACKEND_STATUS"
else
    error "Backend is not responding at http://localhost:3001"
fi

echo ""

# Check frontend
echo "Frontend Service:"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    success "Frontend is responding at http://localhost:3000"
else
    error "Frontend is not responding at http://localhost:3000"
fi

echo ""
echo "=========================="
echo ""

# Summary
if docker ps | grep -q "stockmeter-postgres" && \
   docker ps | grep -q "stockmeter-redis" && \
   curl -s http://localhost:3001/health > /dev/null 2>&1 && \
   curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ All services are healthy!"
else
    echo "⚠️  Some services are not running"
    echo ""
    echo "To start services:"
    echo "  1. Docker: docker-compose up -d"
    echo "  2. Backend: cd backend && npm run dev"
    echo "  3. Frontend: cd frontend && npm run dev"
fi

echo ""
