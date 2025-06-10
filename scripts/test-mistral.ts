#!/usr/bin/env node

/**
 * Simple Mistral API Test Script
 * Runs outside of the test framework for direct debugging
 */

import { Mistral } from '@mistralai/mistralai.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

// Get API key from .dev.vars or command line
async function getApiKey() {
  let apiKey = '';
  
  // First try to read from .dev.vars
  try {
    const devVarsPath = path.join(projectRoot, '.dev.vars');
    const devVars = fs.readFileSync(devVarsPath, 'utf8');
    const match = devVars.match(/MISTRAL_API_KEY=([^\r\n]+)/);
    if (match) {
      apiKey = match[1];
      console.log(`Found API key in .dev.vars (first 4 chars): ${apiKey.substring(0, 4)}...`);
    }
  } catch (err) {
    console.log('No .dev.vars file found or unable to read it');
  }
  
  // If not found, check command line
  if (!apiKey && process.argv.length > 2) {
    apiKey = process.argv[2];
    console.log(`Using API key from command line (first 4 chars): ${apiKey.substring(0, 4)}...`);
  }
  
  if (!apiKey) {
    console.error('Error: API key not found in .dev.vars and not provided as command line argument');
    console.error('Usage: node scripts/test-mistral.js [API_KEY]');
    process.exit(1);
  }
  
  return apiKey;
}

// Test Mistral OCR API with detailed logging
async function testMistralOcr(apiKey) {
  console.log('======== MISTRAL OCR TEST ========');
  console.log('Node.js version:', process.version);
  console.log('Testing at:', new Date().toISOString());
  console.log('API key length:', apiKey.length);
  
  try {
    // Create Mistral client
    console.log('Creating Mistral client...');
    const client = new Mistral({ apiKey });
    console.log('Client created successfully');
    
    // Find test image
    const testImagePaths = [
      path.join(projectRoot, 'tiny-test.jpg'),
      path.join(projectRoot, 'micro-test.jpg'),
      path.join(projectRoot, 'small-test.jpg'),
      path.join(projectRoot, 'tests', 'fixtures', 'images', 'fredmeyer-receipt.jpg'),
      path.join(projectRoot, 'tests', 'fixtures', 'images', 'rental-bill.jpg'),
      path.join(projectRoot, 'tests', 'fixtures', 'images', 'promo-check.HEIC')
    ];
    
    let imagePath;
    for (const testPath of testImagePaths) {
      if (fs.existsSync(testPath)) {
        imagePath = testPath;
        break;
      }
    }
    
    if (!imagePath) {
      console.error('Error: No test image found in known locations');
      process.exit(1);
    }
    
    console.log('Using test image:', imagePath);
    
    // Read image
    const imageBuffer = fs.readFileSync(imagePath);
    console.log('Image size:', imageBuffer.length, 'bytes');
    
    // Convert to base64
    console.log('Converting to base64...');
    const base64 = Buffer.from(imageBuffer).toString('base64');
    console.log('Base64 length:', base64.length, 'chars');
    
    // Create data URL
    const mimeType = 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;
    console.log('Data URL length:', dataUrl.length, 'chars');
    console.log('Data URL prefix:', dataUrl.substring(0, 50), '...');
    
    // Call OCR API
    console.log('\n======== MAKING MISTRAL OCR API CALL ========');
    console.log('Using model: mistral-ocr-latest');
    console.log('Document type: image_url');
    console.log('Calling OCR API at', new Date().toISOString());
    
    try {
      const startTime = Date.now();
      const response = await client.ocr.process({
        model: "mistral-ocr-latest",
        document: {
          type: 'image_url',
          imageUrl: dataUrl
        }
      });
      
      const duration = Date.now() - startTime;
      
      console.log('\n======== MISTRAL OCR API RESPONSE ========');
      console.log('Call succeeded in', duration, 'ms');
      console.log('Response structure:', Object.keys(response).join(', '));
      console.log('Page count:', response.pages?.length || 0);
      
      // Log first page content
      if (response.pages && response.pages.length > 0) {
        const firstPage = response.pages[0];
        console.log('\nFirst page details:');
        console.log('- Index:', firstPage.index);
        console.log('- Text length:', firstPage.markdown?.length || 0, 'chars');
        
        // Show sample of extracted text
        if (firstPage.markdown) {
          const textSample = firstPage.markdown.length > 200 ? 
            `${firstPage.markdown.substring(0, 200)}...` : 
            firstPage.markdown;
          console.log('- Text sample:\n', textSample.replace(/\n/g, ' '));
        }
      }
      
      console.log('\n======== TEST SUCCEEDED ========');
      return true;
    } catch (error) {
      console.log('\n======== MISTRAL OCR API ERROR ========');
      console.log('Error type:', error?.constructor?.name || typeof error);
      console.log('Error message:', error?.message || String(error));
      
      // Log detailed error information
      if (error?.stack) {
        console.log('Stack trace:', error.stack);
      }
      
      if (error?.response) {
        console.log('Response status:', error.response.status);
        console.log('Response status text:', error.response.statusText);
        
        try {
          // Try to parse error response body
          if (typeof error.response.json === 'function') {
            const responseJson = await error.response.json();
            console.log('Response body:', JSON.stringify(responseJson, null, 2));
          } else if (typeof error.response.text === 'function') {
            const responseText = await error.response.text();
            console.log('Response text:', responseText);
          } else {
            console.log('Response object:', error.response);
          }
        } catch (parseError) {
          console.log('Error parsing response:', parseError.message);
        }
      }
      
      if (error?.cause) {
        console.log('Error cause:', error.cause);
      }
      
      console.log('\n======== TEST FAILED ========');
      return false;
    }
  } catch (error) {
    console.error('Fatal error:', error);
    return false;
  }
}

// Main function
async function main() {
  try {
    const apiKey = await getApiKey();
    const success = await testMistralOcr(apiKey);
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the main function
main();