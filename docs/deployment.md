# Deployment Guide

> Copyright © 2025 [Nolock.social](https://nolock.social). All rights reserved.  
> Authored by: [O2.services](https://o2.services)  
> Contact: [sales@o2.services](mailto:sales@o2.services)  
> Licensed under the [GNU Affero General Public License v3.0 or later](https://www.gnu.org/licenses/agpl-3.0.html) (AGPL-3.0-or-later)

## Overview

This guide explains the deployment process for the OCR Checks Server to Cloudflare Workers. The deployment is managed through GitHub Actions CI/CD pipelines that automatically deploy to different environments based on the branch structure, following the gitflow workflow.

## Environments

The system has three deployment environments:

1. **Development** (`dev-api.nolock.social`)
   - Deployed automatically when code is pushed to the `develop` branch
   - Used for ongoing development and feature testing

2. **Staging** (`staging-api.nolock.social`)
   - Deployed automatically when code is pushed to a `release/*` branch
   - Used for pre-production testing and verification

3. **Production** (`api.nolock.social`)
   - Deployed automatically when code is pushed to the `main` branch
   - Also supports manual deployment through GitHub Actions workflow dispatch
   - Used for live production traffic

## Deployment Workflow

The deployment follows the gitflow workflow:

1. Feature branches (`feature/*`) are used for development and run CI checks on push
2. When features are complete, they are merged into `develop` which automatically deploys to the development environment
3. When preparing for a release, a release branch (`release/*`) is created which automatically deploys to the staging environment
4. After validation, the release branch is merged into `main` which automatically deploys to production
5. The release branch is also merged back into `develop` to incorporate any changes

## GitHub Actions Workflows

The following GitHub Actions workflows are set up:

1. **CI** (`ci.yml`)
   - Runs on all feature branches, develop, and pull requests
   - Performs linting and unit/functional tests
   - Does not deploy code

2. **Deploy to Dev** (`deploy-dev.yml`)
   - Runs when code is pushed to `develop`
   - Deploys to the development environment

3. **Deploy to Staging** (`deploy-staging.yml`)
   - Runs when code is pushed to any release branch
   - Deploys to the staging environment

4. **Deploy to Production** (`deploy-production.yml`)
   - Runs when code is pushed to `main`
   - Deploys to the production environment
   - Also creates a GitHub Release

## Required Secrets

The following secrets need to be configured in GitHub Actions:

1. `CF_API_TOKEN`: Cloudflare API token with Workers deployment permissions
2. `MISTRAL_API_KEY`: Mistral API key for OCR processing

These should be configured for each environment (development, staging, production) in GitHub Actions environment settings.

## Manual Setup

For initial setup or if you need to deploy manually:

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Log in to Cloudflare:
   ```bash
   wrangler login
   ```

3. Deploy to an environment:
   ```bash
   # For development
   wrangler deploy --env dev
   
   # For staging
   wrangler deploy --env staging
   
   # For production
   wrangler deploy --env production
   ```

Make sure to set the `MISTRAL_API_KEY` environment variable before deploying:

```bash
export MISTRAL_API_KEY=your-api-key
```

## Configuration

The deployment configuration is defined in `wrangler.toml`. Each environment has its own configuration section with specific settings for routes and environment variables.

## Troubleshooting

### Common Issues

1. **Deployment Failed**
   - Check that `CF_API_TOKEN` is properly configured in GitHub secrets
   - Verify that the Cloudflare account has necessary permissions
   - Look for syntax errors in `wrangler.toml`

2. **Application Errors After Deployment**
   - Check that `MISTRAL_API_KEY` is properly configured
   - Examine logs in Cloudflare Workers dashboard
   - Verify the compatibility date in `wrangler.toml`

### Viewing Logs

You can view logs for deployed Workers in the Cloudflare dashboard:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to "Workers & Pages"
3. Select the deployed worker
4. Click on "Logs" tab

## Rollback Procedure

To rollback to a previous version:

1. Identify the version/commit to rollback to
2. Create a new release branch from that commit
3. Deploy to staging to verify functionality
4. Merge to main to deploy to production

For immediate rollbacks, you can use the Cloudflare dashboard to revert to a previous deployment.