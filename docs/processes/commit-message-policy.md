# Commit Message Policy

## Overview

This document outlines the commit message guidelines for the OCRChecksServer project. Consistent commit messages help maintain a clear project history and facilitate automated tools for release notes generation.

## Guidelines

### Commit Message Format

All commit messages should follow this format:

```
<type>: <summary>
```

Where `<type>` is one of:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (formatting, etc.)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing or correcting existing tests
- **build**: Changes to the build process or dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Regular maintenance tasks and updates

### Rules

1. **No Personal or Third-Party Attributions**: Commit messages should not include:
   - Personal names of developers
   - References to AI assistants or platforms
   - Company names that are not relevant to the project
   - Emojis, decorations or personal signatures

2. **Keep It Professional**: Commit messages should be professional and focus on the code changes.

3. **Be Concise**: The summary line should be concise (50-72 characters) and clearly describe what the commit does.

4. **Use Imperative Mood**: Write commit messages as if you are giving a command (e.g., "Add feature" not "Added feature").

## Examples

### Good Examples:

```
feat: add receipt scanning endpoint
fix: resolve integration test failures in check scanner
docs: update deployment instructions for Cloudflare Workers
refactor: improve error handling in OCR provider
```

### Bad Examples:

```
Added a new feature
John fixed the bug
Created by [TOOL_NAME]
🔧 Fix tests and update docs
feat: add receipt scanning endpoint (created with Claude)
```

## Enforcement

This policy is enforced through:
1. Code review process
2. Automated git hooks
3. Periodic repository cleanup scripts

## Script Usage

A script is available to help clean up commit messages that don't adhere to these guidelines:

```bash
./scripts/fix-commit-messages.sh
```

This script can remove common violations from recent commit messages and create a clean branch with the fixes.