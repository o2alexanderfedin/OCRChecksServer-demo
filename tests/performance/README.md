# Performance Tests

This directory contains performance tests for the OCR Checks Server. These tests are designed to measure and monitor the performance characteristics of various components of the system.

## Running Performance Tests

```bash
npm run test:performance
```

To run a specific performance test:

```bash
npm run test:performance -- server-startup
```

## Available Tests

### Server Startup Tests

- **server-startup.test.ts**: Simple test that measures server startup time and ensures it's within acceptable limits.
- **server-performance-stats.test.ts**: More comprehensive test that measures server startup time over multiple iterations and provides statistical analysis.

## Performance Targets

The performance targets for server startup are:

- **Target P50 (Median)**: 1.5 seconds (1500ms)
- **Target P95**: 2.5 seconds (2500ms)
- **Hard Maximum**: 3.0 seconds (3000ms)

## Performance Optimization Recommendations

If performance tests fail or show warnings, consider the following optimizations:

1. Use lazy initialization for non-critical components
2. Reduce the number of Mistral clients created at startup
3. Optimize validation logic to be more efficient
4. Review startup sequence for potential parallelization