# 404 URL Analysis Report

**Date:** 2025-10-09
**Analyst:** Quinn (QA Engineer)
**Issue:** 400+ URLs returning 404 errors in Google Search Console
**Severity:** HIGH - SEO Impact

---

## Executive Summary

Google Search Console is reporting 400+ 404 errors for URLs following an incorrect location slug pattern. The root cause is **stale generated data files** using an outdated URL format that was replaced during a previous migration.

**Impact:**
- 400+ broken URLs indexed by Google
- Negative SEO impact (crawl budget waste, broken backlinks)
- Poor user experience for users clicking search results

**Status:** Root cause identified, fix required

---

## Problem Description

### Observed Pattern

URLs in the 404 report follow this incorrect pattern:

❌ **INCORRECT FORMAT (causing 404s):**
```
/pumpkin-patches/near/henderson-tx-canada/
/christmas-tree-farms/near/jesup-ga-canada/
/christmas-tree-farms/near/cadott-wi-canada/
/pumpkin-patches/near/livingston-tx-canada/
```

✅ **CORRECT FORMAT (what should exist):**
```
/pumpkin-patches/near/henderson-tx-us/
/christmas-tree-farms/near/jesup-ga-us/
/christmas-tree-farms/near/cadott-wi-us/
/pumpkin-patches/near/livingston-tx-us/
```

### Key Issues Identified

1. **Wrong Country Code:** US cities incorrectly tagged as `canada` instead of `us`
2. **Full Country Names:** Some URLs use `canada` or `united-states` instead of `ca` or `us`
3. **State Code Confusion:** Some URLs show `wi-ca` (Wisconsin with Canada code)
4. **Province Name vs Code:** Old format used full names (`ontario`) instead of codes (`on`)

---

## Root Cause Analysis

### Primary Cause: Stale Data File

**File:** `web/data/location-params.json`
**Status:** Contains outdated location slugs

**Evidence:**
```json
// From location-params.json (INCORRECT - OLD FORMAT)
{ "location": "toronto-ontario-canada" }
{ "location": "hamilton-ontario-canada" }
{ "location": "vancouver-british-columbia-canada" }
```

**Should be:**
```json
// Current format used in locations.json (CORRECT)
{ "location": "toronto-on-ca" }
{ "location": "hamilton-on-ca" }
{ "location": "vancouver-bc-ca" }
```

### Secondary Cause: Script Fallback Logic

**File:** `web/scripts/generate-location-data.js`
**Line:** 145

**Current Code:**
```javascript
const params = filtered.map(l => ({
  location: l.location_slug || generateSlug(`${l.name}-${l.province}-${l.country_slug || 'ca'}`)
}));
```

**Issue:** Fallback uses `l.province` (full name like "Ontario") instead of `l.province_slug` ("on")

### How These URLs Got Indexed

These malformed URLs were likely indexed through:

1. **Historical Sitemaps** - Generated before slug format was updated
2. **Old Internal Links** - May still exist in blog posts or old pages
3. **External Backlinks** - Other sites may have linked using old format
4. **Google Cache** - URLs crawled before migration remain in index

---

## Data Verification

### Verified: Source Data is Correct

**File:** `web/data/locations.json` ✅
Contains proper format:
```json
{
  "name": "Henderson",
  "location_slug": "henderson-tx-us",  // ✅ CORRECT
  "province_slug": "tx",
  "country_slug": "us"
}
```

### Verified: Current Site Pages Use Correct Format

**Files Checked:**
- ✅ `web/app/[slug]/near/[location]/page.tsx` - Uses `location.location_slug`
- ✅ `web/app/[slug]/page.tsx` - Uses `city.slug` (which contains correct format)
- ✅ `web/scripts/generate-sitemaps.js` - Uses `location.location_slug`

### Issue: Stale Generated File

**File:** `web/data/location-params.json` ❌
This file was NOT regenerated after the slug format change.

---

## Recommended Fixes

### Priority 1: Data Cleanup (IMMEDIATE)

**Action Items:**

1. **Delete stale file:**
   ```bash
   # Option 1: Delete if unused
   rm web/data/location-params.json

   # Option 2: Verify usage first
   grep -r "location-params.json" web/
   ```

2. **Fix generation script:**

   **File:** `web/scripts/generate-location-data.js`
   **Line:** 145

   **Change from:**
   ```javascript
   const params = filtered.map(l => ({
     location: l.location_slug || generateSlug(`${l.name}-${l.province}-${l.country_slug || 'ca'}`)
   }));
   ```

   **Change to:**
   ```javascript
   const params = filtered.map(l => ({
     location: l.location_slug || `${generateSlug(l.name)}-${l.province_slug}-${l.country_slug || 'ca'}`
   }));
   ```

3. **Regenerate all data files:**
   ```bash
   cd web
   npm run prebuild
   npm run build
   ```

4. **Verify output:**
   - Check `web/data/location-params-filtered.json` (correct file)
   - Ensure all slugs follow `{city}-{state_code}-{country_code}` pattern

### Priority 2: Implement Redirects (HIGH)

Create redirect rules to handle old URLs gracefully.

**Option A: Next.js Config Redirects**

**File:** `web/next.config.js`

```javascript
async redirects() {
  return [
    {
      // Redirect old format with full province names to new format
      source: '/:category/near/:city-:province-canada',
      destination: '/:category/near/:city-:province-ca',
      permanent: true,
    },
    {
      // Redirect US cities incorrectly tagged as Canada
      source: '/:category/near/:city-:state(tx|ga|wi|il|ny|pa|ca|fl|mi|oh|etc)-canada',
      destination: '/:category/near/:city-:state-us',
      permanent: true,
    },
  ];
}
```

**Option B: Cloudflare Pages Redirects**

**File:** `web/public/_redirects`

```
# Redirect old Canada format to new
/*/near/*-ontario-canada/*  /*/near/*-on-ca/:splat 301
/*/near/*-quebec-canada/*   /*/near/*-qc-ca/:splat 301
/*/near/*-british-columbia-canada/*  /*/near/*-bc-ca/:splat 301

# Redirect US cities incorrectly tagged as Canada
/*/near/*-tx-canada/*  /*/near/*-tx-us/:splat 301
/*/near/*-ga-canada/*  /*/near/*-ga-us/:splat 301
/*/near/*-wi-canada/*  /*/near/*-wi-us/:splat 301
```

**Note:** Cloudflare Pages redirects may have limitations. Verify syntax in Cloudflare docs.

### Priority 3: Google Search Console Cleanup (MEDIUM)

1. **Submit Updated Sitemap**
   - Go to Google Search Console
   - Submit `https://pickafarm.com/sitemap.xml`
   - Request re-crawl of updated pages

2. **Remove Old URLs**
   - Use "Removals" tool to temporarily hide 404 URLs
   - Mark as "Outdated Content" if redirects are in place

3. **Monitor 404 Report**
   - Track reduction in 404 errors over 2-4 weeks
   - Verify redirects are working (should see 301 redirects in logs)

---

## Testing Plan

### Pre-Deployment Testing

**Analyst Action Items:**

- [ ] **Verify location-params.json usage**
  ```bash
  # Search codebase for any imports/usage
  grep -r "location-params.json" web/
  ```

- [ ] **Check for hardcoded old URLs**
  ```bash
  # Search for old format in code
  grep -r "ontario-canada\|quebec-canada\|british-columbia-canada" web/app/
  ```

- [ ] **Test data generation**
  ```bash
  cd web
  npm run generate-location-data
  # Verify output in web/data/location-params-filtered.json
  ```

- [ ] **Sample URL format validation**
  - Open `web/data/location-params-filtered.json`
  - Verify all entries match pattern: `{city}-{2-letter-code}-{2-letter-code}`
  - Examples to check:
    - ✅ `toronto-on-ca`
    - ✅ `henderson-tx-us`
    - ❌ `toronto-ontario-canada` (should NOT exist)

### Post-Deployment Testing

- [ ] **Test redirects locally**
  ```bash
  npm run build
  npm run start
  # Try accessing old URLs, verify redirect to new format
  ```

- [ ] **Verify production redirects**
  - Test sample old URLs:
    - `https://pickafarm.com/pumpkin-patches/near/henderson-tx-canada/`
    - Should redirect to: `.../henderson-tx-us/`
  - Check HTTP status code is `301` (permanent redirect)

- [ ] **Validate sitemap**
  - Visit `https://pickafarm.com/sitemap.xml`
  - Verify NO old-format URLs are present
  - Spot-check 10-20 location URLs for correct format

- [ ] **Monitor Google Search Console**
  - Week 1: Check for new crawl errors
  - Week 2-4: Verify 404 count decreasing
  - Track redirect success (301 responses)

---

## Additional Findings

### Files Using location_slug (Verified Correct ✅)

These files correctly use the `location_slug` property:

1. ✅ `web/app/[slug]/near/[location]/page.tsx:77` - Uses `location.location_slug`
2. ✅ `web/scripts/generate-sitemaps.js:117,136` - Uses `location.location_slug`
3. ✅ `web/app/[slug]/page.tsx:298` - Uses `city.slug` (which contains proper format)

### Potential Issue: Variety of URL Formats

The 404 table shows multiple URL format variations:

| Format | Example | Status |
|--------|---------|--------|
| `city-state-country` | `/near/henderson-tx-us/` | ✅ Correct |
| `city-state-canada` | `/near/henderson-tx-canada/` | ❌ Wrong country |
| `city-province-canada` | `/near/toronto-ontario-canada/` | ❌ Old format |
| `city-state-ca` | `/near/cadott-wi-ca/` | ❌ Wrong country code |

**Recommendation:** Implement comprehensive redirect rules to handle ALL variations.

---

## Risk Assessment

### Risks if Not Fixed

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Continued SEO penalty | HIGH | MEDIUM | Fix immediately |
| Lost organic traffic | MEDIUM | HIGH | Implement redirects |
| Poor user experience | HIGH | MEDIUM | 301 redirects preserve UX |
| Crawl budget waste | HIGH | LOW | Sitemap update + redirects |

### Risks of Proposed Fix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking existing valid URLs | LOW | HIGH | Test thoroughly before deploy |
| Redirect loops | LOW | MEDIUM | Validate redirect rules |
| Performance impact | LOW | LOW | Cloudflare handles redirects efficiently |

---

## Sign-Off Checklist

**For Analyst Review:**

- [ ] Verify `location-params.json` is not used by any critical code
- [ ] Confirm all source data files (`locations.json`, `locations-with-farms.json`) are correct
- [ ] Test data regeneration locally
- [ ] Review redirect rules for completeness
- [ ] Validate no false positives (don't redirect valid URLs)
- [ ] Confirm testing plan covers all scenarios

**For Developer Implementation:**

- [ ] Fix `generate-location-data.js` line 145
- [ ] Delete or archive `location-params.json`
- [ ] Run `npm run prebuild` successfully
- [ ] Implement redirect rules (choose Next.js or Cloudflare method)
- [ ] Test redirects locally
- [ ] Deploy to production
- [ ] Submit updated sitemap to Google Search Console

**For Post-Deployment Monitoring:**

- [ ] Monitor 404 errors in Google Search Console (weekly for 4 weeks)
- [ ] Verify redirect success rate in Cloudflare Analytics
- [ ] Check for any new unexpected 404s
- [ ] Document resolution and learnings

---

## Questions for Analyst

1. **Is `location-params.json` used anywhere?**
   - Need to verify if any code imports this file
   - May be safe to delete or rename to `.backup`

2. **What redirect strategy is preferred?**
   - Next.js config redirects (more control, regex support)
   - Cloudflare Pages `_redirects` file (simpler, but limited)
   - Cloudflare Workers redirect (most powerful, requires Worker setup)

3. **Historical context:**
   - When was the slug format changed?
   - Was there a migration plan for old URLs?
   - Are there any old blog posts or documentation linking to old format?

4. **Priority level:**
   - Should this be fixed in next deployment?
   - Or does it require emergency hotfix?

---

## References

- **404 Report:** `Bugs/Table.csv`
- **Data Files:**
  - Source: `web/data/locations.json`
  - Generated: `web/data/locations-with-farms.json`
  - Stale: `web/data/location-params.json`
- **Scripts:**
  - Generation: `web/scripts/generate-location-data.js`
  - Sitemap: `web/scripts/generate-sitemaps.js`
- **Page Templates:**
  - Category+Location: `web/app/[slug]/near/[location]/page.tsx`
  - State: `web/app/[slug]/page.tsx`

---

**Prepared by:** Quinn (QA Engineer)
**Review Required:** Data Analyst
**Next Steps:** Analyst verification → Developer implementation → Deployment → Monitoring
