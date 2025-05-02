/**
 * Utility for retrying operations that might fail temporarily
 */

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
  } = {}
): Promise<T> {
  const {
    retries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    retryIf = () => true,
    onRetry = () => {},
  } = options;

  let lastError: any;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await fn();
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