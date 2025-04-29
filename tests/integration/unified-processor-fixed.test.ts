import { ProcessorFactory } from '../../src/processor/factory';
import { workerIoE } from '../../src/io';
import { Document, DocumentType, IoE } from '../../src/ocr/types';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Create dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simplified mock with just the types needed for the test
const mockIoE = {
  ...workerIoE,
  // Add missing properties required by IoE
  console: { log: console.log, error: console.error },
  fs: {
    writeFileSync: () => {},
    readFileSync: () => null,
    existsSync: () => false,
    promises: {
      readFile: async () => '',
      writeFile: async () => {},
      readdir: async () => [],
      rm: async () => {},
      mkdir: async () => undefined,
      copyFile: async () => {}
    }
  },
  process: {
    argv: [],
    env: {},
    exit: () => { throw new Error('exit called') },
    cwd: () => ''
  },
  asyncImport: async () => ({ default: {} }),
  performance: {
    now: () => 0
  },
  tryCatch: <T>(f: () => T) => {
    try {
      return ['ok', f()];
    } catch (error) {
      return ['error', error];
    }
  },
} as unknown as IoE;

describe('ReceiptScanner Integration', function() {
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
  
  it('should process a receipt image and extract structured data', async function() {
    // Create processor
    const processor = ProcessorFactory.createMistralProcessor(mockIoE, MISTRAL_API_KEY!);
    
    // Load test image from fixtures directory
    const imagePath = path.resolve(__dirname, '../fixtures/images/telegram-cloud-photo-size-1-4915775046379745521-y.jpg');
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
    
    // Process document
    const result = await processor.processDocument(document);
    
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
      expect(data.json.totals).toBeDefined();
      expect(data.json.timestamp).toBeDefined();
      expect(data.json.currency).toBeDefined();
    }
  });
});