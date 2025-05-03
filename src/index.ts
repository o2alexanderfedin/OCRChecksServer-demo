import 'reflect-metadata';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { workerIoE } from './io';
import { ScannerFactory } from './scanner/factory';
import { Document, DocumentType } from './ocr/types';

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
    version: '1.30.0'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});

export default app; 