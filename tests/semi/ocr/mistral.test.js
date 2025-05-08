
// Import required modules
import fs from 'fs';
import path from 'path';
import { TestDIContainer } from '../../../src/di/index.js';
import { TYPES } from '../../../src/types/di-types.js';
import { DocumentType } from '../../../src/ocr/types.js';
import { workerIoE } from '../../../src/io.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get directory info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

describe('MistralOCR Semi-Integration', () => {
  // Create test-specific Io implementation
  const testIo = {
    ...workerIoE,
    // Ensure fetch and atob implementations exist
    fetch: globalThis.fetch,
    atob: globalThis.atob
  };
  
  // Create provider with test dependencies
  let provider;
  let container;

  // Set a longer timeout for API calls
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000; // 60 seconds
  
  beforeAll(() => {
    console.log('Initializing TestDIContainer with mock Mistral client');
    
    // Create a test container with mock Mistral client
    container = new TestDIContainer().registerMistralDependencies(
      testIo, 
      'test_valid_api_key_123456789012345678901234567890'
    );
    
    // Get the OCR provider from the container
    provider = container.get(TYPES.OCRProvider);
    
    console.log('Successfully initialized test container with mock Mistral client');
  });

  it('should process a check image with real Mistral client', async () => {
    // Load a real check image
    const checksDir = path.join(projectRoot, 'tests', 'fixtures', 'images');
    console.log(`Looking for check images in: ${checksDir}`);
    
    const imageFiles = fs.readdirSync(checksDir)
      .filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg'));
    
    if (imageFiles.length === 0) {
      pending('No check images found in the Checks directory');
      return;
    }

    // Pick the first image
    const imagePath = path.join(checksDir, imageFiles[0]);
    console.log(`Using check image: ${imagePath}`);
    
    // Read the image into a buffer
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`Image size: ${imageBuffer.length} bytes`);
    
    // Process the image
    console.log('Sending image to Mistral OCR...');
    const result = await provider.processDocuments([{
      content: imageBuffer.buffer,
      type: DocumentType.Image,
      name: path.basename(imagePath)
    }]);

    // Check the result
    if (result[0] === 'error') {
      fail(`Error processing image: ${result[1]}`);
      return;
    }

    // Save results to a file for inspection
    console.log('OCR Results:', JSON.stringify(result[1], null, 2));
    const resultsDir = path.join(projectRoot, 'tests', 'fixtures', 'expected');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(resultsDir, 'mistral-ocr-results.json'), 
      JSON.stringify(result[1], null, 2)
    );

    // Basic validation
    expect(result[0]).toBe('ok');
    expect(result[1]).toBeDefined();
    expect(result[1].length).toBeGreaterThan(0);
    expect(result[1][0]).toBeDefined();
    expect(result[1][0].length).toBeGreaterThan(0);
    expect(result[1][0][0].text).toBeDefined();
  });
});
