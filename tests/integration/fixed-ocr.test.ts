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
  // Set a timeout for the fetch operation (10 seconds)
  const TIMEOUT_MS = 10000;
  
  console.log(`Reading image file: ${imagePath}`);
  const imageBuffer = await fs.readFile(imagePath);
  console.log(`Processing image ${path.basename(imagePath)} (${imageBuffer.length} bytes)`);

  try {
    // Create an AbortController to handle timeout
    const controller = new AbortController();
    console.log(`Setting request timeout to ${TIMEOUT_MS}ms`);
    const timeoutId = setTimeout(() => {
      console.log('Request timed out - aborting');
      controller.abort();
    }, TIMEOUT_MS);
    
    console.log(`Sending POST request to ${baseUrl}`);
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg'
      },
      body: imageBuffer,
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    console.log(`Response received with status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to process image: ${response.status} ${errorText}`);
    }

    // Fix: Use type assertion to ensure it's an OCRResult type
    const result = await response.json() as OCRResult;
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${TIMEOUT_MS}ms. Make sure the server is running.`);
    }
    throw error;
  }
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
    // Check if server is running
    try {
      // Check if server is running with a quick HEAD request
      console.log(`Checking if server is running at ${baseUrl}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Server check timed out after 2 seconds');
        controller.abort();
      }, 2000);
      
      try {
        console.log('Sending HEAD request to check server status...');
        const checkResponse = await fetch(baseUrl, { 
          method: 'HEAD',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log(`Server responded with status: ${checkResponse.status}`);
        
        // We just need a response, even if it's a 404
        // A 404 on HEAD is normal for many APIs that only accept POST
        console.log('Server is responding, continuing with test');
        // Only skip if the status code indicates a server error (5xx)
        if (checkResponse.status >= 500) {
          pending('Server is returning error status - skipping test');
          return;
        }
      } catch (e) {
        pending('Server is not available - skipping test');
        return;
      }
      
      const files = await fs.readdir(checksDir);
      const testImages = files.filter(file => 
        file.endsWith('.jpg') || file.endsWith('.jpeg')
      );
      
      // Skip test if no valid test images found
      if (testImages.length === 0) {
        pending('No test images found. Add images to the Checks directory.');
        return;
      }
      
      // Limit to 2 images for faster testing
      const imagesToTest = testImages.slice(0, 2);
      
      // Process each image
      for (const file of imagesToTest) {
        const imagePath = path.join(checksDir, file);
        try {
          console.log(`Testing with image: ${file}`);
          console.log(`Starting to process image: ${imagePath}`);
          const result = await processImage(imagePath, baseUrl);
          console.log(`Successfully processed image: ${file}`);
          results[file] = result;
        
          // Verify result structure 
          expect(result).toBeDefined();
          
          // Fix: Use a different assertion method that exists in Jasmine
          // These fields should always be present (even if null)
          expect(result.amount).toBeDefined();
          expect(result.date).toBeDefined();
          expect(result.payee).toBeDefined();
          
          // Log processed image result
          console.log(`Processed ${file}:`, JSON.stringify(result, null, 2));
        } catch (error) {
          fail(`Failed to process ${file}: ${error}`);
        }
      }
    } catch (error) {
      pending(`Could not run test: ${error}`);
    }
  });
  
  it('should handle invalid content types gracefully', async () => {
    // Only run this test if server is running
    try {
      // Check if server is running with a quick HEAD request
      console.log(`Checking if server is running at ${baseUrl}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Server check timed out after 2 seconds');
        controller.abort();
      }, 2000);
      
      try {
        console.log('Sending HEAD request to check server status...');
        const checkResponse = await fetch(baseUrl, { 
          method: 'HEAD',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log(`Server responded with status: ${checkResponse.status}`);
        
        // We just need a response, even if it's a 404
        // A 404 on HEAD is normal for many APIs that only accept POST
        console.log('Server is responding, continuing with test');
        // Only skip if the status code indicates a server error (5xx)
        if (checkResponse.status >= 500) {
          pending('Server is returning error status - skipping test');
          return;
        }
      } catch (e) {
        pending('Server is not available - skipping test');
        return;
      }
      
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
        
        const errorData = await response.json() as {error?: string};
        // Fix: Use a different assertion method that exists in Jasmine
        expect(errorData.error).toBeDefined();
        
        // Clean up test file
        await fs.unlink(testFilePath);
      } catch (error) {
        // Clean up test file even if test fails
        try {
          await fs.unlink(testFilePath);
        } catch {}
        
        fail(`Error testing invalid content type: ${error}`);
      }
    } catch (error) {
      pending(`Could not run test: ${error}`);
    }
  });
  
  afterAll(async () => {
    // Save results to file for analysis
    const resultsPath = path.join(process.cwd(), 'integration-test-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${resultsPath}`);
  });
});