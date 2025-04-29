
// Import required modules
import fs from 'fs';
import path from 'path';
import { Mistral } from '@mistralai/mistralai';
import { MistralOCRProvider } from '../../src/ocr/mistral.js';
import { DocumentType } from '../../src/ocr/types.js';
import { workerIoE } from '../../src/io.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get directory info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Read API key from wrangler.toml
const wranglerContent = fs.readFileSync(path.join(projectRoot, 'wrangler.toml'), 'utf-8');
const MISTRAL_API_KEY = wranglerContent.match(/MISTRAL_API_KEY\s*=\s*"([^"]+)"/)[1];

describe('MistralOCR Semi-Integration', () => {
  // Create real Io implementation
  const realIo = {
    ...workerIoE,
    // Ensure fetch and atob implementations exist
    fetch: globalThis.fetch,
    atob: globalThis.atob
  };

  // Create real Mistral client with actual API key
  const realMistralClient = new Mistral({ apiKey: MISTRAL_API_KEY });
  
  // Create provider with real dependencies
  let provider;

  // Set a longer timeout for API calls
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000; // 60 seconds
  
  beforeAll(() => {
    console.log('Initializing MistralOCRProvider with real dependencies');
    // Initialize the provider with real dependencies
    provider = new MistralOCRProvider(realIo, realMistralClient);
  });

  it('should process a check image with real Mistral client', async () => {
    // Load a real check image
    const checksDir = path.join(projectRoot, 'Checks');
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
    fs.writeFileSync(
      path.join(projectRoot, 'integration-test-results.json'), 
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
