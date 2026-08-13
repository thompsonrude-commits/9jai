#!/bin/bash
# Backend API Test Script
# Usage: ./backend-api-tests.sh

# Configuration
BASE_URL="https://us-central1-jatalk-1274b.cloudfunctions.net"
RESULTS_FILE="test-results-backend.txt"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initialize results file
echo "Backend API Test Results - $(date)" > $RESULTS_FILE
echo "========================================" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Test counter
PASSED=0
FAILED=0
TOTAL=0

# Helper function for tests
run_test() {
    local test_name=$1
    local endpoint=$2
    local method=$3
    local data=$4
    
    TOTAL=$((TOTAL + 1))
    echo -e "${YELLOW}Running: $test_name${NC}"
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            --max-time 30)
    else
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL/$endpoint?$data" \
            --max-time 30)
    fi
    
    # Extract HTTP code (last line)
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    echo "Test: $test_name" >> $RESULTS_FILE
    echo "Endpoint: $endpoint" >> $RESULTS_FILE
    echo "HTTP Code: $http_code" >> $RESULTS_FILE
    echo "Response: $body" >> $RESULTS_FILE
    echo "---" >> $RESULTS_FILE
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ PASSED${NC} ($http_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC} ($http_code)"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

echo "========================================="
echo "Backend API Tests"
echo "========================================="
echo ""

# Test 1: Health Check
run_test "Health Check" "aiHealth" "GET" ""

# Test 2: Chat Endpoint
run_test "Chat Endpoint" "aiChat" "POST" '{
  "messages": [
    {"role": "user", "content": "Hello, test message"}
  ]
}'

# Test 3: Search Endpoint
run_test "Search Endpoint" "aiSearch" "POST" '{
  "query": "Nigeria population 2026"
}'

# Test 4: Time Endpoint (Default)
run_test "Time Endpoint (Default)" "aiTime" "POST" '{}'

# Test 5: Time Endpoint (Lagos)
run_test "Time Endpoint (Lagos)" "aiTime" "POST" '{
  "city": "Lagos"
}'

# Test 6: Time Endpoint (Nairobi)
run_test "Time Endpoint (Nairobi)" "aiTime" "POST" '{
  "city": "Nairobi"
}'

# Test 7: Weather Endpoint (Lagos)
run_test "Weather Endpoint (Lagos)" "aiWeather" "POST" '{
  "location": "Lagos"
}'

# Test 8: Weather Endpoint (Abuja)
run_test "Weather Endpoint (Abuja)" "aiWeather" "POST" '{
  "city": "Abuja"
}'

# Test 9: Image Generation
run_test "Image Generation" "aiImage" "POST" '{
  "prompt": "A beautiful sunset in Lagos, Nigeria"
}'

# Test 10: Liveness Check
run_test "Liveness Check" "aiLiveness" "GET" ""

# Test 11: Readiness Check
run_test "Readiness Check" "aiReady" "GET" ""

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Check $RESULTS_FILE for details.${NC}"
    exit 1
fi
