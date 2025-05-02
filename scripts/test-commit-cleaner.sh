#!/bin/bash
# A script to test the commit message cleaner on a temp repository
# This creates a temp repository with test commits and runs the cleaner

# Create temp directory
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Create test repository
cd $TEMP_DIR
git init
echo "# Test Repository" > README.md
git add README.md
git config --local user.name "Test User"
git config --local user.email "test@example.com"

# Create test commits with different message formats
echo "Creating test commits..."

# Standard commit
git commit -m "feat: add basic functionality"

# Commit with Claude reference
echo "file1" > file1.txt
git add file1.txt
git commit -m "fix: resolve issue with error handling

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Commit with anthropic reference
echo "file2" > file2.txt
git add file2.txt
git commit -m "docs: update readme with instructions

This commit was assisted by anthropic tools"

# Commit with emoji
echo "file3" > file3.txt
git add file3.txt
git commit -m "🔧 chore: configure build settings"

# Show original commits
echo -e "\nOriginal commits:"
git log --oneline

# Copy the fix script to temp dir
cp /Users/alexanderfedin/Projects/OCRChecksServer/scripts/fix-commit-messages.sh $TEMP_DIR/
chmod +x $TEMP_DIR/fix-commit-messages.sh

# Run the fix script
echo -e "\nRunning commit message fixer..."
./fix-commit-messages.sh

# Show cleaned commits
echo -e "\nCleaned commits:"
git log --oneline

# Clean up
echo -e "\nTest complete. Cleaning up temporary directory."
cd ..
rm -rf $TEMP_DIR

echo "Done!"