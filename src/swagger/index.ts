import { swaggerUI } from '@hono/swagger-ui';
import pkg from '../../package.json';
import openApiSpec from './openapi-spec';

/**
 * Creates a Swagger UI middleware with the current OpenAPI specification
 * @returns A middleware function that serves the Swagger UI
 */
export function createSwaggerUI() {
  // Create a Swagger UI middleware with the OpenAPI spec
  const spec = getOpenAPISpecWithCurrentVersion();
  
  // Define all available environments
  spec.servers = [
    {
      url: '',  // Empty URL means relative to current host - best for local testing
      description: 'Current server'
    },
    {
      url: 'http://localhost:8787',
      description: 'Local development'
    },
    {
      url: 'https://ocr-checks-worker-dev.af-4a0.workers.dev',
      description: 'Development environment'
    },
    {
      url: 'https://ocr-checks-worker-staging.af-4a0.workers.dev',
      description: 'Staging environment'
    },
    {
      url: 'https://ocr-checks-worker.af-4a0.workers.dev',
      description: 'Production environment'
    }
  ];
  
  return swaggerUI({
    spec: spec,
    title: 'OCR Checks Server API Documentation'
  });
}

/**
 * Gets the OpenAPI specification with the current version from package.json
 * @returns The OpenAPI specification object with the updated version
 */
export function getOpenAPISpecWithCurrentVersion() {
  // Clone the spec to avoid modifying the original
  const spec = JSON.parse(JSON.stringify(openApiSpec));
  
  // Update the version with the current package version
  spec.info.version = pkg.version;
  
  return spec;
}