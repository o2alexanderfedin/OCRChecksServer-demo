import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OCRResult } from '../../src/ocr/types.js';
import { throttledFetch, setupThrottledFetch } from '../helpers/throttled-fetch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const fixturesDir = path.join(projectRoot, 'tests', 'fixtures');
const checksDir = path.join(fixturesDir, 'images');
const expectedResultsPath = path.join(fixturesDir, 'expected', 'mistral-ocr-results.json');

// API endpoint configuration
const API_URL = process.env.OCR_API_URL || 'http://localhost:8787';

// Configure throttled fetch with recommended settings
setupThrottledFetch({
  enabled: true,
  requestInterval: 200, // Slightly more conservative than the 167ms limit
  debug: process.env.DEBUG_THROTTLE === 'true'
});

// Utility functions
function getFirstCheckImage() {
  try {
    // Check if directory exists
    if (!fs.existsSync(checksDir)) {
      console.warn(`Check images directory not found: ${checksDir}`);
      // Try parent directory
      const parentDir = path.join(projectRoot, 'Checks');
      if (fs.existsSync(parentDir)) {
        console.log(`Trying parent directory: ${parentDir}`);
        const images = fs.readdirSync(parentDir)
          .filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.HEIC'))
          .filter(file => !file.startsWith('._')); // Filter out macOS metadata files
        return images.length > 0 ? path.join(parentDir, images[0]) : null;
      }
      
      return null;
    }
  
    const images = fs.readdirSync(checksDir)
      .filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg'))
      .filter(file => !file.startsWith('._')); // Filter out macOS metadata files
      
    if (images.length === 0) {
      console.warn('No image files found in the directory');
      return null;
    }
    
    console.log(`Found check image: ${images[0]}`);
    return path.join(checksDir, images[0]);
  } catch (error) {
    console.error('Error reading check images directory:', error);
    return null;
  }
}

async function loadExpectedResults() {
  try {
    if (fs.existsSync(expectedResultsPath)) {
      const data = fs.readFileSync(expectedResultsPath, 'utf8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.warn('Could not load expected results:', error);
    return null;
  }
}

describe('Fixed OCR Tests with Expected Results', () => {
  let expectedResults: any = null;
  
  beforeAll(async () => {
    expectedResults = await loadExpectedResults();
    
    // Skip tests if no expected results are available
    if (!expectedResults) {
      console.warn('No expected results found. Run semi-integration tests first to generate them.');
    }
  });
  
  it('should match OCR response with expected fields from recorded results', async () => {
    // Log API URL being used
    console.log('API URL for OCR test:', API_URL);
    
    // Skip test if expected results are not available
    if (!expectedResults) {
      console.warn('Expected results not available. Run semi-integration tests first.');
      pending('Expected results not available. Run semi-integration tests first.');
      return;
    }
    
    const imagePath = getFirstCheckImage();
    if (!imagePath) {
      console.error('No check images found for testing');
      fail('No check images found for testing');
      return;
    }
    
    console.log(`Using image file: ${imagePath}`);
    
    const imageBuffer = fs.readFileSync(imagePath);
    const response = await throttledFetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: imageBuffer,
    });
    
    expect(response.ok).toBe(true);
    const result = await response.json() as { text: string; data?: any };
    
    // Verify response has text content
    expect(result.text).toBeDefined();
    expect(typeof result.text).toBe('string');
    
    // If the API returns structured data, compare specific fields
    if (result.data && expectedResults[1]) {
      // Check for expected fields from the recorded results
      // This approach allows for some variance in the OCR results
      // while ensuring core fields are extracted
      
      // Get expected fields from recorded results
      const expectedFields = new Set();
      const recordedData = expectedResults[1][0][0];
      
      if (recordedData && recordedData.text) {
        // Extract field patterns from the recorded text
        const fieldMatches = recordedData.text.match(/(?:check(?:\s+number)?|amount|date|pay(?:ee)?(?:\s+to)?|memo|routing|account)(?:\s*\:|\.)/gi);
        
        if (fieldMatches) {
          fieldMatches.forEach((match: string) => {
            // Normalize field names
            const fieldName = match.toLowerCase()
              .replace(/[\:\.\s]+/g, '')
              .replace(/(?:check(?:number)?)/g, 'checkNumber')
              .replace(/pay(?:ee)?(?:to)?/g, 'payee');
            
            expectedFields.add(fieldName);
          });
        }
      }
      
      // Check if at least some expected fields are in the result
      const extractedFields = Object.keys(result.data);
      let matchedFieldCount = 0;
      
      expectedFields.forEach(field => {
        if (extractedFields.includes(field as string)) {
          matchedFieldCount++;
        }
      });
      
      // Require at least 2 fields to match to consider it successful
      expect(matchedFieldCount).toBeGreaterThanOrEqual(2);
    }
  });
});