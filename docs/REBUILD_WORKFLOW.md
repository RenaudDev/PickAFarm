# Automated Rebuild Workflow Documentation

## Overview

PickAFarm uses automated rebuild workflows to keep the static site fresh with the latest farm data, farmer edits, and WordPress updates. The site is rebuilt and deployed to Cloudflare Pages through multiple trigger mechanisms.

## Rebuild Trigger Mechanisms

### 1. Scheduled Rebuilds (Primary)

**Workflow**: `.github/workflows/scheduled-rebuild.yml`
**Schedule**: Every 2 hours (UTC) - `0 */2 * * *`
**Purpose**: Capture routine updates from Zoho CRM, farmer dashboard edits, and WordPress content changes

**When it runs**:
- Automatically at :00 minutes every 2 hours (12:00 AM, 2:00 AM, 4:00 AM, etc. UTC)
- Can be triggered manually via GitHub Actions UI

**What it does**:
1. Checks out repository code
2. Installs Node.js dependencies
3. Runs prebuild scripts to fetch latest data from D1 database
4. Builds Next.js static site
5. Deploys to Cloudflare Pages production
6. Sends Zoho Cliq notification on failure

**Expected duration**: 5-10 minutes

### 2. API-Triggered Rebuilds

**Workflow**: `.github/workflows/rebuild-farms.yml`
**Trigger**: `POST /api/trigger-rebuild` (Worker API endpoint)
**Purpose**: On-demand rebuilds triggered programmatically

**How to trigger**:
```bash
curl -X POST https://pickafarm-api.94623956quebecinc.workers.dev/api/trigger-rebuild
```

**Use cases**:
- Zoho Flow webhooks (when farm marked as "LIVE")
- Emergency content updates
- Third-party integrations
- Developer testing

**What it does**:
Same as scheduled rebuild, plus:
- Logs trigger source and reason
- Includes farm ID in notifications (if provided)

### 3. Manual Rebuilds

**Workflow**: Both workflows support `workflow_dispatch`
**Trigger**: GitHub Actions UI → "Run workflow" button
**Purpose**: Developer-initiated rebuilds for testing or emergency updates

**How to trigger**:
1. Go to GitHub → Actions tab
2. Select workflow: "Scheduled Rebuild" or "Rebuild Farm Directory"
3. Click "Run workflow"
4. Optionally provide reason (for logging)

## Rebuild Process Details

### Step 1: Prebuild Scripts

Located in: `web/scripts/`

These scripts fetch data from various sources and generate JSON files:

1. **`generate-farm-data.js`** - Fetches farms from D1 database
   - Output: `web/data/farms.json`
   - Dependencies: Cloudflare D1 REST API

2. **`generate-location-data.js`** - Creates location/city data
   - Output: `web/data/locations.json`
   - Dependencies: `farms.json`

3. **`generate-state-data.js`** - Creates state-level data
   - Output: `web/data/states.json`
   - Dependencies: `farms.json`, `locations.json`

4. **`generate-sitemaps.js`** - Generates XML sitemaps
   - Output: `web/public/sitemap.xml`, `web/public/sitemap-*.xml`
   - Dependencies: All farm and location data

**Run all prebuild scripts**:
```bash
cd web
npm run prebuild
```

### Step 2: Next.js Build

**Command**: `npm run build` (in `web/` directory)

**Process**:
1. Reads generated JSON files from `web/data/`
2. Pre-renders all static pages (farms, categories, locations)
3. Optimizes images, fonts, and assets
4. Generates static HTML files in `web/out/`

**Output**: `web/out/` directory with fully static site

### Step 3: Cloudflare Pages Deployment

**Method**: `cloudflare/pages-action@v1` GitHub Action

**Process**:
1. Uploads `web/out/` directory to Cloudflare Pages
2. Distributes content to edge network (global CDN)
3. Invalidates old cache
4. Updates production deployment

**Result**: New version live at `pickafarm.com` within ~1-2 minutes

## Monitoring and Notifications

### Success Monitoring

**GitHub Actions Logs**:
- Go to: GitHub → Actions → Select workflow run
- View detailed logs for each step
- Check prebuild script outputs

**Cloudflare Pages Dashboard**:
- Go to: Cloudflare Dashboard → Pages → pickafarm
- View deployment history
- See deployment status and build time

### Failure Notifications

**Zoho Cliq Notifications**:
- Sent to configured Cliq channel on workflow failure
- Includes:
  - Workflow name
  - Direct link to failed run
  - Timestamp
  - Trigger source

**Example Cliq message**:
```
🚨 Scheduled rebuild FAILED

Workflow: Scheduled Rebuild
Run: View Run (clickable link)
Time: 2025-01-14 14:05:23 UTC
Trigger: schedule

[View Logs] (button)
```

**Email Notifications** (GitHub):
- GitHub sends email to repository watchers on workflow failures
- Configure in: GitHub → Settings → Notifications

## Troubleshooting Guide

### Common Errors and Solutions

#### Error: "Failed to fetch farm data from D1"

**Symptoms**:
- Prebuild scripts fail during data generation
- Error message: "D1 API authentication failed"

**Causes**:
- Invalid `CLOUDFLARE_D1_TOKEN`
- Expired token
- D1 database unavailable

**Solutions**:
1. Verify D1 token is valid and not expired
2. Regenerate token if needed: Cloudflare Dashboard → API Tokens
3. Update GitHub Secret: `CLOUDFLARE_D1_TOKEN`
4. Re-run workflow

#### Error: "Failed to deploy to Cloudflare Pages"

**Symptoms**:
- Build succeeds but deployment fails
- Error message: "Cloudflare API error: 403"

**Causes**:
- Invalid `CLOUDFLARE_API_TOKEN`
- Insufficient permissions
- Cloudflare Pages project not found

**Solutions**:
1. Verify API token has "Edit Cloudflare Pages" permission
2. Verify `projectName: pickafarm` matches Cloudflare Pages project name
3. Check `CLOUDFLARE_ACCOUNT_ID` is correct
4. Regenerate token if needed

#### Error: "Build timeout exceeded"

**Symptoms**:
- Workflow runs for 15+ minutes and times out
- No clear error message

**Causes**:
- Slow D1 API responses
- Large number of farms (slow data generation)
- Network issues

**Solutions**:
1. Optimize D1 queries (add indexes)
2. Cache prebuild data when possible
3. Parallelize independent prebuild scripts
4. Increase timeout in workflow (currently 15 minutes)

#### Error: "Cliq notification not received"

**Symptoms**:
- Workflow fails but no Cliq message

**Causes**:
- Invalid `CLIQ_WEBHOOK_URL`
- Cliq webhook deleted or expired
- Workflow permissions issue

**Solutions**:
1. Test webhook manually: `curl -X POST -H 'Content-Type: application/json' -d '{"text":"test"}' "$CLIQ_WEBHOOK_URL"`
2. Regenerate webhook in Zoho Cliq channel settings
3. Update GitHub Secret: `CLIQ_WEBHOOK_URL`

### Emergency Procedures

#### How to pause scheduled rebuilds

**Option 1: Disable cron schedule** (temporary)
1. Edit `.github/workflows/scheduled-rebuild.yml`
2. Comment out cron schedule:
   ```yaml
   # schedule:
   #   - cron: '0 */2 * * *'
   ```
3. Commit and push to main branch
4. Scheduled rebuilds will stop (manual triggers still work)

**Option 2: Disable workflow** (complete disable)
1. Go to: GitHub → Actions → Scheduled Rebuild
2. Click "..." menu → "Disable workflow"
3. Workflow will not run (scheduled or manual)

#### How to force immediate rebuild

**Method 1: Manual trigger** (recommended)
1. Go to: GitHub → Actions → Scheduled Rebuild
2. Click "Run workflow"
3. Provide reason (e.g., "Emergency farm data update")
4. Click "Run workflow"

**Method 2: API trigger**
```bash
curl -X POST https://pickafarm-api.94623956quebecinc.workers.dev/api/trigger-rebuild
```

**Method 3: Trigger via Worker API** (from code)
```javascript
await fetch('https://pickafarm-api.94623956quebecinc.workers.dev/api/trigger-rebuild', {
  method: 'POST'
});
```

#### How to rollback deployment

**Via Cloudflare Pages Dashboard**:
1. Go to: Cloudflare Dashboard → Pages → pickafarm
2. Select "Deployments" tab
3. Find previous working deployment
4. Click "..." → "Rollback to this deployment"
5. Previous version will be live within 1-2 minutes

**Note**: Rollback does NOT affect D1 database data. It only reverts static site files.

## Performance Metrics

### Current Performance

**Scheduled rebuild execution time**:
- Prebuild scripts: ~2-3 minutes
- Next.js build: ~3-4 minutes
- Cloudflare Pages deployment: ~1-2 minutes
- **Total**: ~6-9 minutes (well under 10-minute target)

**Resource usage**:
- GitHub Actions minutes: ~10 minutes per rebuild
- Monthly usage (12 rebuilds/day): ~3,600 minutes/month
- Cloudflare Pages build minutes: Same as GitHub Actions

**Data freshness**:
- Maximum staleness: 2 hours (between scheduled rebuilds)
- Average staleness: 1 hour
- Emergency updates: 6-9 minutes (manual rebuild time)

### Optimization Opportunities

If rebuild time exceeds 10 minutes:
1. **Cache npm dependencies** - Already implemented via `cache: 'npm'`
2. **Parallelize prebuild scripts** - Run independent scripts concurrently
3. **Optimize D1 queries** - Add indexes on frequently queried columns
4. **Incremental builds** - Only rebuild changed farms (complex, future enhancement)
5. **CDN caching** - Cache API responses for prebuild scripts

## Configuration Reference

### Environment Variables (GitHub Secrets)

See [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) for complete setup guide.

Required secrets:
- `CLOUDFLARE_API_TOKEN` - Cloudflare Pages deployment
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_D1_TOKEN` - D1 database read access
- `CLOUDFLARE_D1_URL` - D1 REST API endpoint
- `CLIQ_WEBHOOK_URL` - Failure notifications to Zoho Cliq

### Cron Schedule Format

Current schedule: `0 */2 * * *` (every 2 hours)

**Format**: `minute hour day month weekday`

**Examples**:
```yaml
# Every 2 hours (current)
- cron: '0 */2 * * *'

# Every 4 hours (more conservative)
- cron: '0 */4 * * *'

# Daily at midnight UTC
- cron: '0 0 * * *'

# Business hours only (8 AM - 8 PM UTC)
- cron: '0 8-20/2 * * *'

# Weekdays only
- cron: '0 */2 * * 1-5'
```

**Note**: GitHub Actions cron runs on UTC time. Delays of 3-10 minutes are normal.

## Related Documentation

- [GitHub Secrets Setup](./GITHUB_SECRETS_SETUP.md) - Required secrets configuration
- [Cloudflare Pages Preview Setup](./CLOUDFLARE_PAGES_PREVIEW_SETUP.md) - Preview deployments
- [Application Architecture](../.agent/Docs/DOC_Application_Architecture.md) - System architecture
- [API Documentation](../.agent/Docs/DOC_Cloudflare-Worker-Api.md) - Worker API reference

## Maintenance Tasks

### Weekly
- [ ] Review GitHub Actions logs for any warnings or errors
- [ ] Check Cloudflare Pages deployment history for failures
- [ ] Monitor rebuild execution times (should stay under 10 minutes)

### Monthly
- [ ] Review Cliq notification history
- [ ] Verify all secrets are valid and not expired
- [ ] Check GitHub Actions minutes usage (should stay under plan limits)
- [ ] Review farm data accuracy (spot-check random farms)

### Quarterly (Every 90 Days)
- [ ] Rotate Cloudflare API tokens
- [ ] Rotate GitHub personal access tokens
- [ ] Review and update this documentation
- [ ] Test emergency procedures (pause/resume, rollback)

## Support and Escalation

**For build failures**:
1. Check GitHub Actions logs for detailed error messages
2. Review Zoho Cliq notifications for failure alerts
3. Test API endpoints manually (D1, Cloudflare Pages)
4. Check Cloudflare status page: https://www.cloudflarestatus.com/

**For emergency assistance**:
- GitHub Issues: https://github.com/RenaudDev/PickAFarm/issues
- Cloudflare Support: https://dash.cloudflare.com/support
- Zoho Cliq channel for alerts

**Escalation path**:
1. Developer: Check logs and troubleshoot common errors
2. DevOps: Investigate infrastructure issues (Cloudflare, GitHub Actions)
3. Product Owner: Business decisions (pause rebuilds, rollback)
