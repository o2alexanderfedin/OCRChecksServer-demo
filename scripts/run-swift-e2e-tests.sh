#!/bin/bash

# Swift Proxy End-to-End Integration Test Runner
# This script starts the server, runs the Swift integration tests, then stops the server

# Set color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Print header
echo -e "${GREEN}=== Swift Proxy End-to-End Integration Tests ===${NC}"
echo "This script will start the server, run Swift integration tests, then stop the server."
echo ""

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
cd "$PROJECT_ROOT" || { echo -e "${RED}Error: Could not find project root directory${NC}"; exit 1; }

# Check that swift is installed
if ! command -v swift &> /dev/null; then
    echo -e "${RED}Error: swift is not installed or not in PATH${NC}"
    echo "Please install Swift from https://swift.org/download/"
    exit 1
fi

# Store the PID of the server process
SERVER_PID_FILE=".server-pid"

# Function to clean up on script exit
function cleanup {
    echo ""
    # Check if server pid file exists
    if [ -f "$SERVER_PID_FILE" ]; then
        SERVER_PID=$(cat "$SERVER_PID_FILE")
        echo -e "${YELLOW}Stopping server process (PID: $SERVER_PID)...${NC}"
        kill "$SERVER_PID" 2>/dev/null || true
        rm "$SERVER_PID_FILE"
        echo -e "${GREEN}Server stopped${NC}"
    fi
}

# Register cleanup function to run on script exit
trap cleanup EXIT

# Environment selection with defaults to local server
ENV=${1:-local}  # Use first argument or default to "local"

# Environment-specific configuration
ENVIRONMENTS=(
  "production:https://api.nolock.social"
  "staging:https://staging-api.nolock.social"
  "dev:https://ocr-checks-worker-dev.af-4a0.workers.dev"
  "local:http://localhost:8789"
)

# Find the URL for the specified environment
SERVER_URL=""
for env_pair in "${ENVIRONMENTS[@]}"; do
  key="${env_pair%%:*}"
  value="${env_pair#*:}"
  if [ "$key" = "$ENV" ]; then
    SERVER_URL="$value"
    break
  fi
done

# If no matching environment found, use local
if [ -z "$SERVER_URL" ]; then
  echo -e "${YELLOW}Unknown environment: $ENV, defaulting to local${NC}"
  ENV="local"
  SERVER_URL="http://localhost:8789"
fi

# Start local server if needed
if [ "$ENV" = "local" ]; then
  echo -e "${YELLOW}Starting the local server with wrangler...${NC}"
  cd "$PROJECT_ROOT" || { echo -e "${RED}Error: Could not find project root directory${NC}"; exit 1; }
  
  # Load environment variables from .dev.vars if it exists
  if [ -f ".dev.vars" ]; then
    echo "Loading environment variables from .dev.vars file..."
    export $(grep -v '^#' .dev.vars | xargs)
    echo "Variables: MISTRAL_API_KEY=${MISTRAL_API_KEY:0:4}****"
  else
    echo -e "${YELLOW}Warning: .dev.vars file not found. API key may not be available.${NC}"
  fi
  
  # Use remote flag to ensure environment variables are loaded
  npx wrangler dev --remote --port 8789 &
  SERVER_PID=$!
  echo $SERVER_PID > "$SERVER_PID_FILE"

  echo "Server process started with PID: $SERVER_PID"
  echo "Waiting for server to be ready..."

  # Wait for server to start (ping health endpoint)
  MAX_RETRIES=60  # Increased timeout
  RETRY_COUNT=0

  # Give the server a head start before pinging
  sleep 5

  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s "$SERVER_URL/health" | grep -q "status"; then
      echo -e "${GREEN}Server is ready!${NC}"
      break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
      echo -e "${RED}Error: Server failed to start within timeout period${NC}"
      exit 1
    fi
    
    echo "Waiting for server to start... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 1
  done
else
  # Test against remote environment
  echo -e "${YELLOW}Testing against ${ENV} environment: ${SERVER_URL}${NC}"
  echo "Checking if server is available..."

  # Check if server is responding
  if curl -s "$SERVER_URL/health" | grep -q "status"; then
    echo -e "${GREEN}Server is available!${NC}"
  else
    echo -e "${RED}Error: Server is not responding${NC}"
    exit 1
  fi

  # Add a delay to make sure we don't hit rate limits
  echo -e "${YELLOW}Waiting for 3 seconds before running tests (to avoid rate limits)...${NC}"
  sleep 3
fi

# Set environment variable for the Swift tests
export OCR_API_URL="$SERVER_URL"

# Run the Swift tests
echo ""
echo -e "${YELLOW}Running Swift integration tests...${NC}"
cd swift-proxy || { echo -e "${RED}Error: Could not find swift-proxy directory${NC}"; exit 1; }

# Run Swift tests
swift test

# Check the result
SWIFT_TEST_RESULT=$?
if [ $SWIFT_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}Swift integration tests completed successfully!${NC}"
else
    echo -e "${RED}Swift integration tests failed with code: $SWIFT_TEST_RESULT${NC}"
fi

# Return to project root
cd "$PROJECT_ROOT" || { echo -e "${RED}Error: Could not find project root directory${NC}"; exit 1; }

# Script will automatically clean up the server on exit (via trap)
exit $SWIFT_TEST_RESULT