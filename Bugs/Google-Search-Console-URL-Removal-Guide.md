# Google Search Console - URL Removal Guide

**Document:** Post-Implementation Cleanup for 404 Error Resolution
**Related PRD:** PRD-404-Error-Resolution.md
**Date:** 2025-10-10
**Status:** Ready for Execution

---

## Overview

After deploying the 404 error fixes (redirects + data cleanup), we need to clean up Google Search Console to accelerate the removal of old 404 URLs from Google's index.

**Goals:**
- Remove 400+ outdated URLs from Google's index
- Accelerate re-indexing of correct URLs
- Restore SEO health faster

---

## Prerequisites

✅ **Before starting this process:**
1. ✅ Bug fix deployed to production
2. ✅ Redirects active and tested
3. ✅ New sitemap generated with correct URLs
4. ✅ Wait 24-48 hours after deployment (let redirects work)

---

## Step 1: Submit Updated Sitemap

### Action
Submit the new sitemap to Google Search Console to inform Google of the correct URLs.

### Steps
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select property: **pickafarm.com**
3. Navigate to: **Sitemaps** (left sidebar)
4. Enter sitemap URL: `https://pickafarm.com/sitemap.xml`
5. Click **Submit**

### Verification
- Status should show: "Success"
- Check "Discovered" count increases over next few days
- Check "Indexed" URLs start updating with correct paths

---

## Step 2: Remove Outdated URLs (Batch Removal)

Google Search Console allows you to request removal of outdated content. We'll target the 3 main URL patterns identified in the PRD.

### Pattern 1: US States Incorrectly Tagged as Canada

**URL Pattern:**
`https://pickafarm.com/*/near/*-{state}-canada/`

**Example URLs from Table.csv:**
- `/pumpkin-patches/near/henderson-tx-canada/`
- `/christmas-tree-farms/near/jesup-ga-canada/`
- `/pumpkin-patches/near/livingston-tx-canada/`
- `/corn-mazes/near/henderson-tx-canada/`
- `/christmas-tree-farms/near/cadott-wi-canada/`

**States affected:** AL, AK, AZ, AR, CA, CO, CT, DE, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI, MN, MS, MO, MT, NE, NV, NH, NJ, NM, NY, NC, ND, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VT, VA, WA, WV, WI, WY, DC

**How to Remove:**

1. Go to: **Removals** (left sidebar in GSC)
2. Click: **New Request**
3. Select: **Temporarily remove URL**
4. Enter URL pattern:
   ```
   https://pickafarm.com/christmas-tree-farms/near/*-tx-canada/
   ```
5. Select: **Remove all URLs with this prefix**
6. Click: **Submit Request**

**Repeat for each category + state combination** (or use prefix patterns):
- `/christmas-tree-farms/near/*-canada/`
- `/pumpkin-patches/near/*-canada/`
- `/corn-mazes/near/*-canada/`
- `/all-farms-near/near/*-canada/`
- `/apple-orchards/near/*-canada/`
- `/vineyards/near/*-canada/`
- `/berry-farms/near/*-canada/`
- `/vegetable-farms/near/*-canada/`
- `/sugar-shacks/near/*-canada/`

**Note:** GSC prefix matching will catch all state variations automatically.

---

### Pattern 2: Full Country Name "united-states"

**URL Pattern:**
`https://pickafarm.com/*/near/*-united-states/`

**Example URLs from Table.csv:**
- `/christmas-tree-farms/near/philadelphia-pa-united-states/`
- `/pumpkin-patches/near/baltimore-md-united-states/`
- `/all-farms-near/near/philadelphia-pa-united-states/`
- `/vineyards/near/oakland-ca-united-states/`

**How to Remove:**

1. Go to: **Removals** → **New Request**
2. Enter URL pattern for each category:
   ```
   https://pickafarm.com/christmas-tree-farms/near/*-united-states/
   https://pickafarm.com/pumpkin-patches/near/*-united-states/
   https://pickafarm.com/corn-mazes/near/*-united-states/
   https://pickafarm.com/all-farms-near/near/*-united-states/
   https://pickafarm.com/vineyards/near/*-united-states/
   ```
3. Select: **Remove all URLs with this prefix**
4. Submit each request

---

### Pattern 3: Full Province Names (Canadian Locations)

**URL Pattern:**
`https://pickafarm.com/*/near/*-{province}-canada/`

**Example URLs from Table.csv:**
- `/christmas-tree-farms/near/toronto-ontario-canada/`
- `/pumpkin-patches/near/hamilton-ontario-canada/`
- `/all-farms-near/near/vancouver-british-columbia-canada/`

**Provinces to target:**
- `ontario-canada`
- `quebec-canada`
- `british-columbia-canada`
- `alberta-canada`
- `manitoba-canada`
- `saskatchewan-canada`
- `nova-scotia-canada`
- `new-brunswick-canada`
- `newfoundland-and-labrador-canada`
- `prince-edward-island-canada`
- `northwest-territories-canada`
- `yukon-canada`
- `nunavut-canada`

**How to Remove:**

1. Go to: **Removals** → **New Request**
2. Enter URL patterns:
   ```
   https://pickafarm.com/christmas-tree-farms/near/*-ontario-canada/
   https://pickafarm.com/pumpkin-patches/near/*-ontario-canada/
   https://pickafarm.com/corn-mazes/near/*-ontario-canada/
   https://pickafarm.com/all-farms-near/near/*-ontario-canada/
   ```
3. Repeat for each province (quebec, british-columbia, etc.)
4. Submit each request

---

## Step 3: Request Re-Indexing of Correct URLs

After removing old URLs, request re-indexing of the correct URLs to replace them in search results.

### Sample Correct URLs (from Table.csv)

Based on the 404 list, these are the **correct** versions that should be indexed:

**US Locations (should end in `-us`):**
- `/christmas-tree-farms/near/philadelphia-pa-us/`
- `/pumpkin-patches/near/henderson-tx-us/`
- `/corn-mazes/near/allentown-pa-us/`
- `/vineyards/near/oakland-ca-us/`

**Canadian Locations (should use 2-letter province codes):**
- `/christmas-tree-farms/near/toronto-on-ca/`
- `/pumpkin-patches/near/hamilton-on-ca/`
- `/all-farms-near/near/vancouver-bc-ca/`
- `/christmas-tree-farms/near/quebec-city-qc-ca/`

### How to Request Re-Indexing

1. Go to: **URL Inspection** (top of GSC)
2. Paste the correct URL:
   ```
   https://pickafarm.com/christmas-tree-farms/near/philadelphia-pa-us/
   ```
3. Click: **Request Indexing**
4. Wait for confirmation

**Recommended:** Request indexing for top 50 high-traffic URLs (prioritize major cities).

---

## Step 4: Monitor Progress

### Week 1 (Days 1-7)
**Check Daily:**
- GSC → **Pages** → Filter by "Not found (404)"
- Target: 50% reduction (400 → 200 errors)

**What to look for:**
- Old URLs should start disappearing from 404 list
- New URLs should appear in "Indexed" pages
- Crawl stats should show increased crawl rate

### Week 2-4 (Days 8-28)
**Check Weekly:**
- GSC → **Pages** → Filter by "Not found (404)"
- Target: 80% reduction (400 → 80 errors)

**What to look for:**
- 404 count steadily decreasing
- Correct URLs appearing in search results
- No new 404 errors introduced

---

## Step 5: Verify Redirects Are Working

Periodically check that redirects are functioning correctly.

### Sample Test URLs

**Test these old URLs in browser (should redirect):**

1. Old URL: `https://pickafarm.com/pumpkin-patches/near/henderson-tx-canada/`
   → Should redirect to: `/pumpkin-patches/near/henderson-tx-us/`

2. Old URL: `https://pickafarm.com/christmas-tree-farms/near/philadelphia-pa-united-states/`
   → Should redirect to: `/christmas-tree-farms/near/philadelphia-pa-us/`

3. Old URL: `https://pickafarm.com/christmas-tree-farms/near/toronto-ontario-canada/`
   → Should redirect to: `/christmas-tree-farms/near/toronto-on-ca/`

**Verification:**
- Browser should redirect automatically (308 Permanent Redirect)
- Destination page should load successfully
- URL bar should show the new correct URL

---

## Troubleshooting

### Issue: Removal Requests Denied

**Reason:** Google may deny removal if:
- The URL is still returning 404 (not redirecting)
- The URL wasn't crawled yet after deployment
- The pattern is too broad

**Solution:**
- Verify redirects are working in production
- Use more specific URL patterns
- Wait 48 hours and retry

---

### Issue: 404 Count Not Decreasing

**Possible causes:**
1. Redirects not deployed to production
2. Caching issues (Cloudflare cache not cleared)
3. Google hasn't re-crawled the URLs yet

**Solution:**
1. Verify redirects work in production
2. Clear Cloudflare cache: Cloudflare Dashboard → Caching → Purge Everything
3. Request re-indexing for sample URLs
4. Wait 7-14 days for Google to re-crawl

---

### Issue: New 404 Errors Appearing

**Possible causes:**
1. New locations added with bad data
2. Validation script not running
3. Bug in data generation scripts

**Solution:**
1. Check build logs: `npm run validate-locations`
2. Review any new locations added recently
3. Fix data and redeploy

---

## Success Metrics

### Immediate (Week 1)
- ✅ Updated sitemap submitted
- ✅ Removal requests submitted for all 3 patterns
- ✅ 50 high-traffic URLs re-indexed
- 📉 404 count reduced by 50%

### Short-term (Week 2-4)
- 📉 404 count reduced by 80%
- 📈 Correct URLs appearing in search results
- ✅ Redirect success rate >95%
- ✅ 0 new 404 errors introduced

### Long-term (1-3 Months)
- 📉 404 count <20 total
- 📈 Organic traffic stable or increasing
- 📈 SEO rankings stable or improving
- ✅ 0 new location data errors

---

## Reference: All 404 URL Patterns

Based on `Bugs/Table.csv` analysis, here are all the malformed URL patterns to remove:

### US States with `-canada` suffix:
```
*-al-canada, *-ak-canada, *-az-canada, *-ar-canada, *-ca-canada, *-co-canada,
*-ct-canada, *-de-canada, *-fl-canada, *-ga-canada, *-hi-canada, *-id-canada,
*-il-canada, *-in-canada, *-ia-canada, *-ks-canada, *-ky-canada, *-la-canada,
*-me-canada, *-md-canada, *-ma-canada, *-mi-canada, *-mn-canada, *-ms-canada,
*-mo-canada, *-mt-canada, *-ne-canada, *-nv-canada, *-nh-canada, *-nj-canada,
*-nm-canada, *-ny-canada, *-nc-canada, *-nd-canada, *-oh-canada, *-ok-canada,
*-or-canada, *-pa-canada, *-ri-canada, *-sc-canada, *-sd-canada, *-tn-canada,
*-tx-canada, *-ut-canada, *-vt-canada, *-va-canada, *-wa-canada, *-wv-canada,
*-wi-canada, *-wy-canada, *-dc-canada
```

### Full country names:
```
*-united-states/
```

### Full province names:
```
*-ontario-canada/, *-quebec-canada/, *-british-columbia-canada/,
*-alberta-canada/, *-manitoba-canada/, *-saskatchewan-canada/,
*-nova-scotia-canada/, *-new-brunswick-canada/,
*-newfoundland-and-labrador-canada/, *-prince-edward-island-canada/,
*-northwest-territories-canada/, *-yukon-canada/, *-nunavut-canada/
```

---

## Appendix: Batch Removal Script Template

For bulk removal requests, you can use this Google Apps Script to automate submission via GSC API (requires setup):

```javascript
// Google Search Console API - Batch URL Removal
// Note: Requires GSC API access and authentication setup

const SITE_URL = 'https://pickafarm.com';
const PATTERNS_TO_REMOVE = [
  '/christmas-tree-farms/near/*-tx-canada/',
  '/pumpkin-patches/near/*-tx-canada/',
  '/corn-mazes/near/*-tx-canada/',
  '/all-farms-near/near/*-united-states/',
  '/christmas-tree-farms/near/*-ontario-canada/'
  // Add more patterns...
];

function removeOutdatedURLs() {
  // Implementation requires GSC API authentication
  // See: https://developers.google.com/search-console/api/v1/how-tos/search-analytics

  PATTERNS_TO_REMOVE.forEach(pattern => {
    console.log(`Submitting removal request for: ${pattern}`);
    // API call to submit removal request
  });
}
```

---

## Contact & Support

**For questions or issues:**
- Review PRD: `Bugs/PRD-404-Error-Resolution.md`
- Check validation: `npm run validate-locations`
- Test redirects locally: `npm run build && npm run start`

**Last Updated:** 2025-10-10
