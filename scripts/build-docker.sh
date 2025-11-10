#!/bin/bash

# Stockmeter Docker Build Script
# This script builds Docker images for both backend and frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_IMAGE="stockmeter-backend"
FRONTEND_IMAGE="stockmeter-frontend"
TAG="${1:-latest}"

echo -e "${GREEN}Building Stockmeter Docker Images${NC}"
echo "Tag: $TAG"
echo ""

# Build backend
echo -e "${YELLOW}Building backend image...${NC}"
docker build -t ${BACKEND_IMAGE}:${TAG} -f backend/Dockerfile ./backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend image built successfully${NC}"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi

echo ""

# Build frontend
echo -e "${YELLOW}Building frontend image...${NC}"
docker build -t ${FRONTEND_IMAGE}:${TAG} -f frontend/Dockerfile ./frontend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend image built successfully${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}All images built successfully!${NC}"
echo ""
echo "Images created:"
echo "  - ${BACKEND_IMAGE}:${TAG}"
echo "  - ${FRONTEND_IMAGE}:${TAG}"
echo ""
echo "To run the images:"
echo "  docker run -p 3001:3001 ${BACKEND_IMAGE}:${TAG}"
echo "  docker run -p 3000:3000 ${FRONTEND_IMAGE}:${TAG}"
