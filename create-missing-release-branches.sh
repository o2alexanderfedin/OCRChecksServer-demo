#!/bin/bash
# Script to create missing release branches from tags

# Get all tags
ALL_TAGS=$(git tag -l | grep "^v" | sort -V)

# Get all existing release branches 
EXISTING_BRANCHES=$(git branch -a | grep "origin/release/v" | sed 's|remotes/origin/release/v||' | sort -V)

# Create missing branches
for tag in $ALL_TAGS; do
  # Extract version without 'v' prefix
  version=${tag#v}
  
  # Check if branch exists for this tag
  if ! echo "$EXISTING_BRANCHES" | grep -q "^$version$"; then
    echo "Creating branch for tag $tag (release/v$version)..."
    
    # Checkout the tag
    git checkout "$tag"
    
    # Create a branch with the v prefix
    git checkout -b "release/v$version"
    
    # Push the branch to remote
    git push -u origin "release/v$version"
    
    echo "Branch release/v$version created and pushed"
  else
    echo "Branch already exists for tag $tag (release/v$version)"
  fi
done

# Return to develop branch
git checkout develop
echo "Finished creating missing release branches"