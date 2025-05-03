# GitFlow Testing Workflow

## Problem

When running tests and finding issues, there's a tendency to immediately jump into fixing the code without following the proper GitFlow workflow. This leads to commits being made directly to develop or other branches instead of following the proper feature branch lifecycle.

## Solution: Test-Driven GitFlow Process

Always follow this strict workflow when addressing test failures:

1. **Stop and Create a Feature Branch**
   - When a test fails or a linter issue is found, STOP immediately
   - Do NOT make any changes to code until you're on a proper feature branch
   - Create a GitFlow feature branch with a descriptive name related to the issue:
     ```bash
     git flow feature start fix-[issue-description]
     ```

2. **Verify Working on Feature Branch**
   - Before making ANY code changes, verify you're on the feature branch:
     ```bash
     git branch  # Should show your feature branch with an asterisk
     ```
   - If not on feature branch, STOP and start over

3. **Fix the Issue**
   - Make necessary code changes
   - Run tests locally to verify the fix

4. **Commit Changes**
   - Stage and commit changes with a descriptive message following commit guidelines
   - Use proper prefixes (fix:, feat:, chore:, etc.)

5. **Complete the Feature**
   - Finish the feature only after verifying all tests pass:
     ```bash
     git flow feature finish fix-[issue-description]
     ```

6. **Regularly Check Branch Status**
   - Before running tests that might reveal issues requiring fixes
   - After each meaningful step in the development process

## Automatic Reminder System

Add the following to your testing workflow:

1. **Pre-Test Branch Check**
   - Add a check at the start of test scripts to verify current branch
   - If on develop or main, print a warning to remind about creating a feature branch before fixing any issues

2. **Post-Test Feature Branch Reminder**
   - After test failures, print a reminder about the GitFlow process
   - Include the exact command to create a new feature branch

## Implementation Example

Add this to test scripts:

```bash
# Pre-test branch check
current_branch=$(git branch --show-current)
if [[ "$current_branch" == "develop" || "$current_branch" == "main" ]]; then
  echo "⚠️ WARNING: You are on $current_branch branch!"
  echo "If you need to fix any issues, create a feature branch FIRST:"
  echo "git flow feature start fix-your-issue-name"
fi

# Run tests...

# If tests fail
if [[ $test_result -ne 0 ]]; then
  echo "⚠️ REMINDER: Follow GitFlow process to fix these issues!"
  echo "git flow feature start fix-[descriptive-name]"
  echo "See .claude/rules/gitflow-testing-workflow.md for details"
fi
```

## Checklist for Testing and Fixing

- [ ] Verified on a feature branch before running tests
- [ ] Created feature branch immediately when issues found
- [ ] Ran tests again on feature branch to confirm issues
- [ ] Fixed issues while on feature branch
- [ ] Committed changes with proper commit message
- [ ] Verified tests now pass on feature branch
- [ ] Finished feature branch properly