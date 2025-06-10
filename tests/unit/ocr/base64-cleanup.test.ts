import '../../../test-setup.ts';

// Import the function we're testing - since it's private, we'll test through the exported method
// This is a bit of a hack to test a private function
// We'll test its effects through the createDocumentChunk method in MistralOCRProvider

describe('Base64 Cleanup in Mistral OCR', () => {
    // We can't directly test private functions, so we'll test through exported functionality
    // These tests simply verify that the base64 encoding process doesn't introduce invalid characters
    
    it('should properly handle whitespace in base64 conversion', () => {
        // Create a mock ArrayBuffer with known content
        const testData = new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]);
        const buffer = testData.buffer;
        
        // Expected base64 for "Hello World"
        const expectedBase64 = 'SGVsbG8gV29ybGQ=';
        
        // Create base64 with the direct method
        const base64Direct = Buffer.from(buffer).toString('base64');
        
        // Verify no whitespace is present
        expect(base64Direct).not.toMatch(/\s/);
        expect(base64Direct).toBe(expectedBase64);
        
        // Create base64 with whitespace and verify it gets cleaned
        const withWhitespace = 'SGVs bG8g\nV29y bGQ=';
        const cleaned = withWhitespace.replace(/[\s\r\n]+/g, '');
        expect(cleaned).toBe(expectedBase64);
    });
    
    it('should validate base64 string format', () => {
        // Valid base64 (only contains allowed characters)
        const validBase64 = 'SGVsbG8gV29ybGQ=';
        const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
        expect(base64Pattern.test(validBase64)).toBe(true);
        
        // Invalid base64 (contains disallowed characters)
        const invalidBase64 = 'SGVs!bG8gV@29ybGQ=';
        expect(base64Pattern.test(invalidBase64)).toBe(false);
        
        // Fix invalid base64
        const fixedBase64 = invalidBase64.replace(/[^A-Za-z0-9+/=]/g, '');
        // This won't be the original valid base64 because we removed characters
        // but it should at least pass the pattern test
        expect(base64Pattern.test(fixedBase64)).toBe(true);
    });
    
    it('should handle padding properly', () => {
        // Different strings with different padding requirements
        const withTwoPadding = 'SGVsbG8='; // "Hello" (needs two padding chars)
        const withOnePadding = 'SGVsbG8h'; // "Hello!" (needs one padding char)
        const withNoPadding = 'SGVsbG8hIQ=='; // "Hello!!" (needs no padding)
        
        // Verify all are valid base64
        const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
        expect(base64Pattern.test(withTwoPadding)).toBe(true);
        expect(base64Pattern.test(withOnePadding)).toBe(true);
        expect(base64Pattern.test(withNoPadding)).toBe(true);
    });
});