/**
 * Unit tests for the IO utilities
 */
import { workerIo, workerIoE } from '../../src/io.ts';

// Create our own simplified mock function since jasmine.createSpy might not be available
interface MockFunction {
    (...args: any[]): any;
    calls: {
        count: number;
        args: any[][];
        reset(): void;
    };
    mockReturnValue(val: any): MockFunction;
    mockImplementation(fn: Function): MockFunction;
    and: {
        callFake(fn: Function): MockFunction;
        returnValue(val: any): MockFunction;
    };
}

function createSpy(name: string): MockFunction {
    const fn = function(...args: any[]) {
        fn.calls.count++;
        fn.calls.args.push(args);
        if (fn._implementation) {
            return fn._implementation(...args);
        }
        return fn._returnValue;
    } as MockFunction & { _implementation?: Function; _returnValue?: any; };
    
    fn.calls = {
        count: 0,
        args: [],
        reset() {
            this.count = 0;
            this.args = [];
        }
    };
    
    fn.mockReturnValue = function(val: any) {
        fn._returnValue = val;
        return fn;
    };
    
    fn.mockImplementation = function(impl: Function) {
        fn._implementation = impl;
        return fn;
    };
    
    fn.and = {
        callFake(impl: Function) {
            fn._implementation = impl;
            return fn;
        },
        returnValue(val: any) {
            fn._returnValue = val;
            return fn;
        }
    };
    
    return fn;
}

describe('IO Utilities', () => {
  describe('workerIo', () => {
    describe('asyncTryCatch', () => {
      // Save original console methods
      let originalConsoleLog: typeof console.log;
      let originalConsoleError: typeof console.error;
      
      beforeEach(() => {
        // Store original console methods
        originalConsoleLog = console.log;
        originalConsoleError = console.error;
        
        // Mock console methods to suppress output during tests
        console.log = createSpy('console.log') as any;
        console.error = createSpy('console.error') as any;
      });
      
      afterEach(() => {
        // Restore original console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
      });
      
      it('should return [ok, result] for successful async functions', async () => {
        // Create a success function
        const successFunc = async () => 'success';
        
        // Execute the function with asyncTryCatch
        const result = await workerIo.asyncTryCatch(successFunc);
        
        // Assert the result
        expect(result[0]).toBe('ok');
        expect(result[1]).toBe('success');
      });

      it('should return [error, error] for failed async functions', async () => {
        // Create a test error
        const testError = new Error('test error');
        
        // Create a function that will throw the error
        const errorFunc = async () => {
          throw testError;
        };
        
        // Execute the function with asyncTryCatch
        const result = await workerIo.asyncTryCatch(errorFunc);
        
        // Assert the result
        expect(result[0]).toBe('error');
        expect(result[1]).toBe(testError);
      });

      it('should handle sync errors thrown in async functions', async () => {
        // Create a test error
        const testError = new Error('sync error inside async');
        
        // Create a function that will throw synchronously
        const syncErrorFunc = async () => {
          throw testError; // This is synchronous even though the function is async
        };
        
        // Execute the function with asyncTryCatch
        const result = await workerIo.asyncTryCatch(syncErrorFunc);
        
        // Assert the result
        expect(result[0]).toBe('error');
        expect(result[1]).toBe(testError);
      });
    });

    describe('log', () => {
      it('should call console.log with the provided message', () => {
        // Save original console.log
        const originalConsoleLog = console.log;
        
        // Create a spy replacement for console.log
        const consoleSpy = createSpy('console.log');
        console.log = consoleSpy as any;
        
        try {
          // Call the log function
          const testMessage = 'test log message';
          workerIo.log(testMessage);
          
          // Assert it was called correctly
          expect(consoleSpy.calls.count).toBeGreaterThan(0);
          // Check that the formatted message contains our test message (not an exact match due to formatting)
          expect(consoleSpy.calls.args[0][0]).toContain(testMessage);
        } finally {
          // Restore original console.log
          console.log = originalConsoleLog;
        }
      });
    });
  });

  describe('workerIoE', () => {
    it('should extend workerIo with fetch and atob functions', () => {
      // Assert that workerIoE contains the expected properties
      expect(workerIoE.asyncTryCatch).toBeDefined();
      expect(workerIoE.log).toBeDefined();
      expect(workerIoE.fetch).toBeDefined();
      expect(workerIoE.atob).toBeDefined();
      
      // Verify they exist (we can't directly compare function references due to the wrapper implementation)
      expect(typeof workerIoE.fetch).toBe('function');
      expect(typeof workerIoE.atob).toBe('function');
    });
  });
});