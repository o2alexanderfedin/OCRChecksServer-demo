#!/bin/bash
# Script to rename release branches to ensure consistent naming with 'v' prefix

# Stash any local changes to prevent checkout conflicts
git stash

# List of branches to rename (without 'v' prefix)
BRANCHES=(
  "1.7.0"
  "1.8.0"
  "1.9.0"
  "1.9.1"
  "1.9.2"
  "1.9.3"
  "1.9.5"
  "1.10.0"
  "1.11.0"
  "1.12.0"
  "1.12.1"
  "1.12.2"
)

# Checkout develop branch first to avoid being on a branch we're trying to rename
git checkout develop

# Create new branches with 'v' prefix and push them to remote
for branch in "${BRANCHES[@]}"; do
  echo "Processing branch $branch..."
  
  # Check if old branch exists remotely
  if git ls-remote --heads origin "release/$branch" | grep -q "release/$branch"; then
    echo "- Branch release/$branch exists remotely"
    
    # Check if new branch already exists remotely
    if git ls-remote --heads origin "release/v$branch" | grep -q "release/v$branch"; then
      echo "- Branch release/v$branch already exists remotely, skipping"
      continue
    fi
    
    # Create a new branch that follows the correct naming convention
    echo "- Creating new branch release/v$branch from the remote release/$branch"
    git fetch origin "release/$branch:release/v$branch"
    
    # Push the new branch to remote
    git push origin "release/v$branch"
    
    # Delete the old branch from remote
    echo "- Deleting old branch release/$branch from remote"
    git push origin --delete "release/$branch"
    
    echo "- Successfully renamed release/$branch to release/v$branch"
  else
    echo "- Branch release/$branch no longer exists remotely, skipping"
  fi
done

# Check for any remaining release branches without 'v' prefix
echo "Checking for any remaining release branches without 'v' prefix..."
REMAINING=$(git branch -r | grep -E "origin/release/[^v]" | sed 's/^[ *]*//' | sed 's/origin\///')
if [ -n "$REMAINING" ]; then
  echo "The following release branches still exist without 'v' prefix:"
  echo "$REMAINING"
else
  echo "All release branches now have consistent naming with 'v' prefix."
fi

# Return to develop branch
git checkout develop

# Pop stashed changes if any
git stash pop || true

echo "Finished renaming release branches"