import { ScannerFactory } from '../../../src/scanner/factory';
import { workerIoE } from '../../../src/io';
import { Document, DocumentType } from '../../../src/ocr/types';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Create dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ReceiptScanner Integration', function() {
  // Set a longer timeout for API calls
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  
  // Environment variable for API key
  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
  
  // Skip all tests if API key is not available
  beforeAll(function() {
    if (\!MISTRAL_API_KEY) {
      pending('MISTRAL_API_KEY environment variable not set');
    }
  });
  
  it('should process a receipt image and extract structured data', async function() {
    // Create scanner
    const scanner = ScannerFactory.createMistralReceiptScanner(workerIoE, MISTRAL_API_KEY\!);
    
    // Load test image from fixtures directory
    const imagePath = path.resolve(__dirname, '../../fixtures/images/telegram-cloud-photo-size-1-4915775046379745521-y.jpg');
    console.log('Image path:', imagePath);
    
    // Check if the file exists
    try {
      if (\!fs.existsSync(imagePath)) {
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
      expect(data.json.merchant).toBeDefined();
      expect(data.json.merchant.name).toBeDefined();
      expect(data.json.timestamp).toBeDefined();
      expect(data.json.totals).toBeDefined();
      expect(data.json.totals.total).toBeDefined();
      expect(data.json.currency).toBeDefined();
      expect(data.json.confidence).toBeDefined();
    }
  });
  
  it('should use the factory method to create correct scanner type', async function() {
    // Create scanner using factory method with receipt type
    const scanner = ScannerFactory.createScannerByType(workerIoE, MISTRAL_API_KEY\!, 'receipt');
    
    // Load test image from fixtures directory
    const imagePath = path.resolve(__dirname, '../../fixtures/images/telegram-cloud-photo-size-1-4915775046379745521-y.jpg');
    
    // Skip test if the image doesn't exist
    if (\!fs.existsSync(imagePath)) {
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
    
    // Process document
    const result = await scanner.processDocument(document);
    
    // Skip test if we hit rate limits or other API errors
    if (result[0] === 'error') {
      if (result[1].includes('rate limit') || result[1].includes('API error')) {
        pending('API rate limited or unavailable: ' + result[1]);
        return;
      }
    }
    
    // Verify result
    expect(result[0]).toBe('ok');
    
    if (result[0] === 'ok') {
      const data = result[1];
      
      // Check that the JSON data has expected receipt properties
      expect(data.json.merchant).toBeDefined();
      expect(data.json.merchant.name).toBeDefined();
      expect(data.json.timestamp).toBeDefined();
      expect(data.json.totals).toBeDefined();
      expect(data.json.totals.total).toBeDefined();
      expect(data.json.currency).toBeDefined();
    }
  });
});
EOL < /dev/null