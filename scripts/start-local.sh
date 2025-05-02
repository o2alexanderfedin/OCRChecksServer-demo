#!/bin/bash
# Script to start the OCR Checks Server locally for development
# Usage: ./scripts/start-local.sh [--watch]

# Default settings
WATCH_MODE=false
PORT=8787
API_KEY_ENV="MISTRAL_API_KEY"

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --watch) WATCH_MODE=true ;;
    --port=*) PORT="${1#*=}" ;;
    -p=*) PORT="${1#*=}" ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Check for API key
if [ -z "${!API_KEY_ENV}" ]; then
  echo "Error: MISTRAL_API_KEY environment variable not set."
  echo "Please set it using: export MISTRAL_API_KEY=your_api_key"
  exit 1
fi

# Project root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. Are you in the right directory?"
  echo "Current directory: $(pwd)"
  exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Node modules not found. Installing dependencies..."
  npm install
fi

# Construct the command
if [ "$WATCH_MODE" = true ]; then
  CMD="npm run dev:watch -- --port $PORT"
  echo "Starting server in watch mode on port $PORT..."
else
  CMD="npm run dev -- --port $PORT"
  echo "Starting server on port $PORT..."
fi

# Print helpful information
echo "OCR Checks Server is starting..."
echo "API will be available at: http://localhost:$PORT"
echo "Health check endpoint: http://localhost:$PORT/health"
echo ""
echo "Test commands:"
echo "  - Check health: curl http://localhost:$PORT/health"
echo "  - Process an image: curl -X POST -H \"Content-Type: image/jpeg\" --data-binary @path/to/image.jpg http://localhost:$PORT/process"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the command
eval "$CMD"