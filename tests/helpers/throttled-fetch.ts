/**
 * Throttled fetch utility that respects rate limits
 * Particularly useful for Mistral API which has a 6 requests/second limit
 */

import { withRateLimit, configureRateLimiting, getRateLimitingStats, retry } from './retry.js';

/**
 * A fetch implementation that respects rate limits
 * Drop-in replacement for the global fetch that uses the rate limiting queue
 */
export async function throttledFetch(
  url: string | URL | Request, 
  init?: RequestInit
): Promise<Response> {
  // Parse the URL to string for easier handling
  const urlStr = typeof url === 'string' 
    ? url 
    : url instanceof URL 
      ? url.toString()
      : url.url;
      
  // Check if this is a health check endpoint (can bypass throttling)
  const isHealthCheck = urlStr.includes('/health');
  
  // Check if this is a direct Mistral API call
  const isMistralCall = urlStr.includes('mistral.ai');

  // Configure retry options
  const retryOptions = {
    retries: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    factor: 1.5,
    retryIf: (error: any) => {
      // Retry on connection errors
      if (error instanceof TypeError && error.message.includes('fetch failed')) {
        return true;
      }
      // Retry on network errors with ECONNREFUSED
      if (error?.cause?.code === 'ECONNREFUSED') {
        return true;
      }
      // Retry on timeout errors
      if (error?.message?.includes('timeout')) {
        return true;
      }
      return false;
    },
    onRetry: (error: any, attempt: number) => {
      console.log(`Retrying fetch to ${urlStr.split('?')[0]} (attempt ${attempt}/3) after error: ${error.message}`);
    }
  };

  try {
    // Health checks might need retries but can bypass rate limiting
    if (isHealthCheck) {
      return await retry(() => fetch(url, init), {
        ...retryOptions,
        respectRateLimit: false
      });
    }
    
    // All Mistral API calls need to be strictly rate limited
    if (isMistralCall) {
      // Return rate-limited fetch for Mistral with longer timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      try {
        // Add abort signal to init if it doesn't already have one
        const fetchInit = init ? { ...init } : {};
        if (!fetchInit.signal) {
          fetchInit.signal = controller.signal;
        }
        
        return await retry(() => withRateLimit(() => fetch(url, fetchInit)), retryOptions);
      } finally {
        clearTimeout(timeoutId);
      }
    }
  
    // For non-Mistral endpoints, we still use the queue but with higher priority
    return await retry(() => withRateLimit(() => fetch(url, init)), retryOptions);
  } catch (error) {
    // Enhance error with request details (but don't log sensitive data)
    console.error(`Fetch error for ${urlStr.split('?')[0]}:`, error);
    
    // Rethrow to allow callers to handle the error
    throw error;
  }
}

// Re-export rate limiting configuration utilities
export { configureRateLimiting, getRateLimitingStats };

/**
 * Configure throttled fetch with the recommended settings for integration tests
 */
export function setupThrottledFetch(options: {
  enabled?: boolean;
  requestInterval?: number;
  debug?: boolean;
} = {}): void {
  // Default settings optimized for Mistral API (6 requests per second)
  const defaultOptions = {
    enabled: true,
    requestInterval: 167, // ~6 requests per second
    debug: false,
    ...options
  };
  
  // Apply configuration
  configureRateLimiting(defaultOptions);
  
  console.log('Throttled fetch configured for integration tests');
  
  // Print warning if rate limiting is disabled
  if (!defaultOptions.enabled) {
    console.warn('⚠️ WARNING: Rate limiting is disabled. This may cause API rate limit errors.');
  }
}