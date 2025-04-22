# OCR Checks Worker

A Cloudflare Worker that uses Mistral AI to perform OCR on paper checks and extract relevant information.

## Features

- Accepts image uploads of paper checks
- Uses Mistral AI's vision capabilities to analyze the check
- Extracts key information including:
  - Check number
  - Amount
  - Date
  - Payee
  - Payer
  - Bank name
  - Routing number
  - Account number
  - Memo (if present)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your environment:
   - Add your Mistral API key to `wrangler.toml`
   - Deploy using Wrangler:
     ```bash
     npx wrangler deploy
     ```

## Usage

Send a POST request to the worker endpoint with a check image:

```bash
curl -X POST \
  -H "Content-Type: image/jpeg" \
  --data-binary @check.jpg \
  https://your-worker.workers.dev
```

The response will be a JSON object containing the extracted check information.

## Development

To run locally:
```bash
npx wrangler dev
```

## License

ISC 