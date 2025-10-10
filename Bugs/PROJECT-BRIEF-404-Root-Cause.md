# Project Brief: 404 URL Root Cause Investigation

**Date:** 2025-10-09
**Project:** PickAFarm Website - 404 Error Resolution
**Severity:** HIGH - SEO Impact
**Status:** Root Cause Identified - Awaiting Implementation

---

## Executive Summary

Google Search Console reported **400+ URLs returning 404 errors** on pickafarm.com. Investigation revealed a **critical bug** in the data generation pipeline that has been actively corrupting location data, resulting in malformed URLs being indexed by Google.

**Root Cause:** Bug in `web/scripts/report-missing-locations.js` line 484 that defaults US cities to "Canada" when the country field is null, undefined, or doesn't match expected variants.

**Impact:**
- 400+ broken URLs indexed by Google
- Negative SEO impact (crawl budget waste, broken backlinks, lost organic traffic)
- Poor user experience for users clicking search results
- Data integrity issues in `locations.json` affecting entire build pipeline

**Timeline:**
- **Sept-Oct 2025:** Bug introduced bad data via manual "Add Locations" script runs
- **Oct 5, 2025:** Build generated bad sitemaps, Google indexed malformed URLs
- **Oct 6-7, 2025:** Google crawled and cached 400+ broken URLs
- **Oct 8, 2025:** Data corrected manually, but Google still has stale cache
- **Oct 9, 2025:** Root cause investigation completed

---

## Problem Description

### Observed Patterns

Three distinct 404 URL patterns were identified in Google Search Console:

#### Pattern 1: Bug-Created URLs (US Cities → Canada)
❌ **WRONG:**
```
/pumpkin-patches/near/henderson-tx-canada/
/christmas-tree-farms/near/jesup-ga-canada/
/christmas-tree-farms/near/cadott-wi-canada/
/pumpkin-patches/near/livingston-tx-canada/
```

✅ **CORRECT:**
```
/pumpkin-patches/near/henderson-tx-us/
/christmas-tree-farms/near/jesup-ga-us/
/christmas-tree-farms/near/cadott-wi-us/
/pumpkin-patches/near/livingston-tx-us/
```

**Cause:** `report-missing-locations.js` line 484 bug

#### Pattern 2: Historical Format (Full Country Names)
❌ **OLD FORMAT:**
```
/all-farms-near/near/philadelphia-pa-united-states/
/christmas-tree-farms/near/new-york-ny-united-states/
```

✅ **NEW FORMAT:**
```
/all-farms-near/near/philadelphia-pa-us/
/christmas-tree-farms/near/new-york-ny-us/
```

**Cause:** Old URL format from previous migration

#### Pattern 3: Historical Format (Full Province Names)
❌ **OLD FORMAT:**
```
/christmas-tree-farms/near/toronto-ontario-canada/
/pumpkin-patches/near/hamilton-ontario-canada/
/all-farms-near/near/vancouver-british-columbia-canada/
```

✅ **NEW FORMAT:**
```
/christmas-tree-farms/near/toronto-on-ca/
/pumpkin-patches/near/hamilton-on-ca/
/all-farms-near/near/vancouver-bc-ca/
```

**Cause:** Old URL format from previous migration

---

## Root Cause Analysis

### Primary Cause: Bug in `report-missing-locations.js`

**File:** `web/scripts/report-missing-locations.js`
**Line:** 484
**Severity:** CRITICAL

#### The Bug

```javascript
// LINE 484 - THE BUG:
const isUS = c.country === 'United States' || c.country === 'USA' || c.country === 'US';
const country = isUS ? 'United States' : 'Canada';  // ❌ DEFAULTS TO CANADA!
const countrySlug = isUS ? 'us' : 'ca';
```

#### How It Breaks

The binary check only recognizes three exact country values:
- ✅ `'United States'`
- ✅ `'USA'`
- ✅ `'US'`

**Any other value defaults to Canada**, including:
- ❌ `null` (no country data)
- ❌ `undefined` (missing field)
- ❌ `'United States of America'` (common variant)
- ❌ Any misspelling or variation

#### Real-World Example

From git history (Oct 5, 2025 commit):

**Input (from farm data):**
```javascript
{
  city: "Henderson",
  province: "Texas",
  country: null  // ← Farm has no country data
}
```

**Output (written to locations.json):**
```json
{
  "name": "Henderson",
  "province": "Texas",
  "province_slug": "tx",
  "country": "Canada",        // ❌ WRONG - US city marked as Canada
  "country_slug": "ca",        // ❌ WRONG
  "location_slug": "henderson-tx-ca"  // ❌ Wrong URL generated
}
```

**Result:** URL `/pumpkin-patches/near/henderson-tx-canada/` indexed by Google → 404 error

---

### Secondary Causes: Historical Format Migration

**Stale File:** `web/data/location-params.json`
- Contains old Canadian URL format (`toronto-ontario-canada` instead of `toronto-on-ca`)
- NOT imported anywhere in codebase
- Safe to delete

**Old Sitemaps:**
- Generated before slug format migration
- Old URLs still cached by Google

---

## Data Propagation Path

The bug in `report-missing-locations.js` corrupts data that flows through the entire build pipeline:

```
┌─────────────────────────────────┐
│ report-missing-locations.js     │  ← BUG HERE (Line 484)
│ (run manually)                  │
└──────────────┬──────────────────┘
               │ Appends bad data (Line 589)
               ▼
┌─────────────────────────────────┐
│ web/data/locations.json         │  ← CORRUPTED SOURCE DATA
└──────────────┬──────────────────┘
               │ Read by
               ▼
┌─────────────────────────────────┐
│ generate-location-data.js       │  ← Script is fine, but reads bad data
│ (runs in npm run prebuild)      │
└──────────────┬──────────────────┘
               │ Generates
               ▼
┌─────────────────────────────────┐
│ locations-with-farms.json       │  ← Inherits bad country assignments
└──────────────┬──────────────────┘
               │ Used by
               ▼
┌─────────────────────────────────┐
│ generate-sitemaps.js            │  ← Generates bad URLs
│ (runs in npm run prebuild)      │
└──────────────┬──────────────────┘
               │ Creates sitemap with bad URLs
               ▼
┌─────────────────────────────────┐
│ sitemap.xml                     │  ← Bad URLs submitted to Google
└──────────────┬──────────────────┘
               │ Google crawls
               ▼
┌─────────────────────────────────┐
│ Google Search Console           │  ← 404 errors reported
│ 400+ broken URLs indexed        │
└─────────────────────────────────┘
```

**Key Finding:** `report-missing-locations.js` is NOT part of automated build pipeline (not in `run-parallel.js`). Bug only manifests when script is run **manually** to add new locations.

---

## Investigation Timeline

### Phase 1: Pattern Identification (Quinn - QA Agent)

1. **Analyzed 404 Table** (`Bugs/Table.csv`) - 400+ broken URLs
2. **Identified Three Patterns:**
   - US cities with `-canada` suffix
   - Full country names `-united-states`
   - Full province names `-ontario-canada`
3. **Initial Hypothesis (INCORRECT):**
   - Blamed stale `location-params.json`
   - Suggested bug in `generate-location-data.js` line 145
4. **Created Report:** `Bugs/404-url-analysis.md`

**Outcome:** Pattern identification correct, but missed true root cause

### Phase 2: Deep Dive Analysis (Mary - Analyst Agent)

1. **Git History Analysis:**
   - Checked historical `locations.json` (Oct 5, 2025)
   - Found US cities incorrectly marked as "Canada"
   - Verified current sitemaps have CORRECT URLs
2. **Script Verification:**
   - Confirmed `generate-location-data.js` is NOT buggy
   - Confirmed `location-params.json` is NOT imported anywhere
3. **User Direction:**
   - User pointed to `report-missing-locations.js` as potential source
4. **Bug Discovery:**
   - Found exact bug location: line 484
   - Analyzed unsafe default behavior
5. **Build Pipeline Audit:**
   - Identified all scripts that write to `locations.json`
   - Mapped complete data flow
6. **Updated Report:** `Bugs/ANALYST-REVIEW-404-Root-Cause.md`

**Outcome:** Root cause identified with exact code location and fix

---

## Technical Details

### Files Affected

| File | Status | Impact |
|------|--------|--------|
| `web/scripts/report-missing-locations.js` | ❌ **BUGGY** | Creates bad data |
| `web/data/locations.json` | ⚠️ **CORRUPTED** | Contains bad entries from bug |
| `web/data/locations-with-farms.json` | ⚠️ **INHERITED** | Inherits bad data |
| `web/data/location-params.json` | ⚠️ **STALE** | Old format, not imported |
| `web/scripts/generate-location-data.js` | ✅ **CORRECT** | Script is fine |
| `web/scripts/generate-sitemaps.js` | ✅ **CORRECT** | Script is fine |
| `web/scripts/generate-state-data.js` | ✅ **CORRECT** | Has correct country detection |

### Additional Bugs in Same Script

**Line 362-369:** Different country check logic (inconsistent)
```javascript
const fullCountryName = data.country === 'United States of America' ? 'United States' : 'Canada';
```

**Line 433:** Another unsafe default
```javascript
const fullCountryName = isCAN ? 'Canada' : 'United States';
```

**Line 444-448:** Third variant of country normalization
```javascript
const isUSA = location.country_slug === 'us' || location.country === 'United States' || location.country === 'USA';
const fullCountryName = isUSA ? 'United States' : 'Canada';
```

**Recommendation:** Consolidate all country normalization logic into a single, safe function.

---

## Proposed Solution

### Priority 1: Fix the Bug (CRITICAL)

**File:** `web/scripts/report-missing-locations.js`
**Line:** 483-485

**Change from:**
```javascript
const isUS = c.country === 'United States' || c.country === 'USA' || c.country === 'US';
const country = isUS ? 'United States' : 'Canada';  // ❌ UNSAFE DEFAULT
const countrySlug = isUS ? 'us' : 'ca';
```

**Change to:**
```javascript
// Comprehensive country normalization with SAFE fallback based on province
const isUS = c.country === 'United States' ||
             c.country === 'USA' ||
             c.country === 'US' ||
             c.country === 'United States of America';

const isCanada = c.country === 'Canada' ||
                 c.country === 'CA';

let country;
let countrySlug;

if (isUS) {
  country = 'United States';
  countrySlug = 'us';
} else if (isCanada) {
  country = 'Canada';
  countrySlug = 'ca';
} else {
  // ⚠️  FALLBACK: Use province to determine country
  const usStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
                    'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
                    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
                    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
                    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

  const canadianProvinces = ['AB','BC','MB','NB','NL','NT','NS','NU',
                             'ON','PE','QC','SK','YT'];

  const provinceAbbrev = getProvinceAbbrev(c.province);

  if (usStates.includes(provinceAbbrev)) {
    country = 'United States';
    countrySlug = 'us';
    console.warn(`⚠️  Inferred country=US for ${c.city}, ${c.province} (original country: ${c.country})`);
  } else if (canadianProvinces.includes(provinceAbbrev)) {
    country = 'Canada';
    countrySlug = 'ca';
    console.warn(`⚠️  Inferred country=Canada for ${c.city}, ${c.province} (original country: ${c.country})`);
  } else {
    console.error(`❌ ERROR: Cannot determine country for ${c.city}, ${c.province}, country=${c.country}`);
    return null; // Skip this location - better to skip than corrupt
  }
}
```

**Why This Fix Works:**
1. ✅ Handles `null`, `undefined`, and variant country names
2. ✅ Uses province/state codes as fallback inference
3. ✅ Logs warnings when inference is used (for manual review)
4. ✅ Returns `null` for truly ambiguous cases (prevents corruption)
5. ✅ Explicitly checks for "United States of America"

---

### Priority 2: Create Validation Script (CRITICAL)

**File:** `web/scripts/validate-location-data.js` (NEW FILE)

```javascript
#!/usr/bin/env node

/**
 * Validation script for locations.json
 * Detects country assignment errors (US states marked as Canada, etc.)
 * Run as part of prebuild to catch data corruption early
 */

const fs = require('fs');
const path = require('path');

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
                   'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
                   'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
                   'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
                   'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

const CANADIAN_PROVINCES = ['AB','BC','MB','NB','NL','NT','NS','NU',
                           'ON','PE','QC','SK','YT'];

function validateLocationData() {
  const locationsPath = path.join(__dirname, '../data/locations.json');

  if (!fs.existsSync(locationsPath)) {
    console.error('❌ ERROR: locations.json not found');
    process.exit(1);
  }

  const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
  const errors = [];

  locations.forEach((location, index) => {
    const { name, province_slug, country, country_slug, location_slug } = location;

    // ERROR 1: US state with Canada country
    if (US_STATES.includes(province_slug?.toUpperCase()) && country_slug === 'ca') {
      errors.push({
        line: index + 1,
        name: name,
        province: province_slug,
        country: country_slug,
        slug: location_slug,
        error: `US state "${province_slug}" marked as Canada`
      });
    }

    // ERROR 2: Canadian province with US country
    if (CANADIAN_PROVINCES.includes(province_slug?.toUpperCase()) && country_slug === 'us') {
      errors.push({
        line: index + 1,
        name: name,
        province: province_slug,
        country: country_slug,
        slug: location_slug,
        error: `Canadian province "${province_slug}" marked as US`
      });
    }

    // ERROR 3: Invalid location_slug format
    const slugPattern = /^[a-z0-9-]+-[a-z]{2}-[a-z]{2}$/;
    if (location_slug && !slugPattern.test(location_slug)) {
      errors.push({
        line: index + 1,
        name: name,
        slug: location_slug,
        error: `Invalid slug format (expected: city-state-country)`
      });
    }

    // ERROR 4: Old format slugs
    if (location_slug && (
        location_slug.includes('-canada') ||
        location_slug.includes('-united-states') ||
        location_slug.includes('-ontario-') ||
        location_slug.includes('-quebec-') ||
        location_slug.includes('-british-columbia-')
    )) {
      errors.push({
        line: index + 1,
        name: name,
        slug: location_slug,
        error: `Old format slug detected (should be 2-letter codes)`
      });
    }
  });

  if (errors.length > 0) {
    console.error('\n❌ VALIDATION FAILED - Found', errors.length, 'errors:\n');
    errors.forEach(err => {
      console.error(`  Line ${err.line}: ${err.name}`);
      console.error(`    Slug: ${err.slug}`);
      console.error(`    Error: ${err.error}\n`);
    });
    process.exit(1);
  } else {
    console.log('✅ VALIDATION PASSED - All location data is valid');
  }
}

validateLocationData();
```

**Integration:**

Update `web/package.json`:
```json
{
  "scripts": {
    "prebuild": "node scripts/extract-critical-css.js && node scripts/generate-farm-data.js && node scripts/optimize-blog-images.js && node scripts/run-parallel.js && node scripts/validate-location-data.js",
    "validate-locations": "node scripts/validate-location-data.js"
  }
}
```

**Benefits:**
- ✅ Catches data corruption before build
- ✅ Blocks deployment if validation fails
- ✅ Provides clear error messages for debugging
- ✅ Prevents future 404s from bad data

---

### Priority 3: Implement Redirects (HIGH)

Create comprehensive 301 redirects to handle all three URL patterns.

**File:** `web/next.config.js`

**Add to existing config:**
```javascript
async redirects() {
  return [
    // PATTERN 1: US cities incorrectly tagged as Canada (bug-created)
    {
      source: '/:category/near/:city-al-canada',
      destination: '/:category/near/:city-al-us',
      permanent: true,
    },
    {
      source: '/:category/near/:city-tx-canada',
      destination: '/:category/near/:city-tx-us',
      permanent: true,
    },
    {
      source: '/:category/near/:city-ga-canada',
      destination: '/:category/near/:city-ga-us',
      permanent: true,
    },
    {
      source: '/:category/near/:city-wi-canada',
      destination: '/:category/near/:city-wi-us',
      permanent: true,
    },
    {
      source: '/:category/near/:city-il-canada',
      destination: '/:category/near/:city-il-us',
      permanent: true,
    },
    {
      source: '/:category/near/:city-ny-canada',
      destination: '/:category/near/:city-ny-us',
      permanent: true,
    },
    {
      source: '/:category/near/:city-pa-canada',
      destination: '/:category/near/:city-pa-us',
      permanent: true,
    },
    {
      source: '/:category/near/:city-ca-canada',
      destination: '/:category/near/:city-ca-us',
      permanent: true,
    },
    {
      source: '/:category/near/:city-fl-canada',
      destination: '/:category/near/:city-fl-us',
      permanent: true,
    },
    {
      source: '/:category/near/:city-mi-canada',
      destination: '/:category/near/:city-mi-us',
      permanent: true,
    },
    {
      source: '/:category/near/:city-oh-canada',
      destination: '/:category/near/:city-oh-us',
      permanent: true,
    },
    // Add all 50 US states...

    // PATTERN 2: Full country names to codes
    {
      source: '/:category/near/:location-united-states',
      destination: '/:category/near/:location-us',
      permanent: true,
    },

    // PATTERN 3: Full province names to codes (Canadian)
    {
      source: '/:category/near/:city-ontario-canada',
      destination: '/:category/near/:city-on-ca',
      permanent: true,
    },
    {
      source: '/:category/near/:city-quebec-canada',
      destination: '/:category/near/:city-qc-ca',
      permanent: true,
    },
    {
      source: '/:category/near/:city-british-columbia-canada',
      destination: '/:category/near/:city-bc-ca',
      permanent: true,
    },
    {
      source: '/:category/near/:city-alberta-canada',
      destination: '/:category/near/:city-ab-ca',
      permanent: true,
    },
    {
      source: '/:category/near/:city-manitoba-canada',
      destination: '/:category/near/:city-mb-ca',
      permanent: true,
    },
    {
      source: '/:category/near/:city-saskatchewan-canada',
      destination: '/:category/near/:city-sk-ca',
      permanent: true,
    },
    {
      source: '/:category/near/:city-nova-scotia-canada',
      destination: '/:category/near/:city-ns-ca',
      permanent: true,
    },
    {
      source: '/:category/near/:city-new-brunswick-canada',
      destination: '/:category/near/:city-nb-ca',
      permanent: true,
    },
    {
      source: '/:category/near/:city-newfoundland-canada',
      destination: '/:category/near/:city-nl-ca',
      permanent: true,
    },
    {
      source: '/:category/near/:city-prince-edward-island-canada',
      destination: '/:category/near/:city-pe-ca',
      permanent: true,
    },
    // Add remaining provinces...
  ];
}
```

**Alternative: Cloudflare Pages `_redirects`** (if Next.js redirects have performance issues)

**File:** `web/public/_redirects`

```
# Pattern 1: US states incorrectly tagged as Canada
/*/near/*-tx-canada/* /*/near/*-tx-us/:splat 301
/*/near/*-ga-canada/* /*/near/*-ga-us/:splat 301
/*/near/*-wi-canada/* /*/near/*-wi-us/:splat 301
# ... add all 50 states

# Pattern 2: Full country names
/*/near/*-united-states/* /*/near/*-us/:splat 301

# Pattern 3: Full province names (Canadian)
/*/near/*-ontario-canada/* /*/near/*-on-ca/:splat 301
/*/near/*-quebec-canada/* /*/near/*-qc-ca/:splat 301
/*/near/*-british-columbia-canada/* /*/near/*-bc-ca/:splat 301
# ... add all provinces
```

**Benefits:**
- ✅ Preserves SEO value (301 = permanent)
- ✅ Improves user experience (no broken links)
- ✅ Signals to Google that URLs have moved
- ✅ Prevents crawl budget waste

---

### Priority 4: Google Search Console Cleanup (MEDIUM)

1. **Submit Updated Sitemap:**
   - Go to Google Search Console
   - Submit `https://pickafarm.com/sitemap.xml`
   - Request re-crawl of updated location pages

2. **Use URL Removal Tool:**
   - Navigate to "Removals" in Google Search Console
   - Select "Temporarily hide"
   - Add pattern: `pickafarm.com/*/near/*-canada/*` (for US states)
   - Mark as "Outdated content"

3. **Monitor 404 Report:**
   - Track weekly reduction in 404 errors
   - Expected timeline: 2-4 weeks for full resolution
   - Verify redirects working (301 status codes in logs)

4. **Submit Redirect List:**
   - If available, use "Change of Address" tool for bulk redirects
   - Speeds up Google's re-indexing process

---

## Testing Plan

### Pre-Deployment Testing

**Developer Tasks:**

- [ ] **Apply bug fix** to `report-missing-locations.js` line 484
- [ ] **Create validation script** `validate-location-data.js`
- [ ] **Run validation** on current `locations.json`:
  ```bash
  cd web
  npm run validate-locations
  ```
- [ ] **Fix any detected errors** in `locations.json` manually
- [ ] **Test bug fix** with NULL country farms:
  ```bash
  # Create test case with null country
  # Run report-missing-locations.js
  # Verify province-based inference works
  ```
- [ ] **Implement redirect rules** in `next.config.js`
- [ ] **Test redirects locally**:
  ```bash
  npm run build
  npm run start
  # Visit http://localhost:3000/pumpkin-patches/near/henderson-tx-canada/
  # Should redirect to .../henderson-tx-us/
  ```
- [ ] **Verify redirect status codes** (must be 301, not 302)
- [ ] **Check console for warnings** during build

### Post-Deployment Testing

- [ ] **Test production redirects** (sample 20-30 URLs from 404 report)
  ```bash
  curl -I https://pickafarm.com/pumpkin-patches/near/henderson-tx-canada/
  # Verify: HTTP/1.1 301 Moved Permanently
  # Verify: Location: .../henderson-tx-us/
  ```
- [ ] **Validate sitemap** has no old-format URLs:
  ```bash
  curl https://pickafarm.com/sitemap.xml | grep -E '(ontario-canada|united-states|tx-canada)'
  # Should return NO results
  ```
- [ ] **Monitor Cloudflare Analytics** for redirect traffic
- [ ] **Check Google Search Console** (week 1, 2, 4):
  - 404 count trending down
  - Redirect success rate
  - No new unexpected 404s

---

## Risk Assessment

### Risks if Not Fixed

| Risk | Likelihood | Impact | Cost |
|------|-----------|--------|------|
| Continued SEO penalty | HIGH | MEDIUM | Lost organic traffic, reduced rankings |
| Lost conversions | MEDIUM | HIGH | Users can't find farms, revenue impact |
| Poor user experience | HIGH | MEDIUM | Broken links, low trust |
| Crawl budget waste | HIGH | LOW | Google wastes resources on 404s |
| Data corruption spreads | MEDIUM | HIGH | More bad locations added over time |

### Risks of Proposed Fix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking existing valid URLs | LOW | HIGH | Comprehensive testing, validation script |
| Redirect loops | LOW | MEDIUM | Test all redirect rules carefully |
| Province inference wrong | LOW | MEDIUM | Validate province lists, log warnings |
| Performance impact | LOW | LOW | Next.js handles redirects efficiently |
| Validation script too strict | MEDIUM | LOW | Refine validation rules based on testing |

---

## Success Metrics

### Immediate (Week 1)
- ✅ Bug fix deployed to production
- ✅ Validation script integrated into build pipeline
- ✅ All redirects tested and working
- ✅ No new 404 errors introduced

### Short-term (2-4 Weeks)
- 📉 404 error count reduced by 80%+
- 📈 Redirect success rate > 95%
- ✅ Google re-crawling updated pages
- ✅ No data validation errors in builds

### Long-term (1-3 Months)
- 📉 404 errors reduced to baseline (<20 total)
- 📈 Organic traffic recovered to pre-issue levels
- ✅ SEO rankings stabilized/improved
- ✅ Zero country assignment errors in new locations

---

## Action Items

### Critical (Before Next Deployment)

**Developer:**
1. ✅ Fix bug in `report-missing-locations.js` line 484
2. ✅ Create `validate-location-data.js` script
3. ✅ Run validation, fix detected errors in `locations.json`
4. ✅ Implement comprehensive redirect rules
5. ✅ Test redirects locally (verify 301 status)
6. ✅ Update `package.json` to include validation in prebuild

**QA/Analyst:**
1. ✅ Review bug fix code for correctness
2. ✅ Verify validation script catches all error types
3. ✅ Test sample old URLs to confirm redirect destinations
4. ✅ Create test cases for NULL country farms

### High Priority (Week 1 Post-Deploy)

**Developer:**
1. Deploy to production
2. Submit updated sitemap to Google Search Console
3. Monitor build logs for validation warnings
4. Set up Cloudflare Analytics dashboard for redirects

**SEO/Marketing:**
1. Use Google Search Console removal tool for old URLs
2. Monitor 404 report daily (first week)
3. Check redirect traffic in analytics
4. Document SEO impact for stakeholders

### Medium Priority (Ongoing)

**Developer:**
1. Consolidate all country normalization logic into shared utility function
2. Add unit tests for country detection logic
3. Review other data generation scripts for similar unsafe defaults
4. Add documentation comments to `report-missing-locations.js` warning about the bug

**Analyst:**
1. Weekly 404 monitoring (weeks 1-4)
2. Track organic traffic recovery
3. Monitor for new unexpected 404s
4. Document final resolution and learnings

---

## Lessons Learned

### What Went Well
- ✅ Git history analysis successfully traced data corruption to source
- ✅ Comprehensive analysis caught multiple URL format issues
- ✅ Build pipeline audit identified all affected scripts
- ✅ Validation script approach prevents future occurrences

### What Could Be Improved
- ⚠️  Initial QA analysis missed root cause (focused on symptoms)
- ⚠️  Manual script (`report-missing-locations.js`) not part of automated build → easy to overlook
- ⚠️  No data validation in build pipeline allowed bad data to propagate
- ⚠️  Inconsistent country normalization logic across multiple functions
- ⚠️  No unit tests for data transformation logic

### Preventive Measures for Future

1. **Add Validation to Build Pipeline:**
   - `validate-location-data.js` blocks build on errors
   - Catches data corruption before deployment

2. **Standardize Data Normalization:**
   - Create shared utility functions for country/province normalization
   - Single source of truth for state/province lists
   - Reduce code duplication

3. **Add Unit Tests:**
   - Test country detection with NULL, undefined, variant names
   - Test province-based country inference
   - Test slug generation edge cases

4. **Improve Documentation:**
   - Add comments explaining unsafe defaults
   - Document manual script usage and risks
   - Update CLAUDE.md with bug details

5. **Automated Monitoring:**
   - Set up alerts for sudden 404 spikes in Google Search Console
   - Weekly automated validation reports
   - Cloudflare Analytics monitoring for redirect patterns

---

## References

### Reports
- **404 URL Table:** `Bugs/Table.csv` (400+ broken URLs)
- **Initial QA Analysis:** `Bugs/404-url-analysis.md` (Quinn)
- **Final Root Cause Analysis:** `Bugs/ANALYST-REVIEW-404-Root-Cause.md` (Mary)
- **This Document:** `Bugs/PROJECT-BRIEF-404-Root-Cause.md`

### Code Files
- **Bug Source:** `web/scripts/report-missing-locations.js` (line 484)
- **Data Files:**
  - `web/data/locations.json` (corrupted source)
  - `web/data/locations-with-farms.json` (generated, inherits corruption)
  - `web/data/location-params.json` (stale, old format)
- **Build Scripts:**
  - `web/scripts/generate-location-data.js` (reads locations.json)
  - `web/scripts/generate-sitemaps.js` (generates XML sitemaps)
  - `web/scripts/generate-state-data.js` (has correct country detection)
  - `web/scripts/run-parallel.js` (build orchestration)
- **Config:** `web/next.config.js` (redirects)

### Documentation
- **Application Architecture:** `.agent/Docs/DOC_Application_Architecture.md`
- **Build Scripts:** `.agent/Docs/DOC_Build-Scripts-Data-Generation.md`
- **Project Instructions:** `CLAUDE.md`

---

## Approval Sign-Off

**Prepared by:** Mary (Data Analyst)
**Date:** 2025-10-09

**Review Required:**
- [ ] Developer Lead (Code Review)
- [ ] QA Lead (Testing Plan Review)
- [ ] SEO Manager (Redirect Strategy Review)
- [ ] Product Owner (Deployment Approval)

**Status:** ⏳ Awaiting approval to proceed with implementation

---

## Appendix: Sample 404 URLs

### Pattern 1: Bug-Created (US → Canada)
```
https://pickafarm.com/pumpkin-patches/near/henderson-tx-canada/
https://pickafarm.com/christmas-tree-farms/near/jesup-ga-canada/
https://pickafarm.com/christmas-tree-farms/near/cadott-wi-canada/
https://pickafarm.com/pumpkin-patches/near/livingston-tx-canada/
https://pickafarm.com/christmas-tree-farms/near/dundas-on-canada/
https://pickafarm.com/christmas-tree-farms/near/madison-wi-canada/
```

### Pattern 2: Historical Format (Full Country)
```
https://pickafarm.com/all-farms-near/near/philadelphia-pa-united-states/
https://pickafarm.com/christmas-tree-farms/near/new-york-ny-united-states/
https://pickafarm.com/pumpkin-patches/near/albany-ny-united-states/
```

### Pattern 3: Historical Format (Full Province)
```
https://pickafarm.com/christmas-tree-farms/near/toronto-ontario-canada/
https://pickafarm.com/pumpkin-patches/near/hamilton-ontario-canada/
https://pickafarm.com/all-farms-near/near/vancouver-british-columbia-canada/
https://pickafarm.com/christmas-tree-farms/near/ottawa-ontario-canada/
```

**Total 404s:** 400+ URLs (exact count available in `Bugs/Table.csv`)

---

**END OF PROJECT BRIEF**
