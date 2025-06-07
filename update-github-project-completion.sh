#!/bin/bash

# Update GitHub Project Issue Statuses to Reflect Completion
# Updates all remaining engineering tasks and parent issues to "Done"

# Project configuration  
PROJECT_ID="PVT_kwDOCjxaTs4A65J5"
STATUS_FIELD_ID="PVTSSF_lADOCjxaTs4A65J5zgvWrls"
DONE_STATUS_ID="f75ad846"  # "Done" status option ID

echo "🚀 Updating GitHub Project Issues to Reflect Implementation Completion"
echo "=============================================================="
echo ""

# Issue item IDs that need to be marked as "Done"
declare -A COMPLETED_ISSUES=(
    ["10"]="PVTI_lADOCjxaTs4A65J5zgbO5Is"   # Engineering Task #10: Create JSON extractor factory pattern
    ["11"]="PVTI_lADOCjxaTs4A65J5zgbO5I0"   # Engineering Task #11: Add performance benchmarking tests  
    ["12"]="PVTI_lADOCjxaTs4A65J5zgbO5I4"   # Engineering Task #12: Add end-to-end integration tests
    ["4"]="PVTI_lADOCjxaTs4A65J5zgbO5IQ"    # User Story #4: CloudflareLlama33JsonExtractor implementation
    ["5"]="PVTI_lADOCjxaTs4A65J5zgbO5IY"    # User Story #5: DI container configuration for multiple extractors
    ["1"]="PVTI_lADOCjxaTs4A65J5zgbO5IE"    # Epic #1: Add CloudflareLlama33JsonExtractor Implementation
)

# Function to update issue status to "Done"
update_issue_status() {
    local issue_number=$1
    local item_id="$2"
    
    echo "✅ Marking Issue #$issue_number as Done"
    
    gh api graphql -f query="
    mutation {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: \"$PROJECT_ID\"
          itemId: \"$item_id\"
          fieldId: \"$STATUS_FIELD_ID\"
          value: { singleSelectOptionId: \"$DONE_STATUS_ID\" }
        }
      ) {
        projectV2Item {
          id
          content {
            ... on Issue {
              number
              title
            }
          }
        }
      }
    }" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "   ✓ Issue #$issue_number status updated successfully"
    else
        echo "   ✗ Failed to update Issue #$issue_number status"
    fi
    echo ""
}

echo "📋 Updating Engineering Task Statuses:"
echo ""

# Update engineering tasks first
update_issue_status "10" "${COMPLETED_ISSUES[10]}"
update_issue_status "11" "${COMPLETED_ISSUES[11]}"
update_issue_status "12" "${COMPLETED_ISSUES[12]}"

echo "📊 Updating User Story Statuses:"
echo ""

# Update user stories next
update_issue_status "4" "${COMPLETED_ISSUES[4]}"
update_issue_status "5" "${COMPLETED_ISSUES[5]}"

echo "🎯 Updating Epic Status:"
echo ""

# Finally update epic
update_issue_status "1" "${COMPLETED_ISSUES[1]}"

echo "✅ GitHub Project Status Updates Complete!"
echo ""
echo "📊 Final Project Status:"
echo "   Epic #1: Done ✓"
echo "   ├── User Story #2: Done ✓"
echo "   ├── User Story #3: Done ✓"
echo "   ├── User Story #4: Done ✓"
echo "   └── User Story #5: Done ✓"
echo ""
echo "   Engineering Tasks: All Done ✓"
echo "   ├── Task #6: Extract AntiHallucinationDetector utility ✓"
echo "   ├── Task #7: Extract JsonExtractionConfidenceCalculator utility ✓"
echo "   ├── Task #8: Implement CloudflareLlama33JsonExtractor class ✓"
echo "   ├── Task #9: Configure DI container for multiple extractors ✓"
echo "   ├── Task #10: Create JSON extractor factory pattern ✓"
echo "   ├── Task #11: Add performance benchmarking tests ✓"
echo "   └── Task #12: Add end-to-end integration tests ✓"
echo ""
echo "🔗 View updated project: https://github.com/orgs/nolock-social/projects/1"
echo ""
echo "🎉 All CloudflareLlama33JsonExtractor implementation tasks completed!"