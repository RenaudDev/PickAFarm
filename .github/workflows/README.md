# GitHub Actions Workflows Documentation

This document describes all GitHub Actions workflows for the PickAFarm project, including CI/CD and preview deployment automation.

## Overview

PickAFarm uses multiple GitHub Actions workflows to automate:
- **Continuous Integration** - Code quality and testing on every PR
- **Preview Deployments** - Automatic preview URLs for every PR
- **Deployment Automation** - Scheduled and webhook-triggered rebuilds

---

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Trigger**: Pull requests and pushes to `main-clean`

The CI pipeline consists of 4 parallel jobs:

### 1. Lint & Format Check (`lint`)
- **Purpose**: Ensures code follows style guidelines
- **Runs**:
  - ESLint for JavaScript/TypeScript linting
  - Prettier for code formatting verification
- **Timeout**: 10 minutes
- **Requirements**: Must pass for PR to be merged

### 2. Unit Tests (`test`)
- **Purpose**: Runs unit tests and verifies code coverage
- **Runs**:
  - Vitest test suite
  - Coverage report generation (minimum 1% threshold)
- **Artifacts**: Coverage reports are uploaded and retained for 30 days
- **Timeout**: 10 minutes
- **Requirements**: Must pass for PR to be merged

### 3. Build Next.js Frontend (`build-frontend`)
- **Purpose**: Verifies the Next.js static site builds successfully
- **Runs**: `npm run build` in the `web/` directory
- **Timeout**: 15 minutes
- **Note**: Build may fail if Cloudflare D1 secrets are not configured (this is expected)

### 4. Verify Cloudflare Worker (`verify-worker`)
- **Purpose**: Validates Worker configuration and performs dry-run deployment
- **Runs**:
  - Wrangler dry-run deployment
  - Configuration validation
- **Timeout**: 10 minutes
- **Note**: Dry-run may fail without secrets (this is expected)

## Running Tests Locally

### Prerequisites
```bash
cd web
npm install
```

### Run Linting
```bash
# Check for linting errors
npm run lint

# Check formatting
npm run format:check

# Auto-fix formatting issues
npm run format
```

### Run Tests
```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test -- --run

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Run Build
```bash
# Build Next.js site (requires environment variables)
npm run build
```

### Verify Worker
```bash
# From project root
npm install -g wrangler
wrangler deploy --dry-run
```

## Environment Variables

The following environment variables are required for builds:

**Frontend (web/.env.local)**:
```
NEXT_PUBLIC_API_URL=https://pickafarm-api.94623956quebecinc.workers.dev
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-key>
CLERK_SECRET_KEY=<your-clerk-secret>
CLOUDFLARE_D1_TOKEN=<your-d1-token>
CLOUDFLARE_D1_URL=<your-d1-url>
```

**Worker Secrets** (configured via `wrangler secret put`):
- `ZOHO_REFRESH_TOKEN`
- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `CLERK_SECRET_KEY`
- `RESEND_API_KEY`
- `GITHUB_TOKEN`

## GitHub Secrets Configuration

To configure GitHub secrets for the CI pipeline:

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLOUDFLARE_D1_TOKEN`
   - `CLOUDFLARE_D1_URL`

## Branch Protection Rules

To enforce CI checks before merging:

1. Go to repository **Settings** → **Branches**
2. Add a branch protection rule for `main-clean`
3. Enable **"Require status checks to pass before merging"**
4. Select the following required checks:
   - `Lint & Format Check`
   - `Unit Tests`
5. (Optional) Enable:
   - **"Require branches to be up to date before merging"**
   - **"Require conversation resolution before merging"**

## CI Performance

- **Target Duration**: Under 10 minutes for all jobs
- **Optimization Strategies**:
  - npm dependency caching (via `actions/setup-node@v4`)
  - Parallel job execution
  - Concurrency groups (cancel outdated PR runs)

## Skipping CI

To skip CI for documentation-only changes, include `[skip ci]` in your commit message:

```bash
git commit -m "docs: update README [skip ci]"
```

## Troubleshooting

### Lint Failures
- Run `npm run lint` locally to see errors
- Check `.eslintrc.json` for rule configuration
- Common issues:
  - React hooks called conditionally
  - Unescaped HTML entities
  - Deprecated Next.js patterns

### Test Failures
- Run `npm run test:coverage` locally
- Check for missing dependencies
- Ensure test files end with `.test.ts` or `.test.tsx`

### Build Failures
- Verify environment variables are set
- Check `web/package.json` scripts
- Review `web/next.config.js` configuration

### Worker Verification Failures
- Validate `wrangler.toml` syntax
- Ensure `src/index.js` exists
- Check Worker source code for syntax errors

---

### 2. Preview Deployment Comment (`preview-comment.yml`)

**Trigger**: Pull requests opened, synchronized, or reopened against `main-clean`

**Purpose**: Automatically posts preview deployment URLs as PR comments

**How it works**:
1. Waits 30 seconds for Cloudflare Pages deployment to start
2. Generates preview URL based on branch name
3. Posts or updates PR comment with preview URL and deployment information

**Preview URL Format**:
- Branch alias: `https://<branch-name>.pickafarm.pages.dev`
- Hash-based: `https://<random-hash>.pickafarm.pages.dev`

**Branch name sanitization**:
- Lowercase conversion
- Special characters replaced with hyphens
- Example: `feature/New-Feature` → `feature-new-feature.pickafarm.pages.dev`

**Comment includes**:
- Preview URL
- Branch name
- Commit SHA
- Timestamp
- Deployment information
- Testing checklist

**Permissions**:
- `contents: read` - Read repository content
- `pull-requests: write` - Post and update PR comments

---

### 3. Cleanup Preview Deployment (`cleanup-preview.yml`)

**Trigger**: Pull requests closed (merged or not) against `main-clean`

**Purpose**: Posts notification about preview deployment cleanup

**How it works**:
1. Detects PR closure event
2. Generates preview URL that was used
3. Posts cleanup notification comment

**Note**: Cloudflare Pages automatically deletes preview deployments when PRs are closed. This workflow only posts a notification comment. The actual cleanup is handled by Cloudflare.

**Manual cleanup option**: The workflow includes a commented-out job for manual cleanup via Cloudflare API if needed in the future.

**Permissions**:
- `contents: read` - Read repository content
- `pull-requests: write` - Post cleanup notification comments

---

### 4. Rebuild Farms (`rebuild-farms.yml`)

**Trigger**:
- Manual workflow dispatch
- Repository dispatch event (`rebuild-farms`)
- Scheduled (if configured)

**Purpose**: Triggers full site rebuild to fetch latest farm data

**Note**: This workflow is part of Story 1.1 implementation.

---

## Preview Deployment System

### Overview

PickAFarm uses **Cloudflare Pages automatic preview deployments** combined with GitHub Actions for PR comment automation.

### Preview Deployment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Developer creates PR → GitHub Actions CI runs                │
│ 2. CI passes → Cloudflare Pages builds preview automatically    │
│ 3. GitHub Actions posts preview URL to PR comment               │
│ 4. Developer reviews changes at preview URL                     │
│ 5. New commits → Preview auto-updates                           │
│ 6. PR closed/merged → Preview deleted automatically             │
└─────────────────────────────────────────────────────────────────┘
```

### Preview Environment Characteristics

- **Data**: Uses production D1 database (read-only)
- **Webhooks**: Disabled (no production side effects)
- **Emails**: Disabled (no Resend API key)
- **Rebuilds**: Cannot trigger (no GitHub token)
- **Build time**: 5-10 minutes typically
- **URL stability**: Branch alias URL remains constant for the branch
- **Cleanup**: Automatic after PR close (30-day retention before permanent deletion)

### Preview URL Examples

**Branch alias URL** (recommended):
```
https://feature-farmer-dashboard.pickafarm.pages.dev
```

**Hash-based URL** (unique per deployment):
```
https://abc123def.pickafarm.pages.dev
```

### Testing Preview Deployments

1. Create test branch: `git checkout -b test/preview-deployment`
2. Make code changes and commit
3. Push to GitHub: `git push origin test/preview-deployment`
4. Open pull request against `main-clean`
5. Wait 5-10 minutes for Cloudflare Pages to build
6. Check PR comment for preview URL
7. Access preview URL and verify changes
8. Push additional commits to test auto-update
9. Close or merge PR to verify cleanup notification

---

## Configuration

### Cloudflare Pages Setup

**Configuration guide**: `docs/CLOUDFLARE_PAGES_PREVIEW_SETUP.md`

Key configuration:
- **Production branch**: `main-clean`
- **Preview branches**: All non-production branches
- **Build command**: `npm run build`
- **Output directory**: `web/out/`
- **Node version**: 18

### Environment Variables (Preview)

Required for preview builds:
- `NEXT_PUBLIC_API_URL` - Worker API endpoint
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication
- `CLOUDFLARE_D1_TOKEN` - D1 database read-only access
- `CLOUDFLARE_D1_URL` - D1 REST API endpoint

**Do NOT set** in preview environment:
- `GITHUB_TOKEN` - Prevents triggering production rebuilds
- `RESEND_API_KEY` - Prevents sending production emails
- Zoho webhook tokens - Prevents processing CRM updates

---

## Additional Resources

- [Preview Deployment Setup Guide](../../docs/CLOUDFLARE_PAGES_PREVIEW_SETUP.md)
- [Cloudflare Pages Preview Deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vitest Documentation](https://vitest.dev)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)

---

**Last Updated**: January 2025 (Story 1.3 - Preview Deployment Configuration)
