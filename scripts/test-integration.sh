#!/bin/bash

# Integration Test Script for Stockmeter MVP
# Tests critical API endpoints and flows

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"
TEST_NAME="Test User"

echo "🧪 Starting Stockmeter Integration Tests"
echo "Backend URL: $BACKEND_URL"
echo ""

# Test counter
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local data="$5"
    local headers="$6"
    
    echo -n "Testing: $name... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            ${headers:+-H "$headers"} \
            -d "$data" \
            "$BACKEND_URL$endpoint" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            ${headers:+-H "$headers"} \
            "$BACKEND_URL$endpoint" 2>/dev/null || echo "000")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ] || [ "$status_code" = "200" ] || [ "$status_code" = "201" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Health Check" "GET" "/health" "200"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Authentication Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test registration
test_endpoint "User Registration" "POST" "/api/auth/register" "201" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}"

# Test login
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
    "$BACKEND_URL/api/auth/login" 2>/dev/null)

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
    echo -e "Testing: User Login... ${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "Testing: User Login... ${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Stock Data Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Stock Search" "GET" "/api/stocks/search?q=AAPL" "200"
test_endpoint "Stock Profile" "GET" "/api/stocks/AAPL" "200"
test_endpoint "Stock Financials" "GET" "/api/stocks/AAPL/financials" "200"
test_endpoint "Fair Value Calculation" "GET" "/api/stocks/AAPL/fairvalue" "200"

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Watchlist Endpoints (Authenticated)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$ACCESS_TOKEN" ]; then
    AUTH_HEADER="Authorization: Bearer $ACCESS_TOKEN"
    
    test_endpoint "Get Watchlist" "GET" "/api/user/watchlist" "200" "" "$AUTH_HEADER"
    test_endpoint "Add to Watchlist" "POST" "/api/user/watchlist" "201" \
        "{\"ticker\":\"AAPL\"}" "$AUTH_HEADER"
    test_endpoint "Remove from Watchlist" "DELETE" "/api/user/watchlist/AAPL" "200" "" "$AUTH_HEADER"
else
    echo -e "${YELLOW}⚠ Skipping authenticated tests (no access token)${NC}"
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Currency Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Get Exchange Rates" "GET" "/api/currency/rates" "200"

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Payment Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$ACCESS_TOKEN" ]; then
    test_endpoint "Get Subscription Status" "GET" "/api/user/subscription" "200" "" "$AUTH_HEADER"
else
    echo -e "${YELLOW}⚠ Skipping payment tests (no access token)${NC}"
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
