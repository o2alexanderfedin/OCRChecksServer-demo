# Technical Debt Tracking

This document tracks technical debt items across the codebase. Each item includes a description, priority, status, and resolution approach.

## Categories
- **Architecture**: Issues related to system design and component interactions
- **Testing**: Areas needing improved test coverage or better testing approaches
- **Performance**: Inefficiencies, bottlenecks, or areas needing optimization
- **Refactoring**: Code that works but needs cleanup or reorganization
- **Documentation**: Missing, outdated, or unclear documentation
- **DevOps**: Issues with build, deployment, or infrastructure
- **Tools**: Improvements needed for development or operational tools

## Priority Levels
- **High**: Significantly impacts development velocity or system reliability
- **Medium**: Causes friction but doesn't block development
- **Low**: Minor issues that should be addressed eventually

## Status
- **Open**: Issue identified but not being actively addressed
- **In Progress**: Currently being worked on
- **Resolved**: Completely addressed (include resolution details)

## Architecture

### [A001] Improve Swift Package Integration
- **Description**: Swift packages are currently not optimally integrated with main repository
- **Priority**: Medium
- **Status**: Open
- **Resolution Approach**: 
  1. Create a GitFlow feature branch (`git flow feature start improve-swift-package-integration`)
  2. Create architectural design document outlining integration approach
  3. Following TDD principles, implement integration improvements
  4. Adhere to SOLID and KISS principles throughout the implementation
  5. Finish the feature using proper GitFlow process

## Testing

### [T001] Implement NolockCapture Unit Tests
- **Description**: The nolock-capture submodule has no unit tests for its components
- **Priority**: High
- **Status**: Open
- **Resolution Approach**: 
  1. Create a GitFlow feature branch (`git flow feature start implement-nolock-capture-tests`)
  2. Create an architectural test design document outlining the test strategy
  3. Following TDD principles, write failing tests first for:
     - CaptureController
     - ReceiptCaptureController
     - DepthProcessor classes
  4. Implement test fixtures and mocks following SOLID principles
  5. Use the KISS principle to keep tests simple and maintainable
  6. Finish the feature using proper GitFlow process

### [T002] Comprehensive Test Strategy for LiDAR-Based Document Capture
- **Description**: Need testing approach for depth-aware document capture on devices with LiDAR
- **Priority**: Medium
- **Status**: Open
- **Resolution Approach**: Develop simulator-based tests and device-specific test suite

## Tools

### [TO001] Automate Submodule Updates During Release Process
- **Description**: Submodule references aren't automatically updated during GitFlow release process
- **Priority**: Medium
- **Status**: Open
- **Resolution Approach**: Extend GitFlow scripts to properly handle submodules

## Documentation

### [D001] Consolidate Swift Package Documentation
- **Description**: Documentation for Swift packages is scattered and inconsistent
- **Priority**: Low
- **Status**: Open
- **Resolution Approach**: Create unified documentation template and apply to all Swift packages

## Refactoring

### [R001] Standardize Error Handling Across Repositories
- **Description**: Error handling approaches differ between main repo and submodules
- **Priority**: Medium
- **Status**: Open
- **Resolution Approach**: Define standard error handling patterns and apply consistently