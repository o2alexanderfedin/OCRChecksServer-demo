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
  echo "Please create a .dev.vars file with your API keys"
  echo "Example:"
  echo "MISTRAL_API_KEY=your_mistral_api_key_here"
  echo "CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here"
  exit 1
fi

# Extract API keys from .dev.vars
MISTRAL_API_KEY=$(grep 'MISTRAL_API_KEY=' .dev.vars | cut -d '=' -f 2)
CLOUDFLARE_API_TOKEN=$(grep 'CLOUDFLARE_API_TOKEN=' .dev.vars | cut -d '=' -f 2)

if [ -z "$MISTRAL_API_KEY" ]; then
  echo -e "${RED}Error: MISTRAL_API_KEY not found in .dev.vars${NC}"
  exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo -e "${RED}Error: CLOUDFLARE_API_TOKEN not found in .dev.vars${NC}"
  exit 1
fi

echo -e "${BLUE}Step 1: Setting up secrets...${NC}"

# Set environment to dev by default, but allow override with parameter
ENV="dev"
if [ -n "$1" ]; then
  ENV="$1"
fi

ENV_FLAG="--env $ENV"
echo -e "${BLUE}Deploying to environment: $ENV${NC}"

# Set both API keys as secrets
echo -e "${BLUE}Setting MISTRAL_API_KEY secret...${NC}"
echo "$MISTRAL_API_KEY" | wrangler secret put MISTRAL_API_KEY $ENV_FLAG

if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Could not set MISTRAL_API_KEY secret.${NC}"
  echo -e "${YELLOW}It might already exist or there might be an issue with your Cloudflare account.${NC}"
  echo -e "${YELLOW}Continuing with deployment...${NC}"
fi

echo -e "${BLUE}Setting CLOUDFLARE_API_TOKEN secret...${NC}"
echo "$CLOUDFLARE_API_TOKEN" | wrangler secret put CLOUDFLARE_API_TOKEN $ENV_FLAG

if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Could not set CLOUDFLARE_API_TOKEN secret.${NC}"
  echo -e "${YELLOW}It might already exist or there might be an issue with your Cloudflare account.${NC}"
  echo -e "${YELLOW}Continuing with deployment...${NC}"
fi

echo -e "${BLUE}Step 2: Deploying application...${NC}"
# Run the deployment with environment
echo -e "${BLUE}Running: npm run deploy -- $ENV_FLAG${NC}"
npm run deploy -- $ENV_FLAG

if [ $? -eq 0 ]; then
  echo -e "${GREEN}=== Deployment Complete ===${NC}"
  echo -e "${GREEN}The application has been deployed with both API secrets (MISTRAL_API_KEY and CLOUDFLARE_API_TOKEN).${NC}"
  echo -e "${GREEN}Health check URL: https://ocr-checks-worker.af-4a0.workers.dev/health${NC}"
else
  echo -e "${RED}=== Deployment Failed ===${NC}"
  echo -e "${RED}There was an error during deployment.${NC}"
  exit 1
fi