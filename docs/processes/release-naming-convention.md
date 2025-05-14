# Release Naming Convention

## Overview

This document outlines the convention for naming releases in the OCR Checks Server project. Proper naming helps team members quickly understand the purpose and significance of each release.

## Format

Releases follow this naming format:

```
v{MAJOR}.{MINOR}.{PATCH} - {CODENAME} [{TYPE}]
```

### Components

- **Version Number**: Standard semantic versioning (MAJOR.MINOR.PATCH)
- **Codename**: A symbolic one-word name that captures the release theme
- **Type**: A classification of the type of release

## Release Types

The `[TYPE]` component must be one of the following:

- `Feature`: New capabilities or significant enhancements
- `Fix`: Bug fixes and minor improvements
- `Breaking`: Contains breaking changes requiring client updates
- `Security`: Primarily addresses security vulnerabilities
- `Hotfix`: Emergency fixes for critical issues
- `Refactor`: Code restructuring without functional changes
- `Maintenance`: Dependency updates, documentation, and housekeeping

## Codename Guidelines

The `{CODENAME}` should be a symbolic one-word name inspired by:

- **Mythology**: e.g., *Prometheus*, *Ragnarok*, *Atlas*
- **Astronomy**: e.g., *Nova*, *Eclipse*, *Quasar*
- **Nature**: e.g., *Monsoon*, *Tide*, *Glacier*
- **Sci-Fi**: e.g., *Nexus*, *Warp*, *Sentinel*

The codename should reflect the overall theme or vibe of the release:
- Bug fixes → *Salvage*, *Bastion*, *Shield*
- Major rewrite → *Phoenix*, *Genesis*
- Performance boost → *Tachyon*, *Velocity*, *Flux*
- Security hardening → *Bulwark*, *Aegis*, *Fortress*

## Examples

| Release Content                         | Release Name                      |
|----------------------------------------|-----------------------------------|
| Bug fixes & cleanup                    | `v1.2.4 - Tidy [Fix]`             |
| Major rewrite, new architecture        | `v2.0.0 - Phoenix [Breaking]`     |
| Added high-speed async pipeline        | `v3.1.0 - Tachyon [Feature]`      |
| Security audit with hardening          | `v1.5.9 - Bastion [Security]`     |
| Performance refactor of rendering      | `v2.7.2 - Flux [Refactor]`        |

## Usage Process

1. Analyze the changelog for the release
2. Identify its core theme (speed, stability, expansion, risk, rebirth, evolution, etc.)
3. Choose an appropriate codename that symbolizes this theme
4. Determine the most fitting release type based on content
5. Assemble the full release name
6. Use this name in release announcements, git tags, and documentation

## Benefits

- Provides a memorable "identity" for each release beyond just version numbers
- Helps developers quickly understand the nature of a release
- Creates a consistent narrative across project history
- Makes referencing releases in conversations easier ("the Phoenix release" vs "v2.0.0")