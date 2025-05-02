/**
 * Client example for using the OCR API
 * 
 * This file is a browser-compatible JavaScript version of the TypeScript client.
 */

// Get the base URL from the environment (default to local development)
const getBaseUrl = () => {
  // If running in a browser, use the current origin
  if (typeof window !== 'undefined') {
    // If accessing the examples via our server at /examples/, we need to adjust the path
    if (window.location.pathname.startsWith('/examples/')) {
      return window.location.origin;
    }
    // If accessing directly from file, use localhost
    return 'http://localhost:8787';
  }
  // Default for node environment (should not be reached in a browser)
  return 'http://localhost:8787';
};

/**
 * Process a check image and extract data
 * @param {File} imageFile Image file to process
 * @returns {Promise<Object>} Extracted check data
 */
async function processCheck(imageFile) {
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
    const errorData = await response.json();
    throw new Error(`Processing failed: ${errorData.error}`);
  }
  
  const data = await response.json();
  return data;
}

/**
 * Process a receipt image and extract data
 * @param {File} imageFile Image file to process
 * @returns {Promise<Object>} Extracted receipt data
 */
async function processReceipt(imageFile) {
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
    const errorData = await response.json();
    throw new Error(`Processing failed: ${errorData.error}`);
  }
  
  const data = await response.json();
  return data;
}

/**
 * Process any document type (check or receipt)
 * @param {File} imageFile Image file to process
 * @param {'check'|'receipt'} documentType Type of document
 * @returns {Promise<Object>} Extracted document data
 */
async function processDocument(imageFile, documentType) {
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
    const errorData = await response.json();
    throw new Error(`Processing failed: ${errorData.error}`);
  }
  
  const data = await response.json();
  return data;
}

/**
 * Check service health
 * @returns {Promise<Object>} Health status
 */
async function checkHealth() {
  const url = `${getBaseUrl()}/health`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

// Export the functions for use in other modules
export {
  processCheck,
  processReceipt,
  processDocument,
  checkHealth
};