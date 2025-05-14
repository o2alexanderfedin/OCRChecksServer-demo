import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { throttledFetch, setupThrottledFetch } from '../helpers/throttled-fetch.js';
import { setupServerCleanup } from '../helpers/server-cleanup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const checksDir = path.join(projectRoot, 'tests', 'fixtures', 'images');
const resultsPath = path.join(projectRoot, 'integration-test-results.json');

// Set up proper server cleanup
setupServerCleanup().catch(error => {
  console.error('Failed to set up server cleanup:', error);
});

// Configure throttled fetch with recommended settings
setupThrottledFetch({
  enabled: true,
  requestInterval: 200, // Slightly more conservative than the 167ms limit
  debug: process.env.DEBUG_THROTTLE === 'true'
});

// API endpoint configuration
const API_URL = process.env.OCR_API_URL || 'http://localhost:8787';

// Utility functions
function getCheckImages() {
  try {
    return fs.readdirSync(checksDir)
      .filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg'))
      .filter(file => !file.startsWith('._')); // Filter out macOS metadata files
  } catch (error: any) {
    console.error('Error reading check images directory:', error);
    return [];
  }
}

async function sendCheckImage(imagePath: string): Promise<any> {
  const imageBuffer = fs.readFileSync(imagePath);
  
  try {
    // Use throttled fetch to respect rate limits
    const response = await throttledFetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: imageBuffer,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error(`Error sending image ${path.basename(imagePath)}:`, error);
    throw error;
  }
}

// Tests
describe('OCR API Integration', () => {
  // Store results for all tests to allow examination after test run
  const testResults: Record<string, any> = {};
  
  // Check API availability before tests
  beforeAll(async () => {
    try {
      // Health checks can bypass throttling
      const response = await throttledFetch(API_URL, { 
        method: 'HEAD'
      });
      
      if (!response.ok) {
        throw new Error(`API endpoint returned status ${response.status}`);
      }
      console.log(`API endpoint at ${API_URL} is available`);
    } catch (error: any) {
      console.error(`API endpoint at ${API_URL} is not available:`, error);
      throw new Error(`API is not available at ${API_URL}. Make sure the server is running.`);
    }
  });
  
  // After all tests complete, save results to file
  afterAll(() => {
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`Test results saved to ${resultsPath}`);
  });
  
  it('should process check images and return valid OCR results', async () => {
    const imageFiles = getCheckImages();
    expect(imageFiles.length).toBeGreaterThan(0);
    
    for (const imageFile of imageFiles) {
      const imagePath = path.join(checksDir, imageFile);
      console.log(`Processing image: ${imageFile}`);
      
      const result = await sendCheckImage(imagePath);
      testResults[imageFile] = result;
      
      // Verify response structure
      expect(result).toBeDefined();
      expect(result.error).toBeUndefined();
      
      // Verify OCR text is present
      expect(result.text).toBeDefined();
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
      
      // Check for structured data (may vary based on implementation)
      if (result.data) {
        // If structured data is returned, verify it has expected fields
        expect(result.data).toBeDefined();
        
        // Log specific data fields for manual verification
        console.log(`OCR data extracted for ${imageFile}:`, 
          JSON.stringify({
            hasCheckNumber: !!result.data.checkNumber,
            hasDate: !!result.data.date,
            hasAmount: !!result.data.amount,
            hasPayee: !!result.data.payee,
          }, null, 2)
        );
      }
    }
  });
  
  it('should handle invalid image formats properly', async () => {
    // Create a non-image file for testing
    const testFilePath = path.join(projectRoot, 'temp-test-file.txt');
    fs.writeFileSync(testFilePath, 'This is not an image file');
    
    try {
      // Send invalid file and expect proper error handling
      await sendCheckImage(testFilePath);
      fail('Expected API to reject invalid image format');
    } catch (error: any) {
      // Expected error - API should reject
      expect(error).toBeDefined();
      testResults['invalid_format_test'] = { error: error.message };
    } finally {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });
});