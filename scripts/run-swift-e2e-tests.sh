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

# Start the server manually using wrangler directly
echo -e "${YELLOW}Starting the server with wrangler...${NC}"
cd "$PROJECT_ROOT" || { echo -e "${RED}Error: Could not find project root directory${NC}"; exit 1; }
# Use port 8789 instead of 8787 to avoid conflicts
npx wrangler dev --local --port 8789 &
SERVER_PID=$!
echo $SERVER_PID > "$SERVER_PID_FILE"

echo "Server process started with PID: $SERVER_PID"
echo "Waiting for server to be ready..."

# Wait for server to start (ping health endpoint)
MAX_RETRIES=60  # Increased timeout
RETRY_COUNT=0
SERVER_URL="http://localhost:8789"

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