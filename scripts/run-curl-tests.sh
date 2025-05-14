#!/bin/bash

# Curl-based Integration Tests for OCR Checks Server
# This script tests the API endpoints using curl directly
# Designed to be run both in development and CI environments

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Default to local server URL, but allow override through env variable
API_URL=${API_URL:-"http://localhost:8787"}
TEST_MODE=${TEST_MODE:-"normal"} # Options: normal, verbose, quiet

# Test image path - try different locations in order
TEST_IMAGE=""
POSSIBLE_IMAGES=(
  # Prefer simple JPG test images first for faster tests
  "tiny-test.jpg"
  "micro-test.jpg"
  "small-test.jpg"
  # Then try fixture images - JPG format first (more reliable for curl tests)
  "tests/fixtures/images/fredmeyer-receipt.jpg"
  "tests/fixtures/images/fredmeyer-receipt-2.jpg"
  "tests/fixtures/images/rental-bill.jpg" 
  # HEIC images often need special handling and may not work with curl binary post
  # "tests/fixtures/images/pge-bill.HEIC"
  # "tests/fixtures/images/promo-check.HEIC"
)

# Rate limiting settings - add delays between calls to stay under API limits
RATE_LIMIT_DELAY=200       # 200ms ~= 5 requests/sec is below Mistral's 6/sec limit
FAILED_TESTS_COUNT=0       # Track test failures
TOTAL_TESTS_COUNT=0        # Track total tests run
TESTS_START_TIME=$(date +%s)
# Default timeout for curl requests (in seconds)
CURL_TIMEOUT=30            # 30 seconds is enough for most operations, but can be overridden

# Find the first available test image
for img in "${POSSIBLE_IMAGES[@]}"; do
  if [ -f "$img" ]; then
    TEST_IMAGE="$img"
    break
  fi
done

if [ -z "$TEST_IMAGE" ]; then
  echo -e "${RED}${BOLD}ERROR: No test image found. Please provide a valid image path.${NC}"
  exit 1
fi

# Function to print messages conditionally based on verbosity level
print_message() {
  local level=$1
  local message=$2
  local color=$3
  
  if [ "$TEST_MODE" = "quiet" ] && [ "$level" != "error" ] && [ "$level" != "success" ]; then
    return
  fi
  
  if [ "$TEST_MODE" = "normal" ] && [ "$level" = "debug" ]; then
    return
  fi
  
  if [ -n "$color" ]; then
    echo -e "${color}${message}${NC}"
  else
    echo -e "$message"
  fi
}

# Function to run a test and process results
run_test() {
  local name=$1
  local endpoint=$2
  local method=${3:-"GET"}
  local content_type=${4:-"application/json"}
  local data=${5:-""}
  local expected_status=${6:-200}
  local validation_command=${7:-""}
  local timeout=${8:-$CURL_TIMEOUT}
  
  TOTAL_TESTS_COUNT=$((TOTAL_TESTS_COUNT + 1))
  
  print_message "info" "\n${BOLD}Running Test: ${name}${NC}" "$BLUE"
  print_message "info" "Endpoint: ${endpoint}" "$YELLOW"
  print_message "info" "Method: ${method}" "$YELLOW"
  print_message "info" "Timeout: ${timeout}s" "$YELLOW"
  
  # Prepare curl command
  local curl_cmd="curl -s -w '\n%{http_code}' -X ${method} --max-time ${timeout}"
  
  # Add headers
  curl_cmd+=" -H 'Content-Type: ${content_type}'"
  
  # Add data if provided
  if [ -n "$data" ]; then
    if [ "$content_type" = "image/jpeg" ] || [ "$content_type" = "image/heic" ] || [ "$content_type" = "application/octet-stream" ]; then
      curl_cmd+=" --data-binary @${data}"
      print_message "debug" "Using image: ${data}" "$YELLOW"
    else
      curl_cmd+=" -d '${data}'"
      print_message "debug" "Request body: ${data}" "$YELLOW"
    fi
  fi
  
  # Add the URL
  curl_cmd+=" ${API_URL}${endpoint}"
  
  print_message "debug" "Command: ${curl_cmd}" "$YELLOW"
  
  # Run the curl command and capture output
  local response=$(eval $curl_cmd)
  local status=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')
  
  # Check status code
  if [ "$status" -eq "$expected_status" ]; then
    print_message "success" "✅ Status code ${status} matches expected ${expected_status}" "$GREEN"
  else
    print_message "error" "❌ Status code ${status} does not match expected ${expected_status}" "$RED"
    FAILED_TESTS_COUNT=$((FAILED_TESTS_COUNT + 1))
  fi
  
  # Log response body
  if [ "$TEST_MODE" = "verbose" ]; then
    print_message "debug" "\nResponse body:" "$YELLOW"
    echo "$body" | python3 -m json.tool || echo "$body"
  fi
  
  # Run validation if provided
  if [ -n "$validation_command" ]; then
    local validation_result=$(echo "$body" | eval $validation_command)
    local validation_status=$?
    
    if [ $validation_status -eq 0 ]; then
      print_message "success" "✅ Validation passed: $validation_result" "$GREEN"
    else
      print_message "error" "❌ Validation failed" "$RED"
      FAILED_TESTS_COUNT=$((FAILED_TESTS_COUNT + 1))
    fi
  fi
  
  # Add delay to respect rate limits
  sleep $(echo "scale=3; $RATE_LIMIT_DELAY/1000" | bc)
  
  return $status
}

print_message "info" "${BLUE}${BOLD}===== OCR Checks Server API Tests =====${NC}"
print_message "info" "Testing server at: ${API_URL}"
print_message "info" "Using test image: ${TEST_IMAGE}"
print_message "info" "Verbosity level: ${TEST_MODE}"
print_message "info" "Rate limit delay: ${RATE_LIMIT_DELAY}ms between requests"
print_message "info" "${BLUE}${BOLD}======================================${NC}"

# Test 1: Health Check API
run_test \
  "Health Check" \
  "/health" \
  "GET" \
  "application/json" \
  "" \
  200 \
  "grep -q '\"status\":\"ok\"' && echo 'Health status is OK'"

# Test 2: Check API with image
run_test \
  "Check Processing - Basic Upload" \
  "/check" \
  "POST" \
  "image/jpeg" \
  "${TEST_IMAGE}" \
  200 \
  "grep -q '\"data\"' && echo 'Response contains data field'"

# Test 3: Receipt API with image
run_test \
  "Receipt Processing - Basic Upload" \
  "/receipt" \
  "POST" \
  "image/jpeg" \
  "${TEST_IMAGE}" \
  200 \
  "grep -q '\"data\"' && echo 'Response contains data field'"

# Test 4: Process universal endpoint for checks
run_test \
  "Process Endpoint - Check Type" \
  "/process?type=check" \
  "POST" \
  "image/jpeg" \
  "${TEST_IMAGE}" \
  200 \
  "grep -q '\"documentType\":\"check\"' && echo 'Document type is check'" \
  60  # 60 second timeout for this endpoint

# Test 5: Process universal endpoint for receipts
run_test \
  "Process Endpoint - Receipt Type" \
  "/process?type=receipt" \
  "POST" \
  "image/jpeg" \
  "${TEST_IMAGE}" \
  200 \
  "grep -q '\"documentType\":\"receipt\"' && echo 'Document type is receipt'" \
  60  # 60 second timeout for this endpoint

# Test 6: Error handling - invalid content type
run_test \
  "Error Handling - Invalid Content Type" \
  "/check" \
  "POST" \
  "application/json" \
  "{\"test\":\"data\"}" \
  400 \
  "grep -q '\"error\"' && echo 'Error field present in response'"

# Test 7: Error handling - invalid document type
run_test \
  "Error Handling - Invalid Document Type" \
  "/process?type=invalid_type" \
  "POST" \
  "image/jpeg" \
  "${TEST_IMAGE}" \
  400 \
  "grep -q '\"error\"' && echo 'Error field present in response'"

# Test 8: Error handling - unsupported method
run_test \
  "Error Handling - Unsupported Method" \
  "/check" \
  "DELETE" \
  "application/json" \
  "" \
  404 \
  "true" # No specific validation, just expect 404 status (Cloudflare returns 404 for unsupported methods)

# Calculate test execution time
TESTS_END_TIME=$(date +%s)
EXECUTION_TIME=$((TESTS_END_TIME - TESTS_START_TIME))

# Print summary
print_message "info" "\n${BOLD}${BLUE}===== Test Summary =====${NC}"
if [ $FAILED_TESTS_COUNT -eq 0 ]; then
  print_message "success" "${GREEN}${BOLD}All tests passed! (${TOTAL_TESTS_COUNT}/${TOTAL_TESTS_COUNT})${NC}"
else
  print_message "error" "${RED}${BOLD}${FAILED_TESTS_COUNT} out of ${TOTAL_TESTS_COUNT} tests failed!${NC}"
fi
print_message "info" "Total execution time: ${EXECUTION_TIME} seconds"

exit $FAILED_TESTS_COUNT