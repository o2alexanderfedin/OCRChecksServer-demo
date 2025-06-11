#!/bin/bash

# Enhanced GitFlow Release Script with GitHub Release Creation
# This script wraps the standard GitFlow process to ensure GitHub releases are always created

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Usage function
usage() {
    echo "Enhanced GitFlow Release with GitHub Release Creation"
    echo ""
    echo "Usage: $0 start|finish <version> [description]"
    echo ""
    echo "Commands:"
    echo "  start <version>              Start a new GitFlow release"
    echo "  finish <version> [desc]      Finish GitFlow release and create GitHub release"
    echo ""
    echo "Examples:"
    echo "  $0 start 1.65.0"
    echo "  $0 finish 1.65.0 'New feature implementation'"
    echo ""
    exit 1
}

# Check prerequisites
check_prerequisites() {
    # Check if gh CLI is installed and authenticated
    if ! command -v gh >/dev/null 2>&1; then
        echo -e "${RED}ERROR: GitHub CLI (gh) is not installed${NC}"
        echo "Install with: brew install gh"
        exit 1
    fi
    
    if ! gh auth status >/dev/null 2>&1; then
        echo -e "${RED}ERROR: GitHub CLI not authenticated${NC}"
        echo "Run: gh auth login"
        exit 1
    fi
    
    # Check if git flow is available
    if ! command -v git-flow >/dev/null 2>&1; then
        echo -e "${RED}ERROR: Git Flow is not installed${NC}"
        echo "Install with: brew install git-flow"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Start GitFlow release
start_release() {
    local version=$1
    
    if [ -z "$version" ]; then
        echo -e "${RED}ERROR: Version required for start command${NC}"
        usage
    fi
    
    echo -e "${BLUE}🚀 Starting GitFlow release v$version${NC}"
    
    # Check if release branch already exists
    if git branch -a | grep -q "release/$version"; then
        echo -e "${YELLOW}⚠️ Release branch release/$version already exists${NC}"
        echo "Use: git flow release checkout $version"
        exit 1
    fi
    
    # Start the release
    git flow release start "$version"
    
    echo -e "${GREEN}✅ GitFlow release v$version started${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Make your changes on the release/$version branch"
    echo "2. Update package.json version to $version"
    echo "3. Create docs/releases/release-summary-v$version.md"
    echo "4. Run: $0 finish $version 'Release description'"
}

# Finish GitFlow release and create GitHub release
finish_release() {
    local version=$1
    local description=$2
    
    if [ -z "$version" ]; then
        echo -e "${RED}ERROR: Version required for finish command${NC}"
        usage
    fi
    
    if [ -z "$description" ]; then
        description="Release v$version"
    fi
    
    echo -e "${BLUE}🏁 Finishing GitFlow release v$version${NC}"
    
    # Check if we're on the release branch
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "release/$version" ]; then
        echo -e "${YELLOW}⚠️ Not on release/$version branch (currently on $current_branch)${NC}"
        echo "Switching to release/$version branch..."
        git flow release checkout "$version"
    fi
    
    # Verify package.json version
    local package_version=$(grep '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/')
    if [ "$package_version" != "$version" ]; then
        echo -e "${RED}ERROR: package.json version ($package_version) doesn't match release version ($version)${NC}"
        echo "Please update package.json version to $version"
        exit 1
    fi
    
    # Check if release summary exists
    local notes_file="docs/releases/release-summary-v$version.md"
    if [ ! -f "$notes_file" ]; then
        echo -e "${YELLOW}⚠️ Release notes file not found: $notes_file${NC}"
        echo "Creating basic release notes..."
        mkdir -p "docs/releases"
        cat > "$notes_file" << EOF
# Release Summary - Version $version

> **Release Date**: $(date +"%B %d, %Y")  
> **Version**: $version  
> **Type**: Release

## Overview

$description

## Changes

- See commit history for detailed changes

## Compatibility

- Backward compatible release
- No breaking changes

---

**Copyright © $(date +%Y) [Nolock.social](https://nolock.social). All rights reserved.**  
**Authored by: [O2.services](https://o2.services)**
EOF
        echo -e "${GREEN}✅ Created basic release notes at $notes_file${NC}"
    fi
    
    # Run tests before finishing
    echo -e "${BLUE}🧪 Running tests before release...${NC}"
    if ! npm test; then
        echo -e "${RED}❌ Tests failed! Please fix before finishing release${NC}"
        exit 1
    fi
    
    # Finish the GitFlow release
    echo -e "${BLUE}📝 Finishing GitFlow release...${NC}"
    git flow release finish "$version" -m "Release v$version"
    
    # Push all branches and tags
    echo -e "${BLUE}📤 Pushing branches and tags...${NC}"
    git push origin develop main --tags
    
    # Create GitHub release
    echo -e "${BLUE}🎯 Creating GitHub release...${NC}"
    if bash scripts/create-github-release.sh "$version" "$description"; then
        echo -e "${GREEN}✅ GitHub release v$version created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create GitHub release${NC}"
        echo "You can create it manually with:"
        echo "  gh release create v$version --title 'Release v$version: $description' --notes-file $notes_file"
        exit 1
    fi
    
    # Verify synchronization
    echo -e "${BLUE}🔍 Verifying release synchronization...${NC}"
    if bash scripts/verify-release-sync.sh; then
        echo -e "${GREEN}✅ Release process completed successfully!${NC}"
        echo ""
        echo -e "${CYAN}Release v$version is now available:${NC}"
        echo "- Git tag: v$version"
        echo "- GitHub release: $(gh release view v$version --json url --jq '.url')"
        echo "- Package version: $version"
    else
        echo -e "${YELLOW}⚠️ Synchronization check reported issues${NC}"
        echo "Release was created but may need manual verification"
    fi
}

# Main script execution
main() {
    local command=$1
    local version=$2
    local description=$3
    
    if [ $# -eq 0 ]; then
        usage
    fi
    
    check_prerequisites
    
    case "$command" in
        "start")
            start_release "$version"
            ;;
        "finish")
            finish_release "$version" "$description"
            ;;
        *)
            echo -e "${RED}ERROR: Unknown command '$command'${NC}"
            usage
            ;;
    esac
}

# Execute main function with all arguments
main "$@"