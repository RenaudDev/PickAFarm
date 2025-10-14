# GitHub Secrets Configuration

This document lists all required GitHub Secrets for the PickAFarm automated rebuild workflows.

## Required Secrets

Configure these secrets in: **Settings → Secrets and variables → Actions → New repository secret**

### Cloudflare Secrets

#### `CLOUDFLARE_API_TOKEN`
- **Purpose**: Deploy to Cloudflare Pages from GitHub Actions
- **Permissions Required**:
  - Account > Cloudflare Pages > Edit
- **How to Create**:
  1. Go to Cloudflare Dashboard → My Profile → API Tokens
  2. Click "Create Token"
  3. Use "Edit Cloudflare Pages" template
  4. Select your account
  5. Copy the generated token
- **Value Format**: `cloudflare_api_token_here`

#### `CLOUDFLARE_ACCOUNT_ID`
- **Purpose**: Identify your Cloudflare account for Pages deployment
- **How to Find**:
  1. Go to Cloudflare Dashboard
  2. Select your domain/account
  3. Scroll down to "Account ID" in the right sidebar
  4. Copy the ID
- **Value Format**: `1234567890abcdef1234567890abcdef`

#### `CLOUDFLARE_D1_TOKEN`
- **Purpose**: Read-only access to D1 database for prebuild scripts
- **Permissions Required**:
  - Account > D1 > Read
- **How to Create**:
  1. Go to Cloudflare Dashboard → My Profile → API Tokens
  2. Click "Create Token"
  3. Use "Create Custom Token"
  4. Add permission: Account > D1 > Read
  5. Select your account
  6. Copy the generated token
- **Value Format**: `cloudflare_d1_token_here`

#### `CLOUDFLARE_D1_URL`
- **Purpose**: D1 REST API endpoint for database queries
- **How to Find**:
  1. Run `wrangler d1 info pickafarm-db` in your terminal
  2. Copy the REST API URL
- **Value Format**: `https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}`

### Zoho Cliq Secrets

#### `CLIQ_WEBHOOK_URL`
- **Purpose**: Send failure notifications to Zoho Cliq channel
- **How to Create**:
  1. Go to your Zoho Cliq workspace
  2. Navigate to the channel where you want notifications
  3. Click channel settings → Bots & Integrations → Webhooks
  4. Create a new webhook (or use existing webhook)
  5. Copy the webhook URL with API key
- **Value Format**: `https://cliq.zohocloud.ca/api/v2/channelsbyname/{channel}/message?zapikey={your_api_key}`
- **Security Note**: Anyone with this URL can post to your Cliq channel. Keep it secret.

### Worker Secrets (Set via Wrangler)

These are set in the Cloudflare Worker, NOT in GitHub Secrets:

#### `GITHUB_TOKEN`
- **Purpose**: Trigger GitHub Actions workflows from Worker API
- **Permissions Required**:
  - repo > actions > write (trigger workflows)
- **How to Create**:
  1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. Click "Generate new token (classic)"
  3. Select scopes:
     - ✅ `repo` (Full control of private repositories)
     - Or just `public_repo` if repository is public
  4. Generate token and copy it
  5. Set in Worker: `wrangler secret put GITHUB_TOKEN`
- **Value Format**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### `GITHUB_OWNER` (Optional)
- **Purpose**: GitHub repository owner (defaults to `RenaudDev` if not set)
- **How to Set**: `echo "RenaudDev" | wrangler secret put GITHUB_OWNER`

#### `GITHUB_REPO` (Optional)
- **Purpose**: GitHub repository name (defaults to `PickAFarm` if not set)
- **How to Set**: `echo "PickAFarm" | wrangler secret put GITHUB_REPO`

#### `GITHUB_EVENT` (Optional)
- **Purpose**: GitHub repository_dispatch event type (defaults to `rebuild-farms` if not set)
- **How to Set**: `echo "rebuild-farms" | wrangler secret put GITHUB_EVENT`

## Verification Checklist

After setting up secrets, verify they work:

- [ ] **Test scheduled rebuild**: Manually trigger `scheduled-rebuild.yml` via workflow_dispatch
- [ ] **Test manual rebuild**: Manually trigger `rebuild-farms.yml` via workflow_dispatch
- [ ] **Test API trigger**: Call `POST /api/trigger-rebuild` endpoint
- [ ] **Test Cliq notifications**: Intentionally break build and verify Cliq message received
- [ ] **Test D1 access**: Verify prebuild scripts fetch data successfully from D1
- [ ] **Test Cloudflare Pages deployment**: Verify site deploys to production successfully

## Security Best Practices

### Token Rotation Schedule
- **Cloudflare API tokens**: Rotate every 90 days
- **GitHub personal access tokens**: Rotate every 90 days
- **Zoho Cliq webhook URLs**: Rotate if exposed or every 180 days

### Principle of Least Privilege
- Use **read-only** D1 token for prebuild scripts (no write access needed)
- Use **scoped** Cloudflare API token (only Pages edit, not full account access)
- Use **scoped** GitHub token (only repo/actions, not admin privileges)

### Secret Exposure Prevention
- Never commit secrets to Git repository
- Never log secrets in GitHub Actions workflows
- Never expose secrets in API responses
- Use GitHub Secrets (encrypted at rest) for all sensitive values

## Troubleshooting

### "GitHub token not configured" error
**Cause**: `GITHUB_TOKEN` not set in Worker secrets
**Fix**: Run `wrangler secret put GITHUB_TOKEN` and paste your GitHub personal access token

### "Failed to deploy to Cloudflare Pages" error
**Cause**: Invalid `CLOUDFLARE_API_TOKEN` or insufficient permissions
**Fix**:
1. Verify token has "Edit Cloudflare Pages" permission
2. Regenerate token if expired
3. Update GitHub Secret with new token

### "Failed to fetch farm data from D1" error
**Cause**: Invalid `CLOUDFLARE_D1_TOKEN` or `CLOUDFLARE_D1_URL`
**Fix**:
1. Verify token has D1 read permission
2. Verify D1 URL format is correct (run `wrangler d1 info pickafarm-db`)
3. Test token manually: `curl -H "Authorization: Bearer $TOKEN" $D1_URL`

### Cliq notifications not received
**Cause**: Invalid `CLIQ_WEBHOOK_URL` or workflow permission error
**Fix**:
1. Test webhook manually: `curl -X POST -H 'Content-Type: application/json' -d '{"text":"Test message"}' "$CLIQ_WEBHOOK_URL"`
2. Verify webhook still exists in Zoho Cliq channel settings
3. Regenerate webhook URL if needed

## Reference Links

- [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- [Zoho Cliq Webhooks Documentation](https://www.zoho.com/cliq/help/platform/webhooks.html)
- [Wrangler Secrets Documentation](https://developers.cloudflare.com/workers/wrangler/commands/#secret)
