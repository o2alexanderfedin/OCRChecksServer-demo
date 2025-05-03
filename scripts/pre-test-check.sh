#!/bin/bash

# pre-test-check.sh - GitFlow branch validation script
# Checks if current branch is appropriate for running tests that might need fixes

# ANSI color codes for better visibility
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}${BOLD}GitFlow Branch Check${NC}"
echo "======================="

# Get current branch
current_branch=$(git branch --show-current)

# Check if we're on develop or main
if [[ "$current_branch" == "develop" || "$current_branch" == "main" ]]; then
  echo -e "${RED}${BOLD}⚠️  WARNING: You are on ${current_branch} branch!${NC}"
  echo -e "${YELLOW}This is not recommended for running tests that may require fixes.${NC}"
  echo ""
  echo -e "${BOLD}If you find issues that need fixing, you MUST:${NC}"
  echo "1. Create a feature branch FIRST before making ANY changes:"
  echo -e "   ${GREEN}git flow feature start fix-your-issue-name${NC}"
  echo "2. Run the tests again on your feature branch"
  echo "3. Make your fixes on the feature branch"
  echo "4. Finish your feature when done:"
  echo -e "   ${GREEN}git flow feature finish fix-your-issue-name${NC}"
  echo ""
  echo -e "${BOLD}See the full workflow at:${NC} .claude/rules/gitflow-testing-workflow.md"
  echo ""
  read -p "Do you want to continue anyway? (y/N): " choice
  
  if [[ ! "$choice" =~ ^[Yy]$ ]]; then
    echo "Operation cancelled. Please create a feature branch first."
    exit 1
  fi
  
  echo "Proceeding with tests on ${current_branch}... Remember to follow GitFlow process for any fixes!"
else
  # Check if we're on a feature branch
  if [[ "$current_branch" == feature/* ]]; then
    echo -e "${GREEN}✓ You are on feature branch: ${current_branch}${NC}"
    echo "This is appropriate for running tests and fixing issues."
  else
    echo -e "${YELLOW}ℹ️ You are on branch: ${current_branch}${NC}"
    echo "This doesn't appear to be a standard GitFlow feature branch."
    echo "Verify this is appropriate for your current task."
  fi
fi

echo ""
echo "======================="
echo -e "${BLUE}${BOLD}GitFlow Reminder${NC}"
echo "For any test failures:"
echo "1. DO NOT fix issues directly on develop or main"
echo "2. Create a feature branch for fixes"
echo "3. Follow the full workflow in .claude/rules/gitflow-testing-workflow.md"
echo "======================="
echo ""