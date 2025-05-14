# Cloudflare Workers Deployment Guide

> Copyright © 2025 [Nolock.social](https://nolock.social). All rights reserved.  
> Authored by: [O2.services](https://o2.services)  
> Contact: [sales@o2.services](mailto:sales@o2.services)  
> Licensed under the [GNU Affero General Public License v3.0 or later](https://www.gnu.org/licenses/agpl-3.0.html) (AGPL-3.0-or-later)

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Cloudflare Account Setup](#cloudflare-account-setup)
4. [Setting Up Your Local Environment](#setting-up-your-local-environment)
5. [Understanding Environments](#understanding-environments)
6. [Manual Deployment Process](#manual-deployment-process)
7. [Automated Deployment with GitHub Actions](#automated-deployment-with-github-actions)
8. [Environment Variables and Secrets](#environment-variables-and-secrets)
9. [Deployment Verification](#deployment-verification)
10. [Troubleshooting Common Issues](#troubleshooting-common-issues)
11. [Rollback Procedures](#rollback-procedures)
12. [Monitoring Your Deployed Application](#monitoring-your-deployed-application)
13. [Deployment Checklist](#deployment-checklist)

## Introduction

This guide provides detailed, step-by-step instructions for deploying the OCR Checks Server to Cloudflare Workers. It is designed for users of all experience levels, including those who are new to Cloudflare Workers or deployment processes in general.

The OCR Checks Server is deployed as a Cloudflare Worker that processes images using Mistral AI for optical character recognition (OCR). This guide covers both manual deployment for individual developers and automated deployment using GitHub Actions for team environments.

## Prerequisites

Before you begin the deployment process, ensure you have:

1. **Cloudflare Account**:
   - A Cloudflare account with Workers enabled
   - Access to the Cloudflare dashboard
   - Properly configured domain (if using custom domains)

2. **API Credentials**:
   - Cloudflare API token with Workers deployment permissions
   - Mistral AI API key for OCR processing

3. **Development Tools**:
   - Node.js (version 16 or higher) installed on your computer
   - npm (Node Package Manager) installed on your computer
   - Git installed on your computer
   - A code editor (Visual Studio Code, Sublime Text, etc.)

4. **Project Access**:
   - Access to the OCR Checks Server repository
   - Proper permissions to deploy to Cloudflare
   - For GitHub Actions: Admin access to the repository settings

## Cloudflare Account Setup

Setting up your Cloudflare account correctly is crucial for a successful deployment. This section will guide you through the necessary steps to create and configure your Cloudflare account for Workers deployment.

### Creating a Cloudflare Account

1. **Sign Up for Cloudflare**:
   - Visit [cloudflare.com](https://www.cloudflare.com/) and click "Sign Up"
   - Enter your email address and create a password
   - Verify your email address by clicking the link in the verification email

2. **Complete Account Setup**:
   - After verifying your email, log in to Cloudflare
   - Complete your profile by providing the requested information
   - No payment information is required for using Workers with the free plan

### Enabling Cloudflare Workers

1. **Access Workers Dashboard**:
   - Log in to your Cloudflare account
   - From the navigation menu, select "Workers & Pages"
   - If this is your first time, you'll see a welcome page with an overview of Workers

2. **Set Up Workers Subdomain**:
   - Cloudflare will prompt you to create a workers.dev subdomain
   - Choose a unique subdomain name (e.g., `your-organization.workers.dev`)
   - This subdomain will be used for your worker URLs if you don't use custom domains
   - Click "Create subdomain" to continue

   ![Workers Subdomain Setup](./images/deployment/workers-subdomain-setup.png)

3. **Verify Workers Access**:
   - Make sure you can access the Workers dashboard
   - You should see options to create new Workers and manage existing ones
   - If you encounter any issues, refer to Cloudflare's [official documentation](https://developers.cloudflare.com/workers/)

### Creating API Tokens

To deploy workers using Wrangler or GitHub Actions, you'll need to create an API token with appropriate permissions:

1. **Generate API Token**:
   - In the Cloudflare dashboard, click on your profile icon in the top-right corner
   - Select "My Profile"
   - Navigate to the "API Tokens" tab
   - Click "Create Token"

2. **Configure Token Permissions**:
   - Select "Create Custom Token"
   - Give your token a descriptive name (e.g., "OCR Checks Worker Deployment")
   - Set the following permissions:
     - Zone - Workers Routes: Edit
     - Account - Workers Scripts: Edit
     - Account - Workers KV Storage: Edit
   - Set the Account Resources to "Include - All Accounts"
   - Set an appropriate expiration date for security (or no expiration for long-term use)
   - Click "Continue to Summary"

   ![API Token Creation](./images/deployment/api-token-creation.png)

3. **Save Your Token**:
   - After reviewing the summary, click "Create Token"
   - Copy and securely store the generated token
   - **IMPORTANT**: This token will only be displayed once. If you lose it, you'll need to create a new one.

### Configuring Custom Domains (Optional)

If you want to use your own domain name instead of the workers.dev subdomain, follow these steps:

1. **Add a Domain to Cloudflare**:
   - Go to the Cloudflare dashboard
   - Click "Add a Site" and enter your domain name
   - Follow the instructions to set up your DNS records
   - Change your domain's nameservers to the ones provided by Cloudflare
   - Wait for the DNS changes to propagate (may take up to 24 hours)

2. **Create a Worker Route**:
   - From the Workers dashboard, click "Routes" in the sidebar
   - Click "Add route"
   - Enter the route pattern for your domain (e.g., `api.yourdomain.com/*`)
   - Select your worker from the dropdown menu
   - Click "Save"

3. **Configure DNS Records**:
   - Go to the DNS dashboard for your domain
   - Add an A record pointing to Cloudflare's IP address (typically 192.0.2.1)
   - Add a CNAME record for your subdomain (e.g., `api.yourdomain.com`) pointing to your domain
   - Ensure the proxy status is enabled (orange cloud icon)

4. **Verify Custom Domain Setup**:
   - After DNS propagation, your worker should be accessible via your custom domain
   - Test the deployment using your custom domain URL

### Upgrading Your Plan (Optional)

The free Workers plan has certain limitations. If you need additional resources or features, you might want to upgrade:

1. **Review Plan Options**:
   - Go to Workers dashboard
   - Click on "Usage" in the sidebar
   - Review your current usage and available plans
   - Click "Change" next to your current plan to see available upgrades

2. **Select an Appropriate Plan**:
   - Workers Paid: For production workloads with higher request limits and CPU time
   - Workers Unbound: For more demanding applications with flexible usage-based pricing

3. **Complete Upgrade Process**:
   - Follow the prompts to add payment information
   - Review the terms and pricing
   - Confirm your plan selection

### Setting Up Access Policies (For Team Projects)

If you're working in a team environment, you might want to set up access policies:

1. **Create Access Groups**:
   - Go to the Cloudflare dashboard
   - Navigate to "Access" and then "Groups"
   - Create groups for different roles (e.g., "Developers", "Administrators")

2. **Configure Access Policies**:
   - Create policies that define who can deploy to different environments
   - For example, only allow specific developers to deploy to production

3. **Set Up Service Tokens**:
   - For CI/CD systems, create service tokens with appropriate permissions
   - Store these tokens securely in your CI/CD environment

## Setting Up Your Local Environment

Follow these steps to set up your local environment for deployment:

### Step 1: Clone the Repository

1. Open your terminal or command prompt
2. Navigate to your preferred directory for projects
3. Clone the repository using Git:

```bash
git clone https://github.com/your-organization/OCRChecksServer.git
cd OCRChecksServer
```

### Step 2: Install Dependencies

Install all required npm packages:

```bash
npm install
```

### Step 3: Install Wrangler CLI

Wrangler is Cloudflare's command-line tool for managing Workers. Install it globally:

```bash
npm install -g wrangler
```

### Step 4: Authenticate with Cloudflare

Log in to your Cloudflare account through Wrangler:

```bash
wrangler login
```

![Wrangler Login Command](./images/deployment/wrangler-login-command.png)

This will open a browser window asking you to authorize Wrangler to access your Cloudflare account. 

![Cloudflare Login Screen](./images/deployment/cloudflare-login.png)

Follow the prompts to complete the authorization.

### Step 5: Verify Configuration

Ensure the `wrangler.toml` file is properly configured. This file contains the deployment settings for each environment. Review the file to make sure all settings are correct, especially:

- Worker name
- Routes (if applicable)
- Environment variables

If you need to make changes, update the file according to your specific requirements.

## Understanding Environments

The OCR Checks Server supports three deployment environments, each with its own configuration:

### 1. Development Environment
- **Purpose**: Used for ongoing development and testing new features
- **URL**: dev-api.nolock.social or {your-subdomain}.workers.dev
- **Wrangler Environment**: `dev` (default)
- **Configuration**: Less restrictive, may use test API keys
- **When to use**: For daily development work and testing features before staging
- **Note**: This is the default environment for all deployment and monitoring tools

### 2. Staging Environment
- **Purpose**: Pre-production testing and validation
- **URL**: staging-api.nolock.social
- **Wrangler Environment**: `staging`
- **Configuration**: Mirrors production settings but uses non-production data
- **When to use**: For final testing before moving to production

### 3. Production Environment
- **Purpose**: Live, user-facing service
- **URL**: api.nolock.social
- **Wrangler Environment**: `production`
- **Configuration**: Optimized for performance and security
- **When to use**: Only for validated, tested code ready for end users

Each environment has its own section in the `wrangler.toml` file, with specific settings tailored to that environment's requirements.

## Manual Deployment Process

This section covers manual deployment using the Wrangler CLI. Follow these steps for each environment:

### Step 1: Set Up Environment Variables

The recommended approach is to create a `.dev.vars` file in the project root with your environment variables:

```
MISTRAL_API_KEY=your-api-key-here
```

This file will be automatically used by Wrangler for local development and by our deployment scripts to set up secrets in Cloudflare.

Alternatively, you can set the environment variables manually:

```bash
# For Linux/macOS
export MISTRAL_API_KEY=your-api-key-here

# For Windows Command Prompt
set MISTRAL_API_KEY=your-api-key-here

# For Windows PowerShell
$env:MISTRAL_API_KEY="your-api-key-here"
```

Replace `your-api-key-here` with your actual Mistral API key.

### Step 2: Choose Your Target Environment

Decide which environment you want to deploy to: development, staging, or production. The deployment command will differ based on your choice.

### Step 3: Deploy Using Wrangler

Run the appropriate deployment command:

```bash
# For development environment (default)
wrangler deploy 
# or explicitly specify dev environment
wrangler deploy --env dev

# For staging environment
wrangler deploy --env staging

# For production environment
wrangler deploy --env production
```

Alternatively, you can use npm scripts:

```bash
# For development environment (default)
npm run deploy
# or explicitly specify dev environment  
npm run deploy -- --env dev

# For staging environment
npm run deploy -- --env staging

# For production environment
npm run deploy -- --env production
```

You can also use our convenience script which handles setting up secrets:

```bash
# For development environment (default)
bash scripts/deploy-with-secrets.sh

# For staging environment
bash scripts/deploy-with-secrets.sh staging

# For production environment
bash scripts/deploy-with-secrets.sh production
```

### Step 4: Wait for Deployment Completion

The deployment process may take a few minutes. Wrangler will show a progress indicator and display a confirmation message when the deployment is complete. The output should look similar to:

```
Deploying to env "dev"...
Successfully deployed to https://dev-api.nolock.social
```

![Wrangler Deployment Command](./images/deployment/wrangler-deployment-command.png)

### Step 5: Verify the Deployment

After the deployment completes, verify that the service is working correctly:

1. Visit the health endpoint:
   - Development: https://dev-api.nolock.social/health
   - Staging: https://staging-api.nolock.social/health
   - Production: https://api.nolock.social/health

2. Check the version number in the response to confirm the deployed version

![Health Endpoint Verification](./images/deployment/health-endpoint-verification.png)

## Automated Deployment with GitHub Actions

The OCR Checks Server project uses GitHub Actions for automated deployment, following the GitFlow workflow. Here's how it works:

### Understanding the Automated Workflow

The deployment is automatically triggered based on the branch:

1. **Develop Branch**: Any push to the `develop` branch deploys to the development environment
2. **Release Branches**: Any push to a branch starting with `release/` deploys to the staging environment
3. **Main Branch**: Any push to the `main` branch deploys to the production environment

### Viewing Deployment Status

To view the status of automated deployments:

1. Go to the GitHub repository
2. Click on the "Actions" tab
3. Find the relevant workflow run
4. Check the deployment progress and status

![GitHub Actions Workflow](./images/deployment/github-actions-workflow.png)

### Manual Triggering of Workflows

You can also manually trigger deployments:

1. Go to the GitHub repository
2. Click on the "Actions" tab
3. Select the appropriate workflow (e.g., "Deploy to Production")
4. Click "Run workflow"
5. Select the branch and confirm

## Environment Variables and Secrets

Proper management of environment variables and secrets is crucial for secure deployments.

### Required Environment Variables

The OCR Checks Server requires the following environment variables:

1. **MISTRAL_API_KEY**: API key for Mistral AI services

### Setting Up Secrets in GitHub

For automated deployments using GitHub Actions, set up secrets:

1. Go to your GitHub repository
2. Click on "Settings"
3. Select "Secrets and variables" from the left sidebar
4. Click on "Actions"
5. Click "New repository secret"
6. Add each required secret:
   - Name: `MISTRAL_API_KEY`
   - Value: Your Mistral API key
   - Name: `CF_API_TOKEN`
   - Value: Your Cloudflare API token
7. Click "Add secret"

![GitHub Secrets Setup](./images/deployment/github-secrets-setup.png)

### Setting Up Secrets in Cloudflare

For enhanced security, you can also set up secrets directly in Cloudflare:

1. Log in to the Cloudflare dashboard
2. Navigate to "Workers & Pages"
3. Select your worker
4. Go to the "Settings" tab
5. Scroll to "Environment Variables"
6. Add each required variable, marking sensitive values as "Encrypted"
7. Click "Save"

## Deployment Verification

After deployment, verify that the application is functioning correctly.

### Basic Verification

1. **Health Check**: Visit the health endpoint (/health) to ensure the server is responding
2. **Version Check**: Confirm the displayed version matches the expected deployment version
3. **API Test**: Perform a basic API test by sending a test image to the appropriate endpoint

### Comprehensive Verification

For a more thorough verification, use the following steps:

1. **Check Logs**: Review Cloudflare Workers logs for any errors or warnings
2. **Verify Environment Variables**: Ensure all environment variables are correctly set
3. **Performance Test**: Test response times to ensure they meet performance requirements
4. **Feature Verification**: Test all key features to ensure they're working as expected

## Troubleshooting Common Issues

Here are solutions for common deployment issues:

### Authentication Failures

**Issue**: Wrangler fails to authenticate with Cloudflare.

**Solution**:
1. Run `wrangler login` again to refresh authentication
2. Check if your Cloudflare token has expired
3. Verify you have the correct permissions in your Cloudflare account

### Missing Environment Variables

**Issue**: Deployment fails due to missing environment variables.

**Solution**:
1. Ensure all required environment variables are set
2. Check for typos in environment variable names
3. Verify the variables are set in the correct scope (local terminal, GitHub Secrets, etc.)

### Route Conflicts

**Issue**: Deployment fails due to conflicting routes.

**Solution**:
1. Check if another worker is using the same route
2. Update `wrangler.toml` with a unique route
3. Delete old workers that are no longer needed but may be using the route

### Deployment Timeout

**Issue**: Deployment times out or takes too long.

**Solution**:
1. Check your internet connection
2. Verify Cloudflare's status page for any ongoing issues
3. Try deploying during off-peak hours
4. Break your deployment into smaller chunks if possible

### Worker Size Limit Exceeded

**Issue**: Deployment fails because the worker exceeds Cloudflare's size limits.

**Solution**:
1. Check the size of your bundled worker
2. Optimize dependencies and remove unnecessary packages
3. Implement code splitting if applicable
4. Consider using Cloudflare's Durable Objects for larger applications

## Rollback Procedures

If a deployment causes issues, you may need to rollback to a previous version.

### Using Cloudflare Dashboard

1. Log in to the Cloudflare dashboard
2. Navigate to "Workers & Pages"
3. Select your worker
4. Click on "Versions" tab
5. Find the previous working version
6. Click "Rollback to this version"
7. Confirm the rollback

![Cloudflare Versions Rollback](./images/deployment/cloudflare-versions-rollback.png)

### Using Wrangler CLI

1. Identify the version/tag to rollback to
2. Check out that version in your local repository
3. Deploy using Wrangler:

```bash
git checkout v1.20.0  # Replace with your target version
wrangler deploy --env production  # Replace with your target environment
```

### Using GitHub Actions (Recommended)

1. Create a new release branch from the stable version
2. Push the branch to trigger automatic deployment to staging
3. Verify the rollback works in staging
4. Merge to main to deploy to production

## Monitoring Your Deployed Application

After deployment, it's important to monitor your application to catch any issues.

### Using Cloudflare Analytics

1. Log in to the Cloudflare dashboard
2. Navigate to "Workers & Pages"
3. Select your worker
4. Click on "Analytics" tab
5. Review metrics like requests, errors, and CPU time

![Cloudflare Worker Analytics](./images/deployment/cloudflare-worker-analytics.png)

### Using Wrangler for Real-time Logs

You can view real-time logs using the Wrangler CLI:

```bash
# For development environment (default)
bash scripts/tail-logs.sh

# Filter logs to show only errors
bash scripts/tail-logs.sh --errors

# Filter logs by search term
bash scripts/tail-logs.sh --search "MISTRAL API"

# Tail logs for a specific environment
bash scripts/tail-logs.sh --env staging
bash scripts/tail-logs.sh --env production

# Combined options
bash scripts/tail-logs.sh --env staging --errors --search "MISTRAL API"
```

The `tail-logs.sh` script is a convenience wrapper around the Wrangler tail command that automatically targets the dev environment by default.

### Using Cloudflare Dashboard for Logs

1. Log in to the Cloudflare dashboard
2. Navigate to "Workers & Pages"
3. Select your worker
4. Click on "Logs" tab
5. Choose "Real-time" to see live logs
6. Filter logs by status code, method, or other criteria

![Cloudflare Worker Logs](./images/deployment/cloudflare-worker-logs.png)

### Custom Monitoring

Consider implementing custom monitoring:

1. Set up regular health checks using a service like Uptime Robot
2. Implement error tracking with services like Sentry
3. Create a dashboard for key performance metrics
4. Set up alerts for critical failures

## Deployment Checklist

Use this checklist to ensure a successful deployment:

### Pre-Deployment

- [ ] All tests are passing
- [ ] Code has been reviewed
- [ ] Version number has been updated
- [ ] CHANGELOG.md has been updated
- [ ] Required environment variables are documented
- [ ] Wrangler.toml is correctly configured
- [ ] All dependencies are up-to-date

### During Deployment

- [ ] Correct environment selected
- [ ] Environment variables set correctly
- [ ] Deployment command executed successfully
- [ ] No errors in deployment logs

### Post-Deployment

- [ ] Health endpoint returns 200 OK
- [ ] Version number in response matches expected version
- [ ] API functionality works correctly
- [ ] Performance metrics are acceptable
- [ ] Logs show no unexpected errors
- [ ] Document any deployment issues and solutions

By following this thorough checklist, you can ensure a smooth deployment process and minimize potential issues.