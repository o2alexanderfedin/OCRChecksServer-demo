#!/bin/bash

# Project Status Verification Script
# Verifies that GitHub project statuses are consistent with dependencies and implementation

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ORG="nolock-social"
PROJECT_NUMBER="1"

echo -e "${BLUE}🔍 Verifying GitHub Project Status Consistency${NC}"
echo "=================================="
echo "Project: OCR Checks Server Development"
echo "Organization: $PROJECT_ORG"
echo ""

# Function to check if code implementation exists for an issue
verify_code_implementation() {
    local issue_number=$1
    local issue_title="$2"
    
    case $issue_number in
        6)
            # AntiHallucinationDetector utility
            if [[ -f "src/json/utils/anti-hallucination-detector.ts" ]]; then
                echo -e "  ${GREEN}✅ Code exists${NC}: src/json/utils/anti-hallucination-detector.ts"
                return 0
            else
                echo -e "  ${RED}❌ Code missing${NC}: src/json/utils/anti-hallucination-detector.ts"
                return 1
            fi
            ;;
        7)
            # JsonExtractionConfidenceCalculator utility
            if [[ -f "src/json/utils/confidence-calculator.ts" ]]; then
                echo -e "  ${GREEN}✅ Code exists${NC}: src/json/utils/confidence-calculator.ts"
                return 0
            else
                echo -e "  ${RED}❌ Code missing${NC}: src/json/utils/confidence-calculator.ts"
                return 1
            fi
            ;;
        8)
            # CloudflareLlama33JsonExtractor class
            if [[ -f "src/json/cloudflare-llama33-extractor.ts" ]]; then
                echo -e "  ${GREEN}✅ Code exists${NC}: src/json/cloudflare-llama33-extractor.ts"
                return 0
            else
                echo -e "  ${RED}❌ Code missing${NC}: src/json/cloudflare-llama33-extractor.ts"
                return 1
            fi
            ;;
        9)
            # DI container configuration
            if grep -q "CloudflareLlama33JsonExtractor\|JSON_EXTRACTOR_TYPE" src/di/container.ts; then
                echo -e "  ${GREEN}✅ Code exists${NC}: DI container configured for multiple extractors"
                return 0
            else
                echo -e "  ${RED}❌ Code missing${NC}: DI container not configured for multiple extractors"
                return 1
            fi
            ;;
        10)
            # JSON extractor factory pattern
            if [[ -f "src/json/factory/json-extractor-factory.ts" ]] || find src -name "*factory*.ts" -path "*/json/*" | grep -q .; then
                echo -e "  ${GREEN}✅ Code exists${NC}: JSON extractor factory pattern"
                return 0
            else
                echo -e "  ${RED}❌ Code missing${NC}: JSON extractor factory pattern not implemented"
                return 1
            fi
            ;;
        11)
            # Performance benchmarking tests
            if find tests -name "*benchmark*.ts" -o -name "*performance*.ts" | grep -q cloudflare; then
                echo -e "  ${GREEN}✅ Code exists${NC}: CloudflareLlama33JsonExtractor performance tests"
                return 0
            else
                echo -e "  ${RED}❌ Code missing${NC}: CloudflareLlama33JsonExtractor performance benchmarking tests"
                return 1
            fi
            ;;
        12)
            # End-to-end integration tests
            if find tests -name "*e2e*.ts" -o -name "*integration*.ts" | xargs grep -l "CloudflareLlama33JsonExtractor" 2>/dev/null | grep -q .; then
                echo -e "  ${GREEN}✅ Code exists${NC}: CloudflareLlama33JsonExtractor integration tests"
                return 0
            else
                echo -e "  ${RED}❌ Code missing${NC}: CloudflareLlama33JsonExtractor end-to-end integration tests"
                return 1
            fi
            ;;
        *)
            echo -e "  ${YELLOW}⚠️  Unknown issue${NC}: Cannot verify implementation"
            return 0
            ;;
    esac
}

# Function to check test coverage for an issue
verify_test_coverage() {
    local issue_number=$1
    
    case $issue_number in
        6)
            if [[ -f "tests/unit/json/utils/anti-hallucination-detector.test.ts" ]]; then
                echo -e "  ${GREEN}✅ Tests exist${NC}: Anti-hallucination detector tests"
                return 0
            else
                echo -e "  ${RED}❌ Tests missing${NC}: Anti-hallucination detector tests"
                return 1
            fi
            ;;
        7)
            if [[ -f "tests/unit/json/utils/confidence-calculator.test.ts" ]]; then
                echo -e "  ${GREEN}✅ Tests exist${NC}: Confidence calculator tests"
                return 0
            else
                echo -e "  ${RED}❌ Tests missing${NC}: Confidence calculator tests"
                return 1
            fi
            ;;
        8)
            if [[ -f "tests/unit/json/cloudflare-llama33-extractor.test.ts" ]]; then
                echo -e "  ${GREEN}✅ Tests exist${NC}: CloudflareLlama33JsonExtractor tests"
                return 0
            else
                echo -e "  ${RED}❌ Tests missing${NC}: CloudflareLlama33JsonExtractor tests"
                return 1
            fi
            ;;
        9)
            if [[ -f "tests/unit/di/multiple-extractors.test.ts" ]]; then
                echo -e "  ${GREEN}✅ Tests exist${NC}: Multiple extractors DI tests"
                return 0
            else
                echo -e "  ${RED}❌ Tests missing${NC}: Multiple extractors DI tests"
                return 1
            fi
            ;;
        *)
            echo -e "  ${YELLOW}⚠️  Tests unknown${NC}: No specific test verification for this issue"
            return 0
            ;;
    esac
}

# Get project data
echo "📊 Fetching project data..."
PROJECT_DATA=$(gh api graphql -f query="
query {
  organization(login: \"$PROJECT_ORG\") {
    projectV2(number: $PROJECT_NUMBER) {
      items(first: 20) {
        nodes {
          content {
            ... on Issue {
              number
              title
            }
          }
          fieldValues(first: 20) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}" 2>/dev/null)

if [[ $? -ne 0 ]]; then
    echo -e "${RED}❌ Failed to fetch project data${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Analyzing Issues and Dependencies${NC}"
echo "======================================"

# Define issue dependencies
declare -A DEPENDENCIES=(
    ["1"]="2 3 4 5"      # Epic depends on all user stories
    ["2"]="6"            # User story depends on engineering task
    ["3"]="7"            # User story depends on engineering task
    ["4"]="8 11 12"      # User story depends on engineering tasks
    ["5"]="9 10"         # User story depends on engineering tasks
)

# Define issue types
declare -A ISSUE_TYPES=(
    ["1"]="Epic"
    ["2"]="User Story" 
    ["3"]="User Story"
    ["4"]="User Story"
    ["5"]="User Story"
    ["6"]="Engineering Task"
    ["7"]="Engineering Task"
    ["8"]="Engineering Task"
    ["9"]="Engineering Task"
    ["10"]="Engineering Task"
    ["11"]="Engineering Task"
    ["12"]="Engineering Task"
)

# Extract status for each issue
declare -A ISSUE_STATUS
while IFS= read -r line; do
    if [[ $line == *"issue"* ]]; then
        issue_num=$(echo "$line" | jq -r '.issue')
        status=$(echo "$line" | jq -r '.status // "No Status"')
        ISSUE_STATUS[$issue_num]="$status"
    fi
done < <(echo "$PROJECT_DATA" | jq -c '.data.organization.projectV2.items.nodes[] | {issue: .content.number, status: (.fieldValues.nodes[] | select(.field.name == "Status") | .name)}')

echo ""
INCONSISTENCIES=0
IMPLEMENTATION_ISSUES=0

# Check each issue
for issue in {1..12}; do
    status="${ISSUE_STATUS[$issue]:-No Status}"
    issue_type="${ISSUE_TYPES[$issue]:-Unknown}"
    
    echo -e "${BLUE}Issue #$issue${NC}: $issue_type - Status: ${YELLOW}$status${NC}"
    
    # Verify implementation if marked as Done
    if [[ "$status" == "Done" ]]; then
        echo "  Verifying implementation..."
        if ! verify_code_implementation "$issue" ""; then
            echo -e "  ${RED}❌ INCONSISTENCY: Issue marked 'Done' but implementation missing${NC}"
            ((IMPLEMENTATION_ISSUES++))
        fi
        
        if ! verify_test_coverage "$issue"; then
            echo -e "  ${RED}❌ INCONSISTENCY: Issue marked 'Done' but tests missing${NC}"
            ((IMPLEMENTATION_ISSUES++))
        fi
    fi
    
    # Check dependencies
    deps="${DEPENDENCIES[$issue]:-}"
    if [[ -n "$deps" ]]; then
        echo "  Dependencies: $deps"
        incomplete_deps=""
        
        for dep in $deps; do
            dep_status="${ISSUE_STATUS[$dep]:-No Status}"
            if [[ "$dep_status" != "Done" ]]; then
                incomplete_deps="$incomplete_deps #$dep($dep_status)"
            fi
        done
        
        if [[ -n "$incomplete_deps" && "$status" == "Done" ]]; then
            echo -e "  ${RED}❌ DEPENDENCY INCONSISTENCY: Issue marked 'Done' but dependencies incomplete:$incomplete_deps${NC}"
            ((INCONSISTENCIES++))
        elif [[ -n "$incomplete_deps" && "$status" == "In Progress" ]]; then
            echo -e "  ${GREEN}✅ DEPENDENCY OK: 'In Progress' status correct with incomplete dependencies:$incomplete_deps${NC}"
        elif [[ -z "$incomplete_deps" && "$status" == "Done" ]]; then
            echo -e "  ${GREEN}✅ DEPENDENCY OK: All dependencies complete${NC}"
        fi
    fi
    
    echo ""
done

# Summary
echo -e "${BLUE}📊 Verification Summary${NC}"
echo "======================"

if [[ $INCONSISTENCIES -eq 0 && $IMPLEMENTATION_ISSUES -eq 0 ]]; then
    echo -e "${GREEN}✅ All project statuses are consistent and accurate!${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $INCONSISTENCIES dependency inconsistencies${NC}"
    echo -e "${RED}❌ Found $IMPLEMENTATION_ISSUES implementation issues${NC}"
    echo ""
    echo -e "${YELLOW}🔧 To fix these issues:${NC}"
    echo "1. Run ./scripts/fix-project-status.sh to correct dependency inconsistencies"
    echo "2. Implement missing code before marking issues as 'Done'"
    echo "3. Add missing tests for completed features"
    echo "4. Follow the Project Status Management rules: .claude/rules/project-status-management.md"
    exit 1
fi