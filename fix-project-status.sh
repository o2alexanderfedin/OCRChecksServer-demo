#!/bin/bash

# GitHub Project Status Corrector
# Fixes the inconsistent status based on actual dependencies

# Project information
PROJECT_ID="PVT_kwDOCjxaTs4A65J5"
STATUS_FIELD_ID="PVTSSF_lADOCjxaTs4A65J5zgvWocc"
DONE_OPTION_ID="98236657"
IN_PROGRESS_OPTION_ID="47fc9ee4"
TODO_OPTION_ID="f75ad846"

# Issue item IDs 
declare -A ISSUE_ITEMS=(
    ["1"]="PVTI_lADOCjxaTs4A65J5zgbO5IE"   # Epic
    ["2"]="PVTI_lADOCjxaTs4A65J5zgbO5II"   # User Story: anti-hallucination (complete)
    ["3"]="PVTI_lADOCjxaTs4A65J5zgbO5IM"   # User Story: confidence calculation (complete)
    ["4"]="PVTI_lADOCjxaTs4A65J5zgbO5IQ"   # User Story: CloudflareLlama33JsonExtractor (incomplete)
    ["5"]="PVTI_lADOCjxaTs4A65J5zgbO5IY"   # User Story: DI container (incomplete)
    ["6"]="PVTI_lADOCjxaTs4A65J5zgbO5Io"   # Engineering Task (complete)
    ["7"]="PVTI_lADOCjxaTs4A65J5zgbO5Ig"   # Engineering Task (complete) 
    ["8"]="PVTI_lADOCjxaTs4A65J5zgbO5Iw"   # Engineering Task (complete)
    ["9"]="PVTI_lADOCjxaTs4A65J5zgbO5Ik"   # Engineering Task (complete)
    ["10"]="PVTI_lADOCjxaTs4A65J5zgbO5Is"  # Engineering Task (todo)
    ["11"]="PVTI_lADOCjxaTs4A65J5zgbO5I0"  # Engineering Task (todo)
    ["12"]="PVTI_lADOCjxaTs4A65J5zgbO5I4"  # Engineering Task (todo)
)

echo "🔧 Fixing GitHub Project status inconsistencies..."
echo "Project: OCR Checks Server Development"
echo ""

# Function to update issue status
update_issue_status() {
    local issue_number=$1
    local item_id=$2
    local status_option_id=$3
    local status_name=$4
    local reason=$5
    
    echo "📝 Updating Issue #$issue_number to '$status_name'..."
    echo "   Reason: $reason"
    
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
    }" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Issue #$issue_number updated successfully"
    else
        echo "   ❌ Failed to update Issue #$issue_number"
    fi
}

echo "✅ Keeping completed engineering tasks as Done:"
update_issue_status "6" "${ISSUE_ITEMS[6]}" "$DONE_OPTION_ID" "Done" "AntiHallucinationDetector utility implemented"
update_issue_status "7" "${ISSUE_ITEMS[7]}" "$DONE_OPTION_ID" "Done" "JsonExtractionConfidenceCalculator utility implemented" 
update_issue_status "8" "${ISSUE_ITEMS[8]}" "$DONE_OPTION_ID" "Done" "CloudflareLlama33JsonExtractor class implemented"
update_issue_status "9" "${ISSUE_ITEMS[9]}" "$DONE_OPTION_ID" "Done" "DI container configured for multiple extractors"

echo ""
echo "✅ Completed user stories (all dependencies done):"
update_issue_status "2" "${ISSUE_ITEMS[2]}" "$DONE_OPTION_ID" "Done" "Only depends on Issue #6 which is complete"
update_issue_status "3" "${ISSUE_ITEMS[3]}" "$DONE_OPTION_ID" "Done" "Only depends on Issue #7 which is complete"

echo ""
echo "🔄 User stories with incomplete dependencies → In Progress:"
update_issue_status "4" "${ISSUE_ITEMS[4]}" "$IN_PROGRESS_OPTION_ID" "In Progress" "Depends on #8✅ + #11❌ + #12❌"
update_issue_status "5" "${ISSUE_ITEMS[5]}" "$IN_PROGRESS_OPTION_ID" "In Progress" "Depends on #9✅ + #10❌"

echo ""
echo "🔄 Epic with incomplete user stories → In Progress:"
update_issue_status "1" "${ISSUE_ITEMS[1]}" "$IN_PROGRESS_OPTION_ID" "In Progress" "User Stories #4 and #5 are not fully complete"

echo ""
echo "📋 Keeping pending engineering tasks as Todo:"
update_issue_status "10" "${ISSUE_ITEMS[10]}" "$TODO_OPTION_ID" "Todo" "Factory pattern not implemented"
update_issue_status "11" "${ISSUE_ITEMS[11]}" "$TODO_OPTION_ID" "Todo" "Performance benchmarking not implemented"
update_issue_status "12" "${ISSUE_ITEMS[12]}" "$TODO_OPTION_ID" "Todo" "End-to-end integration tests not implemented"

echo ""
echo "✨ Status correction complete!"
echo ""
echo "📊 Corrected Status Summary:"
echo "   ✅ Done: Issues #2, #3, #6, #7, #8, #9 (complete implementations)"
echo "   🔄 In Progress: Issues #1, #4, #5 (waiting for child tasks)"
echo "   📋 Todo: Issues #10, #11, #12 (not yet implemented)"
echo ""
echo "🎯 This reflects the actual implementation status accurately!"
echo "🔗 View project: https://github.com/orgs/nolock-social/projects/1"