/**
 * Simple test script to verify import paths
 */
console.log('Starting import test...');

try {
  const { ReceiptExtractor, CheckExtractor } = await import('../src/json/extractors/index.js');
  console.log('Successfully imported from index.js:');
  console.log('ReceiptExtractor:', typeof ReceiptExtractor);
  console.log('CheckExtractor:', typeof CheckExtractor);
} catch (err) {
  console.error('Error importing from index.js:', err.message);
}

try {
  const extractors = await import('../src/json/extractors/index.js');
  console.log('Successfully imported as namespace:');
  console.log('extractors:', Object.keys(extractors));
} catch (err) {
  console.error('Error importing as namespace:', err.message);
}

// Try with a direct .ts import
try {
  const { ReceiptExtractor } = await import('../src/json/extractors/receipt-extractor.js');
  console.log('Direct import of ReceiptExtractor:', typeof ReceiptExtractor);
} catch (err) {
  console.error('Error directly importing ReceiptExtractor:', err.message);
}

try {
  const { CheckExtractor } = await import('../src/json/extractors/check-extractor.js');
  console.log('Direct import of CheckExtractor:', typeof CheckExtractor);
} catch (err) {
  console.error('Error directly importing CheckExtractor:', err.message);
}

console.log('Import test completed');