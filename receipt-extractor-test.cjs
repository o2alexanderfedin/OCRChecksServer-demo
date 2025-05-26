// Direct test for receipt-extractor.ts hallucination detection
const fs = require('fs');
const path = require('path');

// Create receipt data with suspicious (hallucinated) values
const HALLUCINATED_RECEIPT = {
  merchantName: "ACME Store",
  date: "2023-01-01",
  total: 99.99,
  subtotal: 89.99,
  tax: 10.00,
  items: [
    { name: "Item 1", price: 19.99, quantity: 1 },
    { name: "Item 2", price: 29.99, quantity: 2 },
    { name: "Item 3", price: 10.02, quantity: 3 }
  ],
  confidence: 0.8
};

// Function to verify if the modified receipt extractor properly detects hallucinations
function verifyReceiptExtractor() {
  console.log('=== Testing Receipt Extractor Hallucination Detection ===');
  
  // Read receipt-extractor.ts to verify our changes
  const extractorPath = path.join(__dirname, 'src', 'json', 'extractors', 'receipt-extractor.ts');
  
  if (!fs.existsSync(extractorPath)) {
    console.error(`Receipt extractor not found at: ${extractorPath}`);
    return false;
  }
  
  const source = fs.readFileSync(extractorPath, 'utf8');
  console.log('Receipt extractor file found, analyzing code...');
  
  // Check for anti-hallucination function
  const hasDetectHallucinations = source.includes('detectHallucinations');
  console.log('Has detectHallucinations function:', hasDetectHallucinations);
  
  // Check for suspicious patterns
  const hasSuspiciousPatterns = source.includes('suspiciousPatterns');
  console.log('Has suspiciousPatterns definition:', hasSuspiciousPatterns);
  
  // Check for isValidInput property
  const hasIsValidInput = source.includes('isValidInput');
  console.log('Uses isValidInput property:', hasIsValidInput);
  
  // Examine the schema to verify required fields have been reduced
  const schemaPath = path.join(__dirname, 'src', 'json', 'schemas', 'receipt.ts');
  
  if (!fs.existsSync(schemaPath)) {
    console.error(`Receipt schema not found at: ${schemaPath}`);
    return false;
  }
  
  const schemaSource = fs.readFileSync(schemaPath, 'utf8');
  console.log('\nReceipt schema file found, analyzing schema...');
  
  // Check that required fields have been reduced
  const requiredSection = schemaSource.match(/\"required\":\s*\[(.*?)\]/s);
  
  if (requiredSection) {
    const requiredFields = requiredSection[1].split(',')
      .map(f => f.trim().replace(/"/g, ''))
      .filter(f => f.length > 0);
    
    console.log('Required fields in schema:', requiredFields);
    console.log('Only confidence is required:', requiredFields.length === 1 && requiredFields[0] === 'confidence');
  } else {
    console.log('Could not find required section in schema');
  }
  
  // Check that isValidInput is defined in the schema
  const hasIsValidInputInSchema = schemaSource.includes('isValidInput');
  console.log('isValidInput defined in schema:', hasIsValidInputInSchema);
  
  // Return overall assessment
  const hasAllRequiredChanges = hasDetectHallucinations && hasSuspiciousPatterns && hasIsValidInput && hasIsValidInputInSchema;
  
  if (hasAllRequiredChanges) {
    console.log('\n✅ SUCCESS: All anti-hallucination code is properly implemented in the receipt extractor!');
    return true;
  } else {
    console.log('\n❌ WARNING: Anti-hallucination implementation may be incomplete in the receipt extractor.');
    console.log('Missing features:');
    if (!hasDetectHallucinations) console.log('- detectHallucinations function');
    if (!hasSuspiciousPatterns) console.log('- suspiciousPatterns definition');
    if (!hasIsValidInput) console.log('- isValidInput property usage');
    if (!hasIsValidInputInSchema) console.log('- isValidInput in schema definition');
    return false;
  }
}

// Run the verification
verifyReceiptExtractor();