// Simple test framework globals to replace Jasmine
export interface TestSuite {
  description: string;
  tests: Test[];
  suites: TestSuite[];
  beforeEach?: () => void;
  afterEach?: () => void;
}

export interface Test {
  description: string;
  fn: () => void | Promise<void>;
  timeout?: number;
}

const currentSuite: TestSuite = {
  description: 'root',
  tests: [],
  suites: []
};

const suiteStack: TestSuite[] = [currentSuite];

// Global test functions
global.describe = function(description: string, fn: () => void) {
  const suite: TestSuite = {
    description,
    tests: [],
    suites: []
  };
  
  const parent = suiteStack[suiteStack.length - 1];
  parent.suites.push(suite);
  suiteStack.push(suite);
  
  fn();
  
  suiteStack.pop();
};

global.it = function(description: string, fn: () => void | Promise<void>, timeout?: number) {
  const test: Test = {
    description,
    fn,
    timeout
  };
  
  const parent = suiteStack[suiteStack.length - 1];
  parent.tests.push(test);
};

global.beforeEach = function(fn: () => void) {
  const parent = suiteStack[suiteStack.length - 1];
  parent.beforeEach = fn;
};

global.afterEach = function(fn: () => void) {
  const parent = suiteStack[suiteStack.length - 1];
  parent.afterEach = fn;
};

global.fail = function(message?: string) {
  throw new Error(message || 'Test failed');
};

// Simple expect implementation
class Expectation {
  constructor(private actual: any) {}
  
  toBe(expected: any) {
    if (this.actual !== expected) {
      throw new Error(`Expected ${this.actual} to be ${expected}`);
    }
  }
  
  toEqual(expected: any) {
    if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} to equal ${JSON.stringify(expected)}`);
    }
  }
  
  toBeDefined() {
    if (this.actual === undefined) {
      throw new Error(`Expected ${this.actual} to be defined`);
    }
  }
  
  toBeUndefined() {
    if (this.actual !== undefined) {
      throw new Error(`Expected ${this.actual} to be undefined`);
    }
  }
  
  toBeInstanceOf(expected: any) {
    if (!(this.actual instanceof expected)) {
      throw new Error(`Expected ${this.actual} to be instance of ${expected.name}`);
    }
  }
  
  toBeGreaterThan(expected: number) {
    if (this.actual <= expected) {
      throw new Error(`Expected ${this.actual} to be greater than ${expected}`);
    }
  }
  
  toContain(expected: any) {
    if (typeof this.actual === 'string') {
      if (!this.actual.includes(expected)) {
        throw new Error(`Expected "${this.actual}" to contain "${expected}"`);
      }
    } else if (Array.isArray(this.actual)) {
      if (!this.actual.includes(expected)) {
        throw new Error(`Expected array to contain ${expected}`);
      }
    } else {
      throw new Error(`toContain() not supported for type ${typeof this.actual}`);
    }
  }
  
  toThrow() {
    if (typeof this.actual !== 'function') {
      throw new Error('Expected a function');
    }
    
    try {
      this.actual();
      throw new Error('Expected function to throw');
    } catch (error) {
      // Function threw as expected
    }
  }
  
  toThrowError(expectedError?: any) {
    if (typeof this.actual !== 'function') {
      throw new Error('Expected a function');
    }
    
    try {
      this.actual();
      throw new Error('Expected function to throw');
    } catch (error) {
      if (expectedError && !(error instanceof expectedError)) {
        throw new Error(`Expected function to throw ${expectedError.name}, but threw ${error.constructor.name}`);
      }
    }
  }
  
  get not() {
    return new NotExpectation(this.actual);
  }
}

class NotExpectation {
  constructor(private actual: any) {}
  
  toBe(expected: any) {
    if (this.actual === expected) {
      throw new Error(`Expected ${this.actual} not to be ${expected}`);
    }
  }
  
  toThrow() {
    if (typeof this.actual !== 'function') {
      throw new Error('Expected a function');
    }
    
    try {
      this.actual();
      // Function didn't throw as expected
    } catch (error) {
      throw new Error('Expected function not to throw');
    }
  }
}

global.expect = function(actual: any) {
  return new Expectation(actual);
};

// Test runner
export async function runTests(suite: TestSuite, depth = 0): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;
  
  const indent = '  '.repeat(depth);
  
  if (depth > 0) {
    console.log(`${indent}${suite.description}`);
  }
  
  // Run tests in this suite
  for (const test of suite.tests) {
    try {
      if (suite.beforeEach) {
        suite.beforeEach();
      }
      
      const result = test.fn();
      if (result instanceof Promise) {
        await result;
      }
      
      if (suite.afterEach) {
        suite.afterEach();
      }
      
      console.log(`${indent}  ✓ ${test.description}`);
      passed++;
    } catch (error) {
      console.log(`${indent}  ✗ ${test.description}`);
      console.log(`${indent}    ${error.message}`);
      failed++;
    }
  }
  
  // Run nested suites
  for (const nestedSuite of suite.suites) {
    const results = await runTests(nestedSuite, depth + 1);
    passed += results.passed;
    failed += results.failed;
  }
  
  return { passed, failed };
}

// Auto-run tests at the end of the file
if (typeof global !== 'undefined' && global.process && global.process.argv0) {
  process.nextTick(async () => {
    try {
      const results = await runTests(currentSuite);
      console.log(`\nTests: ${results.passed + results.failed}, Passed: ${results.passed}, Failed: ${results.failed}`);
      
      if (results.failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Test runner error:', error);
      process.exit(1);
    }
  });
}

// TypeScript global declarations
declare global {
  function describe(description: string, fn: () => void): void;
  function it(description: string, fn: () => void | Promise<void>, timeout?: number): void;
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
  function expect(actual: any): Expectation;
  function fail(message?: string): never;
}