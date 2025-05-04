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
  // Enhanced debugging structure with more detailed categories
  const debugInfo = {
    requestInfo: {
      timestamps: {},
      metrics: {},
      headers: {},
      body: {}
    },
    apiKeyInfo: {},
    environment: {
      runtime: {},
      compatibility: {}
    },
    imageInfo: {
      metadata: {},
      format: {},
      validation: {},
      conversions: []
    },
    requestPayload: {
      format: {},
      fields: {},
      validation: {}
    },
    requestResult: {
      metrics: {},
      network: {}
    },
    responseInfo: {
      metadata: {},
      content: {},
      validation: {}
    },
    errors: [],
    warnings: []
  };
  
  try {
    // Start timing the request with high-resolution timer
    const startTime = Date.now();
    const startTimeHR = performance.now();
    debugInfo.requestInfo.timestamps.start = new Date().toISOString();
    debugInfo.requestInfo.timestamps.startTimestamp = startTime;
    
    // Get request body JSON with error handling
    let body;
    try {
      body = await c.req.json();
      debugInfo.requestInfo.body.received = true;
      debugInfo.requestInfo.body.keys = Object.keys(body);
      debugInfo.requestInfo.body.size = JSON.stringify(body).length;
    } catch (jsonError) {
      debugInfo.errors.push(`Failed to parse request body as JSON: ${String(jsonError)}`);
      debugInfo.requestInfo.body.received = false;
      debugInfo.requestInfo.body.parseError = String(jsonError);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to parse request body as JSON',
        message: String(jsonError),
        debug: debugInfo
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Extract debugging options
    const debug = body.debug === true;
    const testMode = body.testMode === true;
    const diagnosticMode = body.diagnosticMode === true; // Extra detailed diagnostics
    debugInfo.requestInfo.body.debugMode = debug;
    debugInfo.requestInfo.body.testMode = testMode;
    debugInfo.requestInfo.body.diagnosticMode = diagnosticMode;
    
    // Detect and log environment information
    debugInfo.environment.runtime.isCloudflareWorker = typeof caches !== 'undefined' && typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';
    debugInfo.environment.runtime.isNodeJS = typeof process !== 'undefined' && process.versions && process.versions.node;
    debugInfo.environment.runtime.isBrowser = typeof window !== 'undefined';
    debugInfo.environment.runtime.hasBuffer = typeof Buffer !== 'undefined';
    debugInfo.environment.runtime.hasPerformanceNow = typeof performance !== 'undefined' && typeof performance.now === 'function';
    
    // Collect request headers for diagnostics (if in diagnostic mode)
    if (diagnosticMode) {
      const requestHeaders = Object.fromEntries(
        [...c.req.headers.entries()].map(([key, value]) => 
          [key, key.toLowerCase().includes('auth') ? 
           (value.length > 4 ? value.substring(0, 4) + '...' : '[REDACTED]') : 
           value]
        )
      );
      debugInfo.requestInfo.headers.all = requestHeaders;
    } else {
      // Just extract content-type even in normal mode
      debugInfo.requestInfo.headers.contentType = c.req.header('Content-Type');
    }
    
    // Verify API key is available with enhanced diagnostics
    if (!c.env.MISTRAL_API_KEY) {
      debugInfo.apiKeyInfo.available = false;
      debugInfo.apiKeyInfo.source = 'environment';
      debugInfo.errors.push('MISTRAL_API_KEY environment variable is not set');
      
      // Check for runtime environment issues that might affect API key access
      if (debugInfo.environment.runtime.isCloudflareWorker) {
        debugInfo.errors.push('CloudflareWorker detected: Ensure API key is properly set in wrangler.toml or environment variables');
        debugInfo.environment.compatibility.missingApiKeyHint = 'For Cloudflare Workers, add MISTRAL_API_KEY to wrangler.toml or use wrangler secret put MISTRAL_API_KEY';
      }
      
      return new Response(JSON.stringify({ 
        error: 'MISTRAL_API_KEY environment variable is not set',
        hint: 'Please check your environment configuration for the Mistral API key',
        debug: debugInfo
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Enhanced API key validation
    const apiKey = c.env.MISTRAL_API_KEY;
    debugInfo.apiKeyInfo.available = true;
    debugInfo.apiKeyInfo.length = apiKey.length;
    debugInfo.apiKeyInfo.prefix = apiKey.substring(0, 4) + '...';
    
    // Extended API key format validation
    debugInfo.apiKeyInfo.validFormat = apiKey.length >= 20; // Basic length check
    
    // Check for obviously invalid/placeholder keys
    const commonPlaceholders = ['your-api-key-here', 'api-key', 'mistral-api-key', 'placeholder'];
    const containsPlaceholder = commonPlaceholders.some(placeholder => 
      apiKey.toLowerCase().includes(placeholder)
    );
    
    if (containsPlaceholder) {
      debugInfo.apiKeyInfo.isPlaceholder = true;
      debugInfo.warnings.push('API key appears to contain placeholder text');
    }
    
    // Pattern matching for common API key formats (without revealing the key)
    const hasCommonPrefix = apiKey.startsWith('msk_') || apiKey.startsWith('sk-');
    debugInfo.apiKeyInfo.hasRecognizedPrefix = hasCommonPrefix;
    
    if (!debugInfo.apiKeyInfo.validFormat) {
      debugInfo.errors.push(`Invalid API key format - too short (${apiKey.length} chars)`);
      debugInfo.apiKeyInfo.validationErrors = [`API key is too short (${apiKey.length} chars)`];
      
      return new Response(JSON.stringify({ 
        error: 'Invalid Mistral API key format',
        hint: 'API key is too short or improperly formatted',
        debug: debugInfo
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Extract base64 image from request with enhanced validation
    let base64Image = body.image;
    if (!base64Image) {
      debugInfo.errors.push('Image data is required in request body');
      debugInfo.imageInfo.validation.received = false;
      
      return new Response(JSON.stringify({ 
        error: 'Image data is required in request body',
        hint: 'Please provide an image in base64 format or as a data URL',
        debug: debugInfo
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Detailed image validation and format detection
    console.log('Experimental endpoint - received image data:');
    debugInfo.imageInfo.metadata.originalLength = base64Image.length;
    debugInfo.imageInfo.format.isDataUrl = base64Image.startsWith('data:');
    debugInfo.imageInfo.format.hasMimeType = base64Image.includes('image/');
    debugInfo.imageInfo.format.hasBase64Marker = base64Image.includes(';base64,');
    
    // Store original format sample (safely truncated)
    const sampleLength = Math.min(100, base64Image.length);
    debugInfo.imageInfo.format.originalSample = 
      base64Image.substring(0, sampleLength) + 
      (base64Image.length > sampleLength ? '... (truncated)' : '');
    
    // Enhanced data URL parsing and validation
    if (debugInfo.imageInfo.format.isDataUrl) {
      debugInfo.imageInfo.format.type = 'data URL';
      
      // Parse data URL components with more robust pattern matching
      const mimeMatch = base64Image.match(/^data:([^;]+);/);
      const base64Start = base64Image.indexOf(',') + 1;
      
      if (base64Start > 0) {
        debugInfo.imageInfo.format.mimeType = mimeMatch ? mimeMatch[1] : 'unknown';
        debugInfo.imageInfo.format.dataPrefix = base64Image.substring(0, base64Start);
        debugInfo.imageInfo.format.actualBase64Length = base64Image.length - base64Start;
        
        // Extract and validate base64 content
        const base64Content = base64Image.substring(base64Start);
        
        // More comprehensive base64 validation
        const basicValidBase64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        const hasValidChars = basicValidBase64Regex.test(base64Content);
        debugInfo.imageInfo.validation.hasValidChars = hasValidChars;
        
        // Check for correct padding
        const correctPadding = base64Content.length % 4 === 0;
        debugInfo.imageInfo.validation.correctPadding = correctPadding;
        
        // Check for proper length
        const isReasonableLength = base64Content.length > 100; // Sanity check
        debugInfo.imageInfo.validation.isReasonableLength = isReasonableLength;
        
        // Overall validation result
        debugInfo.imageInfo.validation.isValidBase64 = hasValidChars && correctPadding && isReasonableLength;
        
        // Record validation issues for troubleshooting
        if (!hasValidChars) {
          debugInfo.warnings.push('Base64 content contains invalid characters');
        }
        if (!correctPadding) {
          debugInfo.warnings.push('Base64 content has incorrect padding');
        }
        if (!isReasonableLength) {
          debugInfo.warnings.push('Base64 content is suspiciously short');
        }
      } else {
        // Malformed data URL
        debugInfo.imageInfo.validation.isValidDataUrl = false;
        debugInfo.errors.push('Malformed data URL: missing comma separator');
      }
    } else {
      // Handle raw base64 content
      debugInfo.imageInfo.format.type = 'raw base64';
      
      // Validate raw base64 content
      const validBase64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      const isValidRawBase64 = validBase64Regex.test(base64Image);
      debugInfo.imageInfo.validation.isValidRawBase64 = isValidRawBase64;
      
      if (!isValidRawBase64) {
        debugInfo.warnings.push('Raw base64 content contains invalid characters');
        
        // Additional format detection
        if (base64Image.includes('data:image')) {
          debugInfo.warnings.push('Base64 content appears to contain a partial data URL');
        }
      }
      
      // Check for correct padding
      const correctPadding = base64Image.length % 4 === 0;
      debugInfo.imageInfo.validation.rawBase64CorrectPadding = correctPadding;
      
      if (!correctPadding) {
        debugInfo.warnings.push('Raw base64 content has incorrect padding');
      }
      
      // Record the conversion for debugging
      const conversion = {
        operation: 'add_data_url_prefix',
        sourceFormat: 'raw base64',
        sourceLength: base64Image.length,
        added: 'data:image/jpeg;base64, prefix',
        timestamp: new Date().toISOString()
      };
      
      // Add data URL prefix
      base64Image = `data:image/jpeg;base64,${base64Image}`;
      
      // Complete the conversion record
      conversion.resultFormat = 'data URL';
      conversion.resultLength = base64Image.length;
      debugInfo.imageInfo.conversions.push(conversion);
      
      console.log('- Added data:image/jpeg;base64, prefix');
    }
    
    // Create headers for Mistral API request with enhanced security
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    // Add optional request ID for tracing if provided
    if (body.requestId) {
      headers['X-Request-ID'] = body.requestId;
      debugInfo.requestInfo.body.requestId = body.requestId;
    }
    
    // Record header info safely
    debugInfo.requestPayload.headers = {
      contentType: headers['Content-Type'],
      authHeaderPresent: !!headers['Authorization'],
      authHeaderPrefix: headers['Authorization'].substring(0, 7),
      authHeaderLength: headers['Authorization'].length,
      requestIdPresent: !!headers['X-Request-ID']
    };
    
    // Enhanced request payload construction with detailed validation
    // Support side-by-side comparison mode
    const comparison = body.comparison === true;
    debugInfo.requestPayload.format.comparison = comparison;
    
    // Prepare document payloads - either one or both formats
    let snakeCasePayload, camelCasePayload, documentPayload;
    
    // Always prepare snake_case payload (Mistral's native format)
    snakeCasePayload = {
      model: body.model || "mistral-ocr-latest",
      document: {
        type: 'image_url',
        image_url: base64Image
      },
      include_image_base64: true
    };
    
    // Prepare camelCase payload for comparison
    camelCasePayload = {
      model: body.model || "mistral-ocr-latest",
      document: {
        type: 'image_url',
        imageUrl: base64Image
      },
      includeImageBase64: true
    };
    
    // Add comprehensive validation for both formats
    debugInfo.requestPayload.validation.snakeCase = {
      hasModel: !!snakeCasePayload.model,
      modelValue: snakeCasePayload.model,
      documentFormatValid: snakeCasePayload.document.type === 'image_url',
      fieldNamesValid: 'image_url' in snakeCasePayload.document && 'include_image_base64' in snakeCasePayload
    };
    
    debugInfo.requestPayload.validation.camelCase = {
      hasModel: !!camelCasePayload.model,
      modelValue: camelCasePayload.model,
      documentFormatValid: camelCasePayload.document.type === 'image_url',
      fieldNamesValid: 'imageUrl' in camelCasePayload.document && 'includeImageBase64' in camelCasePayload
    };
    
    // Determine which format to use based on request parameters
    if (body.format === 'camelCase' || body.useSnakeCase === false) {
      documentPayload = camelCasePayload;
      debugInfo.requestPayload.format.selected = 'camelCase';
    } else {
      documentPayload = snakeCasePayload;
      debugInfo.requestPayload.format.selected = 'snake_case';
    }
    
    // Record all the fields in the payload
    debugInfo.requestPayload.fields = {
      model: documentPayload.model,
      documentType: documentPayload.document.type,
      imageFieldName: 'image_url' in documentPayload.document ? 'image_url' : 'imageUrl',
      includeImageFieldName: 'include_image_base64' in documentPayload ? 'include_image_base64' : 'includeImageBase64'
    };
    
    // Add optional fields from request body with validation
    if (body.temperature !== undefined) {
      if (typeof body.temperature === 'number' && body.temperature >= 0 && body.temperature <= 1) {
        documentPayload.temperature = body.temperature;
        debugInfo.requestPayload.fields.temperature = body.temperature;
      } else {
        debugInfo.warnings.push('Invalid temperature value, must be a number between 0 and 1');
      }
    }
    
    if (body.max_tokens !== undefined) {
      if (typeof body.max_tokens === 'number' && body.max_tokens > 0) {
        documentPayload.max_tokens = body.max_tokens;
        debugInfo.requestPayload.fields.max_tokens = body.max_tokens;
      } else {
        debugInfo.warnings.push('Invalid max_tokens value, must be a positive number');
      }
    }
    
    // Set endpoint with more information
    const endpoint = 'https://api.mistral.ai/v1/ocr';
    debugInfo.requestPayload.endpoint = endpoint;
    debugInfo.requestPayload.method = 'POST';
    debugInfo.requestPayload.sdkVersion = 'direct API call (no SDK)';
    
    // Enhanced test mode with payload validation
    if (testMode) {
      console.log('- Test mode: Not sending actual API request');
      debugInfo.requestInfo.body.testMode = true;
      
      // Add test mode validation results
      debugInfo.requestPayload.validation.testModeValidation = {
        endpointReachable: true, // Assumed
        payloadValid: true,      // Assumed
        apiKeyValid: null,       // Unknown without actual API call
        imageFormatValid: debugInfo.imageInfo.validation.isValidBase64 || debugInfo.imageInfo.validation.isValidRawBase64
      };
      
      // Calculate processing time even in test mode
      const testModeDuration = Date.now() - startTime;
      const testModeDurationHR = performance.now() - startTimeHR;
      debugInfo.requestInfo.metrics.testModeDuration = testModeDuration;
      debugInfo.requestInfo.metrics.testModeDurationHR = testModeDurationHR.toFixed(2);
      
      // Return detailed test mode response
      const testResponse = {
        success: true,
        testMode: true,
        message: 'Test mode: API request not sent',
        endpoint: endpoint,
        requestTime: new Date().toISOString(),
        duration: testModeDuration,
        documentPayload: diagnosticMode ? documentPayload : undefined,
        snakeCasePayload: comparison ? snakeCasePayload : undefined,
        camelCasePayload: comparison ? camelCasePayload : undefined,
        validationResults: {
          apiKey: debugInfo.apiKeyInfo,
          image: debugInfo.imageInfo.validation,
          payload: debugInfo.requestPayload.validation
        },
        debug: debugInfo
      };
      
      // If we're in comparison mode, add both formats for comparison
      if (comparison) {
        testResponse.comparisonMode = true;
        testResponse.formats = {
          snakeCase: snakeCasePayload,
          camelCase: camelCasePayload
        };
      }
      
      return new Response(JSON.stringify(testResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Enhanced comparison mode: try both formats and return results
    if (comparison) {
      console.log('- Comparison mode: Sending requests with both snake_case and camelCase formats');
      debugInfo.requestPayload.format.comparison = true;
      
      // Record request start time
      const requestStartTime = Date.now();
      debugInfo.requestInfo.timestamps.apiRequestStart = new Date().toISOString();
      
      // Step 1: Try with snake_case format (Official Mistral format)
      console.log('- Sending snake_case format request to Mistral OCR API');
      const snakeCasePayloadJson = JSON.stringify(snakeCasePayload);
      
      // For debugging, store a truncated version of the payload
      debugInfo.requestPayload.snakeCaseSentJson = snakeCasePayloadJson.substring(0, 500) + 
        (snakeCasePayloadJson.length > 500 ? '...(truncated)' : '');
      
      // Make request with snake_case format
      const snakeCaseResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: snakeCasePayloadJson
      });
      
      // Get response details
      const snakeCaseStatus = snakeCaseResponse.status;
      const snakeCaseStatusText = snakeCaseResponse.statusText;
      const snakeCaseHeaders = Object.fromEntries(snakeCaseResponse.headers.entries());
      
      let snakeCaseData;
      try {
        snakeCaseData = await snakeCaseResponse.json();
      } catch (jsonError) {
        const responseText = await snakeCaseResponse.text();
        snakeCaseData = { rawText: responseText, parseError: String(jsonError) };
      }
      
      // Step 2: Try with camelCase format
      console.log('- Sending camelCase format request to Mistral OCR API');
      const camelCasePayloadJson = JSON.stringify(camelCasePayload);
      
      // For debugging, store a truncated version of the payload
      debugInfo.requestPayload.camelCaseSentJson = camelCasePayloadJson.substring(0, 500) + 
        (camelCasePayloadJson.length > 500 ? '...(truncated)' : '');
      
      // Make request with camelCase format
      const camelCaseResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: camelCasePayloadJson
      });
      
      // Get response details
      const camelCaseStatus = camelCaseResponse.status;
      const camelCaseStatusText = camelCaseResponse.statusText;
      const camelCaseHeaders = Object.fromEntries(camelCaseResponse.headers.entries());
      
      let camelCaseData;
      try {
        camelCaseData = await camelCaseResponse.json();
      } catch (jsonError) {
        const responseText = await camelCaseResponse.text();
        camelCaseData = { rawText: responseText, parseError: String(jsonError) };
      }
      
      // Calculate total request duration
      const comparisonDuration = Date.now() - requestStartTime;
      debugInfo.requestResult.metrics.comparisonDuration = comparisonDuration;
      debugInfo.requestInfo.timestamps.apiRequestEnd = new Date().toISOString();
      
      // Prepare the comparison results
      const comparisonResults = {
        snakeCase: {
          success: snakeCaseResponse.ok,
          statusCode: snakeCaseStatus,
          statusText: snakeCaseStatusText,
          headers: snakeCaseHeaders,
          data: snakeCaseData
        },
        camelCase: {
          success: camelCaseResponse.ok,
          statusCode: camelCaseStatus,
          statusText: camelCaseStatusText,
          headers: camelCaseHeaders,
          data: camelCaseData
        },
        analysis: {
          snakeCaseWorked: snakeCaseResponse.ok,
          camelCaseWorked: camelCaseResponse.ok,
          recommendation: snakeCaseResponse.ok && !camelCaseResponse.ok ? 
            'Use snake_case format only' : 
            (camelCaseResponse.ok && !snakeCaseResponse.ok ? 
              'Use camelCase format only (unusual)' : 
              (snakeCaseResponse.ok && camelCaseResponse.ok ? 
                'Both formats work - prefer snake_case as documented' : 
                'Neither format worked - check API key and image format'))
        }
      };
      
      // Calculate overall processing time
      const totalDuration = Date.now() - startTime;
      const totalDurationHR = performance.now() - startTimeHR;
      debugInfo.requestInfo.metrics.totalDuration = totalDuration;
      debugInfo.requestInfo.metrics.totalDurationHR = totalDurationHR.toFixed(2);
      
      // Return the comparison results
      return new Response(JSON.stringify({
        success: snakeCaseResponse.ok || camelCaseResponse.ok,
        comparisonMode: true,
        message: 'Comparison of snake_case vs camelCase formats',
        duration: comparisonDuration,
        totalDuration: totalDuration,
        results: comparisonResults,
        debug: debugInfo
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Standard mode: single request with selected format
    console.log('- Sending request to Mistral OCR API');
    debugInfo.requestInfo.timestamps.apiRequestStart = new Date().toISOString();
    
    // For debugging, stringify the document payload to see exactly what's sent
    const payloadJson = JSON.stringify(documentPayload);
    debugInfo.requestPayload.sentJson = payloadJson.substring(0, 500) + 
      (payloadJson.length > 500 ? '...(truncated)' : '');
    
    // Enhanced fetch with timeout control and network metrics
    const fetchStartTime = performance.now();
    let fetchTimedOut = false;
    
    // Create AbortController for timeout handling if specified
    const DEFAULT_TIMEOUT = 30000; // 30 seconds default timeout
    const timeout = body.timeout || DEFAULT_TIMEOUT;
    debugInfo.requestInfo.metrics.timeout = timeout;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      fetchTimedOut = true;
      debugInfo.errors.push(`Request timed out after ${timeout}ms`);
      debugInfo.requestResult.network.timedOut = true;
    }, timeout);
    
    // Make direct request to Mistral API with timeout handling
    let mistralResponse;
    try {
      mistralResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: payloadJson,
        signal: controller.signal
      });
      
      // Clear timeout since request completed
      clearTimeout(timeoutId);
      
      // Record fetch completion time
      const fetchDuration = performance.now() - fetchStartTime;
      debugInfo.requestResult.metrics.fetchDuration = fetchDuration.toFixed(2);
      debugInfo.requestResult.network.timedOut = false;
      
    } catch (fetchError) {
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Handle fetch error
      const errorMsg = String(fetchError);
      console.error('Fetch error:', errorMsg);
      debugInfo.errors.push(`Fetch error: ${errorMsg}`);
      debugInfo.requestResult.network.error = errorMsg;
      debugInfo.requestResult.network.aborted = fetchTimedOut;
      
      // Specific error handling for common network issues
      if (errorMsg.includes('abort') || fetchTimedOut) {
        debugInfo.requestResult.network.errorType = 'timeout';
        debugInfo.requestResult.network.errorReason = `Request timed out after ${timeout}ms`;
      } else if (errorMsg.includes('network')) {
        debugInfo.requestResult.network.errorType = 'connectivity';
        debugInfo.requestResult.network.errorReason = 'Network connectivity issues';
      } else {
        debugInfo.requestResult.network.errorType = 'other';
        debugInfo.requestResult.network.errorReason = 'Unknown fetch error';
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: fetchTimedOut ? 'Request timed out' : 'Network error',
        message: errorMsg,
        debug: debugInfo
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Calculate request duration with high resolution timer
    const requestDuration = Date.now() - startTime;
    const requestDurationHR = performance.now() - startTimeHR;
    debugInfo.requestResult.metrics.duration = requestDuration;
    debugInfo.requestResult.metrics.durationHR = requestDurationHR.toFixed(2);
    debugInfo.requestInfo.timestamps.apiRequestEnd = new Date().toISOString();
    
    // Enhanced response analysis
    const statusCode = mistralResponse.status;
    const statusText = mistralResponse.statusText;
    const responseHeaders = Object.fromEntries(mistralResponse.headers.entries());
    
    // Extract and analyze important headers
    const contentType = responseHeaders['content-type'] || '';
    const contentLength = responseHeaders['content-length'] ? parseInt(responseHeaders['content-length']) : null;
    
    debugInfo.responseInfo.metadata.statusCode = statusCode;
    debugInfo.responseInfo.metadata.statusText = statusText;
    debugInfo.responseInfo.metadata.headers = responseHeaders;
    debugInfo.responseInfo.metadata.ok = mistralResponse.ok;
    debugInfo.responseInfo.metadata.contentType = contentType;
    debugInfo.responseInfo.metadata.contentLength = contentLength;
    
    console.log(`- Mistral API response: ${statusCode} ${statusText}`);
    
    // Start parsing the response - enhanced error handling
    let responseData;
    const responseStartTime = performance.now();
    
    if (contentType.includes('application/json')) {
      // Try to parse JSON with enhanced error reporting
      try {
        responseData = await mistralResponse.json();
        const parseTime = performance.now() - responseStartTime;
        debugInfo.responseInfo.content.format = 'json';
        debugInfo.responseInfo.content.parseTime = parseTime.toFixed(2);
        debugInfo.responseInfo.content.size = JSON.stringify(responseData).length;
        debugInfo.responseInfo.content.keys = Object.keys(responseData);
        
        // Analyze the response content
        if (responseData.pages) {
          debugInfo.responseInfo.content.hasPagesArray = true;
          debugInfo.responseInfo.content.pageCount = responseData.pages.length;
          
          // Extended page details
          const pageDetails = responseData.pages.map((page, idx) => ({
            index: idx,
            hasMarkdown: !!page.markdown,
            markdownLength: page.markdown ? page.markdown.length : 0,
            dimensions: page.dimensions || null,
            imageCount: page.images ? page.images.length : 0
          }));
          
          debugInfo.responseInfo.content.pageDetails = pageDetails;
        }
        
        if (responseData.model) {
          debugInfo.responseInfo.content.model = responseData.model;
        }
        
        if (responseData.usage_info) {
          debugInfo.responseInfo.content.usageInfo = responseData.usage_info;
        }
        
        // Check for errors field in API response
        if (responseData.error) {
          debugInfo.responseInfo.content.hasErrorField = true;
          debugInfo.responseInfo.content.errorMessage = responseData.error;
          debugInfo.errors.push(`API error: ${responseData.error}`);
          
          // Add analysis of error
          if (typeof responseData.error === 'object') {
            if (responseData.error.type) {
              debugInfo.responseInfo.content.errorType = responseData.error.type;
            }
            if (responseData.error.code) {
              debugInfo.responseInfo.content.errorCode = responseData.error.code;
            }
            if (responseData.error.param) {
              debugInfo.responseInfo.content.errorParam = responseData.error.param;
            }
          }
        }
      } catch (jsonError) {
        // If not JSON despite content-type header, get text instead
        const responseText = await mistralResponse.text();
        const parseTime = performance.now() - responseStartTime;
        debugInfo.responseInfo.content.format = 'invalid-json';
        debugInfo.responseInfo.content.parseTime = parseTime.toFixed(2);
        debugInfo.responseInfo.content.textLength = responseText.length;
        debugInfo.responseInfo.content.jsonError = String(jsonError);
        debugInfo.errors.push('Response is not valid JSON despite Content-Type header: ' + String(jsonError));
        
        // Try to analyze the failed JSON - look for common issues
        const textSample = responseText.substring(0, 200);
        debugInfo.responseInfo.content.textSample = textSample;
        
        // Look for HTML response which might indicate a proxy/firewall issue
        if (textSample.includes('<html') || textSample.includes('<!DOCTYPE')) {
          debugInfo.responseInfo.content.appearsToBeHTML = true;
          debugInfo.warnings.push('Response appears to be HTML instead of JSON, which may indicate a proxy or firewall issue');
        }
        
        console.log('- Response is not valid JSON:', textSample);
        responseData = { rawText: responseText };
      }
    } else {
      // Not JSON according to content-type
      try {
        const responseText = await mistralResponse.text();
        const parseTime = performance.now() - responseStartTime;
        debugInfo.responseInfo.content.format = 'text';
        debugInfo.responseInfo.content.parseTime = parseTime.toFixed(2);
        debugInfo.responseInfo.content.textLength = responseText.length;
        
        console.log('- Non-JSON response received:', responseText.substring(0, 200));
        
        // Try to parse as JSON anyway (sometimes content-type is wrong)
        try {
          responseData = JSON.parse(responseText);
          debugInfo.responseInfo.content.format = 'json-with-wrong-content-type';
          debugInfo.warnings.push('Response was JSON but had incorrect Content-Type: ' + contentType);
        } catch (jsonError) {
          responseData = { rawText: responseText };
        }
      } catch (textError) {
        // Can't even get text response
        debugInfo.responseInfo.content.format = 'binary';
        debugInfo.responseInfo.content.error = String(textError);
        debugInfo.errors.push('Failed to read response as text: ' + String(textError));
        
        responseData = { error: 'Could not parse response' };
      }
    }
    
    // Calculate total processing time with high resolution
    const totalDuration = Date.now() - startTime;
    const totalDurationHR = performance.now() - startTimeHR;
    debugInfo.requestInfo.metrics.totalDuration = totalDuration;
    debugInfo.requestInfo.metrics.totalDurationHR = totalDurationHR.toFixed(2);
    debugInfo.requestInfo.timestamps.end = new Date().toISOString();
    
    // Return detailed response with all debugging info
    const response = {
      success: mistralResponse.ok,
      statusCode,
      statusText,
      duration: requestDuration,
      totalDuration: totalDuration,
      format: debugInfo.requestPayload.format.selected,
      responseHeaders,
      data: responseData
    };
    
    // Add warnings if present
    if (debugInfo.warnings.length > 0) {
      response.warnings = debugInfo.warnings;
    }
    
    // Add detailed debug info if requested
    if (debug || diagnosticMode) {
      response.debug = debugInfo;
    }
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Enhanced error handling
    const errorMsg = String(error);
    console.error('Error in experimental endpoint:', errorMsg);
    debugInfo.errors.push(errorMsg);
    
    // Get more details from the error object
    if (error instanceof Error) {
      // Collect error details
      debugInfo.errors.push('Stack trace: ' + (error.stack || 'No stack trace available'));
      debugInfo.errors.push('Error name: ' + error.name);
      
      // Check for specific error types
      if (error.name === 'AbortError') {
        debugInfo.errors.push('Request was aborted, likely due to timeout');
      } else if (error.name === 'TypeError' && errorMsg.includes('fetch')) {
        debugInfo.errors.push('Network error during fetch operation');
      }
      
      // Check for cause in nested errors
      if ('cause' in error && error.cause) {
        debugInfo.errors.push('Error cause: ' + String(error.cause));
      }
    }
    
    // Add environment information to help with debugging
    if (!debugInfo.environment.runtime.isCloudflareWorker && 
        !debugInfo.environment.runtime.isNodeJS && 
        !debugInfo.environment.runtime.isBrowser) {
      debugInfo.environment.runtime.unknown = true;
      debugInfo.environment.runtime.globalProperties = Object.keys(globalThis).slice(0, 50);
    }
    
    // Calculate timestamps even for errors
    debugInfo.requestInfo.timestamps.errorTime = new Date().toISOString();
    if (debugInfo.requestInfo.timestamps.start) {
      const errorDuration = Date.now() - new Date(debugInfo.requestInfo.timestamps.start).getTime();
      debugInfo.requestInfo.metrics.errorDuration = errorDuration;
    }
    
    // Provide specific error response based on error type
    const errorCategory = 
      errorMsg.includes('JSON') ? 'JSON parsing error' :
      errorMsg.includes('fetch') || errorMsg.includes('network') ? 'Network error' :
      errorMsg.includes('timeout') || errorMsg.includes('abort') ? 'Request timeout' :
      'Internal server error';
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorCategory,
      message: errorMsg,
      timestamp: new Date().toISOString(),
      debug: debugInfo
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export default app; 