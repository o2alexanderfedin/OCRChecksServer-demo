#!/bin/bash
# Script to create remaining release branches

# First stash any local changes to avoid conflicts
git stash

# List of versions we need to create branches for
VERSIONS=("1.39.0" "1.40.0" "1.40.1" "1.40.2" "1.40.3" "1.41.0" "1.42.0" "1.43.0" "1.43.1" "1.44.0" "1.45.0")

# Create branches for each version
for version in "${VERSIONS[@]}"; do
  echo "Creating branch for release v$version..."
  
  # Checkout the tag
  git checkout "v$version"
  
  # Create a new branch
  git checkout -b "release/v$version"
  
  # Push the branch to remote
  git push -u origin "release/v$version"
  
  echo "Created and pushed remote branch: release/v$version"
done

# Return to develop branch and restore changes
git checkout develop
git stash pop

echo "Finished creating missing release branches"