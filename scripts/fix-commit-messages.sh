#!/bin/bash
# A script to fix commit messages by removing anthropic and claude references
# Usage: ./fix-commit-messages.sh

# Ensure we're in the git repository
if [ ! -d ".git" ]; then
  echo "Error: Not in a git repository."
  exit 1
fi

# Set environment variable to suppress git-filter-branch warning
export FILTER_BRANCH_SQUELCH_WARNING=1

# Function to filter a commit message
filter_commit() {
  local commit="$1"
  # Get the commit message
  local original_msg=$(git log --format=%B -n 1 "$commit")
  
  # Filter out unwanted content
  local filtered_msg=$(echo "$original_msg" | sed '/Claude/d; /anthropic/d; /claude\.ai/d; /🤖/d; /Co-Authored-By/d')
  
  # Temporary file for the new message
  local tmp_file=$(mktemp)
  echo "$filtered_msg" > "$tmp_file"
  
  # Amend the commit
  git filter-branch --force --msg-filter "cat $tmp_file" "$commit"^.."$commit"
  
  # Cleanup
  rm "$tmp_file"
}

# Get the list of commits to modify
echo "Checking recent commits for references to remove..."
commits_to_fix=$(git log --grep="Claude\|anthropic\|🤖\|Co-Authored-By" --format="%H" -n 10)

if [ -z "$commits_to_fix" ]; then
  echo "No commits found with references to Claude or Anthropic."
  exit 0
fi

echo "Found commits with references to remove:"
git log --grep="Claude\|anthropic\|🤖\|Co-Authored-By" --oneline -n 10

echo
echo "This script will create a new branch with fixed commit messages."
echo "Current branch: $(git branch --show-current)"
echo

# Create a new branch for the fixed commits
current_branch=$(git branch --show-current)
new_branch="fix/clean-commit-messages-$(date +%s)"
git checkout -b "$new_branch"

echo "Created new branch: $new_branch"
echo "Beginning commit message cleanup..."

# Process each commit
for commit in $commits_to_fix; do
  echo "Processing commit $commit..."
  filter_commit "$commit"
done

echo
echo "Commit messages have been cleaned."
echo "You are now on branch: $new_branch"
echo
echo "Next steps:"
echo "1. Review the changes with: git log"
echo "2. If everything looks good, merge this branch into your main branch:"
echo "   git checkout $current_branch"
echo "   git merge $new_branch"
echo "3. Push the changes: git push"
echo
echo "Done!"