#!/bin/bash

# run-all-tests.sh
# Comprehensive test runner that executes all test types and provides a consolidated report

# Set colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== OCR Checks Server Comprehensive Test Suite =====${NC}"
echo -e "Running all test types to ensure complete coverage\n"

# Track results
TOTAL_PASS=0
TOTAL_FAIL=0
TOTAL_SKIP=0
RESULTS=()

# Function to run a test and capture its result
run_test() {
  TEST_TYPE=$1
  TEST_CMD=$2
  TEST_DESC=$3
  
  echo -e "${YELLOW}Running $TEST_DESC...${NC}"
  
  if $TEST_CMD; then
    RESULTS+=("${GREEN}✓ $TEST_DESC - PASSED${NC}")
    ((TOTAL_PASS++))
  else
    RESULTS+=("${RED}✗ $TEST_DESC - FAILED${NC}")
    ((TOTAL_FAIL++))
  fi
  
  echo ""
}

# Create a temporary feature branch if not already on a feature branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ $CURRENT_BRANCH != feature/* ]]; then
  echo -e "${YELLOW}Creating a temporary feature branch for testing...${NC}"
  TEMP_BRANCH="feature/run-all-tests-$(date +%s)"
  git flow feature start "${TEMP_BRANCH#feature/}" || exit 1
  CREATED_TEMP_BRANCH=true
else
  echo -e "${GREEN}Already on feature branch: $CURRENT_BRANCH${NC}"
  CREATED_TEMP_BRANCH=false
fi

# Run unit tests
run_test "unit" "npm run test:unit" "Unit Tests"

# Run functional tests
run_test "functional" "npm run test:functional" "Functional Tests"

# Run semi-integration tests
run_test "semi" "npm run test:semi" "Semi-Integration Tests"

# Run receipt scanner tests
run_test "receipt-scanner" "npm run test:receipt-scanner" "Receipt Scanner Tests"

# Run integration tests
run_test "integration" "npm run test:integration" "Integration Tests"

# Run Swift end-to-end tests
run_test "swift-e2e" "npm run test:swift-e2e" "Swift End-to-End Tests"

# Run smoke tests (local)
run_test "smoke" "npm run test:smoke" "Smoke Tests (Default Environment)"

# Run lint check
run_test "lint" "npm run lint" "Linting Check"

# Print consolidated report
echo -e "\n${BLUE}===== OCR Checks Server Test Results =====${NC}"
for RESULT in "${RESULTS[@]}"; do
  echo -e "$RESULT"
done

echo -e "\n${BLUE}===== Test Summary =====${NC}"
echo -e "Total Test Suites: $((TOTAL_PASS + TOTAL_FAIL))"
echo -e "${GREEN}Passed: $TOTAL_PASS${NC}"
if [ $TOTAL_FAIL -gt 0 ]; then
  echo -e "${RED}Failed: $TOTAL_FAIL${NC}"
else
  echo -e "Failed: $TOTAL_FAIL"
fi
if [ $TOTAL_SKIP -gt 0 ]; then
  echo -e "${YELLOW}Skipped: $TOTAL_SKIP${NC}"
fi

# Clean up temporary branch if created
if $CREATED_TEMP_BRANCH; then
  echo -e "\n${YELLOW}Cleaning up temporary feature branch...${NC}"
  if [ $TOTAL_FAIL -eq 0 ]; then
    git flow feature finish "${TEMP_BRANCH#feature/}" || echo -e "${RED}Could not automatically finish feature branch. Please finish it manually.${NC}"
  else
    echo -e "${YELLOW}Test failures detected. Keeping feature branch for you to fix the issues.${NC}"
    echo -e "When done, run: git flow feature finish ${TEMP_BRANCH#feature/}"
  fi
fi

# Return overall success/failure
if [ $TOTAL_FAIL -eq 0 ]; then
  echo -e "\n${GREEN}All test suites passed!${NC}"
  exit 0
else
  echo -e "\n${RED}One or more test suites failed!${NC}"
  exit 1
fi