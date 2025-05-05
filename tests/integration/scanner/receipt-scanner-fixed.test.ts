import { ScannerFactory } from '../../../src/scanner/factory';
import { workerIoE } from '../../../src/io';
import { Document, DocumentType, IoE } from '../../../src/ocr/types';
import { Receipt } from '../../../src/json/schemas/receipt';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { retry, isRetryableError } from '../../helpers/retry';

// Create dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define test image cases - each test will run with these images
const TEST_IMAGES = [
  {
    name: 'fredmeyer-receipt.jpg',
    description: 'Fred Meyer grocery store receipt',
    type: 'receipt' as const
  },
  {
    name: 'fredmeyer-receipt-2.jpg',
    description: 'Second Fred Meyer receipt with different items',
    type: 'receipt' as const
  },
  {
    name: 'rental-bill.jpg',
    description: 'Rental property bill receipt',
    type: 'receipt' as const
  }
];

// Helper function to get all available test images
function getAvailableTestImages() {
  const imagesDir = path.resolve(__dirname, '../../fixtures/images');
  try {
    const availableImages = TEST_IMAGES.filter(img => {
      try {
        return fs.existsSync(path.join(imagesDir, img.name));
      } catch (err) {
        return false;
      }
    });
    return availableImages;
  } catch (err) {
    console.error('Error listing test images:', err);
    return [];
  }
}

// Create a complete IoE object with all required properties
const testIoE = {
  // From workerIoE
  fetch: globalThis.fetch,
  atob: globalThis.atob,
  asyncTryCatch: async <T>(fn: () => Promise<T>) => {
    try {
      const result = await fn();
      return ['ok', result] as const;
    } catch (error) {
      return ['error', error] as const;
    }
  },
  log: (message: string) => console.log(message),
  
  // Additional required properties for IoE
  console: console,
  fs: {
    writeFileSync: () => {},
    readFileSync: () => Buffer.from(''),
    existsSync: fs.existsSync,  // Use real existsSync to check for test images
    promises: {
      readFile: async () => Buffer.from(''),
      writeFile: async () => {},
      readdir: async () => [],
      rm: async () => {},
      mkdir: async () => undefined,
      copyFile: async () => {}
    }
  },
  process: {
    argv: [],
    env: process.env,  // Use real environment variables
    exit: () => { throw new Error('exit called'); },
    cwd: () => process.cwd()
  },
  asyncImport: async () => ({ default: {} }),
  performance: {
    now: () => Date.now()
  },
  tryCatch: <T>(fn: () => T) => {
    try {
      return ['ok', fn()] as const;
    } catch (error) {
      return ['error', error] as const;
    }
  }
} as unknown as IoE;

describe('ReceiptScanner Integration (Fixed Environment)', function() {
  // Set a longer timeout for API calls
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  
  // Environment variable for API key
  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
  
  // Skip all tests if API key is not available
  beforeAll(function() {
    if (!MISTRAL_API_KEY) {
      pending('MISTRAL_API_KEY environment variable not set');
    }
  });
  
  // Get available images for testing
  const availableImages = getAvailableTestImages();
  
  if (availableImages.length === 0) {
    it('Receipt scanner tests - no test images available', function() {
      pending('No test images available. Check that test images exist in fixtures/images directory.');
    });
  } else {
    // Use the first available image for the test
    const testImage = availableImages[0];
    
    it(`should process a ${testImage.description} and extract structured data using fixed environment`, async function() {
      // Create scanner
      const scanner = ScannerFactory.createMistralReceiptScanner(testIoE, MISTRAL_API_KEY!);
      
      // Load test image from fixtures directory
      const imagePath = path.resolve(__dirname, '../../fixtures/images', testImage.name);
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
        name: testImage.name
      };
      
      // Process document with retry logic and rate limiting
      let result;
      try {
        result = await retry(
          async () => await scanner.processDocument(document),
          {
            retries: 5, // Try up to 6 times total (initial + 5 retries)
            initialDelay: 1000, // Start with 1 second delay between retries
            respectRateLimit: true, // Enforce Mistral's rate limit of 5 requests/second
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
          console.log('Skipping test due to API rate limit or error');
          pending('API rate limited or unavailable: ' + errorMessage);
          return;
        }
      }
      
      // Type assertion for result
      const typedResult = result as readonly ['ok' | 'error', any];
      
      // Verify result
      expect(typedResult[0]).toBe('ok');
      
      if (typedResult[0] === 'ok') {
        const data = typedResult[1];
        
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
        expect(receiptData.totals).toBeDefined();
        expect(receiptData.timestamp).toBeDefined();
        expect(receiptData.currency).toBeDefined();
      }
    });
  }
});