import { ScannerFactory } from '../../../src/scanner/factory';
import { workerIoE } from '../../../src/io';
import { Document, DocumentType, IoE } from '../../../src/ocr/types';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { retry, isRetryableError } from '../../helpers/retry';
import { Receipt } from '../../../src/json/schemas/receipt';

// Create dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ReceiptScanner Integration', function() {
  // Set a much longer timeout for API calls to avoid timeouts with external services
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000; // 2 minutes
  
  // Environment variable for API key
  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
  
  // Skip all tests if API key is not available
  beforeAll(function() {
    if (!MISTRAL_API_KEY) {
      pending('MISTRAL_API_KEY environment variable not set');
    }
  });
  
  it('should process a receipt image and extract structured data', async function() {
    // Create a complete IoE implementation
    const io: IoE = {
      ...workerIoE,
      console: console,
      fs: {
        writeFileSync: fs.writeFileSync,
        readFileSync: fs.readFileSync,
        existsSync: fs.existsSync,
        promises: fs.promises
      },
      process: process,
      asyncImport: async (path) => import(path),
      performance: {
        now: () => performance.now()
      },
      tryCatch: <T>(f: () => T) => {
        try {
          return ['ok', f()];
        } catch (error) {
          return ['error', error];
        }
      }
    };
    
    // Create scanner
    const scanner = ScannerFactory.createMistralReceiptScanner(io, MISTRAL_API_KEY!);
    
    // Load test image from fixtures directory
    const imagePath = path.resolve(__dirname, '../../fixtures/images/telegram-cloud-photo-size-1-4915775046379745521-y.jpg');
    console.log('Image path:', imagePath);
    
    // Check if the file exists
    try {
      if (!fs.existsSync(imagePath)) {
        pending(`Test image not found at path: ${imagePath}`);
        return;
      }
    } catch (err: any) {
      console.error('Error checking if file exists:', err);
      pending(`Error checking test image: ${err.message}`);
      return;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Create document
    const document: Document = {
      content: imageBuffer.buffer,
      type: DocumentType.Image,
      name: 'test-receipt.jpg'
    };
    
    // Process document with retry logic
    let result;
    try {
      result = await retry(
        async () => await scanner.processDocument(document),
        {
          retries: 2, // Try up to 3 times total (initial + 2 retries)
          initialDelay: 2000,
          retryIf: (error) => {
            // Retry on rate limits or temporary API issues
            if (error[0] === 'error' && 
                (error[1].includes('rate limit') || 
                 error[1].includes('API error') || 
                 isRetryableError(error[1]))) {
              return true;
            }
            return false;
          },
          onRetry: (error, attempt) => {
            console.log(`Retrying after error (attempt ${attempt}/2): ${error[1]}`);
          }
        }
      );
    } catch (error) {
      // If retries failed, use the last error
      result = error;
    }
    
    // Log the result for debugging
    console.log('Process result:', result);
    
    // Skip test if we hit rate limits or other API errors
    if (Array.isArray(result) && result[0] === 'error') {
      const errorMessage = result[1] as string;
      if (errorMessage.includes('rate limit') || errorMessage.includes('API error')) {
        console.log('Skipping test due to API rate limit or error even after retries');
        pending('API rate limited or unavailable: ' + errorMessage);
        return;
      }
    }
    
    // Verify result
    expect(Array.isArray(result) && result[0]).toBe('ok');
    
    if (Array.isArray(result) && result[0] === 'ok') {
      const data = result[1];
      
      // Check that we have the expected properties
      expect(data.json).toBeDefined();
      expect(data.ocrConfidence).toBeDefined();
      expect(data.extractionConfidence).toBeDefined();
      expect(data.overallConfidence).toBeDefined();
      
      // Check that confidence scores are valid
      expect(data.ocrConfidence).toBeGreaterThan(0);
      expect(data.ocrConfidence).toBeLessThanOrEqual(1);
      expect(data.extractionConfidence).toBeGreaterThan(0);
      expect(data.extractionConfidence).toBeLessThanOrEqual(1);
      expect(data.overallConfidence).toBeGreaterThan(0);
      expect(data.overallConfidence).toBeLessThanOrEqual(1);
      
      // Check that the JSON data has expected receipt properties
      const receiptData = data.json as Receipt;
      expect(receiptData.merchant).toBeDefined();
      expect(receiptData.merchant.name).toBeDefined();
      expect(receiptData.timestamp).toBeDefined();
      expect(receiptData.totals).toBeDefined();
      expect(receiptData.totals.total).toBeDefined();
      expect(receiptData.currency).toBeDefined();
      expect(receiptData.confidence).toBeDefined();
    }
  });
  
  it('should use the factory method to create correct scanner type', async function() {
    // Create a complete IoE implementation
    const io: IoE = {
      ...workerIoE,
      console: console,
      fs: {
        writeFileSync: fs.writeFileSync,
        readFileSync: fs.readFileSync,
        existsSync: fs.existsSync,
        promises: fs.promises
      },
      process: process,
      asyncImport: async (path) => import(path),
      performance: {
        now: () => performance.now()
      },
      tryCatch: <T>(f: () => T) => {
        try {
          return ['ok', f()];
        } catch (error) {
          return ['error', error];
        }
      }
    };
    
    // Create scanner using factory method with receipt type
    const scanner = ScannerFactory.createScannerByType(io, MISTRAL_API_KEY!, 'receipt');
    
    // Load test image from fixtures directory
    const imagePath = path.resolve(__dirname, '../../fixtures/images/telegram-cloud-photo-size-1-4915775046379745521-y.jpg');
    
    // Skip test if the image doesn't exist
    if (!fs.existsSync(imagePath)) {
      pending(`Test image not found at path: ${imagePath}`);
      return;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Create document
    const document: Document = {
      content: imageBuffer.buffer,
      type: DocumentType.Image,
      name: 'test-receipt.jpg'
    };
    
    // Process document with retry logic
    let result;
    try {
      result = await retry(
        async () => await scanner.processDocument(document),
        {
          retries: 2, // Try up to 3 times total (initial + 2 retries)
          initialDelay: 2000,
          retryIf: (error) => {
            // Retry on rate limits or temporary API issues
            if (error[0] === 'error' && 
                (error[1].includes('rate limit') || 
                 error[1].includes('API error') || 
                 isRetryableError(error[1]))) {
              return true;
            }
            return false;
          },
          onRetry: (error, attempt) => {
            console.log(`Retrying after error (attempt ${attempt}/2): ${error[1]}`);
          }
        }
      );
    } catch (error) {
      // If retries failed, use the last error
      result = error;
    }
    
    // Skip test if we hit rate limits or other API errors
    if (Array.isArray(result) && result[0] === 'error') {
      const errorMessage = result[1] as string;
      if (errorMessage.includes('rate limit') || errorMessage.includes('API error')) {
        console.log('Skipping test due to API rate limit or error even after retries');
        pending('API rate limited or unavailable: ' + errorMessage);
        return;
      }
    }
    
    // Verify result
    expect(Array.isArray(result) && result[0]).toBe('ok');
    
    if (Array.isArray(result) && result[0] === 'ok') {
      const data = result[1];
      
      // Check that the JSON data has expected receipt properties
      const receiptData = data.json as Receipt;
      expect(receiptData.merchant).toBeDefined();
      expect(receiptData.merchant.name).toBeDefined();
      expect(receiptData.timestamp).toBeDefined();
      expect(receiptData.totals).toBeDefined();
      expect(receiptData.totals.total).toBeDefined();
      expect(receiptData.currency).toBeDefined();
    }
  });
});