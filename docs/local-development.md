# Local Development Guide

This document provides instructions for setting up and running the OCR Checks Server locally for development purposes.

## Prerequisites

Before starting local development, ensure you have:

1. Node.js (version 18 or later)
2. npm or yarn
3. A Mistral AI API key 

## Setting Up the Environment

1. Clone the repository
   ```bash
   git clone https://github.com/your-org/OCRChecksServer.git
   cd OCRChecksServer
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set the Mistral API key as an environment variable
   ```bash
   export MISTRAL_API_KEY=your_api_key
   ```

## Starting the Server Locally

We provide a convenient script that handles starting the server with the proper configuration:

```bash
./scripts/start-local.sh
```

By default, the server will start on port 8787. You can access the API at `http://localhost:8787`.

### Options

The start script supports the following options:

- `--watch`: Start in watch mode, which automatically restarts the server when files change
  ```bash
  ./scripts/start-local.sh --watch
  ```

- `--port=XXXX`: Specify a custom port
  ```bash
  ./scripts/start-local.sh --port=3000
  ```

## Testing the API

Once the server is running, you can test it using:

1. Health check:
   ```bash
   curl http://localhost:8787/health
   ```

2. Process an image:
   ```bash
   curl -X POST \
     -H "Content-Type: image/jpeg" \
     --data-binary @path/to/your/image.jpg \
     http://localhost:8787/process
   ```

3. Process a check specifically:
   ```bash
   curl -X POST \
     -H "Content-Type: image/jpeg" \
     --data-binary @path/to/your/check.jpg \
     http://localhost:8787/check
   ```

4. Process a receipt specifically:
   ```bash
   curl -X POST \
     -H "Content-Type: image/jpeg" \
     --data-binary @path/to/your/receipt.jpg \
     http://localhost:8787/receipt
   ```

## Development Workflow

1. Start the server in watch mode
2. Make changes to the code
3. The server will automatically restart with your changes
4. Use the test commands above to verify your changes

## Troubleshooting

- **MISTRAL_API_KEY not set**: Ensure you've exported your API key before running the script
- **Port already in use**: Specify a different port using the `--port` option
- **Dependencies issues**: Try removing `node_modules` and running `npm install` again