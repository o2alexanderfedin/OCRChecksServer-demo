# OCR Checks Server Documentation

This directory contains comprehensive documentation for the OCR Checks Server project. The documentation is organized into the following categories:

## Documentation Structure

- [Architecture](./architecture/): System architecture and design patterns
- [API](./api/): API specifications, schemas, and Swagger documentation
- [Features](./features/): Detailed documentation on specific features
  - [Check Processing](./features/check-processing/): Check OCR and data extraction
  - [Receipt Processing](./features/receipt-processing/): Receipt OCR and data extraction
  - [OCR](./features/ocr/): OCR processing and Mistral integration
  - [Validation](./features/validation/): Validation system using Zod
- [Guides](./guides/): How-to guides and tutorials
  - [Development](./guides/development/): Local development setup
  - [Testing](./guides/testing/): Testing procedures and tools
  - [Deployment](./guides/deployment/): Deployment procedures and configurations
- [Tools](./tools/): Documentation for project tools and utilities
- [Processes](./processes/): Development workflows and processes
- [Technical Reports](./technical-reports/): In-depth research and technical analysis

## Key Documents

### Architecture
- [System Architecture](./architecture/system-architecture.md): Overview of the system architecture
- [Dependency Injection System](./architecture/dependency-injection-system.md): DI pattern implementation

### API
- [OpenAPI Specification](./api/openapi-specification.md): API documentation details
- [Swagger UI Guide](./api/swagger-ui-guide.md): Using the Swagger UI for API testing

### Features
- [Check Processing Design](./features/check-processing/check-processing-design.md): Check processing implementation
- [Receipt Processing Design](./features/receipt-processing/receipt-processing-design.md): Receipt processing implementation
- [OCR Processing Design](./features/ocr/ocr-processing-design.md): OCR implementation details

### Guides
- [Local Development](./guides/development/local-development.md): Setting up local development
- [Testing Architecture](./guides/testing/testing-architecture.md): Testing framework and methodology
- [Deployment Guide](./guides/deployment/deployment.md): Deployment process

### Technical Reports
- [Authentication Options](./technical-reports/authentication-options-report.md): Research on authentication and authorization options for mobile and web applications

## Contributing to Documentation

When contributing to documentation:

1. Place new documents in the appropriate category directory
2. Use descriptive filenames with kebab-case (e.g., `feature-description.md`)
3. Include a clear title and description at the top of each document
4. Link related documents to provide navigation between topics
5. Update this README.md when adding significant new documentation

## Documentation Standards

- Use Markdown format for all documentation
- Include code examples where appropriate
- Diagrams should be created with Mermaid or as images in the images directory
- Keep documentation up-to-date with code changes