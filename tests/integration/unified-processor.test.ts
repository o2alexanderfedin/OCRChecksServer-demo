import { ProcessorFactory } from '../../src/processor/factory';
import { workerIoE } from '../../src/io';
import { Document, DocumentType } from '../../src/ocr/types';
import * as fs from 'fs';
import * as path from 'path';

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
    const processor = ProcessorFactory.createMistralProcessor(workerIoE, MISTRAL_API_KEY!);
    
    // Load test image
    const imagePath = path.resolve(__dirname, '../../Checks/telegram-cloud-photo-size-1-4915775046379745521-y.jpg');
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
      expect(data).toHaveProperty('json');
      expect(data).toHaveProperty('ocrConfidence');
      expect(data).toHaveProperty('extractionConfidence');
      expect(data).toHaveProperty('overallConfidence');
      
      // Check that confidence scores are valid
      expect(data.ocrConfidence).toBeGreaterThan(0);
      expect(data.ocrConfidence).toBeLessThanOrEqual(1);
      expect(data.extractionConfidence).toBeGreaterThan(0);
      expect(data.extractionConfidence).toBeLessThanOrEqual(1);
      expect(data.overallConfidence).toBeGreaterThan(0);
      expect(data.overallConfidence).toBeLessThanOrEqual(1);
      
      // Check that the JSON data has expected receipt properties
      expect(data.json).toHaveProperty('merchant');
      expect(data.json).toHaveProperty('totals');
      expect(data.json).toHaveProperty('timestamp');
      expect(data.json).toHaveProperty('currency');
    }
  });
});