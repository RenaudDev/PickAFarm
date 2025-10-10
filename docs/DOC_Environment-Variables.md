# Environment Variables Reference

**Document Version**: 1.0
**Last Updated**: October 9, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Web App Variables (Next.js)](#web-app-variables-nextjs)
3. [Worker API Variables (Cloudflare)](#worker-api-variables-cloudflare)
4. [Build Script Variables](#build-script-variables)
5. [Variable Precedence & Overrides](#variable-precedence--overrides)
6. [Security Best Practices](#security-best-practices)

---

## Overview

PickAFarm uses environment variables across **three environments**:
1. **Web App** (Next.js) - `web/.env.local`
2. **Worker API** (Cloudflare) - Cloudflare Secrets (`wrangler secret put`)
3. **Build Scripts** (Node.js) - `web/.env.local`

**Critical**:
- `NEXT_PUBLIC_*` variables are exposed to browser
- Never commit `.env.local` to Git (in `.gitignore`)
- Use Cloudflare Secrets for Worker sensitive data

---

## Web App Variables (Next.js)

**File Location**: `web/.env.local` (create from `web/.env.example`)

### Required Variables

| Variable | Type | Purpose | Example Value | Where Used |
|----------|------|---------|---------------|------------|
| `NEXT_PUBLIC_API_URL` | Public | Worker API base URL | `https://pickafarm-api.*.workers.dev` | API calls from browser |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public | Google Maps embed | `AIza...` | Map components |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk auth (frontend) | `pk_test_...` | Auth UI components |
| `NEXT_PUBLIC_CDN_URL` | Public | R2 CDN for images | `https://cdn.pickafarm.com` | Image URLs |
| `CLERK_SECRET_KEY` | Secret | Clerk auth (server) | `sk_test_...` | Server-side auth validation |

### Optional Variables

| Variable | Type | Purpose | Default | Notes |
|----------|------|---------|---------|-------|
| `GOOGLE_MAPS_API_KEY` | Secret | Server-side geocoding | (none) | Future feature |
| `CLOUDFLARE_D1_TOKEN` | Secret | D1 API access (build time) | (none) | For `generate-farm-data.js` |
| `CLOUDFLARE_D1_URL` | Secret | D1 REST API endpoint | (none) | For `generate-farm-data.js` |

### Example `.env.local` File

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://pickafarm-api.94623956quebecinc.workers.dev

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD...your_key_here
GOOGLE_MAPS_API_KEY=AIzaSyD...your_key_here

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_abc123xyz
CLERK_SECRET_KEY=sk_test_xyz789abc

# CDN for Farm Images
NEXT_PUBLIC_CDN_URL=https://cdn.pickafarm.com

# Build Script Access to D1 (Optional - faster builds)
CLOUDFLARE_D1_TOKEN=your_d1_api_token
CLOUDFLARE_D1_URL=https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/d1/database/YOUR_DB_ID/query
```

---

## Worker API Variables (Cloudflare)

**Configuration Method**: Cloudflare Secrets (encrypted, never in code)

### Set Secrets via Wrangler CLI

```bash
# Zoho CRM Integration
wrangler secret put ZOHO_REFRESH_TOKEN
wrangler secret put ZOHO_CLIENT_ID
wrangler secret put ZOHO_CLIENT_SECRET

# Authentication
wrangler secret put CLERK_SECRET_KEY

# Email Notifications
wrangler secret put RESEND_API_KEY

# GitHub Actions (Auto-Rebuild)
wrangler secret put GITHUB_TOKEN

# Webhook Security
wrangler secret put WEBHOOK_SHARED_SECRET
```

### Required Secrets

| Secret | Purpose | How to Obtain | Used In |
|--------|---------|---------------|---------|
| `ZOHO_REFRESH_TOKEN` | Zoho OAuth (long-lived) | Zoho OAuth flow (one-time setup) | `zohoAccessToken()` |
| `ZOHO_CLIENT_ID` | Zoho OAuth app ID | Zoho Developer Console | `zohoAccessToken()` |
| `ZOHO_CLIENT_SECRET` | Zoho OAuth app secret | Zoho Developer Console | `zohoAccessToken()` |
| `CLERK_SECRET_KEY` | Server-side auth validation | Clerk Dashboard | `verifyClerkToken()` |
| `RESEND_API_KEY` | Email sending | Resend.com dashboard | Email notifications |
| `WEBHOOK_SHARED_SECRET` | Webhook authentication | Generate random string (32+ chars) | Zoho webhooks |

### Optional Secrets

| Secret | Purpose | Default | Notes |
|--------|---------|---------|-------|
| `GITHUB_TOKEN` | Trigger site rebuilds | (none) | GitHub Personal Access Token |
| `CLOUDFLARE_DEPLOY_HOOK` | Alternative rebuild method | (none) | Cloudflare Pages deploy hook |

### Environment Variables (wrangler.toml)

**File Location**: `wrangler.toml` (lines 6-13)

```toml
[vars]
ENVIRONMENT = "development"
GITHUB_OWNER = "RenaudDev"
GITHUB_REPO  = "PickAFarm"
GITHUB_EVENT = "rebuild-farms"
ZOHO_DC = "ca"  # Data center: ca, com, eu, au
FROM_EMAIL = "PickAFarm Notifications <updates@notifications.pickafarm.com>"
CDN_DOMAIN = "https://cdn.pickafarm.com"
```

**Non-Sensitive**: These can be committed to Git (in `wrangler.toml`).

---

## Build Script Variables

**File Location**: `web/.env.local` (same as Next.js)

### Used by `web/scripts/generate-farm-data.js`

| Variable | Purpose | Required | Fallback |
|----------|---------|----------|----------|
| `CLOUDFLARE_D1_TOKEN` | Authenticate to D1 REST API | No | Falls back to Worker API |
| `CLOUDFLARE_D1_URL` | D1 database query endpoint | No | Falls back to Worker API |

**Benefit**: Direct D1 access is faster than Worker API (reduces build time by ~30 seconds).

**Obtaining D1 Credentials**:
1. Get Account ID: `wrangler whoami`
2. Get Database ID: `wrangler d1 list`
3. Create API Token: Cloudflare Dashboard → API Tokens → Create Token
   - Template: "Edit Cloudflare Workers"
   - Add permission: "Account D1:Read"
4. Construct URL:
   ```
   https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DB_ID}/query
   ```

### Used by `web/scripts/sync-zoho-batch.js`

**Same Zoho credentials as Worker** (if running manual sync scripts).

---

## Variable Precedence & Overrides

### Next.js Precedence

1. `.env.local` (highest priority, not committed)
2. `.env.production` (production builds)
3. `.env.development` (development mode)
4. `.env` (lowest priority, committed)

**Current Setup**: Only `.env.local` is used (`.env.example` is template only).

### Cloudflare Worker Precedence

1. **Secrets** (set via `wrangler secret put`) - highest priority
2. **[vars]** in `wrangler.toml` - for non-sensitive config
3. **Environment** (production vs. preview) - separate secrets per environment

**Access in Code**:
```javascript
// In Worker code
export default {
  async fetch(request, env, ctx) {
    const zohoToken = env.ZOHO_REFRESH_TOKEN;  // From secret
    const zohoDC = env.ZOHO_DC;                // From wrangler.toml [vars]
    // ...
  }
}
```

---

## Security Best Practices

### ✅ DO

1. **Use `NEXT_PUBLIC_` prefix only for truly public data**
   - API URLs, CDN domains, Clerk publishable keys

2. **Rotate secrets regularly**
   - Webhook secrets: Every 6 months
   - API keys: When team members leave

3. **Use separate secrets for environments**
   - Production: `wrangler secret put --env production SECRET_NAME`
   - Preview: `wrangler secret put --env preview SECRET_NAME`

4. **Validate required secrets at runtime**
   ```javascript
   if (!env.ZOHO_REFRESH_TOKEN) {
     throw new Error("Missing ZOHO_REFRESH_TOKEN");
   }
   ```

5. **Use environment-specific Clerk projects**
   - Development: `pk_test_...` / `sk_test_...`
   - Production: `pk_live_...` / `sk_live_...`

### ❌ DON'T

1. **Never commit `.env.local` to Git**
   - Already in `.gitignore` ✓

2. **Never log secret values**
   ```javascript
   // ❌ BAD
   console.log("Token:", env.ZOHO_REFRESH_TOKEN);

   // ✅ GOOD
   console.log("Token length:", env.ZOHO_REFRESH_TOKEN?.length);
   ```

3. **Never use `NEXT_PUBLIC_` for secrets**
   ```javascript
   // ❌ EXPOSED TO BROWSER
   NEXT_PUBLIC_CLERK_SECRET_KEY=sk_test_123

   // ✅ SERVER-ONLY
   CLERK_SECRET_KEY=sk_test_123
   ```

4. **Never hardcode fallback secrets**
   ```javascript
   // ❌ BAD
   const apiKey = env.API_KEY || "default-key-123";

   // ✅ GOOD
   if (!env.API_KEY) throw new Error("API_KEY required");
   ```

---

## Troubleshooting

### Issue: "Missing ZOHO_REFRESH_TOKEN"

**Cause**: Secret not set in Cloudflare
**Fix**:
```bash
wrangler secret put ZOHO_REFRESH_TOKEN
# Paste token when prompted
```

### Issue: "Clerk authentication failed"

**Cause**: Mismatched publishable/secret keys (using test key in production)
**Fix**:
1. Check environment: `wrangler whoami`
2. Verify keys match: Clerk Dashboard → API Keys
3. Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_live_` for production

### Issue: "D1 API request failed" (in build scripts)

**Cause**: Missing or invalid `CLOUDFLARE_D1_TOKEN`
**Fix**:
1. **Option A**: Set D1 credentials (faster builds)
   ```bash
   # In web/.env.local
   CLOUDFLARE_D1_TOKEN=your_token
   CLOUDFLARE_D1_URL=https://api.cloudflare.com/...
   ```

2. **Option B**: Remove D1 vars (will use Worker API instead)
   - Script auto-falls back to `https://pickafarm-api.*.workers.dev/api/farms`

### Issue: "Zoho token refresh failed"

**Cause**: Expired refresh token or wrong data center
**Checks**:
1. Verify `ZOHO_DC` matches your Zoho account:
   - Canada: `ZOHO_DC=ca`
   - US: `ZOHO_DC=com`
   - Europe: `ZOHO_DC=eu`

2. Test token manually:
   ```bash
   curl -X POST "https://accounts.zohocloud.ca/oauth/v2/token" \
     -d "refresh_token=YOUR_TOKEN" \
     -d "client_id=YOUR_ID" \
     -d "client_secret=YOUR_SECRET" \
     -d "grant_type=refresh_token"
   ```

3. If invalid, regenerate in Zoho Developer Console

---

## Quick Setup Checklist

### First-Time Setup

- [ ] Copy `web/.env.example` to `web/.env.local`
- [ ] Fill in all `NEXT_PUBLIC_*` variables
- [ ] Set `CLERK_SECRET_KEY`
- [ ] Set Cloudflare Worker secrets (6 required)
- [ ] Test locally: `cd web && npm run dev`
- [ ] Test Worker: `wrangler dev`
- [ ] Verify auth works: Sign in with Clerk
- [ ] Test Zoho webhook: `POST /api/test-zoho-fetch`

### Production Deployment

- [ ] Set production Clerk keys (`pk_live_`, `sk_live_`)
- [ ] Update `NEXT_PUBLIC_API_URL` to production Worker URL
- [ ] Set production Cloudflare secrets (`--env production`)
- [ ] Verify `ZOHO_DC` matches production Zoho account
- [ ] Test production build: `cd web && npm run build`
- [ ] Deploy Worker: `wrangler deploy`
- [ ] Deploy Pages: Automatic on Git push

---

## Related Documentation

- **Example File**: `web/.env.example` - Template with placeholder values
- **Wrangler Config**: `wrangler.toml` - Worker environment configuration
- **API Reference**: `docs/DOC_API-Endpoints-Reference.md` - Endpoints that use these vars
- **Cloudflare Docs**: `Reference/workers/` - Official Cloudflare environment docs

---

**Last Updated**: October 9, 2025
**Maintainer**: Development Team
