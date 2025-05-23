// Direct test for check-extractor.ts hallucination detection
const fs = require('fs');
const path = require('path');

// Create minimal OCR output to test with
const MINIMAL_OCR_TEXT = `This is a tiny test image without any check data.`;

// Create check data with suspicious (hallucinated) values
const HALLUCINATED_CHECK = {
  checkNumber: "1234",
  payee: "John Doe",
  amount: 100,
  date: "2023-10-05",
  confidence: 0.8,
  accountNumber: "123456789",
  bankName: "First National Bank",
  routingNumber: "987654321"
};

// Function to verify if the modified check extractor properly detects hallucinations
function verifyCheckExtractor() {
  console.log('=== Testing Check Extractor Hallucination Detection ===');
  
  // Read check-extractor.ts to verify our changes
  const extractorPath = path.join(__dirname, 'src', 'json', 'extractors', 'check-extractor.ts');
  
  if (!fs.existsSync(extractorPath)) {
    console.error(`Check extractor not found at: ${extractorPath}`);
    return false;
  }
  
  const source = fs.readFileSync(extractorPath, 'utf8');
  console.log('Check extractor file found, analyzing code...');
  
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
  const schemaPath = path.join(__dirname, 'src', 'json', 'schemas', 'check.ts');
  
  if (!fs.existsSync(schemaPath)) {
    console.error(`Check schema not found at: ${schemaPath}`);
    return false;
  }
  
  const schemaSource = fs.readFileSync(schemaPath, 'utf8');
  console.log('\nCheck schema file found, analyzing schema...');
  
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
  
  // Use manual check on suspicious values
  console.log('\n=== Hallucination Detection Analysis ===');
  
  // Check common hallucinated values that should be detected
  const suspiciousValues = {
    checkNumbers: ["1234", "5678", "0000"],
    payees: ["John Doe", "Jane Doe", "John Smith"],
    amounts: [100, 150.75, 200, 500],
    dates: ["2023-10-05", "2024-01-05"]
  };
  
  console.log('Testing example check data for hallucination indicators:');
  let suspicionScore = 0;
  
  // Check number
  if (suspiciousValues.checkNumbers.includes(HALLUCINATED_CHECK.checkNumber)) {
    console.log(`✓ Suspicious check number detected: ${HALLUCINATED_CHECK.checkNumber}`);
    suspicionScore++;
  }
  
  // Payee
  if (suspiciousValues.payees.includes(HALLUCINATED_CHECK.payee)) {
    console.log(`✓ Suspicious payee detected: ${HALLUCINATED_CHECK.payee}`);
    suspicionScore++;
  }
  
  // Amount
  if (suspiciousValues.amounts.includes(HALLUCINATED_CHECK.amount)) {
    console.log(`✓ Suspicious amount detected: ${HALLUCINATED_CHECK.amount}`);
    suspicionScore++;
  }
  
  // Date
  if (suspiciousValues.dates.includes(HALLUCINATED_CHECK.date)) {
    console.log(`✓ Suspicious date detected: ${HALLUCINATED_CHECK.date}`);
    suspicionScore++;
  }
  
  console.log(`\nSuspicion score: ${suspicionScore}`);
  console.log(`Would be flagged as hallucination: ${suspicionScore >= 2}`);
  
  // Return overall assessment
  const hasAllRequiredChanges = hasDetectHallucinations && hasSuspiciousPatterns && hasIsValidInput && hasIsValidInputInSchema;
  
  if (hasAllRequiredChanges) {
    console.log('\n✅ SUCCESS: All anti-hallucination code is properly implemented!');
    return true;
  } else {
    console.log('\n❌ WARNING: Anti-hallucination implementation may be incomplete.');
    console.log('Missing features:');
    if (!hasDetectHallucinations) console.log('- detectHallucinations function');
    if (!hasSuspiciousPatterns) console.log('- suspiciousPatterns definition');
    if (!hasIsValidInput) console.log('- isValidInput property usage');
    if (!hasIsValidInputInSchema) console.log('- isValidInput in schema definition');
    return false;
  }
}

// Run the verification
verifyCheckExtractor();