/**
 * Examples of using the validation system
 */
import { Container } from 'inversify';
import { 
  registerValidators, 
  validateApiKey, 
  validateUrl, 
  TYPES, 
  ApiKey, 
  Url, 
  ValidationError,
  MistralConfigValidator,
  ValidationMiddleware
} from '../src/validators.ts';

/**
 * Example 1: Basic validation of API key and URL
 */
function basicValidationExample() {
  try {
    // Validate API key
    const apiKey: ApiKey = validateApiKey('valid-api-key-12345678901234');
    console.log('Valid API key:', apiKey);
    
    // Validate URL
    const url: Url = validateUrl('https://api.mistral.ai');
    console.log('Valid URL:', url);
    
    // Try invalid values
    try {
      validateApiKey('short');
    } catch (error) {
      console.error('API key validation error:', error instanceof ValidationError ? error.getFormattedMessage() : error);
    }
    
    try {
      validateUrl('not-a-url');
    } catch (error) {
      console.error('URL validation error:', error instanceof ValidationError ? error.getFormattedMessage() : error);
    }
  } catch (error) {
    console.error('Validation error:', error);
  }
}

/**
 * Example 2: Using validators with dependency injection
 */
function dependencyInjectionExample() {
  // Create a container and register validators
  const container = new Container();
  registerValidators(container);
  
  // Get validators from container
  const mistralConfigValidator = container.get<MistralConfigValidator>(TYPES.MistralConfigValidator);
  
  // Validate configuration
  try {
    const config = {
      apiKey: 'valid-api-key-12345678901234',
      baseUrl: 'https://api.mistral.ai',
      timeout: 30000,
      retryConfig: {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 5000
      }
    };
    
    const validConfig = mistralConfigValidator.assertValid(config);
    console.log('Valid configuration:', validConfig);
    
    // Configuration is strongly typed with branded types
    const apiKey: ApiKey = validConfig.apiKey;
    const baseUrl: Url | undefined = validConfig.baseUrl;
    
    console.log('API key:', apiKey);
    console.log('Base URL:', baseUrl);
  } catch (error) {
    console.error('Configuration validation error:', error instanceof ValidationError ? error.getFormattedMessage() : error);
  }
}

/**
 * Example 3: Using validation middleware in Express
 */
function expressMiddlewareExample() {
  // Create a container and register validators
  const container = new Container();
  registerValidators(container);
  
  // Get validators and middleware from container
  const mistralConfigValidator = container.get<MistralConfigValidator>(TYPES.MistralConfigValidator);
  const validationMiddleware = container.get<ValidationMiddleware>(TYPES.ValidationMiddleware);
  
  // Create an Express-like app mock for demonstration
  const app = {
    post: (path: string, ...handlers: any[]) => {
      console.log(`Registered POST endpoint: ${path} with ${handlers.length} middleware handlers`);
    }
  };
  
  // Register routes with validation middleware
  app.post('/api/mistral/configure', 
    validationMiddleware.createBodyValidator(mistralConfigValidator),
    (req: any, res: any) => {
      // In a real handler, req.body would now be a validated MistralConfig
      console.log('Request handled with validated body');
    }
  );
}

// Run examples
console.log('===== Basic Validation Example =====');
basicValidationExample();

console.log('\n===== Dependency Injection Example =====');
dependencyInjectionExample();

console.log('\n===== Express Middleware Example =====');
expressMiddlewareExample();