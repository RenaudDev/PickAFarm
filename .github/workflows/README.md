# CI Pipeline Documentation

This document describes the Continuous Integration (CI) pipeline for PickAFarm.

## Overview

The CI pipeline automatically runs on every pull request to the `main-clean` branch. It ensures code quality, test coverage, and build integrity before merging changes.

## Workflow Jobs

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

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vitest Documentation](https://vitest.dev)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)
