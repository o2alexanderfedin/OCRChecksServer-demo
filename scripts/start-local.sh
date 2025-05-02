#!/bin/bash
# Script to start the OCR Checks Server locally for development
# Usage: ./scripts/start-local.sh [--watch] [--port=XXXX] [--install-deps]

# Default settings
WATCH_MODE=false
PORT=8787
API_KEY_ENV="MISTRAL_API_KEY"
INSTALL_DEPS=false
REQUIRED_NODE_VERSION="18.0.0"
COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[0;33m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --watch) WATCH_MODE=true ;;
    --port=*) PORT="${1#*=}" ;;
    -p=*) PORT="${1#*=}" ;;
    --install-deps) INSTALL_DEPS=true ;;
    --help) 
      echo "Usage: ./scripts/start-local.sh [options]"
      echo "Options:"
      echo "  --watch            Enable watch mode for automatic reloading"
      echo "  --port=XXXX        Specify port number (default: 8787)"
      echo "  --install-deps     Attempt to install missing dependencies"
      echo "  --help             Show this help message"
      exit 0
      ;;
    *) echo "Unknown parameter: $1. Use --help for usage information."; exit 1 ;;
  esac
  shift
done

# Function to print colored messages
print_message() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${COLOR_RESET}"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to compare semver versions
# Returns 0 if version1 >= version2, 1 otherwise
version_ge() {
  local version1=$1
  local version2=$2
  
  if [[ "$version1" == "$version2" ]]; then
    return 0
  fi
  
  local IFS=.
  local i ver1=($version1) ver2=($version2)
  
  # Fill empty fields with zeros
  for ((i=${#ver1[@]}; i<${#ver2[@]}; i++)); do
    ver1[i]=0
  done
  
  for ((i=0; i<${#ver1[@]}; i++)); do
    if [[ -z ${ver2[i]} ]]; then
      ver2[i]=0
    fi
    if ((10#${ver1[i]} > 10#${ver2[i]})); then
      return 0
    fi
    if ((10#${ver1[i]} < 10#${ver2[i]})); then
      return 1
    fi
  done
  
  return 0
}

# Check prerequisites
check_prerequisites() {
  print_message "$COLOR_BLUE" "=== Checking prerequisites ==="
  
  local all_prerequisites_met=true
  
  # Check Node.js
  if ! command_exists node; then
    all_prerequisites_met=false
    print_message "$COLOR_RED" "❌ Node.js is not installed"
    
    if [ "$INSTALL_DEPS" = true ]; then
      print_message "$COLOR_YELLOW" "Attempting to install Node.js..."
      
      if command_exists brew; then
        brew install node
      elif command_exists apt-get; then
        sudo apt-get update
        sudo apt-get install -y nodejs npm
      elif command_exists dnf; then
        sudo dnf install -y nodejs
      elif command_exists yum; then
        sudo yum install -y nodejs
      else
        print_message "$COLOR_RED" "Cannot automatically install Node.js. Please install it manually:"
        print_message "$COLOR_YELLOW" "Visit: https://nodejs.org/en/download/"
        exit 1
      fi
      
      if ! command_exists node; then
        print_message "$COLOR_RED" "Failed to install Node.js. Please install it manually."
        exit 1
      else
        print_message "$COLOR_GREEN" "✅ Node.js installed successfully"
      fi
    else
      print_message "$COLOR_YELLOW" "Please install Node.js manually or use --install-deps flag:"
      print_message "$COLOR_YELLOW" "Visit: https://nodejs.org/en/download/"
      exit 1
    fi
  else
    local node_version=$(node -v | cut -c 2-)
    print_message "$COLOR_GREEN" "✅ Node.js is installed (version $node_version)"
    
    if ! version_ge "$node_version" "$REQUIRED_NODE_VERSION"; then
      print_message "$COLOR_RED" "❌ Node.js version is too old. Required: $REQUIRED_NODE_VERSION, Found: $node_version"
      print_message "$COLOR_YELLOW" "Please update Node.js to version $REQUIRED_NODE_VERSION or higher"
      all_prerequisites_met=false
      
      if [ "$INSTALL_DEPS" = true ]; then
        if command_exists nvm; then
          print_message "$COLOR_YELLOW" "Attempting to use nvm to install the required Node.js version..."
          nvm install "$REQUIRED_NODE_VERSION"
          nvm use "$REQUIRED_NODE_VERSION"
        else
          print_message "$COLOR_YELLOW" "NVM not found. Consider installing nvm to manage Node.js versions:"
          print_message "$COLOR_YELLOW" "https://github.com/nvm-sh/nvm#installing-and-updating"
        fi
      else
        print_message "$COLOR_YELLOW" "Run with --install-deps to attempt an automatic update"
        exit 1
      fi
    fi
  fi
  
  # Check npm
  if ! command_exists npm; then
    all_prerequisites_met=false
    print_message "$COLOR_RED" "❌ npm is not installed"
    
    if [ "$INSTALL_DEPS" = true ]; then
      print_message "$COLOR_YELLOW" "Attempting to install npm..."
      
      if command_exists apt-get; then
        sudo apt-get install -y npm
      elif command_exists brew; then
        brew install npm
      else
        print_message "$COLOR_RED" "Cannot automatically install npm. Please install it manually."
        exit 1
      fi
      
      if ! command_exists npm; then
        print_message "$COLOR_RED" "Failed to install npm. Please install it manually."
        exit 1
      else
        print_message "$COLOR_GREEN" "✅ npm installed successfully"
      fi
    else
      print_message "$COLOR_YELLOW" "Please install npm manually or use --install-deps flag"
      exit 1
    fi
  else
    print_message "$COLOR_GREEN" "✅ npm is installed (version $(npm -v))"
  fi

  # Check Wrangler
  if ! npm list -g wrangler >/dev/null 2>&1 && ! npm list wrangler >/dev/null 2>&1; then
    print_message "$COLOR_YELLOW" "⚠️ Wrangler is not installed"
    
    if [ "$INSTALL_DEPS" = true ]; then
      print_message "$COLOR_YELLOW" "Installing Wrangler locally..."
      npm install wrangler
      
      if ! npm list wrangler >/dev/null 2>&1; then
        print_message "$COLOR_RED" "Failed to install Wrangler. The server may not work properly."
      else
        print_message "$COLOR_GREEN" "✅ Wrangler installed successfully"
      fi
    else
      print_message "$COLOR_YELLOW" "Wrangler will be installed as part of npm dependencies"
    fi
  else
    print_message "$COLOR_GREEN" "✅ Wrangler is installed"
  fi
  
  # Check for Mistral API key
  if [ -z "${!API_KEY_ENV}" ]; then
    all_prerequisites_met=false
    print_message "$COLOR_RED" "❌ MISTRAL_API_KEY environment variable not set"
    print_message "$COLOR_YELLOW" "Set it using: export MISTRAL_API_KEY=your_api_key"
    print_message "$COLOR_YELLOW" "You can get an API key from: https://console.mistral.ai/"
    exit 1
  else
    print_message "$COLOR_GREEN" "✅ MISTRAL_API_KEY is set"
  fi
  
  if [ "$all_prerequisites_met" = true ]; then
    print_message "$COLOR_GREEN" "All prerequisites are met! ✨"
  fi
}

# Navigate to project root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
  print_message "$COLOR_RED" "Error: package.json not found. Are you in the right directory?"
  print_message "$COLOR_YELLOW" "Current directory: $(pwd)"
  exit 1
fi

# Check prerequisites
check_prerequisites

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  print_message "$COLOR_YELLOW" "Node modules not found. Installing dependencies..."
  npm install
  
  if [ $? -ne 0 ]; then
    print_message "$COLOR_RED" "Failed to install dependencies. Please check npm error messages above."
    exit 1
  else
    print_message "$COLOR_GREEN" "Dependencies installed successfully"
  fi
fi

# Construct the command
if [ "$WATCH_MODE" = true ]; then
  CMD="npm run dev:watch -- --port $PORT"
  print_message "$COLOR_BLUE" "Starting server in watch mode on port $PORT..."
else
  CMD="npm run dev -- --port $PORT"
  print_message "$COLOR_BLUE" "Starting server on port $PORT..."
fi

# Print helpful information
print_message "$COLOR_GREEN" "OCR Checks Server is starting..."
print_message "$COLOR_GREEN" "API will be available at: http://localhost:$PORT"
print_message "$COLOR_GREEN" "Health check endpoint: http://localhost:$PORT/health"
echo ""
print_message "$COLOR_BLUE" "Test commands:"
print_message "$COLOR_YELLOW" "  - Check health: curl http://localhost:$PORT/health"
print_message "$COLOR_YELLOW" "  - Process an image: curl -X POST -H \"Content-Type: image/jpeg\" --data-binary @path/to/image.jpg http://localhost:$PORT/process"
echo ""
print_message "$COLOR_BLUE" "Press Ctrl+C to stop the server"
echo ""

# Run the command
eval "$CMD"