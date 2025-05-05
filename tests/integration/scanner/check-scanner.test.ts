import { ScannerFactory } from '../../../src/scanner/factory';
import { workerIoE } from '../../../src/io';
import { Document, DocumentType, IoE } from '../../../src/ocr/types';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Check } from '../../../src/json/schemas/check';
import { retry, isRetryableError } from '../../helpers/retry';

// Create dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define test image cases - each test will run with these images
const TEST_IMAGES = [
  {
    name: 'promo-check.HEIC',
    description: 'Promotional check in HEIC format',
    type: 'check' as const
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

describe('CheckScanner Integration', function() {
  // Set a much longer timeout for API calls to prevent timeouts
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000; // 2 minutes
  
  // Environment variable for API key
  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
  
  // Skip all tests if API key is not available
  beforeAll(function() {
    if (!MISTRAL_API_KEY) {
      pending('MISTRAL_API_KEY environment variable not set');
    }
  });
  
  // Create a test for each available test image
  const availableImages = getAvailableTestImages();
  
  if (availableImages.length === 0) {
    it('Check scanner tests - no test images available', function() {
      pending('No test images available. Check that test images exist in fixtures/images directory.');
    });
  } else {
    // Create test for each available image
    availableImages.forEach((testImage) => {
      it(`should process ${testImage.description} and extract structured data`, async function() {
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
        const scanner = ScannerFactory.createMistralCheckScanner(io, MISTRAL_API_KEY!);
        
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
        
        // Process document with retry logic for better reliability
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
        console.log(`Process result for ${testImage.name}:`, result);
        
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
          
          // Check that the JSON data has expected check properties
          const checkData = data.json as Check;
          expect(checkData.checkNumber).toBeDefined();
          expect(checkData.date).toBeDefined();
          expect(checkData.payee).toBeDefined();
          expect(checkData.amount).toBeDefined();
        }
      });
    });
  }
  
  // Factory method test - also use available images
  if (availableImages.length > 0) {
    // Use the first available image for factory test
    const testImage = availableImages[0];
    
    it(`should use the factory method to create correct scanner type for ${testImage.type}`, async function() {
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
      
      // Create scanner using factory method with check type
      const scanner = ScannerFactory.createScannerByType(io, MISTRAL_API_KEY!, testImage.type);
      
      // Load test image from fixtures directory
      const imagePath = path.resolve(__dirname, '../../fixtures/images', testImage.name);
      
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
        name: testImage.name
      };
      
      // Process document with retry for reliability
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
              console.log(`Retrying factory test after error (attempt ${attempt}/2): ${error[1]}`);
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
          pending('API rate limited or unavailable: ' + errorMessage);
          return;
        }
      }
      
      // Verify result
      expect(Array.isArray(result) && result[0]).toBe('ok');
      
      if (Array.isArray(result) && result[0] === 'ok') {
        const data = result[1];
        
        // Check that the JSON data has expected check properties
        const checkData = data.json as Check;
        expect(checkData.checkNumber).toBeDefined();
        expect(checkData.date).toBeDefined();
        expect(checkData.payee).toBeDefined();
        expect(checkData.amount).toBeDefined();
      }
    });
  }
});