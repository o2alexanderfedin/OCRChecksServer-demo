import fs from 'fs/promises';
import path from 'path';
import 'jasmine';

/**
 * OCR result structure returned by the API
 */
interface OCRResult {
  check_number: string | null;
  amount: string | null;
  date: string | null;
  payee: string | null;
  payer: string | null;
  bank_name: string | null;
  routing_number: string | null;
  account_number: string | null;
  memo: string | null;
}

/**
 * Process a single image through the OCR API
 * @param imagePath - Path to the image file
 * @param baseUrl - Base URL of the OCR API
 * @returns Promise with OCR result
 */
async function processImage(imagePath: string, baseUrl = 'http://localhost:8787'): Promise<OCRResult> {
  const imageBuffer = await fs.readFile(imagePath);
  console.log(`Processing image ${path.basename(imagePath)} (${imageBuffer.length} bytes)`);

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/jpeg'
    },
    body: imageBuffer
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to process image: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result;
}

describe('OCR API Integration Tests', () => {
  // Base URL for the API - configurable via environment variable
  const baseUrl = process.env.OCR_API_URL || 'http://localhost:8787';
  
  // Test images directory
  const checksDir = path.join(process.cwd(), 'Checks');
  
  // Results storage
  const results: Record<string, OCRResult> = {};
  
  beforeAll(async () => {
    // Verify the checks directory exists
    try {
      await fs.access(checksDir);
    } catch (error) {
      fail(`Checks directory not found: ${checksDir}`);
    }
  });
  
  it('should process valid check images successfully', async () => {
    const files = await fs.readdir(checksDir);
    const testImages = files.filter(file => 
      (file.endsWith('.jpg') || file.endsWith('.jpeg')) && 
      file.startsWith('telegram')
    );
    
    // Skip test if no valid test images found
    if (testImages.length === 0) {
      pending('No test images found. Add images to the Checks directory.');
      return;
    }
    
    // Process each image
    for (const file of testImages) {
      const imagePath = path.join(checksDir, file);
      try {
        const result = await processImage(imagePath, baseUrl);
        results[file] = result;
        
        // Verify result structure
        expect(result).toBeDefined();
        
        // These fields should always be present (even if null)
        expect(result).toHaveProperty('amount');
        expect(result).toHaveProperty('date');
        expect(result).toHaveProperty('payee');
        
        // Log processed image result
        console.log(`Processed ${file}:`, JSON.stringify(result, null, 2));
      } catch (error) {
        fail(`Failed to process ${file}: ${error}`);
      }
    }
  });
  
  it('should handle invalid content types gracefully', async () => {
    // Create a text file to test with
    const testFilePath = path.join(checksDir, 'test.txt');
    await fs.writeFile(testFilePath, 'This is not an image');
    
    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: 'This is not an image'
      });
      
      // API should return a 400 for invalid content type
      expect(response.status).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      
      // Clean up test file
      await fs.unlink(testFilePath);
    } catch (error) {
      // Clean up test file even if test fails
      try {
        await fs.unlink(testFilePath);
      } catch {}
      
      fail(`Error testing invalid content type: ${error}`);
    }
  });
  
  afterAll(async () => {
    // Save results to file for analysis
    const resultsPath = path.join(process.cwd(), 'integration-test-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${resultsPath}`);
  });
});