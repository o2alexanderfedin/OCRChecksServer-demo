/**
 * Throttled fetch utility that respects rate limits
 * Particularly useful for Mistral API which has a 6 requests/second limit
 */

import { withRateLimit, configureRateLimiting, getRateLimitingStats } from './retry.js';

/**
 * A fetch implementation that respects rate limits
 * Drop-in replacement for the global fetch that uses the rate limiting queue
 */
export async function throttledFetch(
  url: string | URL | Request, 
  init?: RequestInit
): Promise<Response> {
  // Check if this is a direct Mistral API call
  const isMistralCall = typeof url === 'string' 
    ? url.includes('mistral.ai') 
    : url instanceof URL 
      ? url.hostname.includes('mistral.ai')
      : url.url.includes('mistral.ai');

  // All Mistral API calls need to be strictly rate limited
  if (isMistralCall) {
    // Return rate-limited fetch for Mistral
    return withRateLimit(() => fetch(url, init));
  }

  // For non-Mistral endpoints, we still use the queue but with higher priority
  return withRateLimit(() => fetch(url, init));
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