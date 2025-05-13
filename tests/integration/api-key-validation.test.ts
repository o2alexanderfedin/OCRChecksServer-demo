/**
 * API Key Validation Test
 * 
 * This test verifies that the MISTRAL_API_KEY environment variable is set correctly
 * before running integration tests.
 */

describe('API Key Environment Variable Validation', () => {
  it('should have MISTRAL_API_KEY set in environment', () => {
    // Check if MISTRAL_API_KEY is defined
    expect(process.env.MISTRAL_API_KEY).toBeDefined();
    
    // Log key details for debugging (safely)
    if (process.env.MISTRAL_API_KEY) {
      const apiKey = process.env.MISTRAL_API_KEY;
      console.log(`MISTRAL_API_KEY is defined with length: ${apiKey.length}`);
      console.log(`MISTRAL_API_KEY first 4 chars: ${apiKey.substring(0, 4)}****`);
      
      // Validate key format
      expect(apiKey.length).toBeGreaterThan(20);
      
      // Verify it's not one of the placeholder values
      const commonPlaceholders = ['your-api-key-here', 'api-key', 'mistral-api-key', 'placeholder'];
      const containsPlaceholder = commonPlaceholders.some(placeholder => apiKey.toLowerCase().includes(placeholder));
      expect(containsPlaceholder).toBe(false);
    }
  });
});