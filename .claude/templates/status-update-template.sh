#!/bin/bash

# GitHub Project Status Update Template
# Use this template when updating project statuses to ensure consistency

# Project configuration
PROJECT_ID="PVT_kwDOCjxaTs4A65J5"
STATUS_FIELD_ID="PVTSSF_lADOCjxaTs4A65J5zgvWocc"
DONE_OPTION_ID="98236657"
IN_PROGRESS_OPTION_ID="47fc9ee4" 
TODO_OPTION_ID="f75ad846"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 GitHub Project Status Update${NC}"
echo "Project: OCR Checks Server Development"
echo "======================================="
echo ""

# STEP 1: VERIFY IMPLEMENTATION BEFORE UPDATING STATUS
verify_implementation() {
    local issue_number=$1
    local description="$2"
    
    echo -e "${YELLOW}🔍 Verifying Issue #$issue_number implementation...${NC}"
    echo "   Description: $description"
    
    # TODO: Add specific verification logic here
    # Examples:
    # - Check if required files exist
    # - Verify tests pass
    # - Check code quality metrics
    
    # For now, return true - REPLACE WITH ACTUAL VERIFICATION
    return 0
}

# STEP 2: CHECK ALL CHILD DEPENDENCIES
check_dependencies() {
    local parent_issue=$1
    local child_issues=("${@:2}")
    
    echo -e "${YELLOW}🔗 Checking dependencies for Issue #$parent_issue...${NC}"
    
    for child in "${child_issues[@]}"; do
        # Get current status of child issue
        local child_status=$(get_issue_status "$child")
        
        if [[ "$child_status" != "Done" ]]; then
            echo -e "   ${RED}❌ Child Issue #$child is '$child_status' (not Done)${NC}"
            return 1
        else
            echo -e "   ${GREEN}✅ Child Issue #$child is Done${NC}"
        fi
    done
    
    echo -e "   ${GREEN}✅ All dependencies complete${NC}"
    return 0
}

# STEP 3: GET CURRENT ISSUE STATUS
get_issue_status() {
    local issue_number=$1
    
    # TODO: Implement actual status retrieval via GitHub API
    # This is a placeholder
    echo "Unknown"
}

# STEP 4: UPDATE ISSUE STATUS SAFELY
update_issue_status() {
    local issue_number=$1
    local item_id="$2"
    local status_option_id="$3"
    local status_name="$4"
    local reason="$5"
    
    echo -e "${BLUE}📝 Updating Issue #$issue_number to '$status_name'${NC}"
    echo "   Item ID: $item_id"
    echo "   Reason: $reason"
    
    # Execute the GraphQL mutation
    local result=$(gh api graphql -f query="
    mutation {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: \"$PROJECT_ID\"
          itemId: \"$item_id\"
          fieldId: \"$STATUS_FIELD_ID\"
          value: { singleSelectOptionId: \"$status_option_id\" }
        }
      ) {
        projectV2Item {
          id
        }
      }
    }" 2>&1)
    
    if [[ $? -eq 0 ]]; then
        echo -e "   ${GREEN}✅ Issue #$issue_number updated successfully${NC}"
        return 0
    else
        echo -e "   ${RED}❌ Failed to update Issue #$issue_number${NC}"
        echo "   Error: $result"
        return 1
    fi
}

# STEP 5: SAFE STATUS UPDATE WORKFLOW
safely_mark_done() {
    local issue_number=$1
    local item_id="$2"
    local description="$3"
    local dependencies=("${@:4}")
    
    echo -e "${YELLOW}🎯 Attempting to mark Issue #$issue_number as Done${NC}"
    
    # Verify implementation exists
    if ! verify_implementation "$issue_number" "$description"; then
        echo -e "${RED}❌ Cannot mark as Done: Implementation verification failed${NC}"
        return 1
    fi
    
    # Check dependencies if any
    if [[ ${#dependencies[@]} -gt 0 ]]; then
        if ! check_dependencies "$issue_number" "${dependencies[@]}"; then
            echo -e "${RED}❌ Cannot mark as Done: Dependencies incomplete${NC}"
            return 1
        fi
    fi
    
    # All checks passed, update status
    update_issue_status "$issue_number" "$item_id" "$DONE_OPTION_ID" "Done" "All verification checks passed"
}

# STEP 6: EXAMPLE USAGE
echo -e "${BLUE}📋 Example Status Updates${NC}"
echo "========================="

# Example: Mark engineering task as done (no dependencies)
# safely_mark_done "6" "PVTI_item_id" "Extract AntiHallucinationDetector utility"

# Example: Mark user story as done (with dependencies)
# safely_mark_done "2" "PVTI_item_id" "User Story: shared anti-hallucination utilities" "6"

# Example: Mark epic as done (with multiple user story dependencies)  
# safely_mark_done "1" "PVTI_item_id" "Epic: CloudflareLlama33JsonExtractor Implementation" "2" "3" "4" "5"

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT REMINDERS:${NC}"
echo "1. Always verify implementation before marking as Done"
echo "2. Check ALL child dependencies are complete"
echo "3. Use In Progress for partially complete issues"
echo "4. Run verification script after updates: ./scripts/verify-project-status.sh"
echo "5. Follow Project Status Management rules: .claude/rules/project-status-management.md"
echo ""
echo -e "${GREEN}✨ Status update template complete!${NC}"