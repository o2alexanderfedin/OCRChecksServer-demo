#!/bin/bash
# Deployment script with secret management
# This script handles deployment of the application to Cloudflare Workers
# including setting up the necessary secrets

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== OCR Checks Server Deployment ===${NC}"

# Check if .dev.vars exists
if [ ! -f ".dev.vars" ]; then
  echo -e "${RED}Error: .dev.vars file not found${NC}"
  echo "Please create a .dev.vars file with your Mistral API key"
  echo "Example: MISTRAL_API_KEY=your_api_key_here"
  exit 1
fi

# Extract Mistral API key from .dev.vars
MISTRAL_API_KEY=$(grep 'MISTRAL_API_KEY=' .dev.vars | cut -d '=' -f 2)

if [ -z "$MISTRAL_API_KEY" ]; then
  echo -e "${RED}Error: MISTRAL_API_KEY not found in .dev.vars${NC}"
  exit 1
fi

echo -e "${BLUE}Step 1: Setting up secrets...${NC}"

# Check if environment parameter is provided
ENV_FLAG=""
if [ -n "$1" ]; then
  ENV_FLAG="--env $1"
  echo -e "${BLUE}Deploying to environment: $1${NC}"
else
  echo -e "${BLUE}Deploying to default environment${NC}"
fi

# Try to set the Mistral API key as a secret
echo -e "${BLUE}Setting MISTRAL_API_KEY secret...${NC}"
echo "$MISTRAL_API_KEY" | wrangler secret put MISTRAL_API_KEY $ENV_FLAG

# Verify the secret was set
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Could not set MISTRAL_API_KEY secret.${NC}"
  echo -e "${YELLOW}It might already exist or there might be an issue with your Cloudflare account.${NC}"
  echo -e "${YELLOW}Continuing with deployment...${NC}"
fi

echo -e "${BLUE}Step 2: Deploying application...${NC}"
# Run the deployment with environment if specified
if [ -n "$1" ]; then
  echo -e "${BLUE}Running: npm run deploy -- --env $1${NC}"
  npm run deploy -- --env $1
else
  echo -e "${BLUE}Running: npm run deploy${NC}"
  npm run deploy
fi

if [ $? -eq 0 ]; then
  echo -e "${GREEN}=== Deployment Complete ===${NC}"
  echo -e "${GREEN}The application has been deployed with the necessary secrets.${NC}"
  echo -e "${GREEN}Health check URL: https://ocr-checks-worker.af-4a0.workers.dev/health${NC}"
else
  echo -e "${RED}=== Deployment Failed ===${NC}"
  echo -e "${RED}There was an error during deployment.${NC}"
  exit 1
fi