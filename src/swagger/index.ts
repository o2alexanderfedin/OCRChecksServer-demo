import { swaggerUI } from '@hono/swagger-ui';
import pkg from '../../package.json';
import openApiSpec from './openapi-spec';

/**
 * Creates a Swagger UI middleware with the current OpenAPI specification
 * @returns A middleware function that serves the Swagger UI
 */
export function createSwaggerUI() {
  // Create a Swagger UI middleware with the OpenAPI spec
  return swaggerUI({
    openAPISpec: getOpenAPISpecWithCurrentVersion()
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