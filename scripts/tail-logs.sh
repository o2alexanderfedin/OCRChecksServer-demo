#!/bin/bash
# Tail logs script for monitoring Worker logs
# This script makes it easy to monitor logs with common filtering options

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
WORKER_NAME="ocr-checks-worker-dev"
FORMAT="pretty"
ENV="dev"
SEARCH=""
STATUS=""

# Display help information
show_help() {
    echo "Usage: bash scripts/tail-logs.sh [options]"
    echo
    echo "Options:"
    echo "  -e, --env ENV        Environment to tail logs from (default: dev)"
    echo "  -w, --worker NAME    Worker name (default: ocr-checks-worker-dev)"
    echo "  -s, --search TEXT    Filter logs by search text"
    echo "  --errors             Show only error logs"
    echo "  --json               Output logs in JSON format instead of pretty format"
    echo "  -h, --help           Display this help message"
    echo
    echo "Examples:"
    echo "  bash scripts/tail-logs.sh                          # Tail logs from dev environment (default)"
    echo "  bash scripts/tail-logs.sh -e staging               # Tail logs from staging environment"
    echo "  bash scripts/tail-logs.sh -s \"MISTRAL API ERROR\"   # Only show Mistral API error logs"
    echo "  bash scripts/tail-logs.sh --errors                 # Only show error logs"
    echo "  bash scripts/tail-logs.sh --env production         # Tail logs from production"
    echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            show_help
            exit 0
            ;;
        -e|--env)
            ENV="$2"
            shift 2
            ;;
        -w|--worker)
            WORKER_NAME="$2"
            shift 2
            ;;
        -s|--search)
            SEARCH="$2"
            shift 2
            ;;
        --errors)
            STATUS="error"
            shift
            ;;
        --json)
            FORMAT="json"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Build the wrangler tail command
COMMAND="wrangler tail $WORKER_NAME --format $FORMAT --env $ENV"

# Add search filter if specified
if [ -n "$SEARCH" ]; then
    COMMAND="$COMMAND --search \"$SEARCH\""
fi

# Add status filter if specified
if [ -n "$STATUS" ]; then
    COMMAND="$COMMAND --status $STATUS"
fi

# Display the command being run
echo -e "${BLUE}Running: $COMMAND${NC}"

# Execute the command
eval $COMMAND