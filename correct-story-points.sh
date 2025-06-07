#!/bin/bash

# Correct GitHub Project Story Points Based on Child Task Dependencies
# User Story points = sum of all child engineering task points
# Epic points = sum of all child user story points

# Project configuration  
PROJECT_ID="PVT_kwDOCjxaTs4A65J5"
STORY_POINTS_FIELD_ID="PVTSSF_lADOCjxaTs4A65J5zgvWrls"

# Available Story Points Option IDs from GitHub
POINTS_5_ID="f9528d17"   # 5 points
POINTS_8_ID="c77c808e"   # 8 points
POINTS_13_ID="43b5d612"  # 13 points

# Issue item IDs that need updates
declare -A ISSUE_ITEMS=(
    ["4"]="PVTI_lADOCjxaTs4A65J5zgbO5IQ"   # User Story #4
    ["5"]="PVTI_lADOCjxaTs4A65J5zgbO5IY"   # User Story #5  
    ["1"]="PVTI_lADOCjxaTs4A65J5zgbO5IE"   # Epic #1
)

echo "🎯 Correcting GitHub Project Story Points Based on Dependencies"
echo "=============================================================="
echo ""

# Function to update story points
update_story_points() {
    local issue_number=$1
    local item_id="$2"
    local points_option_id="$3"
    local points_value="$4"
    local calculation="$5"
    
    echo "📊 Updating Issue #$issue_number to $points_value story points"
    echo "   Calculation: $calculation"
    
    gh api graphql -f query="
    mutation {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: \"$PROJECT_ID\"
          itemId: \"$item_id\"
          fieldId: \"$STORY_POINTS_FIELD_ID\"
          value: { singleSelectOptionId: \"$points_option_id\" }
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
    echo ""
}

echo "📋 Current vs Required Story Points:"
echo ""
echo "User Stories (sum of child engineering tasks):"
echo "   US #2: Has 3 pts ✅ = Task #6 (3 pts) - CORRECT"
echo "   US #3: Has 3 pts ✅ = Task #7 (3 pts) - CORRECT"  
echo "   US #4: Has 3 pts ❌ ≠ Tasks #8+#11+#12 (3+3+3=9 pts) - NEEDS UPDATE"
echo "   US #5: Has 5 pts ❌ ≠ Tasks #9+#10 (3+3=6 pts) - NEEDS UPDATE"
echo ""
echo "Epic (sum of child user stories):"
echo "   Epic #1: Has 13 pts ❌ ≠ US #2+#3+#4+#5 (3+3+9+6=21 pts) - NEEDS UPDATE"
echo ""

echo "🔧 Applying Corrections:"
echo ""

# Update User Story #4: Should be 9 points (closest available is 8)
update_story_points "4" "${ISSUE_ITEMS[4]}" "$POINTS_8_ID" "8" "Tasks #8(3) + #11(3) + #12(3) = 9 pts → using closest available (8)"

# Update User Story #5: Should be 6 points (closest available is 5)  
update_story_points "5" "${ISSUE_ITEMS[5]}" "$POINTS_5_ID" "5" "Tasks #9(3) + #10(3) = 6 pts → using closest available (5)"

# Update Epic #1: Should be 21 points (closest available is 13)
update_story_points "1" "${ISSUE_ITEMS[1]}" "$POINTS_13_ID" "13" "US #2(3) + #3(3) + #4(8) + #5(5) = 19 pts → using closest available (13)"

echo "✅ Story Point Corrections Complete!"
echo ""
echo "📊 Final Hierarchy (with GitHub constraints):"
echo "   Epic #1: 13 pts (represents ~19-21 logical points)"
echo "   ├── User Story #2: 3 pts = Task #6 (3 pts)"
echo "   ├── User Story #3: 3 pts = Task #7 (3 pts)"
echo "   ├── User Story #4: 8 pts ≈ Tasks #8+#11+#12 (9 pts)"
echo "   └── User Story #5: 5 pts ≈ Tasks #9+#10 (6 pts)"
echo ""
echo "📝 Note: GitHub's predefined options (1,2,3,5,8,13) limit exact representation"
echo "of calculated sums, but values now reflect dependency relationships."
echo ""
echo "🔗 View project: https://github.com/orgs/nolock-social/projects/1"