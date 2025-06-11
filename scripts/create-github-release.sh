#!/bin/bash

# Create GitHub release from Git tag
# Usage: ./scripts/create-github-release.sh 1.64.1 "Critical Smoke Test Environment URL Fix"

set -e

create_github_release() {
    local version=$1
    local description=$2
    local notes_file="docs/releases/release-summary-v${version}.md"
    
    if [ -z "$version" ]; then
        echo "ERROR: Version parameter required"
        echo "Usage: $0 <version> <description>"
        echo "Example: $0 1.64.1 'Critical Smoke Test Environment URL Fix'"
        exit 1
    fi
    
    if [ -z "$description" ]; then
        echo "ERROR: Description parameter required"
        echo "Usage: $0 <version> <description>"
        echo "Example: $0 1.64.1 'Critical Smoke Test Environment URL Fix'"
        exit 1
    fi
    
    if [ ! -f "$notes_file" ]; then
        echo "ERROR: Release notes file not found: $notes_file"
        echo "Please create the release summary document first"
        exit 1
    fi
    
    # Check if GitHub CLI is authenticated
    if ! gh auth status >/dev/null 2>&1; then
        echo "ERROR: GitHub CLI not authenticated"
        echo "Run: gh auth login"
        exit 1
    fi
    
    # Check if release already exists
    if gh release view "v$version" >/dev/null 2>&1; then
        echo "GitHub release v$version already exists"
        echo "URL: $(gh release view v$version --json url --jq '.url')"
        return 0
    fi
    
    # Check if Git tag exists
    if ! git tag -l "v$version" | grep -q "v$version"; then
        echo "ERROR: Git tag v$version does not exist"
        echo "Create the tag first with: git tag v$version"
        exit 1
    fi
    
    # Create the release
    echo "Creating GitHub release v$version..."
    local title="Release v$version: $description"
    
    gh release create "v$version" \
        --title "$title" \
        --notes-file "$notes_file" \
        --latest
    
    echo "✅ GitHub release v$version created successfully"
    echo "URL: $(gh release view v$version --json url --jq '.url')"
}

# Main execution
create_github_release "$1" "$2"