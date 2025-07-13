#!/bin/bash
set -euo pipefail

# Smoke Test Script for DuetRight Dashboard
# Runs basic tests to verify deployment health

# Configuration
BASE_URL="${BASE_URL:-http://localhost:5001}"
API_URL="${BASE_URL}/api"
TIMEOUT=5
VERBOSE=${VERBOSE:-false}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Helper functions
log() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
    fi
}

test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    local method=${4:-GET}
    local data=${5:-}
    
    echo -n "Testing $name... "
    
    local curl_args="-s -o /dev/null -w %{http_code} --max-time $TIMEOUT"
    if [[ -n "$data" ]]; then
        curl_args="$curl_args -H 'Content-Type: application/json' -d '$data'"
    fi
    
    local status=$(curl $curl_args -X $method "$url")
    
    if [[ "$status" == "$expected_status" ]]; then
        echo -e "${GREEN}✓${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} (Expected: $expected_status, Got: $status)"
        ((TESTS_FAILED++))
        FAILED_TESTS+=("$name")
        return 1
    fi
}

test_json_response() {
    local name=$1
    local url=$2
    local jq_filter=$3
    local expected=$4
    
    echo -n "Testing $name... "
    
    local response=$(curl -s --max-time $TIMEOUT "$url")
    local actual=$(echo "$response" | jq -r "$jq_filter" 2>/dev/null || echo "PARSE_ERROR")
    
    if [[ "$actual" == "$expected" ]]; then
        echo -e "${GREEN}✓${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} (Expected: $expected, Got: $actual)"
        ((TESTS_FAILED++))
        FAILED_TESTS+=("$name")
        return 1
    fi
}

# Start tests
echo "🧪 Running Smoke Tests for $BASE_URL"
echo "=================================="

# Health Check Tests
echo -e "\n📋 Health Checks:"
test_endpoint "Basic Health" "$API_URL/health" 200
test_json_response "Health Status" "$API_URL/health" ".status" "healthy"
test_endpoint "Liveness Probe" "$API_URL/health/live" 200
test_endpoint "Readiness Probe" "$API_URL/health/ready" 200

# API Endpoint Tests
echo -e "\n🔌 API Endpoints:"
test_endpoint "Auth Health" "$API_URL/auth/health" 200
test_endpoint "API Documentation" "$API_URL/docs" 200
test_endpoint "Metrics Endpoint" "$API_URL/metrics" 200

# Static Assets
echo -e "\n📦 Static Assets:"
test_endpoint "Frontend Index" "$BASE_URL/" 200
test_endpoint "Manifest.json" "$BASE_URL/manifest.json" 200
test_endpoint "Service Worker" "$BASE_URL/service-worker.js" 200

# Security Headers
echo -e "\n🔒 Security Headers:"
HEADERS=$(curl -s -I "$BASE_URL")
echo -n "Testing X-Frame-Options... "
if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    echo -e "${GREEN}✓${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC}"
    ((TESTS_FAILED++))
    FAILED_TESTS+=("X-Frame-Options header")
fi

echo -n "Testing X-Content-Type-Options... "
if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✓${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC}"
    ((TESTS_FAILED++))
    FAILED_TESTS+=("X-Content-Type-Options header")
fi

# Performance Checks
echo -e "\n⚡ Performance Checks:"
echo -n "Testing response time (<1s)... "
START_TIME=$(date +%s%N)
curl -s "$API_URL/health" > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

if [[ $RESPONSE_TIME -lt 1000 ]]; then
    echo -e "${GREEN}✓${NC} (${RESPONSE_TIME}ms)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} (${RESPONSE_TIME}ms)"
    ((TESTS_FAILED++))
    FAILED_TESTS+=("Response time")
fi

# Service Dependencies
echo -e "\n🔗 Service Dependencies:"
test_json_response "Redis Connection" "$API_URL/health/services/redis" ".status" "healthy"
test_json_response "Firebase Connection" "$API_URL/health/services/firebase" ".status" "healthy"

# Error Handling
echo -e "\n❌ Error Handling:"
test_endpoint "404 Not Found" "$API_URL/nonexistent" 404
test_endpoint "Invalid Method" "$API_URL/health" 405 "POST"

# Summary
echo -e "\n=================================="
echo "📊 Test Summary:"
echo "  Passed: ${GREEN}$TESTS_PASSED${NC}"
echo "  Failed: ${RED}$TESTS_FAILED${NC}"

if [[ $TESTS_FAILED -gt 0 ]]; then
    echo -e "\n${RED}Failed Tests:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo "  - $test"
    done
    echo -e "\n${RED}❌ Smoke tests failed!${NC}"
    exit 1
else
    echo -e "\n${GREEN}✅ All smoke tests passed!${NC}"
    exit 0
fi