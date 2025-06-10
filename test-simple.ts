// Simple test to verify tsx works
console.log('Running simple test...');

// Mock the global test functions
global.describe = function(description: string, fn: () => void) {
  console.log(`\nSuite: ${description}`);
  fn();
};

global.it = function(description: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.then(() => {
        console.log(`  ✓ ${description}`);
      }).catch((error) => {
        console.log(`  ✗ ${description}: ${error.message}`);
      });
    } else {
      console.log(`  ✓ ${description}`);
    }
  } catch (error) {
    console.log(`  ✗ ${description}: ${error.message}`);
  }
};

global.expect = function(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error(`Expected ${actual} to be defined`);
      }
    }
  };
};

global.beforeEach = function(fn: () => void) {
  // Simple implementation for now
  fn();
};

global.afterEach = function(fn: () => void) {
  // Simple implementation for now  
  fn();
};

global.fail = function(message?: string) {
  throw new Error(message || 'Test failed');
};

// TypeScript global declarations
declare global {
  function describe(description: string, fn: () => void): void;
  function it(description: string, fn: () => void | Promise<void>): void;
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
  function expect(actual: any): any;
  function fail(message?: string): never;
}

// Simple test
describe('Simple Test', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should pass', () => {
    expect('hello').toBeDefined();
  });
});

console.log('Simple test completed.');