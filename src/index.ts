import 'reflect-metadata';
import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { workerIoE } from './io.ts';
import { ScannerFactory } from './scanner/factory.ts';
import { Document, DocumentType } from './ocr/types.ts';
// Import Swagger UI middleware
import { createSwaggerUI, getOpenAPISpecWithCurrentVersion } from './swagger/index.ts';
// Get package version (used in health check)
import pkg from '../package.json' with { type: 'json' };

interface Env {
  MISTRAL_API_KEY: string;
  CLOUDFLARE_API_TOKEN: string;
}

const app = new Hono<{ Bindings: Env }>();
// Apply CORS middleware to all routes
app.options('*', (_c) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    }
  });
});

// Add CORS headers to all responses
app.use('*', async (c, next) => {
  await next();
  
  // Get the response
  const response = c.res;
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
});

// Serve examples directory for client testing
app.get('/examples/*', serveStatic({ root: './' }));

// Serve OpenAPI Swagger UI for API documentation
app.get('/api-docs', createSwaggerUI());

// Serve the raw OpenAPI specification as JSON
app.get('/openapi.json', (c) => {
  return c.json(getOpenAPISpecWithCurrentVersion());
});

// All functionality is now provided through dedicated endpoints:
// - /process - Universal document processing endpoint
// - /check - Check-specific processing endpoint
// - /receipt - Receipt-specific processing endpoint
// - /health - Server status endpoint
// - /api-docs - API documentation (Swagger UI)
// - /openapi.json - Raw OpenAPI specification

// New unified endpoint for processing documents
app.post('/process', async (c) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log(`[${requestId}] ===== PROCESS ENDPOINT START =====`);
  console.log(`[${requestId}] Request started at: ${new Date().toISOString()}`);
  
  try {
    console.log(`[${requestId}] Step 1: Checking content type`);
    // Check content type
    const contentType = c.req.header('Content-Type');
    console.log(`[${requestId}] Content-Type header: ${contentType}`);
    
    if (!contentType?.startsWith('image/')) {
      console.log(`[${requestId}] EARLY RETURN: Invalid content type`);
      return new Response(JSON.stringify({ error: 'Invalid content type. Expected image/*' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${requestId}] Step 2: Parsing query parameters`);
    // Get document format (image/pdf) from query
    const documentFormat = c.req.query('format') || 'image';
    const documentType = documentFormat === 'pdf' ? DocumentType.PDF : DocumentType.Image;
    console.log(`[${requestId}] Document format: ${documentFormat}, type: ${documentType}`);
    
    // Get document content type (check/receipt) from query
    const contentTypeParam = c.req.query('type') || 'receipt';
    console.log(`[${requestId}] Document content type: ${contentTypeParam}`);
    
    if (!['check', 'receipt'].includes(contentTypeParam)) {
      console.log(`[${requestId}] EARLY RETURN: Invalid document type`);
      return new Response(JSON.stringify({ error: 'Invalid document type. Supported types: check, receipt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${requestId}] Step 3: Reading image data`);
    // Get image data
    const imageBuffer = await c.req.arrayBuffer();
    console.log(`[${requestId}] Image buffer size: ${imageBuffer.byteLength} bytes`);
    
    console.log(`[${requestId}] Step 4: Creating scanner`);
    // Create appropriate scanner based on document content type
    const scanner = ScannerFactory.createScannerByType(
      workerIoE, 
      c.env.MISTRAL_API_KEY, 
      contentTypeParam as 'check' | 'receipt'
    );
    console.log(`[${requestId}] Scanner created successfully`);

    console.log(`[${requestId}] Step 5: Creating document object`);
    // Create document
    const document: Document = {
      content: imageBuffer,
      type: documentType,
      name: c.req.query('filename') || 'uploaded-document'
    };
    console.log(`[${requestId}] Document object created: ${document.name}`);

    console.log(`[${requestId}] Step 6: Starting document processing - THIS IS THE CRITICAL STEP`);
    console.log(`[${requestId}] About to call scanner.processDocument() at ${new Date().toISOString()}`);
    
    // Process document
    const result = await scanner.processDocument(document);
    
    console.log(`[${requestId}] Step 7: Document processing completed`);
    console.log(`[${requestId}] Processing result type: ${result[0]}`);
    console.log(`[${requestId}] Time since start: ${Date.now() - startTime}ms`);

    // Handle result
    if (result[0] === 'error') {
      console.error('Error in result:', result[1]);
      return new Response(JSON.stringify({ error: result[1] }), {
        status: 429,
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
    return new Response(JSON.stringify({ 
      message: 'Too many requests, please try again later',
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Dedicated endpoint for check processing
app.post('/check', async (c) => {
  const requestId = `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log(`[${requestId}] ===== CHECK ENDPOINT START =====`);
  console.log(`[${requestId}] Check request started at: ${new Date().toISOString()}`);
  
  try {
    console.log(`[${requestId}] Step 1: Checking content type`);
    // Check content type
    const contentType = c.req.header('Content-Type');
    console.log(`[${requestId}] Content-Type header: ${contentType}`);
    
    if (!contentType?.startsWith('image/')) {
      console.log(`[${requestId}] EARLY RETURN: Invalid content type`);
      return new Response(JSON.stringify({ error: 'Invalid content type. Expected image/*' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${requestId}] Step 2: Parsing document format`);
    // Get document format (image/pdf) from query
    const documentFormat = c.req.query('format') || 'image';
    const documentType = documentFormat === 'pdf' ? DocumentType.PDF : DocumentType.Image;
    console.log(`[${requestId}] Document format: ${documentFormat}, type: ${documentType}`);
    
    console.log(`[${requestId}] Step 3: Reading image data`);
    // Get image data
    const imageBuffer = await c.req.arrayBuffer();
    console.log(`[${requestId}] Image buffer size: ${imageBuffer.byteLength} bytes`);

    console.log(`[${requestId}] Step 4: Creating check scanner`);
    // Create check scanner
    const scanner = ScannerFactory.createMistralCheckScanner(workerIoE, c.env.MISTRAL_API_KEY);
    console.log(`[${requestId}] Check scanner created successfully`);

    console.log(`[${requestId}] Step 5: Creating document object`);
    // Create document
    const document: Document = {
      content: imageBuffer,
      type: documentType,
      name: c.req.query('filename') || 'check-document'
    };
    console.log(`[${requestId}] Document object created: ${document.name}`);

    console.log(`[${requestId}] Step 6: Starting check processing - THIS IS THE CRITICAL STEP`);
    console.log(`[${requestId}] About to call scanner.processDocument() at ${new Date().toISOString()}`);
    
    // Process document
    const result = await scanner.processDocument(document);
    
    console.log(`[${requestId}] Step 7: Check processing completed`);
    console.log(`[${requestId}] Processing result type: ${result[0]}`);
    console.log(`[${requestId}] Time since start: ${Date.now() - startTime}ms`);

    // Handle result
    if (result[0] === 'error') {
      console.error('Error in result:', result[1]);
      return new Response(JSON.stringify({ error: result[1] }), {
        status: 429,
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
    return new Response(JSON.stringify({ 
      message: 'Too many requests, please try again later',
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 429,
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
      console.error('Error in result:', result[1]);
      return new Response(JSON.stringify({ error: result[1] }), {
        status: 429,
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
    return new Response(JSON.stringify({ 
      message: 'Too many requests, please try again later',
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Health check endpoint for testing server availability and API key configuration
app.get('/health', (c) => {
  try {
    // Validate DI
    const diContainer = ScannerFactory.createDIContainer(workerIoE, c.env.MISTRAL_API_KEY);

    ScannerFactory.createMistralCheckScanner(workerIoE, c.env.MISTRAL_API_KEY);
    ScannerFactory.createScannerByType(workerIoE, c.env.MISTRAL_API_KEY, 'check');

    ScannerFactory.createMistralReceiptScanner(workerIoE, c.env.MISTRAL_API_KEY);
    ScannerFactory.createScannerByType(workerIoE, c.env.MISTRAL_API_KEY, 'receipt');

    const apiKey = diContainer.getMistralApiKey();

    // Create health response with ISO formatted date string as per HealthResponse interface
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: pkg.version,
      apiKey: apiKey ? apiKey.slice(0, 4) + '...' : `Invalid Mistral API Key: ${apiKey}`,
      mistralApiKey: c.env.MISTRAL_API_KEY ? c.env.MISTRAL_API_KEY.slice(0, 4) + '...' : 'Not set',
      cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN ? c.env.CLOUDFLARE_API_TOKEN.slice(0, 4) + '...' : 'Not set'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in health check:', error);
    return new Response(JSON.stringify({ 
      message: 'Too many requests, please try again later',
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export default app; 