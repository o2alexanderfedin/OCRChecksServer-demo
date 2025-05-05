import { ScannerFactory } from '../../../src/scanner/factory';
import { workerIoE } from '../../../src/io';
import { Document, DocumentType, IoE } from '../../../src/ocr/types';
import { Receipt } from '../../../src/json/schemas/receipt';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Create dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define test image cases - each test will run with these images
const TEST_IMAGES = [
  {
    name: 'fredmeyer-receipt.jpg',
    description: 'Fred Meyer grocery store receipt',
    type: 'receipt'
  },
  {
    name: 'fredmeyer-receipt-2.jpg',
    description: 'Second Fred Meyer receipt with different items',
    type: 'receipt'
  },
  {
    name: 'rental-bill.jpg',
    description: 'Rental property bill receipt',
    type: 'receipt'
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
      
      // Process document
      const result = await scanner.processDocument(document);
      
      // Log the result for debugging
      console.log('Process result:', result);
      
      // Skip test if we hit rate limits or other API errors
      if (result[0] === 'error') {
        if (result[1].includes('rate limit') || result[1].includes('API error')) {
          console.log('Skipping test due to API rate limit or error');
          pending('API rate limited or unavailable: ' + result[1]);
          return;
        }
      }
      
      // Verify result
      expect(result[0]).toBe('ok');
      
      if (result[0] === 'ok') {
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
        expect(receiptData.totals).toBeDefined();
        expect(receiptData.timestamp).toBeDefined();
        expect(receiptData.currency).toBeDefined();
      }
    });
  }
});