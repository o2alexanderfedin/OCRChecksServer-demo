#!/bin/bash

# Verify Git tags and GitHub releases are in sync
# Usage: ./scripts/verify-release-sync.sh

set -e

verify_release_sync() {
    echo "🔍 Checking Git tags vs GitHub releases synchronization..."
    
    # Check if GitHub CLI is authenticated
    if ! gh auth status >/dev/null 2>&1; then
        echo "ERROR: GitHub CLI not authenticated"
        echo "Run: gh auth login"
        exit 1
    fi
    
    # Get latest Git tag
    local latest_git_tag=$(git tag --sort=-version:refname | head -1)
    
    # Get latest GitHub release
    local latest_gh_release=$(gh release list --limit 1 --json tagName --jq '.[0].tagName' 2>/dev/null || echo "")
    
    echo "Latest Git tag: $latest_git_tag"
    echo "Latest GitHub release: ${latest_gh_release:-'None found'}"
    
    if [ -z "$latest_gh_release" ]; then
        echo "❌ SYNC ERROR: No GitHub releases found!"
        echo "Create releases for existing tags:"
        git tag --sort=-version:refname | head -5 | while read tag; do
            echo "  gh release create $tag --title 'Release $tag' --notes-file docs/releases/release-summary-${tag#v}.md"
        done
        return 1
    fi
    
    if [ "$latest_git_tag" != "$latest_gh_release" ]; then
        echo "❌ SYNC ERROR: Git tags and GitHub releases are out of sync!"
        echo ""
        echo "Missing GitHub releases for these tags:"
        
        # Find tags that don't have GitHub releases
        local missing_releases=()
        for tag in $(git tag --sort=-version:refname | head -10); do
            if ! gh release view "$tag" >/dev/null 2>&1; then
                missing_releases+=("$tag")
                echo "  $tag"
            fi
        done
        
        echo ""
        echo "To fix, run these commands:"
        for tag in "${missing_releases[@]}"; do
            local version=${tag#v}
            echo "  bash scripts/create-github-release.sh $version 'Automated release creation'"
        done
        
        return 1
    else
        echo "✅ Git tags and GitHub releases are synchronized"
        
        # Check if this is the first release in the list (which means it's marked as Latest)
        local first_release=$(gh release list --limit 1 --json tagName --jq '.[0].tagName')
        if [ "$latest_gh_release" = "$first_release" ]; then
            echo "✅ Latest release ($latest_gh_release) is correctly marked as 'Latest'"
        else
            echo "⚠️ Latest release ($latest_gh_release) might not be marked as 'Latest'"
            echo "Check with: gh release list --limit 5"
        fi
        
        return 0
    fi
}

# Show additional release statistics
show_release_stats() {
    echo ""
    echo "📊 Release Statistics:"
    local git_tag_count=$(git tag | wc -l | tr -d ' ')
    local gh_release_count=$(gh release list --json tagName --jq '. | length' 2>/dev/null || echo "0")
    
    echo "  Git tags: $git_tag_count"
    echo "  GitHub releases: $gh_release_count"
    
    if [ "$git_tag_count" -eq "$gh_release_count" ]; then
        echo "  ✅ All Git tags have corresponding GitHub releases"
    else
        local missing=$((git_tag_count - gh_release_count))
        echo "  ❌ Missing $missing GitHub releases"
    fi
}

# Main execution
verify_release_sync
show_release_stats