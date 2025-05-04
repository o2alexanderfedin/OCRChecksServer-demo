// Enhanced client for testing the experimental Mistral direct endpoint
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Parse command line arguments with better support for options
const args = process.argv.slice(2);
const options = {
  // Format options
  format: args.includes('--camelCase') ? 'camelCase' : 'snake_case',
  
  // Request modes
  testMode: args.includes('--test'),
  debug: true,
  diagnosticMode: args.includes('--diagnostic'),
  comparison: args.includes('--compare'),
  
  // API options
  model: args.includes('--model') ? args[args.indexOf('--model') + 1] : "mistral-ocr-latest",
  timeout: args.includes('--timeout') ? parseInt(args[args.indexOf('--timeout') + 1]) : 30000,
  
  // Image options
  image: args.includes('--image') ? args[args.indexOf('--image') + 1] : 'tiny-test.jpg',
  rawBase64: args.includes('--raw-base64'),
  
  // Output options
  save: args.includes('--save'),
  verbose: args.includes('--verbose'),
  quiet: args.includes('--quiet'),
  
  // Extra parameters
  requestId: args.includes('--request-id') ? args[args.indexOf('--request-id') + 1] : undefined
};

// Usage help information
const usage = `
Enhanced Experimental Mistral API Client

Usage: 
  API_URL=https://ocr-checks-worker-dev.af-4a0.workers.dev node debug-test/experimental-client-v2.js [options]

Options:
  --camelCase       Use camelCase field names (default is snake_case)
  --test            Test mode - validate request but don't send to API
  --diagnostic      Enable extra detailed diagnostics
  --compare         Run comparison test of snake_case vs camelCase formats
  --model NAME      Specify model name (default: mistral-ocr-latest)
  --timeout MS      Set request timeout in milliseconds (default: 30000)
  --image PATH      Path to image file (default: tiny-test.jpg)
  --raw-base64      Send raw base64 without data URL wrapper
  --save            Save full response to debug-test/response-*.json
  --verbose         Show more detailed output
  --quiet           Show minimal output
  --request-id ID   Add custom request ID for tracing
  --help            Show this help message
`;

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(usage);
  process.exit(0);
}

/**
 * Main function to test the experimental endpoint with enhanced features
 */
async function testExperimentalEndpoint() {
  // Get API URL from environment or default to dev environment
  const API_URL = process.env.API_URL || 'https://ocr-checks-worker-dev.af-4a0.workers.dev';
  
  if (!options.quiet) {
    console.log(`Testing against API: ${API_URL}`);
    console.log(`Options: ${JSON.stringify(options, null, 2)}`);
  }
  
  // Use the specified test image
  const imagePath = path.resolve(options.image.startsWith('/') ? options.image : path.join(projectRoot, options.image));
  
  if (!options.quiet) {
    console.log(`Using test image at: ${imagePath}`);
  }
  
  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`Error: Image file does not exist at ${imagePath}`);
      return;
    }
    
    // Read and encode the image
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = Buffer.from(imageBuffer).toString('base64');
    // Determine if we should wrap in a data URL or use raw base64
    const imageData = options.rawBase64 ? base64 : `data:image/jpeg;base64,${base64}`;
    
    if (!options.quiet) {
      console.log(`Image encoded as ${options.rawBase64 ? 'raw base64' : 'data URL'} (${base64.length} characters)`);
    }
    
    // Create the enhanced request payload with all options
    const payload = {
      // Image data - required
      image: imageData,
      
      // Debug options
      debug: options.debug,
      diagnosticMode: options.diagnosticMode,
      testMode: options.testMode,
      
      // Format options
      format: options.format,
      comparison: options.comparison,
      
      // API parameters
      model: options.model,
      timeout: options.timeout
    };
    
    // Add optional request ID if specified
    if (options.requestId) {
      payload.requestId = options.requestId;
    }
    
    // Test with selected format
    if (!options.quiet) {
      console.log(`\n--- Testing experimental endpoint with ${
        options.comparison ? 'comparison of snake_case vs camelCase' : options.format
      } format ---`);
    }
    
    const endpoint = `${API_URL}/experimental/mistral-direct`;
    console.log(`POST ${endpoint}${options.testMode ? ' (TEST MODE)' : ''}`);
    
    // Make the API request with timing
    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const duration = Date.now() - startTime;
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response time: ${duration}ms`);
    
    // Get response body with error handling
    let responseJson;
    try {
      responseJson = await response.json();
    } catch (jsonError) {
      console.error('Error parsing response as JSON:', jsonError);
      console.log('Response text:', await response.text());
      return;
    }
    
    // Display different output based on response type
    if (options.testMode) {
      displayTestModeResults(responseJson, duration);
    } else if (options.comparison) {
      displayComparisonResults(responseJson, duration);
    } else {
      displayStandardResults(responseJson, duration);
    }
    
    // Save full response to file if requested
    if (options.save) {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const format = options.comparison ? 'comparison' : options.format;
      const outputFile = `debug-test/response-${format}-${timestamp}.json`;
      fs.writeFileSync(outputFile, JSON.stringify(responseJson, null, 2));
      console.log(`\nFull response saved to ${outputFile}`);
    }
    
  } catch (error) {
    console.error('Error making request:', error);
    console.error('Error details:', error.stack || 'No stack trace available');
  }
}

/**
 * Display results from test mode (no actual API call)
 */
function displayTestModeResults(responseJson, duration) {
  console.log('\n=== Test Mode Results ===');
  console.log(`Status: ${responseJson.success ? 'Valid Request' : 'Invalid Request'}`);
  console.log(`Endpoint: ${responseJson.endpoint || 'Unknown'}`);
  console.log(`Request processing time: ${responseJson.duration || duration}ms`);
  
  // Show validation results
  if (responseJson.validationResults) {
    console.log('\n=== Validation Results ===');
    
    // API Key validation
    const apiKeyValidation = responseJson.validationResults.apiKey || {};
    console.log(`API Key: ${apiKeyValidation.available ? 'Available' : 'Missing'}`);
    if (apiKeyValidation.validFormat === false) {
      console.log('  - Warning: API key format appears invalid');
    }
    if (apiKeyValidation.isPlaceholder) {
      console.log('  - Warning: API key appears to contain placeholder text');
    }
    
    // Image validation
    const imageValidation = responseJson.validationResults.image || {};
    const validImage = imageValidation.isValidBase64 || imageValidation.isValidRawBase64;
    console.log(`Image: ${validImage ? 'Valid' : 'Invalid'}`);
    
    if (!imageValidation.hasValidChars) {
      console.log('  - Warning: Image contains invalid base64 characters');
    }
    if (!imageValidation.correctPadding) {
      console.log('  - Warning: Image base64 has incorrect padding');
    }
    if (!imageValidation.isReasonableLength) {
      console.log('  - Warning: Image base64 length is suspiciously short');
    }
    
    // Payload validation
    const payloadValidation = responseJson.validationResults.payload || {};
    if (payloadValidation.snakeCase) {
      console.log(`Snake case payload: ${payloadValidation.snakeCase.fieldNamesValid ? 'Valid' : 'Invalid'}`);
    }
    if (payloadValidation.camelCase) {
      console.log(`Camel case payload: ${payloadValidation.camelCase.fieldNamesValid ? 'Valid' : 'Invalid'}`);
    }
  }
  
  // What would be sent
  if (responseJson.documentPayload && options.verbose) {
    console.log('\n=== Payload that would be sent ===');
    console.log(JSON.stringify(responseJson.documentPayload, null, 2));
  }
  
  // Show any warnings
  if (responseJson.warnings && responseJson.warnings.length > 0) {
    console.log('\n=== Warnings ===');
    responseJson.warnings.forEach((warning, i) => console.log(`Warning ${i+1}: ${warning}`));
  }
  
  // Show any errors
  if (responseJson.debug && responseJson.debug.errors && responseJson.debug.errors.length > 0) {
    console.log('\n=== Errors ===');
    responseJson.debug.errors.forEach((error, i) => console.log(`Error ${i+1}: ${error}`));
  }
}

/**
 * Display results from comparison mode (both snake_case and camelCase tested)
 */
function displayComparisonResults(responseJson, duration) {
  console.log('\n=== Comparison Results ===');
  console.log(`Overall success: ${responseJson.success ? 'Yes' : 'No'}`);
  console.log(`Processing time: ${responseJson.duration || duration}ms`);
  
  if (responseJson.results) {
    const { snakeCase, camelCase, analysis } = responseJson.results;
    
    console.log('\n=== Format Comparison ===');
    console.log(`Snake case format: ${snakeCase.success ? 'SUCCESS' : 'FAILED'} (${snakeCase.statusCode} ${snakeCase.statusText})`);
    console.log(`Camel case format: ${camelCase.success ? 'SUCCESS' : 'FAILED'} (${camelCase.statusCode} ${camelCase.statusText})`);
    
    if (analysis && analysis.recommendation) {
      console.log(`\nRecommendation: ${analysis.recommendation}`);
    }
    
    // Show response details for each format if in verbose mode
    if (options.verbose) {
      console.log('\n=== Snake Case Response ===');
      if (snakeCase.data && snakeCase.data.pages) {
        console.log(`- ${snakeCase.data.pages.length} pages extracted`);
        if (snakeCase.data.model) {
          console.log(`- Model used: ${snakeCase.data.model}`);
        }
      } else if (snakeCase.data && snakeCase.data.error) {
        console.log(`- Error: ${typeof snakeCase.data.error === 'object' ? 
                    JSON.stringify(snakeCase.data.error) : snakeCase.data.error}`);
      }
      
      console.log('\n=== Camel Case Response ===');
      if (camelCase.data && camelCase.data.pages) {
        console.log(`- ${camelCase.data.pages.length} pages extracted`);
        if (camelCase.data.model) {
          console.log(`- Model used: ${camelCase.data.model}`);
        }
      } else if (camelCase.data && camelCase.data.error) {
        console.log(`- Error: ${typeof camelCase.data.error === 'object' ? 
                    JSON.stringify(camelCase.data.error) : camelCase.data.error}`);
      }
    }
  }
  
  // Display any OCR content from successful response
  if (responseJson.results) {
    // Prefer snake_case result if available, otherwise use camelCase
    const successfulResult = 
      responseJson.results.snakeCase.success ? responseJson.results.snakeCase.data :
      responseJson.results.camelCase.success ? responseJson.results.camelCase.data : null;
    
    if (successfulResult && successfulResult.pages) {
      console.log('\n=== OCR Results ===');
      console.log(`${successfulResult.pages.length} pages extracted`);
      
      successfulResult.pages.forEach((page, i) => {
        console.log(`\nPage ${i+1}:`);
        if (page.markdown) {
          // Show a short preview of the text content
          const preview = page.markdown.length > 200 ? 
            page.markdown.substring(0, 200) + '...' : page.markdown;
          console.log(`Text: ${preview.replace(/\n/g, ' ')}`);
        } else {
          console.log('Text: (empty)');
        }
        
        if (page.dimensions) {
          console.log(`Dimensions: ${page.dimensions.width}x${page.dimensions.height}`);
        }
        
        if (page.images && page.images.length > 0) {
          console.log(`Images: ${page.images.length}`);
        }
      });
    }
  }
  
  // Show any warnings
  if (responseJson.warnings && responseJson.warnings.length > 0) {
    console.log('\n=== Warnings ===');
    responseJson.warnings.forEach((warning, i) => console.log(`Warning ${i+1}: ${warning}`));
  }
  
  // Show any errors
  if (responseJson.debug && responseJson.debug.errors && responseJson.debug.errors.length > 0) {
    console.log('\n=== Errors ===');
    responseJson.debug.errors.forEach((error, i) => console.log(`Error ${i+1}: ${error}`));
  }
}

/**
 * Display results from standard API call
 */
function displayStandardResults(responseJson, duration) {
  // Log important high-level information first
  console.log('\n=== API Call Summary ===');
  console.log(`Success: ${responseJson.success}`);
  console.log(`Status: ${responseJson.statusCode} ${responseJson.statusText}`);
  console.log(`Duration: ${responseJson.duration || duration}ms`);
  console.log(`Format used: ${responseJson.format || options.format}`);
  
  // Display any warnings
  if (responseJson.warnings && responseJson.warnings.length > 0) {
    console.log('\n=== Warnings ===');
    responseJson.warnings.forEach((warning, i) => console.log(`Warning ${i+1}: ${warning}`));
  }
  
  // If there's debug info, show the most relevant parts
  if (responseJson.debug) {
    console.log('\n=== Debug Information ===');
    
    // Environment info
    const envInfo = responseJson.debug.environment && responseJson.debug.environment.runtime || {};
    console.log('Runtime Environment:');
    console.log(`- Cloudflare Worker: ${envInfo.isCloudflareWorker ? 'Yes' : 'No'}`);
    console.log(`- Node.js: ${envInfo.isNodeJS ? 'Yes' : 'No'}`);
    console.log(`- Browser: ${envInfo.isBrowser ? 'Yes' : 'No'}`);
    
    // API key info
    const apiKeyInfo = responseJson.debug.apiKeyInfo || {};
    console.log('\nAPI Key:');
    console.log(`- Available: ${apiKeyInfo.available ? 'Yes' : 'No'}`);
    console.log(`- Length: ${apiKeyInfo.length || 'Unknown'}`);
    if (apiKeyInfo.validFormat === false) {
      console.log(`- Format valid: No`);
    }
    if (apiKeyInfo.isPlaceholder) {
      console.log(`- Warning: Contains placeholder text`);
    }
    
    // Image info
    const imageInfo = responseJson.debug.imageInfo || {};
    console.log('\nImage Details:');
    
    if (imageInfo.format) {
      console.log(`- Format: ${imageInfo.format.type || 'Unknown'}`);
      console.log(`- MIME Type: ${imageInfo.format.mimeType || 'Unknown'}`);
      console.log(`- Base64 Length: ${imageInfo.format.actualBase64Length || imageInfo.metadata?.originalLength || 'Unknown'}`);
    }
    
    if (imageInfo.validation) {
      console.log('- Validation:');
      console.log(`  - Valid chars: ${imageInfo.validation.hasValidChars ? 'Yes' : 'No'}`);
      console.log(`  - Correct padding: ${imageInfo.validation.correctPadding ? 'Yes' : 'No'}`);
      console.log(`  - Reasonable length: ${imageInfo.validation.isReasonableLength ? 'Yes' : 'No'}`);
    }
    
    if (imageInfo.conversions && imageInfo.conversions.length > 0) {
      console.log(`- Conversions applied: ${imageInfo.conversions.length}`);
      if (options.verbose) {
        imageInfo.conversions.forEach((conv, i) => {
          console.log(`  ${i+1}: ${conv.operation} (${conv.sourceFormat} -> ${conv.resultFormat})`);
        });
      }
    }
    
    // Request payload info
    const requestPayload = responseJson.debug.requestPayload || {};
    console.log('\nRequest Details:');
    console.log(`- Format: ${requestPayload.format?.selected || 'Unknown'}`);
    console.log(`- Endpoint: ${requestPayload.endpoint || 'Unknown'}`);
    console.log(`- Method: ${requestPayload.method || 'Unknown'}`);
    
    if (requestPayload.fields) {
      console.log('- Fields:');
      console.log(`  - Model: ${requestPayload.fields.model || 'Unknown'}`);
      console.log(`  - Document Type: ${requestPayload.fields.documentType || 'Unknown'}`);
      console.log(`  - Image Field: ${requestPayload.fields.imageFieldName || 'Unknown'}`);
      console.log(`  - Include Image Field: ${requestPayload.fields.includeImageFieldName || 'Unknown'}`);
    }
    
    // Request metrics
    const metrics = responseJson.debug.requestInfo?.metrics || responseJson.debug.requestResult?.metrics || {};
    if (Object.keys(metrics).length > 0) {
      console.log('\nPerformance Metrics:');
      if (metrics.fetchDuration) console.log(`- Fetch duration: ${metrics.fetchDuration}ms`);
      if (metrics.duration) console.log(`- API call duration: ${metrics.duration}ms`);
      if (metrics.totalDuration) console.log(`- Total duration: ${metrics.totalDuration}ms`);
    }
    
    // Response info
    const responseInfo = responseJson.debug.responseInfo || {};
    if (responseInfo.content) {
      console.log('\nResponse Details:');
      console.log(`- Format: ${responseInfo.content.format || 'Unknown'}`);
      if (responseInfo.content.parseTime) console.log(`- Parse time: ${responseInfo.content.parseTime}ms`);
      if (responseInfo.content.size) console.log(`- Size: ${responseInfo.content.size} bytes`);
      
      if (responseInfo.content.model) {
        console.log(`- Model: ${responseInfo.content.model}`);
      }
      
      if (responseInfo.content.hasPagesArray) {
        console.log(`- Pages: ${responseInfo.content.pageCount || 0}`);
      }
      
      if (responseInfo.content.usageInfo) {
        console.log('- Usage info:');
        const usage = responseInfo.content.usageInfo;
        Object.keys(usage).forEach(key => {
          console.log(`  - ${key}: ${usage[key]}`);
        });
      }
      
      // Show error details if present
      if (responseInfo.content.hasErrorField) {
        console.log('\nAPI Error Details:');
        console.log(`- Message: ${responseInfo.content.errorMessage || 'Unknown'}`);
        if (responseInfo.content.errorType) console.log(`- Type: ${responseInfo.content.errorType}`);
        if (responseInfo.content.errorCode) console.log(`- Code: ${responseInfo.content.errorCode}`);
        if (responseInfo.content.errorParam) console.log(`- Parameter: ${responseInfo.content.errorParam}`);
      }
    }
    
    // Show errors
    const errors = responseJson.debug.errors || [];
    if (errors.length > 0) {
      console.log('\n=== Errors ===');
      errors.forEach((error, i) => console.log(`Error ${i+1}: ${error}`));
    }
  }
  
  // Show OCR response data
  if (responseJson.data && responseJson.data.pages) {
    console.log('\n=== OCR Results ===');
    console.log(`Total pages: ${responseJson.data.pages.length}`);
    
    // Show model information if available
    if (responseJson.data.model) {
      console.log(`Model: ${responseJson.data.model}`);
    }
    
    // Show usage information if available
    if (responseJson.data.usage_info) {
      console.log('Usage info:');
      const usage = responseJson.data.usage_info;
      Object.keys(usage).forEach(key => {
        console.log(`- ${key}: ${usage[key]}`);
      });
    }
    
    // Show each page's content
    responseJson.data.pages.forEach((page, i) => {
      console.log(`\nPage ${i+1}:`);
      
      if (page.dimensions) {
        console.log(`Dimensions: ${page.dimensions.width}x${page.dimensions.height}`);
      }
      
      if (page.images) {
        console.log(`Images: ${page.images.length}`);
      }
      
      if (page.markdown) {
        console.log('Text:');
        // In verbose mode, show full text; otherwise limit to a preview
        const text = options.verbose ? 
          page.markdown : 
          (page.markdown.length > 500 ? page.markdown.substring(0, 500) + '...' : page.markdown);
        console.log(text);
      } else {
        console.log('Text: (empty)');
      }
    });
  } else if (responseJson.data) {
    // Handle error responses or non-standard responses
    if (responseJson.data.error) {
      console.log('\n=== API Error ===');
      const error = responseJson.data.error;
      if (typeof error === 'object') {
        console.log(JSON.stringify(error, null, 2));
      } else {
        console.log(error);
      }
    } else {
      console.log('\n=== Response Data ===');
      console.log(JSON.stringify(responseJson.data, null, 2));
    }
  } else {
    console.log('\n=== No Response Data ===');
  }
}

// Execute main function
testExperimentalEndpoint().catch(err => {
  console.error('Unhandled error:', err);
});