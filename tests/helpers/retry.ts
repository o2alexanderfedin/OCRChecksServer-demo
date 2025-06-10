/**
 * Utility for retrying operations that might fail temporarily
 * and handling rate limiting
 */

// Rate limiting state
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 167; // 167ms ≈ 6 requests per second (Mistral API limit)
const REQUEST_QUEUE: Function[] = [];
let isProcessingQueue = false;
let totalRequests = 0;
let queuedRequests = 0;
let maxQueueLength = 0;

// Rate limiting configuration
let verboseLogging = false;
const RATE_LIMIT_CONFIG = {
  rateLimitEnabled: true,
  requestInterval: MIN_REQUEST_INTERVAL,
  debug: false,
};

/**
 * Process the queue of rate-limited requests
 */
async function processQueue() {
  if (isProcessingQueue || REQUEST_QUEUE.length === 0) return;
  
  isProcessingQueue = true;
  
  // Update max queue length for monitoring
  if (REQUEST_QUEUE.length > maxQueueLength) {
    maxQueueLength = REQUEST_QUEUE.length;
  }
  
  if (RATE_LIMIT_CONFIG.debug) {
    console.log(`Starting to process queue with ${REQUEST_QUEUE.length} requests`);
  }
  
  while (REQUEST_QUEUE.length > 0) {
    const task = REQUEST_QUEUE.shift();
    if (!task) continue;
    
    // Only rate limit if enabled
    if (RATE_LIMIT_CONFIG.rateLimitEnabled) {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      
      // If we've made a request too recently, delay until we're under the rate limit
      if (timeSinceLastRequest < RATE_LIMIT_CONFIG.requestInterval) {
        const delayTime = RATE_LIMIT_CONFIG.requestInterval - timeSinceLastRequest;
        
        if (RATE_LIMIT_CONFIG.debug) {
          console.log(`Rate limiting: Queue size ${REQUEST_QUEUE.length}, waiting ${delayTime}ms before next request`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delayTime));
      }
    }
    
    // Update the last request time
    lastRequestTime = Date.now();
    totalRequests++;
    
    // Execute the queued task with timeout protection
    try {
      // Create a timeout promise that will reject after 120 seconds for integration tests
      const timeout = new Promise<never>((_, reject) => {
        const id = setTimeout(() => {
          reject(new Error('Task execution timed out after 120 seconds'));
        }, 120000);
        // Store the timeout ID so we can clear it later
        return () => clearTimeout(id);
      });

      // Execute the task with the timeout
      await Promise.race([
        task(),
        timeout
      ]);
      
      if (RATE_LIMIT_CONFIG.debug && REQUEST_QUEUE.length > 0) {
        console.log(`Task completed. ${REQUEST_QUEUE.length} items remaining in queue.`);
      }
    } catch (error) {
      console.error('Error in rate-limited task:', error);
      
      // Log additional error details for debugging
      if (error instanceof Error) {
        console.error(`Task error details: ${error.name}: ${error.message}`);
        if (error.stack) {
          console.error(`Stack trace: ${error.stack}`);
        }
      }
    }
  }
  
  if (RATE_LIMIT_CONFIG.debug) {
    console.log(`Queue processing completed. Processed ${totalRequests} total requests.`);
  }
  
  isProcessingQueue = false;
}

/**
 * Enforces rate limiting by using a queue-based approach to respect
 * the rate limit of 6 requests per second (Mistral API limit)
 * 
 * @param fn Function to execute with rate limiting
 * @param options Optional configuration overrides for this specific call
 * @returns The result of the function
 */
export async function withRateLimit<T>(
  fn: () => Promise<T>,
  options: { skipQueue?: boolean } = {}
): Promise<T> {
  // Skip queue if explicitly requested or rate limiting is disabled
  if (options.skipQueue || !RATE_LIMIT_CONFIG.rateLimitEnabled) {
    if (RATE_LIMIT_CONFIG.debug) {
      console.log('Skipping rate limit queue (explicitly disabled)');
    }
    return await fn();
  }
  
  return new Promise<T>((resolve, reject) => {
    // Update statistics
    queuedRequests++;
    
    // Add the task to the queue
    REQUEST_QUEUE.push(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    
    // Log queue size if debugging is enabled
    if (RATE_LIMIT_CONFIG.debug) {
      console.log(`Added task to queue. Current size: ${REQUEST_QUEUE.length}`);
    }
    
    // Start processing the queue if it's not already being processed
    if (!isProcessingQueue) {
      processQueue();
    }
  });
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
      // Use rate limiting if specified and enabled
      if (respectRateLimit && RATE_LIMIT_CONFIG.rateLimitEnabled) {
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
 * Configure the rate limiting behavior
 */
export function configureRateLimiting(config: {
  enabled?: boolean;
  requestInterval?: number;
  debug?: boolean;
} = {}): void {
  if (config.enabled !== undefined) {
    RATE_LIMIT_CONFIG.rateLimitEnabled = config.enabled;
  }
  
  if (config.requestInterval !== undefined) {
    RATE_LIMIT_CONFIG.requestInterval = config.requestInterval;
  }
  
  if (config.debug !== undefined) {
    RATE_LIMIT_CONFIG.debug = config.debug;
    verboseLogging = config.debug;
  }
  
  console.log(`Rate limiting configuration updated:`, RATE_LIMIT_CONFIG);
}

/**
 * Get statistics about rate limiting
 */
export function getRateLimitingStats(): {
  totalRequests: number;
  queuedRequests: number;
  currentQueueLength: number;
  maxQueueLength: number;
  isProcessingQueue: boolean;
  config: typeof RATE_LIMIT_CONFIG;
} {
  return {
    totalRequests,
    queuedRequests,
    currentQueueLength: REQUEST_QUEUE.length,
    maxQueueLength,
    isProcessingQueue,
    config: { ...RATE_LIMIT_CONFIG },
  };
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