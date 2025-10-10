# PRD: 404 Error Resolution & Data Quality Enforcement

**Document ID:** PRD-2025-001
**Created:** 2025-10-09
**Status:** 🟡 Ready for Implementation
**Priority:** 🔴 CRITICAL
**Project:** PickAFarm Website - SEO Health & Data Integrity

---

## Executive Summary

### Problem Statement

Google Search Console has identified **400+ URLs returning 404 errors** on pickafarm.com, causing:
- Negative SEO impact (wasted crawl budget, lost organic traffic)
- Poor user experience (broken search results)
- Data integrity issues across the entire build pipeline

### Root Cause

A critical bug in `web/scripts/report-missing-locations.js` line 484 incorrectly defaults US cities to "Canada" when country data is null/undefined, generating malformed URLs like `/pumpkin-patches/near/henderson-tx-canada/` instead of `/pumpkin-patches/near/henderson-tx-us/`.

### Solution Overview

1. **Fix the data generation bug** with safe fallback logic using province/state inference
2. **Create validation pipeline** to prevent future data corruption
3. **Implement comprehensive redirects** to preserve SEO value and fix user experience
4. **Clean up Google Search Console** to accelerate re-indexing

### Success Metrics

- ✅ Zero new 404 errors from data generation bugs
- 📉 Existing 404 count reduced by 80%+ within 2-4 weeks
- 📈 Organic traffic recovered to baseline within 1-3 months
- ✅ 95%+ redirect success rate

---

## Background & Context

### Timeline of Events

| Date | Event |
|------|-------|
| Sept-Oct 2025 | Bug introduced bad data via manual "Add Locations" script runs |
| Oct 5, 2025 | Build generated bad sitemaps, Google indexed malformed URLs |
| Oct 6-7, 2025 | Google crawled and cached 400+ broken URLs |
| Oct 8, 2025 | Data corrected manually, but Google still has stale cache |
| Oct 9, 2025 | Root cause investigation completed |

### Data Flow Impact

```
report-missing-locations.js (BUG HERE)
    ↓ Appends bad data
locations.json (CORRUPTED)
    ↓ Read by
generate-location-data.js
    ↓ Generates
locations-with-farms.json (INHERITS BAD DATA)
    ↓ Used by
generate-sitemaps.js
    ↓ Creates
sitemap.xml (BAD URLs)
    ↓ Google crawls
Google Search Console (400+ 404s)
```

### 404 URL Patterns Identified

#### Pattern 1: Bug-Created URLs (US Cities → Canada)
- **Examples:** `/pumpkin-patches/near/henderson-tx-canada/`, `/christmas-tree-farms/near/jesup-ga-canada/`
- **Cause:** Line 484 bug in `report-missing-locations.js`
- **Count:** ~200+ URLs

#### Pattern 2: Historical Format (Full Country Names)
- **Examples:** `/all-farms-near/near/philadelphia-pa-united-states/`
- **Cause:** Old URL format from previous migration
- **Count:** ~100+ URLs

#### Pattern 3: Historical Format (Full Province Names)
- **Examples:** `/christmas-tree-farms/near/toronto-ontario-canada/`
- **Cause:** Old URL format from previous migration
- **Count:** ~100+ URLs

---

## Goals & Objectives

### Primary Goals

1. **Eliminate data generation bugs** that create invalid location URLs
2. **Prevent future data corruption** through automated validation
3. **Preserve SEO value** by implementing proper 301 redirects
4. **Restore user experience** by fixing all broken links

### Secondary Goals

1. Consolidate country normalization logic across all scripts
2. Add comprehensive unit tests for data transformation logic
3. Document data generation pipeline risks
4. Set up monitoring for future 404 spikes

### Non-Goals

- Migrating to a different CMS or data source
- Redesigning URL structure (current format is correct)
- Implementing runtime location data (static generation is intentional)

---

## User Stories & Use Cases

### User Story 1: Developer Adding New Locations
**As a** developer running the "Add Locations" script
**I want** the script to correctly infer country from province/state when country data is missing
**So that** I don't accidentally create invalid URLs that result in 404 errors

**Acceptance Criteria:**
- Script recognizes all US state abbreviations (AL, TX, GA, etc.)
- Script recognizes all Canadian province abbreviations (ON, BC, QC, etc.)
- Script logs warnings when country is inferred (not explicitly provided)
- Script returns `null` and skips truly ambiguous locations (prevents corruption)
- Script handles common country name variants ("United States of America", "USA", "US")

---

### User Story 2: Developer Building the Site
**As a** developer running `npm run prebuild`
**I want** the build to fail if location data contains errors
**So that** I don't deploy a site with broken URLs

**Acceptance Criteria:**
- Build pipeline includes `validate-location-data.js` script
- Validation script detects US states marked as Canada
- Validation script detects Canadian provinces marked as US
- Validation script detects old URL format slugs
- Build exits with error code if validation fails
- Clear error messages indicate which locations are invalid

---

### User Story 3: User Clicking Google Search Result
**As a** user clicking a search result for "pumpkin patches near Henderson, TX"
**I want** to be redirected to the correct page automatically
**So that** I can find farms near me without encountering broken links

**Acceptance Criteria:**
- Old URL `/pumpkin-patches/near/henderson-tx-canada/` redirects to `/pumpkin-patches/near/henderson-tx-us/`
- Redirect is a 301 (permanent) status code
- Redirect preserves query parameters if present
- Redirect works for all 50 US states + Canadian provinces
- Page loads within 3 seconds after redirect

---

### User Story 4: SEO Manager Monitoring Site Health
**As an** SEO manager
**I want** to see 404 error count decreasing in Google Search Console
**So that** I know our SEO health is improving

**Acceptance Criteria:**
- Updated sitemap submitted to Google Search Console
- Old URLs marked for removal using GSC removal tool
- 404 count reduced by 50% within 1 week
- 404 count reduced by 80% within 4 weeks
- No new 404 errors introduced by the fix

---

## Technical Requirements

### Requirement 1: Fix Country Normalization Bug

**File:** `web/scripts/report-missing-locations.js`
**Location:** Lines 483-485

#### Current Implementation (BUGGY)
```javascript
const isUS = c.country === 'United States' || c.country === 'USA' || c.country === 'US';
const country = isUS ? 'United States' : 'Canada';  // ❌ UNSAFE DEFAULT
const countrySlug = isUS ? 'us' : 'ca';
```

#### Required Implementation
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

#### Technical Constraints
- Must handle `null`, `undefined`, and empty string country values
- Must handle common country name variants
- Must NOT default to an arbitrary country without validation
- Must log warnings for manual review when inference is used
- Must skip ambiguous locations rather than corrupt data

---

### Requirement 2: Create Location Data Validation Script

**File:** `web/scripts/validate-location-data.js` (NEW FILE)

#### Validation Rules

1. **US State with Canada Country**
   - Check: `province_slug` in US states list AND `country_slug === 'ca'`
   - Error: `"US state \"tx\" marked as Canada"`

2. **Canadian Province with US Country**
   - Check: `province_slug` in Canadian provinces list AND `country_slug === 'us'`
   - Error: `"Canadian province \"on\" marked as US"`

3. **Invalid Slug Format**
   - Check: `location_slug` matches pattern `/^[a-z0-9-]+-[a-z]{2}-[a-z]{2}$/`
   - Error: `"Invalid slug format (expected: city-state-country)"`

4. **Old Format Slugs**
   - Check: `location_slug` contains `-canada`, `-united-states`, `-ontario-`, etc.
   - Error: `"Old format slug detected (should be 2-letter codes)"`

#### Build Integration

Update `web/package.json`:
```json
{
  "scripts": {
    "prebuild": "node scripts/extract-critical-css.js && node scripts/generate-farm-data.js && node scripts/optimize-blog-images.js && node scripts/run-parallel.js && node scripts/validate-location-data.js",
    "validate-locations": "node scripts/validate-location-data.js"
  }
}
```

#### Error Handling
- Exit code 1 if validation fails (blocks build)
- Exit code 0 if validation passes (allows build)
- Clear console output with line numbers and error descriptions

---

### Requirement 3: Implement Comprehensive Redirects

**File:** `web/next.config.js`

#### Redirect Rules by Pattern

##### Pattern 1: US States Incorrectly Tagged as Canada
```javascript
// All 50 US states + DC
{
  source: '/:category/near/:city-:state(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy|dc)-canada',
  destination: '/:category/near/:city-:state-us',
  permanent: true,
}
```

##### Pattern 2: Full Country Names to Codes
```javascript
{
  source: '/:category/near/:location-united-states',
  destination: '/:category/near/:location-us',
  permanent: true,
}
```

##### Pattern 3: Full Province Names to Codes
```javascript
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
// Add remaining provinces: alberta, manitoba, saskatchewan, nova-scotia, new-brunswick, etc.
```

#### Technical Constraints
- Must use 301 (permanent) status code
- Must preserve query parameters
- Must not create redirect loops
- Must handle all category slugs dynamically (`:category`)
- Must handle all city slugs dynamically (`:city`)

---

### Requirement 4: Data Cleanup Tasks

#### Task 4.1: Clean Current locations.json
- Run validation script on current data
- Manually fix any detected errors
- Commit cleaned data to git

#### Task 4.2: Delete Stale Files
- Delete `web/data/location-params.json` (not imported anywhere, contains old format)

#### Task 4.3: Google Search Console Actions
1. Submit updated sitemap: `https://pickafarm.com/sitemap.xml`
2. Use URL Removal Tool:
   - Pattern: `pickafarm.com/*/near/*-canada/*` (for US states)
   - Pattern: `pickafarm.com/*/near/*-united-states/*`
   - Pattern: `pickafarm.com/*/near/*-ontario-canada/*`
   - Mark as "Outdated content"
3. Request re-crawl of corrected URLs (sample 50 URLs)

---

## Implementation Plan

### Phase 1: Bug Fix & Validation (CRITICAL - Day 1)

**Tasks:**
1. Apply bug fix to `report-missing-locations.js` line 484
2. Create `validate-location-data.js` script
3. Update `package.json` to include validation in prebuild
4. Run validation on current `locations.json`
5. Fix detected errors manually
6. Test with sample data (null country farms)
7. Commit changes

**Deliverables:**
- ✅ Bug fix deployed
- ✅ Validation script integrated
- ✅ Clean `locations.json`

**Testing:**
```bash
cd web
npm run validate-locations  # Should pass with 0 errors
node scripts/report-missing-locations.js  # Test with sample data
npm run prebuild  # Should include validation
```

---

### Phase 2: Redirect Implementation (HIGH - Day 2)

**Tasks:**
1. Implement redirect rules in `next.config.js`
2. Test redirects locally
3. Verify 301 status codes
4. Test all three URL patterns
5. Deploy to staging
6. Test production URLs

**Deliverables:**
- ✅ Comprehensive redirect rules
- ✅ Local testing complete
- ✅ Production deployment

**Testing:**
```bash
# Local testing
npm run build
npm run start
curl -I http://localhost:3000/pumpkin-patches/near/henderson-tx-canada/
# Should return: HTTP/1.1 301 Moved Permanently
# Should return: Location: /pumpkin-patches/near/henderson-tx-us/

# Production testing (sample 20 URLs from Bugs/Table.csv)
curl -I https://pickafarm.com/pumpkin-patches/near/henderson-tx-canada/
curl -I https://pickafarm.com/christmas-tree-farms/near/jesup-ga-canada/
curl -I https://pickafarm.com/all-farms-near/near/philadelphia-pa-united-states/
```

---

### Phase 3: Google Search Console Cleanup (MEDIUM - Week 1)

**Tasks:**
1. Submit updated sitemap to GSC
2. Use URL Removal Tool for old patterns
3. Request re-crawl of sample URLs
4. Set up GSC monitoring dashboard
5. Set up Cloudflare Analytics dashboard for redirects

**Deliverables:**
- ✅ Updated sitemap submitted
- ✅ Old URLs marked for removal
- ✅ Monitoring dashboards configured

---

### Phase 4: Monitoring & Refinement (ONGOING - Weeks 2-4)

**Tasks:**
1. Monitor 404 count daily (week 1), then weekly
2. Track redirect success rate in Cloudflare Analytics
3. Monitor organic traffic recovery
4. Investigate any new unexpected 404s
5. Document final resolution and learnings

**Deliverables:**
- ✅ Weekly progress reports
- ✅ Final resolution documentation
- ✅ Post-mortem with lessons learned

---

## Success Metrics & KPIs

### Immediate Success Criteria (Week 1)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Bug fix deployed | ✅ Yes | Production deployment |
| Validation script integrated | ✅ Yes | Part of prebuild |
| Redirects implemented | ✅ Yes | All 3 patterns covered |
| No new 404s introduced | 0 | GSC 404 report |
| Sample redirect success rate | >95% | Test 20 URLs |

### Short-term Success Criteria (2-4 Weeks)

| Metric | Target | Measurement |
|--------|--------|-------------|
| 404 count reduction | 80%+ | GSC 404 report |
| Redirect success rate | >95% | Cloudflare Analytics |
| Google re-crawling pages | ✅ Yes | GSC crawl stats |
| Data validation errors | 0 | Build logs |
| Organic traffic change | Stable or ↑ | Google Analytics |

### Long-term Success Criteria (1-3 Months)

| Metric | Target | Measurement |
|--------|--------|-------------|
| 404 error count | <20 total | GSC 404 report |
| Organic traffic | Baseline or ↑ | Google Analytics |
| SEO rankings | Stable or ↑ | Rank tracking tool |
| New location errors | 0 | Build logs |
| User complaints | 0 | Support tickets |

---

## Risk Assessment

### High-Risk Items

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking existing valid URLs | LOW | HIGH | Comprehensive testing, validation script, staged rollout |
| Redirect loops | LOW | MEDIUM | Test all redirect rules carefully, use regex patterns |
| Province inference wrong | LOW | MEDIUM | Validate province lists, log warnings for manual review |

### Medium-Risk Items

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Validation script too strict | MEDIUM | LOW | Refine validation rules based on testing, allow exceptions |
| Performance impact of redirects | LOW | LOW | Next.js handles redirects efficiently, monitor Core Web Vitals |
| Google slow to re-index | HIGH | LOW | Use GSC tools to accelerate, submit updated sitemap |

---

## Dependencies

### Technical Dependencies
- Next.js 15 redirect functionality
- Cloudflare Pages deployment pipeline
- Google Search Console access
- Cloudflare Analytics access

### Team Dependencies
- Developer: Implement bug fix, validation script, redirects
- QA: Test redirect rules, validate fix
- SEO Manager: GSC cleanup, monitoring
- Product Owner: Deployment approval

---

## Open Questions

1. **Should we implement redirects in Next.js or Cloudflare Pages `_redirects`?**
   - **Recommendation:** Start with Next.js for easier testing, migrate to `_redirects` if performance issues arise

2. **Should we consolidate country normalization logic into a shared utility function?**
   - **Recommendation:** Yes, but defer to Phase 4 to avoid scope creep

3. **Should we add unit tests for data transformation logic?**
   - **Recommendation:** Yes, but defer to Phase 4 to prioritize critical bug fix

4. **Should we set up automated alerts for 404 spikes?**
   - **Recommendation:** Yes, include in Phase 3 monitoring setup

---

## Appendix

### Reference Documents
- **Investigation Report:** `Bugs/ANALYST-REVIEW-404-Root-Cause.md`
- **Project Brief:** `Bugs/PROJECT-BRIEF-404-Root-Cause.md`
- **404 URL Table:** `Bugs/Table.csv` (400+ URLs)
- **Initial QA Analysis:** `Bugs/404-url-analysis.md`

### Related Code Files
- **Bug Source:** `web/scripts/report-missing-locations.js:484`
- **Data Files:** `web/data/locations.json`, `web/data/locations-with-farms.json`
- **Build Scripts:** `web/scripts/generate-location-data.js`, `web/scripts/generate-sitemaps.js`
- **Config:** `web/next.config.js`

### Sample 404 URLs (from Table.csv)

**Pattern 1: US → Canada**
```
/pumpkin-patches/near/henderson-tx-canada/
/christmas-tree-farms/near/jesup-ga-canada/
/christmas-tree-farms/near/cadott-wi-canada/
/pumpkin-patches/near/livingston-tx-canada/
```

**Pattern 2: Full Country Names**
```
/all-farms-near/near/philadelphia-pa-united-states/
/christmas-tree-farms/near/new-york-ny-united-states/
/pumpkin-patches/near/albany-ny-united-states/
```

**Pattern 3: Full Province Names**
```
/christmas-tree-farms/near/toronto-ontario-canada/
/pumpkin-patches/near/hamilton-ontario-canada/
/all-farms-near/near/vancouver-british-columbia-canada/
```

---

## Approval & Sign-Off

**PRD Author:** Claude (based on investigation by Mary - Data Analyst)
**Date Created:** 2025-10-09
**Status:** 🟡 Ready for Review

**Required Approvals:**
- [ ] Developer Lead - Technical approach review
- [ ] QA Lead - Testing plan review
- [ ] SEO Manager - Redirect strategy review
- [ ] Product Owner - Implementation approval

**Next Steps:**
1. Review PRD with stakeholders
2. Create task list for Phase 1 implementation
3. Assign developer for bug fix
4. Schedule deployment window

---

**END OF PRD**
