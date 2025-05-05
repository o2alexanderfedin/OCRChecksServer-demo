#!/bin/bash
# Script to rename release branches to ensure consistent naming with 'v' prefix

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
    
    # Fetch the old branch
    git fetch origin "release/$branch"
    
    # Create new branch from old branch
    git checkout -b "release/v$branch" "origin/release/$branch"
    
    # Push new branch to remote
    git push origin "release/v$branch"
    
    # Delete old branch from remote (optional)
    echo "- Deleting old branch release/$branch from remote"
    git push origin --delete "release/$branch"
    
    # Delete old branch locally
    git checkout develop
    git branch -D "release/$branch" || true
    
    echo "- Successfully renamed release/$branch to release/v$branch"
  else
    echo "- Branch release/$branch doesn't exist remotely, skipping"
  fi
done

# Return to develop branch
git checkout develop
echo "Finished renaming release branches"