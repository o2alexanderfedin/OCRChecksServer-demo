// Test setup for tsx compatibility
// This file provides Jasmine-compatible globals for our test files

interface TestResult {
  description: string;
  fn: () => void | Promise<void>;
  status?: 'passed' | 'failed';
  error?: Error;
}

interface SuiteResult {
  description: string;
  tests: TestResult[];
  suites: SuiteResult[];
  beforeEach?: () => void;
  afterEach?: () => void;
}

let currentSuite: SuiteResult | null = null;
const rootSuite: SuiteResult = { description: 'Root', tests: [], suites: [] };
const suiteStack: SuiteResult[] = [rootSuite];

// Global describe function
global.describe = function(description: string, fn: () => void) {
  const suite: SuiteResult = { description, tests: [], suites: [] };
  const parent = suiteStack[suiteStack.length - 1];
  parent.suites.push(suite);
  suiteStack.push(suite);
  currentSuite = suite;
  
  fn();
  
  suiteStack.pop();
  currentSuite = suiteStack.length > 1 ? suiteStack[suiteStack.length - 1] : null;
};

// Global it function
global.it = function(description: string, fn: () => void | Promise<void>) {
  const test: TestResult = { description, fn };
  const suite = suiteStack[suiteStack.length - 1];
  suite.tests.push(test);
};

// Global beforeEach function
global.beforeEach = function(fn: () => void) {
  const suite = suiteStack[suiteStack.length - 1];
  suite.beforeEach = fn;
};

// Global afterEach function
global.afterEach = function(fn: () => void) {
  const suite = suiteStack[suiteStack.length - 1];
  suite.afterEach = fn;
};

// Global fail function
global.fail = function(message?: string) {
  throw new Error(message || 'Test failed');
};

// Expectation class
class Expectation {
  private actual: any;
  
  constructor(actual: any) {
    this.actual = actual;
  }
  
  toBe(expected: any) {
    if (this.actual !== expected) {
      throw new Error(`Expected ${this.actual} to be ${expected}`);
    }
    return this;
  }
  
  toEqual(expected: any) {
    const actualStr = JSON.stringify(this.actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(`Expected ${actualStr} to equal ${expectedStr}`);
    }
    return this;
  }
  
  toBeDefined() {
    if (this.actual === undefined) {
      throw new Error(`Expected value to be defined`);
    }
    return this;
  }
  
  toBeUndefined() {
    if (this.actual !== undefined) {
      throw new Error(`Expected ${this.actual} to be undefined`);
    }
    return this;
  }
  
  toBeInstanceOf(expected: any) {
    if (!(this.actual instanceof expected)) {
      throw new Error(`Expected ${this.actual} to be instance of ${expected.name}`);
    }
    return this;
  }
  
  toBeGreaterThan(expected: number) {
    if (this.actual <= expected) {
      throw new Error(`Expected ${this.actual} to be greater than ${expected}`);
    }
    return this;
  }
  
  toBeLessThan(expected: number) {
    if (this.actual >= expected) {
      throw new Error(`Expected ${this.actual} to be less than ${expected}`);
    }
    return this;
  }
  
  toBeGreaterThanOrEqual(expected: number) {
    if (this.actual < expected) {
      throw new Error(`Expected ${this.actual} to be greater than or equal to ${expected}`);
    }
    return this;
  }
  
  toBeLessThanOrEqual(expected: number) {
    if (this.actual > expected) {
      throw new Error(`Expected ${this.actual} to be less than or equal to ${expected}`);
    }
    return this;
  }
  
  toBeTruthy() {
    if (!this.actual) {
      throw new Error(`Expected ${this.actual} to be truthy`);
    }
    return this;
  }
  
  toBeFalsy() {
    if (this.actual) {
      throw new Error(`Expected ${this.actual} to be falsy`);
    }
    return this;
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
    return this;
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
    return this;
  }
  
  toThrowError(expectedError?: any) {
    if (typeof this.actual !== 'function') {
      throw new Error('Expected a function');
    }
    
    try {
      this.actual();
      throw new Error('Expected function to throw');
    } catch (error) {
      if (expectedError) {
        if (expectedError instanceof RegExp) {
          // Handle regex pattern matching
          if (!expectedError.test(error.message || String(error))) {
            throw new Error(`Expected error message "${error.message}" to match pattern ${expectedError}`);
          }
        } else if (typeof expectedError === 'function') {
          // Handle constructor matching
          if (!(error instanceof expectedError)) {
            throw new Error(`Expected function to throw ${expectedError.name}, but threw ${error.constructor.name}`);
          }
        } else if (typeof expectedError === 'string') {
          // Handle string matching
          if (!String(error).includes(expectedError)) {
            throw new Error(`Expected error "${String(error)}" to contain "${expectedError}"`);
          }
        }
      }
    }
    return this;
  }
  
  toBeNull() {
    if (this.actual !== null) {
      throw new Error(`Expected ${this.actual} to be null`);
    }
    return this;
  }
  
  toHaveLength(expectedLength: number) {
    if (!this.actual || typeof this.actual.length !== 'number') {
      throw new Error(`Expected value to have a length property`);
    }
    if (this.actual.length !== expectedLength) {
      throw new Error(`Expected length ${this.actual.length} to be ${expectedLength}`);
    }
    return this;
  }
  
  toBeCloseTo(expected: number, precision = 2) {
    const actualDiff = Math.abs(this.actual - expected);
    const maxDiff = Math.pow(10, -precision) / 2;
    if (actualDiff > maxDiff) {
      throw new Error(`Expected ${this.actual} to be close to ${expected} (precision: ${precision})`);
    }
    return this;
  }
  
  toMatch(pattern: RegExp | string) {
    if (typeof this.actual !== 'string') {
      throw new Error(`Expected value to be a string, but got ${typeof this.actual}`);
    }
    
    if (pattern instanceof RegExp) {
      if (!pattern.test(this.actual)) {
        throw new Error(`Expected "${this.actual}" to match pattern ${pattern}`);
      }
    } else {
      if (!this.actual.includes(pattern)) {
        throw new Error(`Expected "${this.actual}" to match "${pattern}"`);
      }
    }
    return this;
  }
  
  get not() {
    return new NotExpectation(this.actual);
  }
}

class NotExpectation {
  private actual: any;
  
  constructor(actual: any) {
    this.actual = actual;
  }
  
  toBe(expected: any) {
    if (this.actual === expected) {
      throw new Error(`Expected ${this.actual} not to be ${expected}`);
    }
    return this;
  }
  
  toBeUndefined() {
    if (this.actual === undefined) {
      throw new Error(`Expected ${this.actual} not to be undefined`);
    }
    return this;
  }
  
  toMatch(pattern: RegExp | string) {
    if (typeof this.actual !== 'string') {
      throw new Error(`Expected value to be a string, but got ${typeof this.actual}`);
    }
    
    if (pattern instanceof RegExp) {
      if (pattern.test(this.actual)) {
        throw new Error(`Expected "${this.actual}" not to match pattern ${pattern}`);
      }
    } else {
      if (this.actual.includes(pattern)) {
        throw new Error(`Expected "${this.actual}" not to match "${pattern}"`);
      }
    }
    return this;
  }
  
  toBeNull() {
    if (this.actual === null) {
      throw new Error(`Expected ${this.actual} not to be null`);
    }
    return this;
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
    return this;
  }
}

// Global expect function
global.expect = function(actual: any) {
  return new Expectation(actual);
};

// TypeScript global declarations
declare global {
  function describe(description: string, fn: () => void): void;
  function it(description: string, fn: () => void | Promise<void>): void;
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
  function expect(actual: any): Expectation;
  function fail(message?: string): never;
}

// Auto-run tests when imported
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test-setup-only') {
  process.nextTick(async () => {
    await runTestSuite(rootSuite);
  });
}

async function runTestSuite(suite: SuiteResult, depth = 0, parentBeforeEach?: () => void): Promise<{ passed: number; failed: number }> {
  const indent = '  '.repeat(depth);
  
  if (depth > 0) {
    console.log(`${indent}${suite.description}`);
  }
  
  let passed = 0;
  let failed = 0;
  
  // Run tests
  for (const test of suite.tests) {
    try {
      // Run parent beforeEach first, then current suite beforeEach
      if (parentBeforeEach) parentBeforeEach();
      if (suite.beforeEach) suite.beforeEach();
      
      const result = test.fn();
      if (result instanceof Promise) {
        await result;
      }
      
      if (suite.afterEach) suite.afterEach();
      
      console.log(`${indent}  ✓ ${test.description}`);
      passed++;
    } catch (error) {
      if (suite.afterEach) suite.afterEach();
      
      console.log(`${indent}  ✗ ${test.description}`);
      console.log(`${indent}    ${error.message}`);
      failed++;
    }
  }
  
  // Run nested suites  
  for (const nestedSuite of suite.suites) {
    // Pass current suite's beforeEach to nested suites
    const currentBeforeEach = suite.beforeEach ? 
      (parentBeforeEach ? 
        () => { parentBeforeEach(); suite.beforeEach!(); } :
        suite.beforeEach
      ) : 
      parentBeforeEach;
      
    const results = await runTestSuite(nestedSuite, depth + 1, currentBeforeEach);
    passed += results.passed;
    failed += results.failed;
  }
  
  if (depth === 0) {
    console.log(`\nTests: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0) {
      process.exit(1);
    }
  }
  
  return { passed, failed };
}