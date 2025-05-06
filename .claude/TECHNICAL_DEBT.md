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

### [A001] Streamline Submodule Management Process
- **Description**: Current submodule operations are error-prone, especially with GitFlow
- **Priority**: High
- **Status**: Resolved (Created submodule-helper.sh and documentation)
- **Resolution**: Implemented helper script with interactive menu for common operations, added comprehensive documentation, and created rule file with best practices

### [A002] Improve Swift Package Integration
- **Description**: Swift packages are currently not optimally integrated with main repository
- **Priority**: Medium
- **Status**: Open
- **Resolution Approach**: Consider moving to Swift Package Manager for all Swift components

## Testing

### [T001] Implement NolockCapture Unit Tests
- **Description**: The nolock-capture-lib submodule has no unit tests for its components
- **Priority**: High
- **Status**: Open
- **Resolution Approach**: Create comprehensive unit tests for CaptureController, ReceiptCaptureController, and DepthProcessor classes

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