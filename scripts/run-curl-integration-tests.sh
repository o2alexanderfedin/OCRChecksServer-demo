#!/bin/bash

# Run curl integration tests against a local server
# Starts a server, runs the tests, and then shuts down the server

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
SERVER_PORT=${SERVER_PORT:-0} # Use 0 to let the OS assign an available port
SERVER_STARTUP_WAIT=15 # seconds to wait for server to start
SERVER_PID_FILE="./.server-pid"
TEST_MODE=${TEST_MODE:-"normal"}
EXIT_CODE=0
ACTUAL_SERVER_PORT=""  # Will be populated with the actual port from server output

# Clean up resources before exiting
cleanup() {
  echo -e "${YELLOW}Cleaning up resources...${NC}"
  
  # Check if server PID file exists
  if [ -f "$SERVER_PID_FILE" ]; then
    SERVER_PID=$(cat "$SERVER_PID_FILE")
    if [ -n "$SERVER_PID" ]; then
      echo -e "${YELLOW}Shutting down server (PID: $SERVER_PID)...${NC}"
      kill -15 $SERVER_PID 2>/dev/null || true
      
      # Wait for server to shut down
      for i in {1..5}; do
        if ! ps -p $SERVER_PID > /dev/null; then
          break
        fi
        sleep 1
      done
      
      # Force kill if server is still running
      if ps -p $SERVER_PID > /dev/null; then
        echo -e "${YELLOW}Server did not shut down gracefully, force killing...${NC}"
        kill -9 $SERVER_PID 2>/dev/null || true
      fi
    fi
    
    # Remove PID file and server output log
    rm -f "$SERVER_PID_FILE"
    rm -f ".server-output.log"
  fi
  
  echo -e "${GREEN}Cleanup complete.${NC}"
  
  # Exit with appropriate code
  exit $EXIT_CODE
}

# Set up trap to ensure cleanup happens even if script is interrupted
trap cleanup EXIT INT TERM

# Check for dev vars file
if [ ! -f ".dev.vars" ]; then
  echo -e "${RED}${BOLD}ERROR: .dev.vars file not found. This is required for tests.${NC}"
  echo -e "Please create a .dev.vars file with your Mistral API key:"
  echo -e "MISTRAL_API_KEY=your_api_key_here"
  exit 1
fi

# Load environment variables
echo -e "${BLUE}${BOLD}Loading environment variables from .dev.vars...${NC}"
export $(cat .dev.vars | grep -v '^#' | xargs)

# Start the server
echo -e "${BLUE}${BOLD}Starting server in test mode...${NC}"
# Use SERVER_PORT environment variable to request specific port
export SERVER_PORT
# Start server and capture its output to get actual port, but also show output to user
NODE_ENV=test node --no-deprecation scripts/start-server.js 2>&1 | tee .server-output.log &

# Give the server time to start up
echo -e "${YELLOW}Waiting for server to start (max ${SERVER_STARTUP_WAIT} seconds)...${NC}"

# Loop until server is ready or timeout
start_time=$(date +%s)
while true; do
  # Check if server output log exists and contains port information
  if [ -f ".server-output.log" ]; then
    # Extract the actual port from the server output
    port_line=$(grep -o "Ready on http://localhost:[0-9]\+" .server-output.log | tail -1)
    if [ -n "$port_line" ]; then
      ACTUAL_SERVER_PORT=$(echo $port_line | grep -o "[0-9]\+$")
      echo -e "${GREEN}Server started on port: ${ACTUAL_SERVER_PORT}${NC}"
      break
    fi
  fi
  
  # Check if timeout reached
  current_time=$(date +%s)
  elapsed=$((current_time - start_time))
  if [ $elapsed -ge $SERVER_STARTUP_WAIT ]; then
    echo -e "${YELLOW}Timeout reached. Using default port ${SERVER_PORT}.${NC}"
    ACTUAL_SERVER_PORT=$SERVER_PORT
    break
  fi
  
  # Wait a bit before checking again
  sleep 1
  echo -n "."
done
echo

# Check if server started successfully
if [ ! -f "$SERVER_PID_FILE" ]; then
  echo -e "${RED}${BOLD}ERROR: Server PID file not found. Server may have failed to start.${NC}"
  if [ -f ".server-output.log" ]; then
    echo -e "${YELLOW}Server output logs:${NC}"
    cat .server-output.log
  fi
  exit 1
fi

SERVER_PID=$(cat "$SERVER_PID_FILE")
if ! ps -p $SERVER_PID > /dev/null; then
  echo -e "${RED}${BOLD}ERROR: Server process not found. Server may have crashed.${NC}"
  if [ -f ".server-output.log" ]; then
    echo -e "${YELLOW}Server output logs:${NC}"
    cat .server-output.log
  fi
  exit 1
fi

# Check if server is responding to health checks
echo -e "${YELLOW}Verifying server health...${NC}"
HEALTH_RESPONSE=$(curl -s "http://localhost:${ACTUAL_SERVER_PORT}/health")
HEALTH_STATUS=$?

if [ $HEALTH_STATUS -ne 0 ] || ! echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo -e "${RED}${BOLD}ERROR: Server health check failed.${NC}"
  echo -e "Health response: $HEALTH_RESPONSE"
  exit 1
fi

echo -e "${GREEN}Server is healthy and ready for testing.${NC}"

# Run the curl tests
echo -e "${BLUE}${BOLD}Running curl integration tests...${NC}"
API_URL="http://localhost:${ACTUAL_SERVER_PORT}" TEST_MODE="$TEST_MODE" ./scripts/run-curl-tests.sh
EXIT_CODE=$?

# Result summary
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}${BOLD}✓ All tests passed!${NC}"
else
  echo -e "${RED}${BOLD}✗ Some tests failed.${NC}"
fi

# The cleanup function will be called automatically due to the trap
exit $EXIT_CODE