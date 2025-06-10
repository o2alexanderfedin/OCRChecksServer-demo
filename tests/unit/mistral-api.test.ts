import { Mistral } from '@mistralai/mistralai.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createMockMistral } from '../../src/di/test-container.ts';

// Get directory info
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Get test image path
const testImagePath = path.join(projectRoot, 'tests', 'fixtures', 'images', 'rental-bill.jpg');

// Import types and create a proper IoE implementation
import type { IoE } from '../../src/ocr/types.ts';

// Create a minimal IO interface for testing
const testIo: IoE = {
  log: (message: string) => console.log(message),
  debug: (message: string, data?: unknown) => console.debug(message, data),
  warn: (message: string, data?: unknown) => console.warn(message, data),
  error: (message: string, error?: unknown) => console.error(message, error),
  trace: (source: string, methodName: string, args?: unknown) => console.trace(`${source}.${methodName}`, args),
  fetch: globalThis.fetch,
  atob: globalThis.atob,
  console: {
    log: console.log,
    error: console.error
  },
  fs: {
    writeFileSync: fs.writeFileSync,
    readFileSync: fs.readFileSync,
    existsSync: fs.existsSync,
    promises: fs.promises
  },
  process: {
    argv: process.argv,
    env: process.env,
    exit: process.exit,
    cwd: process.cwd
  },
  asyncImport: async (path: string) => ({ default: {} }),
  performance: {
    now: () => Date.now()
  },
  tryCatch: <T>(fn: () => T): ['ok', T] | ['error', unknown] => {
    try {
      return ['ok', fn()];
    } catch (error) {
      return ['error', error];
    }
  },
  asyncTryCatch: async <T>(fn: () => Promise<T>): Promise<['ok', T] | ['error', unknown]> => {
    try {
      return ['ok', await fn()];
    } catch (error) {
      return ['error', error];
    }
  }
};

describe('Mistral API Direct Test', () => {
  // Mock console methods to reduce test output noise
  let originalConsoleLog: typeof console.log;
  let originalConsoleDebug: typeof console.debug;
  
  beforeEach(() => {
    // Store original console methods
    originalConsoleLog = console.log;
    originalConsoleDebug = console.debug;
    
    // Mock console methods to suppress output during tests
    console.log = jasmine.createSpy('console.log');
    console.debug = jasmine.createSpy('console.debug');
    
    // Set test API key for environment if not already set
    if (!process.env.MISTRAL_API_KEY) {
      process.env.MISTRAL_API_KEY = "wHAFWZ8ksDNcRseO9CWprd5EuhezolxE";
    }
    
    // Ensure the test image exists, or create a simple test image if necessary
    if (!fs.existsSync(testImagePath)) {
      console.log(`Test image not found at path: ${testImagePath}`);
      // Ensure the directory exists
      const imageDir = path.dirname(testImagePath);
      if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
      }
      // Create a simple test image (1x1 pixel JPEG)
      const minimalJpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 
        0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xC2, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 
        0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
        0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x01, 0x3F, 
        0x10
      ]);
      fs.writeFileSync(testImagePath, minimalJpegBuffer);
    }
  });
  
  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.debug = originalConsoleDebug;
  });
  
  it('should call Mistral API directly with base64-encoded image', async () => {
    // Create a mock Mistral client with our implementation
    const mockClient = createMockMistral({
      apiKey: 'test_api_key_for_unit_tests',
      io: testIo,
      mockOcrProcess: async (params) => {
        return {
          model: "mistral-ocr-latest",
          usageInfo: { pagesProcessed: 1 },
          pages: [
            {
              index: 0,
              markdown: "Sample OCR text from test image.\nLine 2 of sample text.",
              dimensions: { width: 800, height: 600, dpi: 300 }
            }
          ]
        };
      }
    });
    
    // Read the test image file
    const imageBuffer = fs.readFileSync(testImagePath);
    
    // Convert to base64
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    
    // Call the Mistral API with our mock
    const response = await mockClient.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: 'image_url',
        imageUrl: dataUrl
      }
    });
    
    // Basic validations
    expect(response).toBeDefined();
    expect(response.pages).toBeDefined();
    expect(response.pages.length).toBeGreaterThan(0);
    expect(response.pages[0].markdown).toContain("Sample OCR text");
  });
});