#!/bin/bash

# GitHub Project Status Updater
# Updates the status of completed CloudflareLlama33JsonExtractor issues

# Project information
PROJECT_ID="PVT_kwDOCjxaTs4A65J5"
STATUS_FIELD_ID="PVTSSF_lADOCjxaTs4A65J5zgvWocc"
DONE_OPTION_ID="98236657"
TODO_OPTION_ID="f75ad846"

# Issue item IDs (from the GraphQL query results)
declare -A ISSUE_ITEMS=(
    ["1"]="PVTI_lADOCjxaTs4A65J5zgbO5IE"   # Epic: Add CloudflareLlama33JsonExtractor Implementation
    ["2"]="PVTI_lADOCjxaTs4A65J5zgbO5II"   # User Story: shared anti-hallucination utilities
    ["3"]="PVTI_lADOCjxaTs4A65J5zgbO5IM"   # User Story: shared confidence calculation utilities
    ["4"]="PVTI_lADOCjxaTs4A65J5zgbO5IQ"   # User Story: CloudflareLlama33JsonExtractor implementation
    ["5"]="PVTI_lADOCjxaTs4A65J5zgbO5IY"   # User Story: DI container configuration for multiple extractors
    ["6"]="PVTI_lADOCjxaTs4A65J5zgbO5Io"   # Extract AntiHallucinationDetector utility
    ["7"]="PVTI_lADOCjxaTs4A65J5zgbO5Ig"   # Extract JsonExtractionConfidenceCalculator utility  
    ["8"]="PVTI_lADOCjxaTs4A65J5zgbO5Iw"   # Implement CloudflareLlama33JsonExtractor class
    ["9"]="PVTI_lADOCjxaTs4A65J5zgbO5Ik"   # Configure DI container for multiple extractors
    ["10"]="PVTI_lADOCjxaTs4A65J5zgbO5Is"  # Create JSON extractor factory pattern (pending)
    ["11"]="PVTI_lADOCjxaTs4A65J5zgbO5I0"  # Add performance benchmarking tests (pending)
    ["12"]="PVTI_lADOCjxaTs4A65J5zgbO5I4"  # Add end-to-end integration tests (pending)
)

# Issues that are completed (Epic + User Stories + Engineering Tasks)
COMPLETED_ISSUES=(1 2 3 4 5 6 7 8 9)
PENDING_ISSUES=(10 11 12)

echo "🚀 Updating GitHub Project statuses..."
echo "Project: OCR Checks Server Development"
echo "Project ID: $PROJECT_ID"
echo ""

# Function to update issue status
update_issue_status() {
    local issue_number=$1
    local item_id=$2
    local status_option_id=$3
    local status_name=$4
    
    echo "📝 Updating Issue #$issue_number to '$status_name'..."
    
    gh api graphql -f query="
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
    }"
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Issue #$issue_number updated successfully"
    else
        echo "   ❌ Failed to update Issue #$issue_number"
    fi
}

# Update completed issues to "Done"
echo "🎉 Marking completed issues as Done:"
for issue in "${COMPLETED_ISSUES[@]}"; do
    item_id="${ISSUE_ITEMS[$issue]}"
    update_issue_status "$issue" "$item_id" "$DONE_OPTION_ID" "Done"
done

echo ""
echo "📋 Ensuring pending issues are marked as Todo:"
for issue in "${PENDING_ISSUES[@]}"; do
    item_id="${ISSUE_ITEMS[$issue]}"
    update_issue_status "$issue" "$item_id" "$TODO_OPTION_ID" "Todo"
done

echo ""
echo "✨ Project status update complete!"
echo ""
echo "📊 Summary:"
echo "   ✅ Completed (Epic + User Stories + Engineering Tasks): ${COMPLETED_ISSUES[*]}"
echo "   📋 Pending (Engineering Tasks): ${PENDING_ISSUES[*]}"
echo ""
echo "🎯 All core CloudflareLlama33JsonExtractor functionality is now complete!"
echo "   - Epic #1: CloudflareLlama33JsonExtractor Implementation ✅"
echo "   - All supporting user stories ✅"  
echo "   - All required engineering tasks ✅"
echo ""
echo "🔗 View project: https://github.com/orgs/nolock-social/projects/1"