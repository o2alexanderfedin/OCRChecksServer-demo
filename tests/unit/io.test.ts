/**
 * Unit tests for the IO utilities
 */
import { workerIo, workerIoE } from '../../src/io';

describe('IO Utilities', () => {
  describe('workerIo', () => {
    describe('asyncTryCatch', () => {
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
        let logCalled = false;
        let logMessage = '';
        console.log = (msg: string) => {
          logCalled = true;
          logMessage = msg;
        };
        
        try {
          // Call the log function
          const testMessage = 'test log message';
          workerIo.log(testMessage);
          
          // Assert it was called correctly
          expect(logCalled).toBe(true);
          // Check that the formatted message contains our test message (not an exact match due to formatting)
          expect(logMessage).toContain(testMessage);
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