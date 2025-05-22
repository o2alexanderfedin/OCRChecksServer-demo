#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Environment URLs
DEV_URL="https://ocr-checks-worker-dev.af-4a0.workers.dev"
STAGING_URL="https://ocr-checks-worker-staging.af-4a0.workers.dev"
PROD_URL="https://ocr-checks-worker.af-4a0.workers.dev"

# Test image path
TEST_IMAGE="tests/fixtures/images/fredmeyer-receipt.jpg"

# Test duration (can be overridden with first argument)
DURATION=${1:-300}

# Test endpoint
ENDPOINT="/receipt"

# Counters for successful and failed requests
DEV_SUCCESS=0
DEV_FAIL=0
STAGING_SUCCESS=0
STAGING_FAIL=0
PROD_SUCCESS=0
PROD_FAIL=0

# Verify test image exists
if [ ! -f "$TEST_IMAGE" ]; then
  echo -e "${RED}${BOLD}ERROR: Test image not found at $TEST_IMAGE${NC}"
  exit 1
fi

echo -e "${BLUE}${BOLD}===== OCR Checks Environment Load Test =====${NC}"
echo -e "${BLUE}Starting tests against all environments for $DURATION seconds${NC}"
echo -e "${BLUE}Using test image: ${TEST_IMAGE}${NC}"
echo -e "${BLUE}Request interval: 1 second${NC}"
echo -e "${BLUE}${BOLD}==========================================${NC}\n"

# Calculate end time
END_TIME=$(($(date +%s) + DURATION))

# Function to test an environment
test_environment() {
  local url=$1
  local env_name=$2
  
  echo -e "${YELLOW}Testing $env_name: $url$ENDPOINT${NC}"
  
  # Run curl command and capture both body and status code
  local http_response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: image/jpeg" --data-binary @"$TEST_IMAGE" "$url$ENDPOINT")
  local status=$(echo "$http_response" | tail -n1)
  local body=$(echo "$http_response" | sed '$d')
  
  # Check if request was successful
  if [ "$status" -eq 200 ]; then
    echo -e "${GREEN}✅ $env_name: Success (HTTP $status)${NC}"
    case $env_name in
      "DEV") DEV_SUCCESS=$((DEV_SUCCESS + 1)) ;;
      "STAGING") STAGING_SUCCESS=$((STAGING_SUCCESS + 1)) ;;
      "PROD") PROD_SUCCESS=$((PROD_SUCCESS + 1)) ;;
    esac
  else
    echo -e "${RED}❌ $env_name: Failed (HTTP $status)${NC}"
    # Parse the JSON response to extract error message
    local error_msg=$(echo "$body" | grep -o '"error":"[^"]*"' | sed 's/"error":"//;s/"//')
    if [ -n "$error_msg" ]; then
      echo -e "${YELLOW}Error: $error_msg${NC}"
    else
      echo -e "${YELLOW}Response: $body${NC}"
    fi
    case $env_name in
      "DEV") DEV_FAIL=$((DEV_FAIL + 1)) ;;
      "STAGING") STAGING_FAIL=$((STAGING_FAIL + 1)) ;;
      "PROD") PROD_FAIL=$((PROD_FAIL + 1)) ;;
    esac
  fi
}

# Track start time
START_TIME=$(date +%s)

# Main loop for specified duration
while [ $(date +%s) -lt $END_TIME ]; do
  # Test each environment with a round-robin approach
  test_environment "$DEV_URL" "DEV"
  sleep 1
  
  test_environment "$STAGING_URL" "STAGING"
  sleep 1
  
  test_environment "$PROD_URL" "PROD"
  sleep 1
  
  # Print a separator between rounds
  echo -e "${BLUE}--------------------------------${NC}"
  
  # Calculate elapsed time
  ELAPSED=$(($(date +%s) - START_TIME))
  REMAINING=$((DURATION - ELAPSED))
  
  echo -e "${BLUE}Elapsed: ${ELAPSED}s / Remaining: ${REMAINING}s${NC}\n"
  
  # Check if we should exit early
  if [ $ELAPSED -ge $DURATION ]; then
    break
  fi
done

# Calculate final totals
DEV_TOTAL=$((DEV_SUCCESS + DEV_FAIL))
STAGING_TOTAL=$((STAGING_SUCCESS + STAGING_FAIL))
PROD_TOTAL=$((PROD_SUCCESS + PROD_FAIL))
TOTAL=$((DEV_TOTAL + STAGING_TOTAL + PROD_TOTAL))

# Calculate success rates (avoid division by zero)
DEV_RATE=0
STAGING_RATE=0
PROD_RATE=0

if [ $DEV_TOTAL -gt 0 ]; then
  DEV_RATE=$(echo "scale=2; $DEV_SUCCESS * 100 / $DEV_TOTAL" | bc)
fi

if [ $STAGING_TOTAL -gt 0 ]; then
  STAGING_RATE=$(echo "scale=2; $STAGING_SUCCESS * 100 / $STAGING_TOTAL" | bc)
fi

if [ $PROD_TOTAL -gt 0 ]; then
  PROD_RATE=$(echo "scale=2; $PROD_SUCCESS * 100 / $PROD_TOTAL" | bc)
fi

# Calculate actual elapsed time
ACTUAL_ELAPSED=$(($(date +%s) - START_TIME))

# Print summary
echo -e "\n${BLUE}${BOLD}===== Test Summary =====${NC}"
echo -e "${BOLD}Total test duration: ${ACTUAL_ELAPSED} seconds${NC}"
echo -e "${BOLD}Total requests: ${TOTAL}${NC}\n"

echo -e "${YELLOW}${BOLD}DEV Environment:${NC}"
echo -e "  Success: $DEV_SUCCESS / $DEV_TOTAL (${DEV_RATE}%)"
echo -e "  Failed: $DEV_FAIL / $DEV_TOTAL\n"

echo -e "${YELLOW}${BOLD}STAGING Environment:${NC}"
echo -e "  Success: $STAGING_SUCCESS / $STAGING_TOTAL (${STAGING_RATE}%)"
echo -e "  Failed: $STAGING_FAIL / $STAGING_TOTAL\n"

echo -e "${YELLOW}${BOLD}PRODUCTION Environment:${NC}"
echo -e "  Success: $PROD_SUCCESS / $PROD_TOTAL (${PROD_RATE}%)"
echo -e "  Failed: $PROD_FAIL / $PROD_TOTAL\n"

echo -e "${BLUE}${BOLD}===== End of Test =====${NC}"