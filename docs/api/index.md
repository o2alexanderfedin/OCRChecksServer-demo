# 🔌 OCR Checks Server - API Documentation

---
**🏠 [Home](../../README.md)** | **📚 [Documentation](../README.md)** | **🔌 You are here: API Overview**
---

This directory contains comprehensive API documentation for the OCR Checks Server REST API.

## 📋 API Documentation Components

### 🔌 Core API Documentation

- [OpenAPI Specification](./openapi-specification.md): Complete API specification details and endpoint documentation
- [Swagger UI Guide](./swagger-ui-guide.md): Interactive API testing interface usage guide
- [Swagger UI Troubleshooting](./swagger-ui-troubleshooting.md): Common issues and solutions for Swagger UI

### 📊 Schema Documentation

- [Check Schema Documentation](./check-schema-documentation.md): Data schema validation for check processing endpoints
- [Receipt Schema Documentation](./receipt-schema-documentation.md): Data schema validation for receipt processing endpoints

## 🌐 API Overview

The OCR Checks Server provides a REST API for processing images of checks and receipts using OCR technology. The API is built with Hono framework and deployed on Cloudflare Workers.

### 🔗 Main Endpoints

#### 🌐 Universal Processing
- `POST /process` - Universal document processing endpoint supporting both checks and receipts

#### 📄 Specialized Processing
- `POST /check` - Dedicated check processing endpoint
- `POST /receipt` - Dedicated receipt processing endpoint

#### 🛠️ Utility Endpoints
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation (Swagger UI)

### 🔐 Authentication

The API uses API key authentication via the `X-API-Key` header for production environments.

### 📊 Response Formats

All endpoints support multiple response formats:
- `json` (default): Structured JSON response
- `text`: Plain text OCR output
- `raw`: Raw OCR response data

## 🚀 Getting Started

1. 🔍 **Explore the API**: Start with the [OpenAPI Specification](./openapi-specification.md) for complete endpoint details
2. 🎮 **Interactive Testing**: Use the [Swagger UI Guide](./swagger-ui-guide.md) to test endpoints interactively
3. ✅ **Schema Validation**: Review schema documentation for [checks](./check-schema-documentation.md) and [receipts](./receipt-schema-documentation.md)
4. 🔧 **Troubleshooting**: Refer to [Swagger UI Troubleshooting](./swagger-ui-troubleshooting.md) for common issues

## 🔗 Cross-References

- ⚙️ [Features Documentation](../features/): Implementation details for API features
- 🏗️ [Architecture Documentation](../architecture/): System design and API architecture
- 🧪 [Testing Guides](../guides/testing/): API testing procedures and tools
- 🚀 [Deployment Guides](../guides/deployment/): API deployment configuration

## 💻 Examples

### 📄 Basic Check Processing

```bash
curl -X POST "https://your-api-domain.com/check" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: image/jpeg" \
  --data-binary @check-image.jpg
```

### 🧾 Receipt Processing with JSON Format

```bash
curl -X POST "https://your-api-domain.com/receipt?format=json" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: image/png" \
  --data-binary @receipt-image.png
```

### 🌐 Universal Processing

```bash
curl -X POST "https://your-api-domain.com/process?type=check&format=json" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: image/jpeg" \
  --data-binary @document-image.jpg
```

For more detailed examples and testing procedures, see the [cURL Testing Guide](../guides/testing/curl-testing-guide.md).

---
**🏠 [Home](../../README.md)** | **📚 [Documentation](../README.md)** | **🔌 API Overview** | **⬆️ [Top](#-ocr-checks-server---api-documentation)**
---