# Throttling Cloudflare Worker to Respect Mistral Rate Limit

## Overview

This guide explains how to implement rate limiting in a Cloudflare Worker to respect Mistral API's rate limits. The solution uses Durable Objects to maintain a global counter across all Worker instances.

## Scenario

You have a Cloudflare Worker that invokes the Mistral model via RESTful API.  
Mistral allows **6 invocations per second**.

Each Worker call makes **2 Mistral API calls**, so your Worker must be throttled to **3 requests per second** globally.

## Solution: Global Rate Limiting with Durable Objects

Cloudflare's **Durable Objects** provide shared, persistent state—perfect for implementing a global rate limiter.

### Step 1: Define a Durable Object

```typescript
export class RateLimiter {
  private count: number = 0;
  private resetTime: number = Date.now() + 1000; // 1 second window

  async fetch(request: Request): Promise<Response> {
    const now = Date.now();

    if (now > this.resetTime) {
      this.count = 0;
      this.resetTime = now + 1000;
    }

    if (this.count >= 3) {
      return new Response("Too Many Requests", { status: 429 });
    }

    this.count++;
    return new Response("Request allowed");
  }
}
```

### Step 2: Bind Durable Object in `wrangler.toml`

```toml
[[durable_objects]]
name = "RATE_LIMITER"
class_name = "RateLimiter"

[vars]
RATE_LIMITER = "RATE_LIMITER"
```

### Step 3: Use Durable Object in Your Worker

```typescript
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const id = env.RATE_LIMITER.idFromName("global");
    const stub = env.RATE_LIMITER.get(id);
    return await stub.fetch(request);
  }
};
```

## Implementation Details

Durable Objects act as a **temporal gatekeeper**—a memory shard across Worker invocations. This design enforces rate limits without losing distributed performance benefits.

### How It Works

1. A single Durable Object instance tracks requests across all Worker instances
2. The counter resets every second, allowing 3 requests per second
3. When the limit is reached, subsequent requests receive a 429 status code
4. Clients should implement retry with exponential backoff when receiving 429 responses

## Integration with Mistral API Client

When integrating with your Mistral API client:

```typescript
async function processMistralRequest(request) {
  // First, check with rate limiter
  const rateLimiterResponse = await checkRateLimit();
  
  if (rateLimiterResponse.status === 429) {
    return new Response("Service busy, try again later", { status: 429 });
  }
  
  // Continue with Mistral API calls
  const result1 = await callMistralAPI(request.data.part1);
  const result2 = await callMistralAPI(request.data.part2);
  
  return new Response(JSON.stringify({ results: [result1, result2] }));
}
```

## Result

With this setup:
- You'll respect the 6 RPS limit imposed by Mistral
- Your Cloudflare Worker will scale safely
- You avoid hitting throttling errors or being blocked by the Mistral API

## Best Practices

1. Implement retry logic in clients to handle 429 responses
2. Monitor rate limit usage to optimize performance
3. Consider implementing a queue for high-traffic periods
4. Add telemetry to track rate limit hits and API call volumes