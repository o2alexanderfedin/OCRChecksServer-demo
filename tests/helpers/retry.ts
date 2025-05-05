/**
 * Utility for retrying operations that might fail temporarily
 * and handling rate limiting
 */

// Rate limiting state
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 200; // 200ms = 5 requests per second

/**
 * Enforces rate limiting by delaying execution if needed to respect
 * the rate limit of 5 requests per second
 * 
 * @param fn Function to execute with rate limiting
 * @returns The result of the function
 */
export async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  // If we've made a request too recently, delay until we're under the rate limit
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delayTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Rate limiting: Waiting ${delayTime}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, delayTime));
  }
  
  // Update the last request time
  lastRequestTime = Date.now();
  
  // Execute the function
  return await fn();
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn Function to retry
 * @param options Retry options
 * @returns Result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    retryIf?: (error: any) => boolean;
    onRetry?: (error: any, attempt: number) => void;
    respectRateLimit?: boolean;
  } = {}
): Promise<T> {
  const {
    retries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    retryIf = () => true,
    onRetry = () => {},
    respectRateLimit = true,
  } = options;

  let lastError: any;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      // Use rate limiting if specified
      if (respectRateLimit) {
        return await withRateLimit(() => fn());
      } else {
        return await fn();
      }
    } catch (error) {
      lastError = error;
      
      // Check if we should retry based on the error
      if (attempt >= retries || !retryIf(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(factor, attempt), maxDelay);
      
      // Notify about retry
      onRetry(error, attempt + 1);
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
      
      attempt++;
    }
  }

  // This should never happen, but TypeScript needs it
  throw lastError;
}

/**
 * Checks if an error is likely a temporary issue that can be retried
 * (network errors, API rate limits, etc.)
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Rate limits or temporary API issues
  if (error?.message?.toLowerCase().includes('rate limit')) {
    return true;
  }
  
  if (error?.message?.toLowerCase().includes('timeout')) {
    return true;
  }
  
  if (typeof error === 'string' && 
      (error.includes('rate limit') || 
       error.includes('timeout') || 
       error.includes('temporarily unavailable'))) {
    return true;
  }
  
  // HTTP status codes that often indicate temporary issues
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  if (error?.status && retryableStatusCodes.includes(error.status)) {
    return true;
  }
  
  return false;
}