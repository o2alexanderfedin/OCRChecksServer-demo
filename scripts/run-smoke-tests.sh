#!/bin/bash

# Smoke Tests Runner
# This script runs the smoke tests against different environments
# It's a wrapper around the TypeScript-based smoke test script to make it easier to run

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the directory of this script
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$DIR")"

# Default options
ENV="local"
SAVE=false
VERBOSE=false
HELP=false
FORCE=false  # Continue on error

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env|-e)
      ENV="$2"
      shift 2
      ;;
    --production|-p)
      ENV="production"
      shift
      ;;
    --staging|-s)
      ENV="staging"
      shift
      ;;
    --dev|-d)
      ENV="dev"
      shift
      ;;
    --save)
      SAVE=true
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --force|-f)
      FORCE=true
      shift
      ;;
    --help|-h)
      HELP=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown argument: $1${NC}"
      HELP=true
      shift
      ;;
  esac
done

# Show help message
if [ "$HELP" = true ]; then
  echo -e "${MAGENTA}=======================================================${NC}"
  echo -e "${MAGENTA}OCR Checks Worker - Smoke Tests Runner${NC}"
  echo -e "${MAGENTA}=======================================================${NC}"
  echo -e "Usage: $0 [options]"
  echo -e ""
  echo -e "Options:"
  echo -e "  ${CYAN}--env, -e ${NC}ENV       Set the target environment (local, dev, staging, production)"
  echo -e "  ${CYAN}--dev, -d${NC}           Shorthand for --env dev"
  echo -e "  ${CYAN}--production, -p${NC}    Shorthand for --env production"
  echo -e "  ${CYAN}--staging, -s${NC}       Shorthand for --env staging"
  echo -e "  ${CYAN}--save${NC}              Save detailed test results to a JSON file"
  echo -e "  ${CYAN}--verbose, -v${NC}       Show verbose output including API responses"
  echo -e "  ${CYAN}--force, -f${NC}         Continue execution even if some tests fail (treat as warnings)"
  echo -e "  ${CYAN}--help, -h${NC}          Show this help message"
  echo -e ""
  echo -e "Examples:"
  echo -e "  $0                   # Run tests against local environment"
  echo -e "  $0 --dev             # Run tests against dev environment"
  echo -e "  $0 --dev --force     # Run tests against dev environment, continue on errors"
  echo -e "  $0 --production      # Run tests against production environment"
  echo -e "  $0 --env staging --save  # Run tests against staging and save results"
  echo -e "${MAGENTA}=======================================================${NC}"
  exit 0
fi

# Check if ts-node is installed
if ! command -v ts-node >/dev/null 2>&1; then
  echo -e "${YELLOW}ts-node is not installed. Installing it now...${NC}"
  npm install -g ts-node typescript
fi

# Build command arguments
ARGS=("--env" "$ENV")

if [ "$SAVE" = true ]; then
  ARGS+=("--save")
fi

if [ "$VERBOSE" = true ]; then
  ARGS+=("--verbose")
fi

# Run the TypeScript smoke tests
echo -e "${BLUE}Running smoke tests against ${CYAN}$ENV${BLUE} environment...${NC}"
echo -e "${YELLOW}Command: ts-node $PROJECT_ROOT/scripts/production-smoke-test.ts ${ARGS[*]}${NC}"
echo -e ""

# Execute the tests with --no-deprecation flag to ignore deprecation warnings
ts-node --no-deprecation "$PROJECT_ROOT/scripts/production-smoke-test.ts" "${ARGS[@]}"
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "\n${GREEN}Smoke tests completed successfully!${NC}"
elif [ "$FORCE" = true ]; then
  echo -e "\n${YELLOW}Some smoke tests failed with exit code $EXIT_CODE, but continuing due to --force flag${NC}"
  # When using --force, we treat errors as warnings and return success
  exit 0
else
  echo -e "\n${RED}Smoke tests failed with exit code $EXIT_CODE${NC}"
  echo -e "${YELLOW}Tip: Use --force to treat failures as warnings and continue execution${NC}"
  exit $EXIT_CODE
fi