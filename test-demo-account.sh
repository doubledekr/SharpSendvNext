#!/bin/bash

# Test script for demo account functionality
echo "========================================="
echo "SharpSend Demo Account Test Suite"
echo "========================================="

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:5000"

# Test counter
PASS=0
FAIL=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local endpoint="$2"
    local expected_content="$3"
    
    echo -n "Testing $name... "
    
    # Get auth token
    TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email": "demo@sharpsend.io", "password": "demo123", "subdomain": "demo"}' \
        | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}FAIL${NC} - Could not authenticate"
        ((FAIL++))
        return
    fi
    
    # Test the endpoint
    RESPONSE=$(curl -s $BASE_URL$endpoint -H "Authorization: Bearer $TOKEN")
    
    if echo "$RESPONSE" | grep -q "$expected_content"; then
        echo -e "${GREEN}PASS${NC}"
        ((PASS++))
    else
        echo -e "${RED}FAIL${NC}"
        echo "  Expected: $expected_content"
        echo "  Got: $(echo $RESPONSE | head -c 100)..."
        ((FAIL++))
    fi
}

# Test authentication
echo -n "Testing authentication... "
AUTH_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "demo@sharpsend.io", "password": "demo123", "subdomain": "demo"}')

if echo "$AUTH_RESPONSE" | grep -q '"token"'; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
fi

# Test various endpoints
test_endpoint "Analytics API" "/api/analytics" '"totalSubscribers":12847'
test_endpoint "Campaigns API" "/api/campaigns" '"Tech Earnings Week Alert"'
test_endpoint "Subscribers API" "/api/subscribers" '"total":12847'
test_endpoint "Market News API" "/api/market-news" '"news":\['
test_endpoint "Segments API" "/api/segments" '\['
test_endpoint "Opportunities API" "/api/opportunities" '"opportunity"'
test_endpoint "Assignments API" "/api/assignments" '"assignment"'
test_endpoint "Email Templates API" "/api/email-templates" '"template"'

# Summary
echo "========================================="
echo "Test Results:"
echo -e "  Passed: ${GREEN}$PASS${NC}"
echo -e "  Failed: ${RED}$FAIL${NC}"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi