#!/bin/bash
# Submodule Helper Script
# Usage: ./scripts/submodule-helper.sh
# This script helps manage Git submodules with common operations

set -e  # Exit on any error

# Define colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_menu() {
  echo -e "${BLUE}=== Nolock.social Submodule Helper ===${NC}"
  echo -e "${YELLOW}1)${NC} Update all submodules to latest commits"
  echo -e "${YELLOW}2)${NC} Commit changes in submodules"
  echo -e "${YELLOW}3)${NC} Push submodule changes"
  echo -e "${YELLOW}4)${NC} Push main repository (including submodule references)"
  echo -e "${YELLOW}5)${NC} Complete workflow (update, commit, push all)"
  echo -e "${YELLOW}6)${NC} Check submodule status"
  echo -e "${YELLOW}7)${NC} Initialize/reset submodules"
  echo -e "${YELLOW}q)${NC} Quit"
}

update_submodules() {
  echo -e "${BLUE}=== Updating submodules to latest commits ===${NC}"
  git submodule update --remote --merge
  echo -e "${GREEN}Submodules updated successfully${NC}"
}

commit_submodules() {
  echo -e "${BLUE}=== Committing changes in submodules ===${NC}"
  read -p "Enter commit message: " message
  
  # Check if message is empty
  if [ -z "$message" ]; then
    echo -e "${RED}Commit message cannot be empty. Aborting.${NC}"
    return 1
  fi
  
  # First commit changes within each submodule
  echo -e "${YELLOW}Committing in each submodule...${NC}"
  git submodule foreach "git add . && git diff --staged --quiet || git commit -m \"$message\""
  
  # Then commit the submodule reference changes in the main repo
  echo -e "${YELLOW}Committing updated submodule references in main repository...${NC}"
  git add .
  if ! git diff --staged --quiet; then
    git commit -m "Update submodule references: $message"
    echo -e "${GREEN}Changes committed successfully${NC}"
  else
    echo -e "${YELLOW}No changes to commit in main repository${NC}"
  fi
}

push_submodules() {
  echo -e "${BLUE}=== Pushing changes in submodules ===${NC}"
  git submodule foreach "git push || echo -e \"${YELLOW}No changes to push or not on a branch in this submodule${NC}\""
  echo -e "${GREEN}Submodule push operations completed${NC}"
}

push_main_repo() {
  echo -e "${BLUE}=== Pushing main repository ===${NC}"
  git push
  echo -e "${GREEN}Main repository pushed successfully${NC}"
}

complete_workflow() {
  echo -e "${BLUE}=== Running complete workflow ===${NC}"
  update_submodules
  commit_submodules || return 1
  push_submodules
  push_main_repo
  echo -e "${GREEN}Complete workflow finished successfully${NC}"
}

check_submodule_status() {
  echo -e "${BLUE}=== Checking submodule status ===${NC}"
  git submodule status
  
  echo -e "\n${YELLOW}Detailed submodule information:${NC}"
  git submodule foreach "echo -e \"${BLUE}Repository: \$(basename \$(pwd))${NC}\" && git status -s && echo \"\""
}

initialize_submodules() {
  echo -e "${BLUE}=== Initializing/resetting submodules ===${NC}"
  git submodule update --init --recursive
  echo -e "${GREEN}Submodules initialized successfully${NC}"
}

# Main program loop
while true; do
  show_menu
  read -p "Choose option: " option
  echo ""

  case $option in
    1) update_submodules ;;
    2) commit_submodules ;;
    3) push_submodules ;;
    4) push_main_repo ;;
    5) complete_workflow ;;
    6) check_submodule_status ;;
    7) initialize_submodules ;;
    q) echo -e "${GREEN}Goodbye!${NC}"; exit 0 ;;
    *) echo -e "${RED}Invalid option${NC}" ;;
  esac
  
  echo ""
  read -p "Press Enter to continue..."
  clear
done