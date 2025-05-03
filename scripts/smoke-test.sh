#!/bin/bash

# Smoke Tests for OCR Checks Worker
# This script performs basic health and functionality checks on the deployed worker

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Base URL for the deployed worker
BASE_URL="https://ocr-checks-worker.af-4a0.workers.dev"

# Use correct Mistral API key from wrangler.toml for testing
MISTRAL_API_KEY="wHAFWZ8ksDNcRseO9CWprd5EuhezolxE"

# Check for Mistral API key in environment variable
if [ -z "$MISTRAL_API_KEY" ]; then
  echo -e "${YELLOW}MISTRAL_API_KEY environment variable not found. Mistral direct test will be skipped.${NC}"
  echo -e "${YELLOW}To test Mistral directly, run: MISTRAL_API_KEY=your-key-here ./scripts/smoke-test.sh${NC}"
  RUN_MISTRAL_TEST=false
else
  RUN_MISTRAL_TEST=true
  echo -e "${GREEN}MISTRAL_API_KEY found. Mistral direct test will be performed.${NC}"
fi

# Test image path - try different locations in order
TEST_IMAGE=""
POSSIBLE_IMAGES=(
  "small-test.jpg"
  "tiny-test.jpg"
  "tests/fixtures/images/telegram-cloud-photo-size-1-4915775046379745521-y.jpg"
  "tests/fixtures/images/IMG_2388.jpg"
)

# Find the first available test image
for img in "${POSSIBLE_IMAGES[@]}"; do
  if [ -f "$img" ]; then
    TEST_IMAGE="$img"
    break
  fi
done

if [ -z "$TEST_IMAGE" ]; then
  echo -e "${RED}No test image found. Please provide a valid image path.${NC}"
  exit 1
fi

echo -e "${YELLOW}Starting smoke tests for ${BASE_URL}${NC}"
echo -e "Using test image: ${TEST_IMAGE}"
echo "=============================================="

# Test 1: Health Check
echo -e "\n${YELLOW}Test 1: Health Check${NC}"
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/health")
HEALTH_STATUS=$?

if [ $HEALTH_STATUS -eq 0 ]; then
    echo -e "${GREEN}✓ Health endpoint is accessible${NC}"
    
    # Extract and display version
    VERSION=$(echo $HEALTH_RESPONSE | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo -e "  Version: ${GREEN}${VERSION}${NC}"
    
    # Verify version is the expected one
    if [ "$VERSION" == "1.27.0" ]; then
        echo -e "  ${GREEN}✓ Version is correct (1.27.0)${NC}"
    else
        echo -e "  ${RED}✗ Version is incorrect. Expected 1.27.0, got ${VERSION}${NC}"
    fi
    
    # Display full health response
    echo -e "\n  Health response:"
    echo $HEALTH_RESPONSE | python3 -m json.tool
else
    echo -e "${RED}✗ Failed to access health endpoint${NC}"
    echo "  Exit code: $HEALTH_STATUS"
fi

# Test 2: Check Processing Endpoint
echo -e "\n${YELLOW}Test 2: Check Processing Test${NC}"
echo -e "Sending image ${TEST_IMAGE} to /check endpoint..."

CHECK_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: image/jpeg" \
  --data-binary @"${TEST_IMAGE}" \
  "${BASE_URL}/check?filename=test-check.jpg")
CHECK_STATUS=$?

if [ $CHECK_STATUS -eq 0 ]; then
    # Check if the response contains an error
    if echo "$CHECK_RESPONSE" | grep -q '"error"'; then
        ERROR_MSG=$(echo $CHECK_RESPONSE | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo -e "${RED}✗ Check endpoint returned an error: ${ERROR_MSG}${NC}"
        echo -e "\n  Full response:"
        echo $CHECK_RESPONSE | python3 -m json.tool
    else
        echo -e "${GREEN}✓ Check endpoint processed the image successfully${NC}"
        
        # Display some basic info from the response
        echo -e "\n  Response highlights:"
        echo $CHECK_RESPONSE | python3 -m json.tool | head -20
        echo -e "  ${YELLOW}(Response truncated for readability)${NC}"
        
        # Check for confidence scores
        if echo "$CHECK_RESPONSE" | grep -q '"confidence"'; then
            echo -e "\n  ${GREEN}✓ Response includes confidence scores${NC}"
        else
            echo -e "\n  ${RED}✗ Response does not include confidence scores${NC}"
        fi
        
        # Check for data field
        if echo "$CHECK_RESPONSE" | grep -q '"data"'; then
            echo -e "  ${GREEN}✓ Response includes data field${NC}"
        else
            echo -e "  ${RED}✗ Response does not include data field${NC}"
        fi
    fi
else
    echo -e "${RED}✗ Failed to access check endpoint${NC}"
    echo "  Exit code: $CHECK_STATUS"
fi

# Test 3: Receipt Processing Endpoint
echo -e "\n${YELLOW}Test 3: Receipt Processing Test${NC}"
echo -e "Sending image ${TEST_IMAGE} to /receipt endpoint..."

RECEIPT_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: image/jpeg" \
  --data-binary @"${TEST_IMAGE}" \
  "${BASE_URL}/receipt?filename=test-receipt.jpg")
RECEIPT_STATUS=$?

if [ $RECEIPT_STATUS -eq 0 ]; then
    # Check if the response contains an error
    if echo "$RECEIPT_RESPONSE" | grep -q '"error"'; then
        ERROR_MSG=$(echo $RECEIPT_RESPONSE | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo -e "${RED}✗ Receipt endpoint returned an error: ${ERROR_MSG}${NC}"
        echo -e "\n  Full response:"
        echo $RECEIPT_RESPONSE | python3 -m json.tool
    else
        echo -e "${GREEN}✓ Receipt endpoint processed the image successfully${NC}"
        
        # Display some basic info from the response
        echo -e "\n  Response highlights:"
        echo $RECEIPT_RESPONSE | python3 -m json.tool | head -20
        echo -e "  ${YELLOW}(Response truncated for readability)${NC}"
        
        # Check for confidence scores
        if echo "$RECEIPT_RESPONSE" | grep -q '"confidence"'; then
            echo -e "\n  ${GREEN}✓ Response includes confidence scores${NC}"
        else
            echo -e "\n  ${RED}✗ Response does not include confidence scores${NC}"
        fi
        
        # Check for data field
        if echo "$RECEIPT_RESPONSE" | grep -q '"data"'; then
            echo -e "  ${GREEN}✓ Response includes data field${NC}"
        else
            echo -e "  ${RED}✗ Response does not include data field${NC}"
        fi
    fi
else
    echo -e "${RED}✗ Failed to access receipt endpoint${NC}"
    echo "  Exit code: $RECEIPT_STATUS"
fi

# Test 4: Direct Mistral API Test (if API key is available)
if [ "$RUN_MISTRAL_TEST" = true ]; then
    echo -e "\n${YELLOW}Test 4: Direct Mistral API Test${NC}"
    echo -e "Testing Mistral API directly with image ${TEST_IMAGE}..."
    
    # Convert image to base64
    BASE64_IMAGE=$(base64 -i "${TEST_IMAGE}")
    
    # Create a data URL
    DATA_URL="data:image/jpeg;base64,${BASE64_IMAGE}"
    
    # Create the JSON payload for Mistral API
    MISTRAL_PAYLOAD=$(cat <<EOF
{
  "model": "mistral-ocr-latest",
  "document": {
    "type": "image_url",
    "imageUrl": "${DATA_URL}"
  }
}
EOF
)
    
    # Call Mistral API directly
    MISTRAL_RESPONSE=$(curl -s -X POST \
      "https://api.mistral.ai/v1/ocr/process" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -H "Authorization: Bearer ${MISTRAL_API_KEY}" \
      -d "${MISTRAL_PAYLOAD}")
    MISTRAL_STATUS=$?
    
    if [ $MISTRAL_STATUS -eq 0 ]; then
        # Check if the response contains an error
        if echo "$MISTRAL_RESPONSE" | grep -q '"error"'; then
            ERROR_MSG=$(echo $MISTRAL_RESPONSE | grep -o '"error"[^}]*' | tr -d '\n')
            echo -e "${RED}✗ Mistral API returned an error: ${ERROR_MSG}${NC}"
            echo -e "\n  Full response:"
            echo $MISTRAL_RESPONSE | python3 -m json.tool
        else
            echo -e "${GREEN}✓ Mistral API processed the image successfully${NC}"
            
            # Check if the response contains pages field
            if echo "$MISTRAL_RESPONSE" | grep -q '"pages"'; then
                echo -e "  ${GREEN}✓ Response includes OCR pages data${NC}"
                
                # Count pages
                PAGE_COUNT=$(echo "$MISTRAL_RESPONSE" | grep -o '"pages"' | wc -l)
                echo -e "  Found approximately ${GREEN}${PAGE_COUNT}${NC} page(s) in the response"
                
                # Display a snippet of the response
                echo -e "\n  Response snippet:"
                echo $MISTRAL_RESPONSE | python3 -m json.tool | head -20
                echo -e "  ${YELLOW}(Response truncated for readability)${NC}"
            else
                echo -e "  ${RED}✗ Response does not include OCR pages data${NC}"
                echo -e "\n  Full response:"
                echo $MISTRAL_RESPONSE | python3 -m json.tool
            fi
        fi
    else
        echo -e "${RED}✗ Failed to connect to Mistral API${NC}"
        echo "  Exit code: $MISTRAL_STATUS"
    fi
else
    echo -e "\n${YELLOW}Test 4: Direct Mistral API Test - SKIPPED (No API key)${NC}"
    MISTRAL_STATUS=2  # Custom status for skipped test
fi

echo -e "\n${YELLOW}Smoke tests completed${NC}"
echo "=============================================="

# Summary 
echo -e "\n${YELLOW}Test Summary:${NC}"

if [ $HEALTH_STATUS -eq 0 ]; then
    echo -e "Health Check: ${GREEN}PASSED${NC}"
else
    echo -e "Health Check: ${RED}FAILED${NC}"
fi

if [ $CHECK_STATUS -eq 0 ] && ! echo "$CHECK_RESPONSE" | grep -q '"error"'; then
    echo -e "Check Processing: ${GREEN}PASSED${NC}"
else
    echo -e "Check Processing: ${RED}FAILED${NC}"
fi

if [ $RECEIPT_STATUS -eq 0 ] && ! echo "$RECEIPT_RESPONSE" | grep -q '"error"'; then
    echo -e "Receipt Processing: ${GREEN}PASSED${NC}"
else
    echo -e "Receipt Processing: ${RED}FAILED${NC}"
fi

if [ "$RUN_MISTRAL_TEST" = true ]; then
    if [ $MISTRAL_STATUS -eq 0 ] && ! echo "$MISTRAL_RESPONSE" | grep -q '"error"'; then
        echo -e "Mistral Direct API: ${GREEN}PASSED${NC}"
    else
        echo -e "Mistral Direct API: ${RED}FAILED${NC}"
    fi
else
    echo -e "Mistral Direct API: ${YELLOW}SKIPPED${NC}"
fi

# Save detailed test results to a file if requested
if [ "$1" == "--save" ]; then
    RESULTS_FILE="smoke-test-results-$(date +%Y%m%d-%H%M%S).json"
    
    # Add Mistral test result if it was run
    if [ "$RUN_MISTRAL_TEST" = true ]; then
        MISTRAL_JSON=",
    \"mistral\": {
      \"status\": $MISTRAL_STATUS,
      \"passed\": $([ $MISTRAL_STATUS -eq 0 ] && ! echo "$MISTRAL_RESPONSE" | grep -q '"error"' && echo "true" || echo "false")
    }"
    else
        MISTRAL_JSON=",
    \"mistral\": {
      \"status\": $MISTRAL_STATUS,
      \"passed\": \"skipped\"
    }"
    fi
    
    echo "{
  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
  \"baseUrl\": \"${BASE_URL}\",
  \"version\": \"${VERSION}\",
  \"tests\": {
    \"health\": {
      \"status\": $HEALTH_STATUS,
      \"passed\": $([ $HEALTH_STATUS -eq 0 ] && echo "true" || echo "false")
    },
    \"check\": {
      \"status\": $CHECK_STATUS,
      \"passed\": $([ $CHECK_STATUS -eq 0 ] && ! echo "$CHECK_RESPONSE" | grep -q '"error"' && echo "true" || echo "false")
    },
    \"receipt\": {
      \"status\": $RECEIPT_STATUS,
      \"passed\": $([ $RECEIPT_STATUS -eq 0 ] && ! echo "$RECEIPT_RESPONSE" | grep -q '"error"' && echo "true" || echo "false")
    }${MISTRAL_JSON}
  }
}" > $RESULTS_FILE
    echo -e "\nDetailed test results saved to: ${GREEN}${RESULTS_FILE}${NC}"
fi

# Print details about deployment issues based on test results
echo -e "\n${YELLOW}Deployment Analysis:${NC}"
if [ "$VERSION" != "1.27.0" ]; then
    echo -e "${RED}• The deployed version (${VERSION}) doesn't match the expected version (1.27.0)${NC}"
    echo -e "  This indicates that the latest code hasn't been deployed to Cloudflare Workers."
fi

if [ "$RUN_MISTRAL_TEST" = true ] && [ $MISTRAL_STATUS -eq 0 ] && ! echo "$MISTRAL_RESPONSE" | grep -q '"error"'; then
    if [ $CHECK_STATUS -eq 0 ] && echo "$CHECK_RESPONSE" | grep -q '"error"'; then
        echo -e "${YELLOW}• Mistral API is working directly, but fails through the worker${NC}"
        echo -e "  This suggests a configuration issue in the worker deployment or API key problems."
    fi
else
    if [ "$RUN_MISTRAL_TEST" = true ]; then
        echo -e "${RED}• Mistral API failed when called directly${NC}"
        echo -e "  This suggests a problem with the Mistral API service or API key."
    fi
fi