# Cloudflare URL Discovery and Dynamic Version Testing

## Overview

The OCR Checks Server includes comprehensive tools for automatically discovering Cloudflare Worker URLs and performing version verification across all deployed environments. This eliminates the need for hardcoded URLs and ensures accurate deployment verification.

## Problem Solved

**Previous Approach**: Hardcoded environment URLs that could become outdated
```typescript
const environments = {
  production: 'https://api.nolock.social',      // Might be wrong
  dev: 'https://dev-api.nolock.social',         // Might not exist
  staging: 'https://staging-api.nolock.social'  // Could be outdated
};
```

**Current Approach**: Dynamic discovery from Cloudflare configuration
```typescript
const environments = await discoverWorkingUrls();
// Returns verified, working URLs:
// {
//   production: "https://ocr-checks-worker.af-4a0.workers.dev",
//   dev: "https://ocr-checks-worker-dev.af-4a0.workers.dev", 
//   staging: "https://ocr-checks-worker-staging.af-4a0.workers.dev"
// }
```

## Available Tools

### 1. URL Discovery Scripts

#### `scripts/get-cloudflare-urls.ts`
**Purpose**: Comprehensive URL discovery with multiple methods and output formats

**Usage**:
```bash
# Basic URL discovery
npx tsx scripts/get-cloudflare-urls.ts

# Use Cloudflare API method
npx tsx scripts/get-cloudflare-urls.ts --method api

# Output as JSON
npx tsx scripts/get-cloudflare-urls.ts --format json

# Output as environment variables
npx tsx scripts/get-cloudflare-urls.ts --format env
```

**Features**:
- **Multiple discovery methods**: wrangler CLI or Cloudflare API
- **Flexible output formats**: human-readable, JSON, environment variables
- **URL verification**: Tests discovered URLs for accessibility
- **Account subdomain detection**: Automatically finds Cloudflare account subdomain

#### `scripts/simple-url-discovery.ts`
**Purpose**: Lightweight URL discovery with pattern testing

**Usage**:
```bash
# Discover and test URL patterns
npx tsx scripts/simple-url-discovery.ts

# Export as TypeScript constants
npx tsx scripts/simple-url-discovery.ts --format typescript
```

**Features**:
- **Pattern testing**: Tests known URL patterns for accessibility
- **Worker name parsing**: Reads configuration from `wrangler.toml`
- **Verification**: Confirms URLs respond to health checks
- **Export support**: Can be imported by other scripts

### 2. Dynamic Version Testing

#### `scripts/dynamic-version-smoke-test.ts`
**Purpose**: Comprehensive version verification with automatic URL discovery

**Usage**:
```bash
# Test all environments
npx tsx scripts/dynamic-version-smoke-test.ts --env all

# Test specific environment
npx tsx scripts/dynamic-version-smoke-test.ts --env production

# Verbose output with full responses
npx tsx scripts/dynamic-version-smoke-test.ts --env all --verbose
```

**Features**:
- **Automatic URL discovery**: No hardcoded URLs needed
- **Multi-environment testing**: Test single or all environments
- **Version comparison**: Compares deployed version with `package.json`
- **Health verification**: Checks service health and API key status
- **Comprehensive reporting**: Color-coded results with detailed analysis

#### Enhanced `scripts/version-smoke-test.ts`
**Purpose**: Static URL version testing (maintained for compatibility)

**Usage**:
```bash
# Test with predefined URLs
npm run test:version:production
npm run test:version:dev
```

## NPM Scripts

### Dynamic URL Discovery Tests
```bash
# Test all environments with auto-discovery
npm run test:version:dynamic

# Test specific environments
npm run test:version:dynamic:production
npm run test:version:dynamic:dev
npm run test:version:dynamic:staging
```

### Static URL Tests (Compatibility)
```bash
# Test with predefined URLs
npm run test:version
npm run test:version:production
npm run test:version:dev
npm run test:version:staging
```

## How URL Discovery Works

### Step 1: Configuration Parsing
The tools parse `wrangler.toml` to extract worker names:

```toml
name = "ocr-checks-worker"

[env.dev]
name = "ocr-checks-worker-dev"

[env.staging]
name = "ocr-checks-worker-staging"
```

### Step 2: URL Pattern Construction
Using discovered worker names and account subdomain:

```typescript
const workerNames = {
  production: "ocr-checks-worker",
  dev: "ocr-checks-worker-dev",
  staging: "ocr-checks-worker-staging"
};

const accountSubdomain = "af-4a0"; // Discovered from Cloudflare

const urls = {
  production: `https://${workerNames.production}.${accountSubdomain}.workers.dev`,
  dev: `https://${workerNames.dev}.${accountSubdomain}.workers.dev`,
  staging: `https://${workerNames.staging}.${accountSubdomain}.workers.dev`
};
```

### Step 3: URL Verification
Each discovered URL is tested for accessibility:

```typescript
async function testUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

## Discovery Methods

### Method 1: Wrangler CLI
**Requirements**: Authenticated with `wrangler auth login`

**Process**:
1. Parse worker names from `wrangler.toml`
2. Query account information with `wrangler whoami`
3. Extract subdomain from deployment history
4. Construct and verify URLs

**Advantages**:
- Uses existing authentication
- No additional API tokens required
- Leverages local wrangler configuration

### Method 2: Cloudflare API
**Requirements**: `CLOUDFLARE_API_TOKEN` environment variable

**Process**:
1. Query account information via Cloudflare API
2. Get worker details for each environment
3. Retrieve account subdomain information
4. Construct and verify URLs

**Advantages**:
- Direct API access
- More reliable for automation
- Can be used in CI/CD pipelines

### Method 3: Pattern Testing
**Requirements**: None (fallback method)

**Process**:
1. Parse worker names from `wrangler.toml`
2. Test known subdomain patterns (e.g., `af-4a0`)
3. Verify URL accessibility
4. Use working patterns for URL construction

**Advantages**:
- No authentication required
- Works offline for known patterns
- Fast and reliable for established deployments

## Integration with Existing Tools

### Enhanced Smoke Tests
The dynamic URL discovery integrates with existing smoke test infrastructure:

```bash
# Traditional smoke tests (updated to use package.json version)
bash scripts/smoke-test.sh

# Dynamic smoke tests with URL discovery
npm run test:version:dynamic
```

### Integration Tests
Health integration tests now include version comparison:

```typescript
// tests/integration/health.test.ts
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const expectedVersion = packageJson.version;
expect(body.version).toBe(expectedVersion);
```

### CI/CD Integration
The tools can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions usage
- name: Verify Deployment Versions
  run: npm run test:version:dynamic
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Output Examples

### URL Discovery Output
```
Cloudflare Environment URL Discovery
Method: wrangler
Format: urls

Found workers:
  production: ocr-checks-worker
  dev: ocr-checks-worker-dev
  staging: ocr-checks-worker-staging

Environment URLs:
  production  : https://ocr-checks-worker.af-4a0.workers.dev
  dev         : https://ocr-checks-worker-dev.af-4a0.workers.dev
  staging     : https://ocr-checks-worker-staging.af-4a0.workers.dev
  local       : http://localhost:8787
```

### Dynamic Version Test Output
```
========================================
Dynamic Version Smoke Test
========================================
Target: all
Timestamp: 2025-06-10T23:15:13.613Z

Source version: 1.63.0 (from package.json)

Discovering environment URLs from Cloudflare...
Found worker configurations:
  production: ocr-checks-worker
  dev: ocr-checks-worker-dev
  staging: ocr-checks-worker-staging

Testing production environment
URL: https://ocr-checks-worker.af-4a0.workers.dev
✓ production - Version Format: Valid semver: 1.63.0
✓ production - Version Match: Source and deployed both at 1.63.0
✓ production - Health Status: Service status: ok

Testing dev environment
URL: https://ocr-checks-worker-dev.af-4a0.workers.dev
✓ dev - Version Format: Valid semver: 1.63.0
✓ dev - Version Match: Source and deployed both at 1.63.0
✓ dev - Health Status: Service status: ok

Testing staging environment
URL: https://ocr-checks-worker-staging.af-4a0.workers.dev
✓ staging - Version Format: Valid semver: 1.63.0
✓ staging - Version Match: Source and deployed both at 1.63.0
✓ staging - Health Status: Service status: ok

Test Summary:
  production  : PASSED
  dev         : PASSED
  staging     : PASSED
  local       : PASSED

Overall: 4/4 environments passed

✅ SUCCESS: All environments have correct version deployed
```

## Error Handling

### Common Issues and Solutions

#### 1. Authentication Issues
```
Error: Not authenticated with Cloudflare. Run: wrangler auth login
```
**Solution**: Run `wrangler auth login` to authenticate

#### 2. Missing API Token
```
Error: CLOUDFLARE_API_TOKEN environment variable is required for API method
```
**Solution**: Set `CLOUDFLARE_API_TOKEN` environment variable

#### 3. Network Connectivity
```
Error: Failed to get deployed version: TypeError: fetch failed
```
**Solution**: Check network connectivity and URL accessibility

#### 4. Version Mismatch
```
❌ FAILURE: Some environments have version mismatches
Source: 1.63.0, Deployed: 1.62.0
```
**Solution**: 
1. Check deployment status for failed environments
2. Re-deploy if necessary
3. Verify network connectivity to failed environments

## Best Practices

### 1. Use Dynamic Discovery for Automation
```bash
# Preferred for CI/CD and automated testing
npm run test:version:dynamic
```

### 2. Combine with Regular Smoke Tests
```bash
# Complete verification workflow
npm run test:version:dynamic && npm run test:smoke
```

### 3. Test Before and After Deployments
```bash
# Pre-deployment verification
npm run test:version:dynamic

# Deploy
npm run deploy:production

# Post-deployment verification
npm run test:version:dynamic:production
```

### 4. Use Appropriate Discovery Method
- **Local development**: Pattern testing (fastest)
- **CI/CD pipelines**: Cloudflare API (most reliable)
- **Manual testing**: Wrangler CLI (most convenient)

## Troubleshooting

### URL Discovery Fails
1. **Check wrangler.toml**: Ensure worker names are correctly configured
2. **Verify authentication**: Run `wrangler whoami` to check authentication status
3. **Test patterns manually**: Try accessing URLs directly in browser
4. **Check network**: Ensure connectivity to Cloudflare services

### Version Tests Fail
1. **Check deployment status**: Verify latest code was deployed
2. **Compare versions manually**: Check `/health` endpoint directly
3. **Verify package.json**: Ensure version is correctly updated
4. **Check service health**: Ensure all services are running properly

### API Token Issues
1. **Verify token permissions**: Ensure token has appropriate Cloudflare permissions
2. **Check token format**: Ensure token is correctly formatted
3. **Test token separately**: Try using token with Cloudflare API directly

## Related Documentation

- [Testing Architecture](../guides/testing/testing-architecture.md)
- [Deployment Guide](../guides/deployment/deployment.md)
- [Smoke Testing Guide](../guides/testing/smoke-testing.md)
- [CI/CD Pipeline Configuration](../guides/deployment/cicd-pipeline.md)