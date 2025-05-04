import 'reflect-metadata';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { workerIoE } from './io';
import { ScannerFactory } from './scanner/factory';
import { Document, DocumentType } from './ocr/types';
// Get package version (used in health check)
import pkg from '../package.json';

interface Env {
  MISTRAL_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();
app.use('*', cors());

// Serve examples directory for client testing
app.get('/examples/*', serveStatic({ root: './' }));

// All functionality is now provided through dedicated endpoints:
// - /process - Universal document processing endpoint
// - /check - Check-specific processing endpoint
// - /receipt - Receipt-specific processing endpoint
// - /health - Server status endpoint

// New unified endpoint for processing documents
app.post('/process', async (c) => {
  try {
    // Check content type
    const contentType = c.req.header('Content-Type');
    if (!contentType?.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Invalid content type. Expected image/*' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get document format (image/pdf) from query
    const documentFormat = c.req.query('format') || 'image';
    const documentType = documentFormat === 'pdf' ? DocumentType.PDF : DocumentType.Image;
    
    // Get document content type (check/receipt) from query
    const contentTypeParam = c.req.query('type') || 'receipt';
    if (!['check', 'receipt'].includes(contentTypeParam)) {
      return new Response(JSON.stringify({ error: 'Invalid document type. Supported types: check, receipt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get image data
    const imageBuffer = await c.req.arrayBuffer();

    // Verify API key is available
    if (!c.env.MISTRAL_API_KEY) {
      const errorMessage = '[/process:handler] CRITICAL ERROR: MISTRAL_API_KEY environment variable is not set';
      console.error(errorMessage);
      // For HTTP endpoints we return a response rather than throw, but with clear error location
      return new Response(JSON.stringify({ 
        error: errorMessage,
        hint: 'Please ensure MISTRAL_API_KEY is set in your environment variables'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate API key format - at minimum it should be a reasonable length
    if (c.env.MISTRAL_API_KEY.length < 20) {
      const errorMessage = `[/process:handler] CRITICAL ERROR: Invalid API key format - too short (${c.env.MISTRAL_API_KEY.length} chars)`;
      console.error(errorMessage);
      return new Response(JSON.stringify({ 
        error: errorMessage,
        hint: 'Please provide a valid Mistral API key in your environment variables'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check for obviously invalid placeholder keys
    const commonPlaceholders = ['your-api-key-here', 'api-key', 'mistral-api-key', 'placeholder'];
    if (commonPlaceholders.some(placeholder => c.env.MISTRAL_API_KEY.toLowerCase().includes(placeholder))) {
      const errorMessage = '[/process:handler] CRITICAL ERROR: Detected placeholder text in Mistral API key';
      console.error(errorMessage);
      return new Response(JSON.stringify({ 
        error: errorMessage,
        hint: 'Please replace the placeholder API key with a valid Mistral API key'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    
    // Log API key presence (not the actual key)
    console.log('API key is available (first 4 chars):', c.env.MISTRAL_API_KEY.substring(0, 4) + '...');
    
    // Create appropriate scanner based on document content type
    const scanner = ScannerFactory.createScannerByType(
      workerIoE, 
      c.env.MISTRAL_API_KEY, 
      contentTypeParam as 'check' | 'receipt'
    );

    // Create document
    const document: Document = {
      content: imageBuffer,
      type: documentType,
      name: c.req.query('filename') || 'uploaded-document'
    };

    // Process document
    const result = await scanner.processDocument(document);

    // Handle result
    if (result[0] === 'error') {
      return new Response(JSON.stringify({ error: result[1] }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return processing result
    return new Response(JSON.stringify({
      data: result[1].json,
      documentType: contentTypeParam,
      confidence: {
        ocr: result[1].ocrConfidence,
        extraction: result[1].extractionConfidence,
        overall: result[1].overallConfidence
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Dedicated endpoint for check processing
app.post('/check', async (c) => {
  try {
    // Check content type
    const contentType = c.req.header('Content-Type');
    if (!contentType?.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Invalid content type. Expected image/*' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get document format (image/pdf) from query
    const documentFormat = c.req.query('format') || 'image';
    const documentType = documentFormat === 'pdf' ? DocumentType.PDF : DocumentType.Image;
    
    // Get image data
    const imageBuffer = await c.req.arrayBuffer();

    // Verify API key is available
    if (!c.env.MISTRAL_API_KEY) {
      const errorMessage = '[/check:handler] CRITICAL ERROR: MISTRAL_API_KEY environment variable is not set';
      console.error(errorMessage);
      return new Response(JSON.stringify({ 
        error: errorMessage,
        hint: 'Please ensure MISTRAL_API_KEY is set in your environment variables'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate API key format - at minimum it should be a reasonable length
    if (c.env.MISTRAL_API_KEY.length < 20) {
      const errorMessage = `[/check:handler] CRITICAL ERROR: Invalid API key format - too short (${c.env.MISTRAL_API_KEY.length} chars)`;
      console.error(errorMessage);
      return new Response(JSON.stringify({ 
        error: errorMessage,
        hint: 'Please provide a valid Mistral API key in your environment variables'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check for obviously invalid placeholder keys
    const commonPlaceholders = ['your-api-key-here', 'api-key', 'mistral-api-key', 'placeholder'];
    if (commonPlaceholders.some(placeholder => c.env.MISTRAL_API_KEY.toLowerCase().includes(placeholder))) {
      const errorMessage = '[/check:handler] CRITICAL ERROR: Detected placeholder text in Mistral API key';
      console.error(errorMessage);
      return new Response(JSON.stringify({ 
        error: errorMessage,
        hint: 'Please replace the placeholder API key with a valid Mistral API key'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    
    // Log API key presence (not the actual key)
    console.log('/check: API key is available (first 4 chars):', c.env.MISTRAL_API_KEY.substring(0, 4) + '...');

    // Create check scanner
    const scanner = ScannerFactory.createMistralCheckScanner(workerIoE, c.env.MISTRAL_API_KEY);

    // Create document
    const document: Document = {
      content: imageBuffer,
      type: documentType,
      name: c.req.query('filename') || 'check-document'
    };

    // Process document
    const result = await scanner.processDocument(document);

    // Handle result
    if (result[0] === 'error') {
      return new Response(JSON.stringify({ error: result[1] }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return processing result
    return new Response(JSON.stringify({
      data: result[1].json,
      confidence: {
        ocr: result[1].ocrConfidence,
        extraction: result[1].extractionConfidence,
        overall: result[1].overallConfidence
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing check:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Dedicated endpoint for receipt processing
app.post('/receipt', async (c) => {
  try {
    // Check content type
    const contentType = c.req.header('Content-Type');
    if (!contentType?.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Invalid content type. Expected image/*' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get document format (image/pdf) from query
    const documentFormat = c.req.query('format') || 'image';
    const documentType = documentFormat === 'pdf' ? DocumentType.PDF : DocumentType.Image;
    
    // Get image data
    const imageBuffer = await c.req.arrayBuffer();

    // Verify API key is available
    if (!c.env.MISTRAL_API_KEY) {
      const errorMessage = '[/receipt:handler] CRITICAL ERROR: MISTRAL_API_KEY environment variable is not set';
      console.error(errorMessage);
      return new Response(JSON.stringify({ 
        error: errorMessage,
        hint: 'Please ensure MISTRAL_API_KEY is set in your environment variables'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate API key format - at minimum it should be a reasonable length
    if (c.env.MISTRAL_API_KEY.length < 20) {
      const errorMessage = `[/receipt:handler] CRITICAL ERROR: Invalid API key format - too short (${c.env.MISTRAL_API_KEY.length} chars)`;
      console.error(errorMessage);
      return new Response(JSON.stringify({ 
        error: errorMessage,
        hint: 'Please provide a valid Mistral API key in your environment variables'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check for obviously invalid placeholder keys
    const commonPlaceholders = ['your-api-key-here', 'api-key', 'mistral-api-key', 'placeholder'];
    if (commonPlaceholders.some(placeholder => c.env.MISTRAL_API_KEY.toLowerCase().includes(placeholder))) {
      const errorMessage = '[/receipt:handler] CRITICAL ERROR: Detected placeholder text in Mistral API key';
      console.error(errorMessage);
      return new Response(JSON.stringify({ 
        error: errorMessage,
        hint: 'Please replace the placeholder API key with a valid Mistral API key'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    
    // Log API key presence (not the actual key)
    console.log('/receipt: API key is available (first 4 chars):', c.env.MISTRAL_API_KEY.substring(0, 4) + '...');

    // Create receipt scanner
    const scanner = ScannerFactory.createMistralReceiptScanner(workerIoE, c.env.MISTRAL_API_KEY);

    // Create document
    const document: Document = {
      content: imageBuffer,
      type: documentType,
      name: c.req.query('filename') || 'receipt-document'
    };

    // Process document
    const result = await scanner.processDocument(document);

    // Handle result
    if (result[0] === 'error') {
      return new Response(JSON.stringify({ error: result[1] }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return processing result
    return new Response(JSON.stringify({
      data: result[1].json,
      confidence: {
        ocr: result[1].ocrConfidence,
        extraction: result[1].extractionConfidence,
        overall: result[1].overallConfidence
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing receipt:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Health check endpoint for testing server availability
app.get('/health', () => {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: pkg.version
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Experimental endpoint for direct Mistral API testing with enhanced debugging
app.post('/experimental/mistral-direct', async (c) => {
  const debugInfo = {
    requestInfo: {},
    apiKeyInfo: {},
    imageInfo: {},
    requestPayload: {},
    requestResult: {},
    responseInfo: {},
    errors: []
  };
  
  try {
    // Start timing the request
    const startTime = Date.now();
    debugInfo.requestInfo.startTime = new Date().toISOString();
    
    // Get request body JSON
    const body = await c.req.json();
    debugInfo.requestInfo.receivedRequestBody = !!body;
    debugInfo.requestInfo.bodyKeys = Object.keys(body);
    
    // Extract debugging options
    const debug = body.debug === true;
    const testMode = body.testMode === true;
    debugInfo.requestInfo.debugMode = debug;
    debugInfo.requestInfo.testMode = testMode;
    
    // Verify API key is available
    if (!c.env.MISTRAL_API_KEY) {
      debugInfo.apiKeyInfo.available = false;
      debugInfo.errors.push('MISTRAL_API_KEY environment variable is not set');
      
      return new Response(JSON.stringify({ 
        error: 'MISTRAL_API_KEY environment variable is not set',
        debug: debugInfo
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // API key info (safely)
    debugInfo.apiKeyInfo.available = true;
    debugInfo.apiKeyInfo.length = c.env.MISTRAL_API_KEY.length;
    debugInfo.apiKeyInfo.prefix = c.env.MISTRAL_API_KEY.substring(0, 4) + '...';
    
    // Extract base64 image from request
    let base64Image = body.image;
    if (!base64Image) {
      debugInfo.errors.push('Image data is required in request body');
      
      return new Response(JSON.stringify({ 
        error: 'Image data is required in request body',
        debug: debugInfo
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Log image format info
    console.log('Experimental endpoint - received image data:');
    debugInfo.imageInfo.originalLength = base64Image.length;
    debugInfo.imageInfo.isDataUrl = base64Image.startsWith('data:');
    debugInfo.imageInfo.hasMimeType = base64Image.includes('image/');
    debugInfo.imageInfo.hasBase64Marker = base64Image.includes(';base64,');
    
    if (debugInfo.imageInfo.isDataUrl) {
      // Parse data URL components
      const mimeMatch = base64Image.match(/^data:([^;]+);/);
      const base64Start = base64Image.indexOf(',') + 1;
      
      debugInfo.imageInfo.mimeType = mimeMatch ? mimeMatch[1] : 'unknown';
      debugInfo.imageInfo.dataPrefix = base64Image.substring(0, base64Start);
      debugInfo.imageInfo.actualBase64Length = base64Image.length - base64Start;
      
      // Validate base64 content
      const base64Content = base64Image.substring(base64Start);
      const validBase64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      debugInfo.imageInfo.isValidBase64 = validBase64Regex.test(base64Content);
    }
    
    // Clean base64 if not in data URL format
    if (!base64Image.startsWith('data:')) {
      // Check if it's already valid base64
      const validBase64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      debugInfo.imageInfo.isValidRawBase64 = validBase64Regex.test(base64Image);
      
      // Store original format for debugging
      debugInfo.imageInfo.originalFormat = 'raw base64';
      debugInfo.imageInfo.added = 'data:image/jpeg;base64, prefix';
      
      // Add data URL prefix
      base64Image = `data:image/jpeg;base64,${base64Image}`;
      debugInfo.imageInfo.newLength = base64Image.length;
      console.log('- Added data:image/jpeg;base64, prefix');
    } else {
      debugInfo.imageInfo.originalFormat = 'data URL';
      debugInfo.imageInfo.preserved = 'already had data URL prefix';
    }
    
    // Create headers for Mistral API request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${c.env.MISTRAL_API_KEY}`
    };
    debugInfo.requestInfo.headers = {
      contentType: headers['Content-Type'],
      authHeaderLength: headers['Authorization'].length
    };
    
    // Prepare document for Mistral API
    // Try both snake_case and camelCase to compare
    let documentPayload;
    
    if (body.format === 'camelCase' || body.useSnakeCase === false) {
      // Use camelCase format
      documentPayload = {
        model: "mistral-ocr-latest",
        document: {
          type: 'image_url',
          imageUrl: base64Image
        },
        includeImageBase64: true
      };
      debugInfo.requestPayload.format = 'camelCase';
    } else {
      // Use snake_case format (default)
      documentPayload = {
        model: "mistral-ocr-latest",
        document: {
          type: 'image_url',
          image_url: base64Image
        },
        include_image_base64: true
      };
      debugInfo.requestPayload.format = 'snake_case';
    }
    
    // Add optional fields from request body
    if (body.model) {
      documentPayload.model = body.model;
      debugInfo.requestPayload.customModel = body.model;
    }
    
    // Set endpoint based on the SDK version
    const endpoint = 'https://api.mistral.ai/v1/ocr';
    debugInfo.requestPayload.endpoint = endpoint;
    debugInfo.requestPayload.method = 'POST';
    
    // Optional test mode - don't actually make the API call
    if (testMode) {
      console.log('- Test mode: Not sending actual API request');
      debugInfo.requestInfo.testMode = true;
      
      // Return the detailed debug info
      return new Response(JSON.stringify({
        success: true,
        testMode: true,
        message: 'Test mode: API request not sent',
        documentPayload, // Include what would have been sent
        debug: debugInfo
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('- Sending request to Mistral OCR API');
    debugInfo.requestInfo.sentAt = new Date().toISOString();
    
    // For debugging, stringify the document payload to see exactly what's sent
    const payloadJson = JSON.stringify(documentPayload);
    debugInfo.requestPayload.sentJson = payloadJson.substring(0, 500) + 
      (payloadJson.length > 500 ? '...(truncated)' : '');
    
    // Make direct request to Mistral API
    const mistralResponse = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: payloadJson
    });
    
    // Calculate request duration
    const requestDuration = Date.now() - startTime;
    debugInfo.requestResult.duration = requestDuration;
    debugInfo.requestResult.receivedAt = new Date().toISOString();
    
    // Get response details for debugging
    const statusCode = mistralResponse.status;
    const statusText = mistralResponse.statusText;
    const responseHeaders = Object.fromEntries(mistralResponse.headers.entries());
    
    debugInfo.responseInfo.statusCode = statusCode;
    debugInfo.responseInfo.statusText = statusText;
    debugInfo.responseInfo.headers = responseHeaders;
    debugInfo.responseInfo.ok = mistralResponse.ok;
    
    console.log(`- Mistral API response: ${statusCode} ${statusText}`);
    
    // Get response body
    let responseData;
    try {
      responseData = await mistralResponse.json();
      debugInfo.responseInfo.format = 'json';
      
      // Check for specific success indicators in the response
      if (responseData.pages) {
        debugInfo.responseInfo.hasPagesArray = true;
        debugInfo.responseInfo.pageCount = responseData.pages.length;
      }
      
      if (responseData.model) {
        debugInfo.responseInfo.model = responseData.model;
      }
      
      if (responseData.usage_info) {
        debugInfo.responseInfo.usageInfo = responseData.usage_info;
      }
    } catch (jsonError) {
      // If not JSON, get text instead
      const responseText = await mistralResponse.text();
      debugInfo.responseInfo.format = 'text';
      debugInfo.responseInfo.textLength = responseText.length;
      debugInfo.errors.push('Response is not valid JSON: ' + String(jsonError));
      
      console.log('- Response is not valid JSON:', responseText.substring(0, 200));
      responseData = { rawText: responseText };
    }
    
    // Return detailed response with all debugging info
    return new Response(JSON.stringify({
      success: mistralResponse.ok,
      statusCode,
      statusText,
      duration: requestDuration,
      responseHeaders,
      data: responseData,
      debug: debugInfo
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorMsg = String(error);
    console.error('Error in experimental endpoint:', errorMsg);
    debugInfo.errors.push(errorMsg);
    
    if (error instanceof Error) {
      debugInfo.errors.push('Stack trace: ' + error.stack);
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error in experimental endpoint',
      message: errorMsg,
      debug: debugInfo
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export default app; 