# GitHub Actions CI/CD Pipeline

This directory contains GitHub Actions workflows for the OCR Checks Server project.

## Workflows

### CI Workflow (`ci.yml`)
- **Trigger**: Push to main/develop branches, pull requests, manual dispatch
- **Purpose**: Fast feedback with unit tests only (28 tests, ~10 seconds)
- **Matrix**: Tests on Node.js 18.x and 20.x
- **Command**: `npm run ci` (uses `scripts/ci-cd-pipeline.sh --ci-only`)

### CD Workflow (`cd.yml`)
- **Trigger**: Push to main/develop, releases, manual dispatch with environment selection
- **Purpose**: Deploy to environments and run smoke tests
- **Environments**: dev, staging, production
- **Command**: `npm run cd` or `npm run deploy:{env}` (uses `scripts/ci-cd-pipeline.sh`)

## Required Repository Secrets

To use these workflows, configure the following secrets in your GitHub repository:

### Navigate to Repository Settings
1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each of the following:

### Required Secrets

#### `MISTRAL_API_KEY`
- **Description**: API key for Mistral AI service used for OCR and JSON extraction
- **Format**: String (e.g., `mk-1234567890abcdef...`)
- **Where to get**: [Mistral AI Console](https://console.mistral.ai/)
- **Usage**: Required for all OCR and document processing functionality

#### `CLOUDFLARE_API_TOKEN`
- **Description**: Cloudflare API token for Workers deployment
- **Format**: String (e.g., `abcd1234567890...`)
- **Where to get**: Cloudflare Dashboard → My Profile → API Tokens
- **Permissions needed**:
  - Zone:Zone:Read
  - Zone:Zone Settings:Edit
  - Account:Cloudflare Workers:Edit
- **Usage**: Required for deploying to Cloudflare Workers environments

### Environment-Specific Configuration

The workflows support deployment to multiple environments:
- **dev**: Development environment (`ocr-checks-worker-dev.af-4a0.workers.dev`)
- **staging**: Staging environment (same URL, different wrangler config)
- **production**: Production environment (`ocr-checks-worker.af-4a0.workers.dev`)

Environment selection is handled automatically:
- Manual dispatch: User selects environment
- Push to `main`: Deploys to production
- Push to `develop`: Deploys to dev
- Pull requests: CI only (no deployment)

### Workflow Features

#### CI Pipeline
- ✅ Fast unit tests (28 tests in ~10 seconds)
- ✅ Multi-node version testing
- ✅ Artifact upload for test results
- ✅ Lightweight and reliable

#### CD Pipeline
- ✅ Environment-specific deployment
- ✅ Automatic secret management
- ✅ Smoke tests with real API calls
- ✅ Deployment status notifications
- ✅ Failure handling and logging
- ✅ Manual environment selection option

### Manual Workflow Dispatch

Both workflows support manual triggering:

1. Go to **Actions** tab in your repository
2. Select the workflow (CI or CD)
3. Click **Run workflow**
4. For CD workflow: Select target environment and options
5. Click **Run workflow** to start

### Local Testing

Before relying on GitHub Actions, test the pipelines locally:

```bash
# Test CI pipeline locally
npm run ci

# Test CD pipeline locally  
npm run cd

# Test single environment deployment
npm run deploy:dev
npm run deploy:staging
npm run deploy:production
```

### Troubleshooting

#### Common Issues

1. **Missing API Keys**: Ensure both `MISTRAL_API_KEY` and `CLOUDFLARE_API_TOKEN` are set
2. **Deployment Failures**: Check Cloudflare account permissions and API token scope
3. **Smoke Test Failures**: Verify deployed endpoints are responding correctly
4. **Node Version Issues**: Workflows test on Node 18.x and 20.x

#### Debug Steps

1. Check workflow logs in GitHub Actions tab
2. Review uploaded artifacts for detailed error information
3. Test deployment locally with same secrets
4. Verify Cloudflare Workers dashboard for deployment status

### Pipeline Architecture

The GitHub Actions workflows integrate with the existing bash-based CI/CD pipeline:

```
CI Workflow (ci.yml)
├── npm run ci
└── scripts/ci-cd-pipeline.sh --ci-only
    └── Unit Tests (28 tests, ~10s)

CD Workflow (cd.yml)  
├── npm run cd (automatic)
│   └── scripts/ci-cd-pipeline.sh
│       ├── Deploy dev → staging → production
│       └── Smoke tests for each environment
└── npm run deploy:{env} (manual)
    └── scripts/ci-cd-pipeline.sh --env {env}
        ├── Deploy to specific environment
        └── Smoke tests for that environment
```

This architecture ensures consistency between local development and CI/CD execution.