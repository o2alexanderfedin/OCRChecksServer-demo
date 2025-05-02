/**
 * Client example for using the OCR API with TypeScript
 * 
 * This file demonstrates how to use the API response types.
 */

import { 
  CheckOCRResponse, 
  ReceiptOCRResponse, 
  ProcessDocumentResponse, 
  ErrorResponse, 
  HealthResponse 
} from '../src/types/api-responses';

// Get the base URL from the environment (default to local development)
const getBaseUrl = (): string => {
  // If running in a browser, use the current origin
  if (typeof window !== 'undefined') {
    // If accessing the examples via our server at /examples/, we need to adjust the path
    if (window.location.pathname.startsWith('/examples/')) {
      return window.location.origin;
    }
    // If accessing directly from file, use localhost
    return 'http://localhost:8787';
  }
  // Default for node environment
  return process.env.OCR_API_URL || 'http://localhost:8787';
};

/**
 * Process a check image and extract data
 * @param imageFile Image file to process
 * @returns Extracted check data
 */
async function processCheck(imageFile: File): Promise<CheckOCRResponse> {
  const url = `${getBaseUrl()}/check`;
  
  // For image files, we need to send the raw binary data
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': imageFile.type,
    },
    body: imageFile,
  });
  
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(`Processing failed: ${errorData.error}`);
  }
  
  const data: CheckOCRResponse = await response.json();
  return data;
}

/**
 * Process a receipt image and extract data
 * @param imageFile Image file to process
 * @returns Extracted receipt data
 */
async function processReceipt(imageFile: File): Promise<ReceiptOCRResponse> {
  const url = `${getBaseUrl()}/receipt`;
  
  // For image files, we need to send the raw binary data
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': imageFile.type,
    },
    body: imageFile,
  });
  
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(`Processing failed: ${errorData.error}`);
  }
  
  const data: ReceiptOCRResponse = await response.json();
  return data;
}

/**
 * Process any document type (check or receipt)
 * @param imageFile Image file to process
 * @param documentType Type of document ('check' or 'receipt')
 * @returns Extracted document data
 */
async function processDocument(
  imageFile: File, 
  documentType: 'check' | 'receipt'
): Promise<ProcessDocumentResponse> {
  const url = `${getBaseUrl()}/process?type=${documentType}`;
  
  // For image files, we need to send the raw binary data
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': imageFile.type,
    },
    body: imageFile,
  });
  
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(`Processing failed: ${errorData.error}`);
  }
  
  const data: ProcessDocumentResponse = await response.json();
  return data;
}

/**
 * Check service health
 * @returns Health status
 */
async function checkHealth(): Promise<HealthResponse> {
  const url = `${getBaseUrl()}/health`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  
  const data: HealthResponse = await response.json();
  return data;
}

/**
 * Example usage of the client functions
 */
async function exampleUsage() {
  try {
    // Check service health
    const healthStatus = await checkHealth();
    console.log(`Service is ${healthStatus.status} (v${healthStatus.version})`);
    
    // Process a check image (assuming you have a file input)
    const checkFileInput = document.getElementById('checkFile') as HTMLInputElement;
    if (checkFileInput.files && checkFileInput.files.length > 0) {
      const checkResult = await processCheck(checkFileInput.files[0]);
      
      // Use the structured data
      console.log(`Check #${checkResult.data.checkNumber}`);
      console.log(`Amount: $${checkResult.data.amount}`);
      console.log(`Payee: ${checkResult.data.payee}`);
      console.log(`Confidence: ${checkResult.confidence.overall * 100}%`);
    }
    
    // Process a receipt image
    const receiptFileInput = document.getElementById('receiptFile') as HTMLInputElement;
    if (receiptFileInput.files && receiptFileInput.files.length > 0) {
      const receiptResult = await processReceipt(receiptFileInput.files[0]);
      
      // Use the structured data
      console.log(`Merchant: ${receiptResult.data.merchant.name}`);
      console.log(`Date: ${receiptResult.data.timestamp}`);
      console.log(`Total: $${receiptResult.data.totals.total}`);
      console.log(`Items: ${receiptResult.data.items?.length || 0}`);
      console.log(`Confidence: ${receiptResult.confidence.overall * 100}%`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// For browser environments
if (typeof window !== 'undefined') {
  // Add event listener to a process button
  const processButton = document.getElementById('processButton');
  if (processButton) {
    processButton.addEventListener('click', exampleUsage);
  }
}