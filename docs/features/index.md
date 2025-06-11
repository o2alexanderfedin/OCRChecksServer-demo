# ⚙️ OCR Checks Server - Features Documentation

---
**🏠 [Home](../../README.md)** | **📚 [Documentation](../README.md)** | **⚙️ You are here: Features Overview**
---

This directory contains detailed documentation for the core features of the OCR Checks Server.

## 🎯 Feature Categories

### 🔄 Core Processing Features

#### 📄 [**Check Processing**](./check-processing/)
- [Check Processing Design](./check-processing/check-processing-design.md): Architecture and implementation details for check OCR processing
- [Check Schema Documentation](./check-processing/check-schema-documentation.md): Data schema validation for check processing

#### 🧾 [**Receipt Processing**](./receipt-processing/)
- [Receipt Processing Design](./receipt-processing/receipt-processing-design.md): Architecture and implementation details for receipt OCR processing
- [Receipt Scanner Design](./receipt-processing/receipt-scanner-design.md): Receipt scanning implementation
- [Receipt Extractor Design](./receipt-processing/receipt-extractor-design.md): Receipt data extraction design
- [Receipt Schema Documentation](./receipt-processing/receipt-schema-documentation.md): Data schema validation for receipt processing
- [Receipt Schema Implementation](./receipt-processing/receipt-schema-implementation.md): Technical implementation details

#### 📊 [**JSON Extraction**](./json-extraction/)
- [Cloudflare JSON Extractor Design](./json-extraction/cloudflare-json-extractor-design.md): JSON extraction from OCR text using Cloudflare Workers
- [Execution Plan](./json-extraction/execution-plan.md): Implementation execution strategy
- [SOLID, KISS, DRY Validation](./json-extraction/solid-kiss-dry-validation.md): Design principles validation

#### 👁️ [**OCR Processing**](./ocr/)
- [OCR Processing Design](./ocr/ocr-processing-design.md): OCR implementation architecture and design patterns
- [Cloudflare Worker Mistral Compatibility](./ocr/cloudflare-worker-mistral-compatibility.md): Mistral API integration with Cloudflare Workers
- [Mistral API Error Handling](./ocr/mistral-api-error-handling.md): Error handling strategies for Mistral API
- [Mistral Retry Policy](./ocr/mistral-retry-policy.md): Retry mechanism for API resilience

#### ✅ [**Validation**](./validation/)
- [Zod Validation Design](./validation/zod-validation-design.md): Validation system architecture using Zod
- [Nested Validation Error Propagation](./validation/nested-validation-error-propagation.md): Error handling for complex validation scenarios
- [Nested Validation Errors](./validation/nested-validation-errors.md): Detailed error reporting implementation

## 🔗 Integration and Architecture

The features in this directory work together to provide a comprehensive OCR and data extraction solution:

1. 👁️ **OCR Processing** converts images to text using Mistral AI
2. 📊 **JSON Extraction** structures the OCR text into usable data formats
3. 📄🧾 **Check/Receipt Processing** applies domain-specific logic for different document types
4. ✅ **Validation** ensures data quality and schema compliance throughout the pipeline

## 🔗 Cross-References

- 🏗️ [System Architecture](../architecture/system-architecture.md): Overall system design
- 🔌 [API Documentation](../api/): REST API specifications
- 🧪 [Testing Documentation](../guides/testing/): Testing strategies for features
- 🚀 [Deployment Guides](../guides/deployment/): Feature deployment procedures

## 📝 Contributing

When adding new features:

1. 📁 Create a new subdirectory for the feature
2. 📋 Include design documentation explaining the architecture
3. ✅ Document schemas and validation rules
4. 💻 Provide implementation details and examples
5. 🔄 Update this index with appropriate cross-references

---
**🏠 [Home](../../README.md)** | **📚 [Documentation](../README.md)** | **⚙️ Features Overview** | **⬆️ [Top](#-ocr-checks-server---features-documentation)**
---