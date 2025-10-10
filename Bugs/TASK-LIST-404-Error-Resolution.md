# Implementation Task List: 404 Error Resolution

**Project:** PRD-2025-001 - 404 Error Resolution & Data Quality Enforcement
**Created:** 2025-10-09
**Status:** 🟡 Ready to Execute
**Priority:** 🔴 CRITICAL

---

## Task Overview

This task list breaks down the PRD into actionable development tasks across 4 phases. Each task includes acceptance criteria, testing requirements, and dependencies.

---

## 📊 Progress Tracker

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| Phase 1: Bug Fix & Validation | 12 | 0/12 | ⏸️ Not Started |
| Phase 2: Redirect Implementation | 8 | 0/8 | ⏸️ Not Started |
| Phase 3: Google Search Console | 6 | 0/6 | ⏸️ Not Started |
| Phase 4: Monitoring & Refinement | 8 | 0/8 | ⏸️ Not Started |
| **TOTAL** | **34** | **0/34** | **0%** |

---

## 🔴 Phase 1: Bug Fix & Validation (CRITICAL - Day 1)

**Goal:** Fix the data generation bug and prevent future corruption
**Timeline:** Day 1 (4-6 hours)
**Assignee:** Developer

---

### Task 1.1: Analyze Current Bug Implementation ⚡ CRITICAL

**Priority:** P0
**Estimated Time:** 30 minutes
**Dependencies:** None

**Description:**
Read and analyze the buggy code in `web/scripts/report-missing-locations.js` to understand:
- Current country normalization logic (line 484)
- How `getProvinceAbbrev()` function works
- All places where country normalization occurs (lines 362-369, 433, 444-448)

**Acceptance Criteria:**
- [ ] Located all instances of country normalization logic in the file
- [ ] Documented how the bug manifests with null/undefined country values
- [ ] Identified if `getProvinceAbbrev()` helper function exists
- [ ] Listed all functions that call this buggy logic

**Testing:**
```bash
cd web/scripts
grep -n "country" report-missing-locations.js
grep -n "getProvinceAbbrev" report-missing-locations.js
```

**Output:** Notes document with findings

---

### Task 1.2: Create Province/State Reference Lists ⚡ CRITICAL

**Priority:** P0
**Estimated Time:** 30 minutes
**Dependencies:** Task 1.1

**Description:**
Create a shared constants file with US states and Canadian provinces for reuse across scripts.

**File:** `web/scripts/utils/geo-constants.js` (NEW FILE)

**Implementation:**
```javascript
/**
 * Geographic constants for US states and Canadian provinces
 * Used for country inference when country data is missing/invalid
 */

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const CANADIAN_PROVINCES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU',
  'ON', 'PE', 'QC', 'SK', 'YT'
];

const US_COUNTRY_VARIANTS = [
  'United States',
  'USA',
  'US',
  'United States of America'
];

const CANADIAN_COUNTRY_VARIANTS = [
  'Canada',
  'CA'
];

module.exports = {
  US_STATES,
  CANADIAN_PROVINCES,
  US_COUNTRY_VARIANTS,
  CANADIAN_COUNTRY_VARIANTS
};
```

**Acceptance Criteria:**
- [ ] File created at `web/scripts/utils/geo-constants.js`
- [ ] All 50 US states + DC included
- [ ] All 13 Canadian provinces/territories included
- [ ] Country name variants documented
- [ ] Proper JSDoc comments added

**Testing:**
```bash
node -e "const geo = require('./web/scripts/utils/geo-constants.js'); console.log(geo.US_STATES.length); console.log(geo.CANADIAN_PROVINCES.length);"
# Should output: 51 (states + DC) and 13 (provinces)
```

---

### Task 1.3: Create Country Normalization Utility Function ⚡ CRITICAL

**Priority:** P0
**Estimated Time:** 1 hour
**Dependencies:** Task 1.2

**Description:**
Create a safe, reusable country normalization function that handles null/undefined values.

**File:** `web/scripts/utils/normalize-country.js` (NEW FILE)

**Implementation:**
```javascript
const {
  US_STATES,
  CANADIAN_PROVINCES,
  US_COUNTRY_VARIANTS,
  CANADIAN_COUNTRY_VARIANTS
} = require('./geo-constants');

/**
 * Safely normalizes country data with fallback to province-based inference
 *
 * @param {string|null|undefined} country - Country name from source data
 * @param {string} province - Province/state name or abbreviation
 * @param {string} city - City name (for logging)
 * @param {function} getProvinceAbbrev - Function to convert province name to abbreviation
 * @returns {{country: string, countrySlug: string}|null} Normalized country data or null if ambiguous
 */
function normalizeCountry(country, province, city, getProvinceAbbrev) {
  // Explicit country match
  if (US_COUNTRY_VARIANTS.includes(country)) {
    return {
      country: 'United States',
      countrySlug: 'us'
    };
  }

  if (CANADIAN_COUNTRY_VARIANTS.includes(country)) {
    return {
      country: 'Canada',
      countrySlug: 'ca'
    };
  }

  // FALLBACK: Infer from province
  console.warn(`⚠️  Country data missing or invalid for ${city}, ${province}. Attempting province-based inference...`);

  const provinceAbbrev = getProvinceAbbrev(province).toUpperCase();

  if (US_STATES.includes(provinceAbbrev)) {
    console.warn(`⚠️  Inferred country=US for ${city}, ${province} (original country: ${country})`);
    return {
      country: 'United States',
      countrySlug: 'us'
    };
  }

  if (CANADIAN_PROVINCES.includes(provinceAbbrev)) {
    console.warn(`⚠️  Inferred country=Canada for ${city}, ${province} (original country: ${country})`);
    return {
      country: 'Canada',
      countrySlug: 'ca'
    };
  }

  // Cannot determine - fail safely
  console.error(`❌ ERROR: Cannot determine country for ${city}, ${province}, country=${country}`);
  return null;
}

module.exports = { normalizeCountry };
```

**Acceptance Criteria:**
- [ ] Function created with proper JSDoc
- [ ] Handles all US country name variants
- [ ] Handles all Canadian country name variants
- [ ] Falls back to province-based inference
- [ ] Logs warnings when inference is used
- [ ] Returns null for ambiguous cases
- [ ] Includes proper error messages

**Testing:**
```javascript
// Create test file: web/scripts/utils/normalize-country.test.js
const { normalizeCountry } = require('./normalize-country');

// Mock getProvinceAbbrev
const getProvinceAbbrev = (p) => p.toUpperCase().substring(0, 2);

// Test cases
console.log(normalizeCountry('United States', 'Texas', 'Houston', getProvinceAbbrev)); // Should return US
console.log(normalizeCountry('USA', 'California', 'LA', getProvinceAbbrev)); // Should return US
console.log(normalizeCountry(null, 'Texas', 'Dallas', getProvinceAbbrev)); // Should infer US
console.log(normalizeCountry(null, 'Ontario', 'Toronto', getProvinceAbbrev)); // Should infer Canada
console.log(normalizeCountry(null, 'Unknown', 'Mystery', getProvinceAbbrev)); // Should return null
```

---

### Task 1.4: Apply Bug Fix to report-missing-locations.js ⚡ CRITICAL

**Priority:** P0
**Estimated Time:** 1 hour
**Dependencies:** Task 1.3

**Description:**
Replace the buggy country normalization logic (line 484) with the new safe utility function.

**File:** `web/scripts/report-missing-locations.js`

**Changes:**
1. Import the new utility at the top of the file
2. Replace lines 483-485 with safe implementation
3. Update any other instances of unsafe country defaults (lines 362-369, 433, 444-448)

**Implementation:**
```javascript
// Add to top of file
const { normalizeCountry } = require('./utils/normalize-country');

// REPLACE lines 483-485:
// OLD CODE (DELETE):
// const isUS = c.country === 'United States' || c.country === 'USA' || c.country === 'US';
// const country = isUS ? 'United States' : 'Canada';
// const countrySlug = isUS ? 'us' : 'ca';

// NEW CODE:
const countryData = normalizeCountry(c.country, c.province, c.city, getProvinceAbbrev);

if (!countryData) {
  console.warn(`⚠️  Skipping location ${c.city}, ${c.province} - cannot determine country`);
  return null; // Skip this location
}

const { country, countrySlug } = countryData;
```

**Acceptance Criteria:**
- [ ] Imported `normalizeCountry` utility
- [ ] Replaced buggy logic at line 484
- [ ] Updated other unsafe defaults (lines 362-369, 433, 444-448)
- [ ] Added null check to skip ambiguous locations
- [ ] Code passes JavaScript linting
- [ ] No syntax errors

**Testing:**
```bash
cd web/scripts
node -c report-missing-locations.js  # Check syntax
```

---

### Task 1.5: Create Location Data Validation Script ⚡ CRITICAL

**Priority:** P0
**Estimated Time:** 1.5 hours
**Dependencies:** Task 1.2

**Description:**
Create a comprehensive validation script to detect data corruption in `locations.json`.

**File:** `web/scripts/validate-location-data.js` (NEW FILE)

**Implementation:**
```javascript
#!/usr/bin/env node

/**
 * Validation script for locations.json
 * Detects country assignment errors (US states marked as Canada, etc.)
 * Run as part of prebuild to catch data corruption early
 */

const fs = require('fs');
const path = require('path');
const { US_STATES, CANADIAN_PROVINCES } = require('./utils/geo-constants');

function validateLocationData() {
  const locationsPath = path.join(__dirname, '../data/locations.json');

  if (!fs.existsSync(locationsPath)) {
    console.error('❌ ERROR: locations.json not found');
    process.exit(1);
  }

  const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
  const errors = [];
  const warnings = [];

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

    // WARNING 1: Old format slugs
    if (location_slug && (
        location_slug.includes('-canada') ||
        location_slug.includes('-united-states') ||
        location_slug.includes('-ontario-') ||
        location_slug.includes('-quebec-') ||
        location_slug.includes('-british-columbia-') ||
        location_slug.includes('-alberta-') ||
        location_slug.includes('-manitoba-') ||
        location_slug.includes('-saskatchewan-')
    )) {
      warnings.push({
        line: index + 1,
        name: name,
        slug: location_slug,
        warning: `Old format slug detected (should be 2-letter codes)`
      });
    }
  });

  // Report warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  VALIDATION WARNINGS - Found', warnings.length, 'warnings:\n');
    warnings.forEach(warn => {
      console.warn(`  Line ${warn.line}: ${warn.name}`);
      console.warn(`    Slug: ${warn.slug}`);
      console.warn(`    Warning: ${warn.warning}\n`);
    });
  }

  // Report errors
  if (errors.length > 0) {
    console.error('\n❌ VALIDATION FAILED - Found', errors.length, 'errors:\n');
    errors.forEach(err => {
      console.error(`  Line ${err.line}: ${err.name}`);
      console.error(`    Slug: ${err.slug}`);
      console.error(`    Error: ${err.error}\n`);
    });
    process.exit(1);
  } else {
    console.log(`✅ VALIDATION PASSED - All ${locations.length} location entries are valid`);
    if (warnings.length > 0) {
      console.log(`⚠️  Note: ${warnings.length} warnings detected (non-blocking)`);
    }
  }
}

validateLocationData();
```

**Acceptance Criteria:**
- [ ] Script created at `web/scripts/validate-location-data.js`
- [ ] Validates US state/Canada country mismatch
- [ ] Validates Canadian province/US country mismatch
- [ ] Validates slug format (city-state-country)
- [ ] Detects old format slugs
- [ ] Exits with code 1 on errors
- [ ] Exits with code 0 on success
- [ ] Clear error messages with line numbers
- [ ] Shebang line for direct execution

**Testing:**
```bash
cd web
node scripts/validate-location-data.js
# Should analyze current data and report any errors
```

---

### Task 1.6: Add Validation to Build Pipeline ⚡ CRITICAL

**Priority:** P0
**Estimated Time:** 15 minutes
**Dependencies:** Task 1.5

**Description:**
Integrate validation script into the prebuild process to block builds with invalid data.

**File:** `web/package.json`

**Changes:**
```json
{
  "scripts": {
    "prebuild": "node scripts/extract-critical-css.js && node scripts/generate-farm-data.js && node scripts/optimize-blog-images.js && node scripts/run-parallel.js && node scripts/validate-location-data.js",
    "validate-locations": "node scripts/validate-location-data.js"
  }
}
```

**Acceptance Criteria:**
- [ ] Added `validate-location-data.js` to end of prebuild chain
- [ ] Added standalone `validate-locations` script
- [ ] Prebuild will fail if validation fails (due to exit code 1)
- [ ] Script runs after all data generation completes

**Testing:**
```bash
cd web
npm run validate-locations  # Test standalone
npm run prebuild  # Test in full pipeline
```

---

### Task 1.7: Run Validation on Current Data ⚡ CRITICAL

**Priority:** P0
**Estimated Time:** 30 minutes
**Dependencies:** Task 1.6

**Description:**
Run the validation script on current `locations.json` to identify existing corruption.

**Acceptance Criteria:**
- [ ] Validation script executed successfully
- [ ] All errors documented in a report
- [ ] Error count and patterns recorded
- [ ] Screenshots/logs saved for reference

**Testing:**
```bash
cd web
npm run validate-locations > ../Bugs/validation-report-$(date +%Y%m%d).txt 2>&1
```

**Output:** `Bugs/validation-report-YYYYMMDD.txt`

---

### Task 1.8: Manually Fix Detected Errors in locations.json

**Priority:** P0
**Estimated Time:** 1 hour
**Dependencies:** Task 1.7

**Description:**
Manually correct any errors detected in the validation report.

**Process:**
1. Open `web/data/locations.json`
2. For each error in validation report:
   - Find the location entry by line number
   - Correct the `country`, `country_slug`, and `location_slug` fields
   - Verify the province_slug matches the correct country
3. Save the file
4. Re-run validation to confirm all errors fixed

**Acceptance Criteria:**
- [ ] All validation errors corrected
- [ ] Validation script passes with 0 errors
- [ ] Changes documented in git commit message
- [ ] Backup of original file created

**Testing:**
```bash
# Backup original
cp web/data/locations.json web/data/locations.json.backup

# After fixes
cd web
npm run validate-locations
# Should output: ✅ VALIDATION PASSED
```

---

### Task 1.9: Delete Stale location-params.json File

**Priority:** P1
**Estimated Time:** 15 minutes
**Dependencies:** Task 1.7

**Description:**
Remove the unused `location-params.json` file that contains old URL format.

**File:** `web/data/location-params.json`

**Verification Steps:**
1. Confirm file is not imported anywhere in codebase
2. Verify file contains old format (full province/country names)
3. Delete the file
4. Commit deletion

**Acceptance Criteria:**
- [ ] Verified file is not imported (grep search)
- [ ] File deleted
- [ ] Deletion committed to git

**Testing:**
```bash
cd web
grep -r "location-params" . --exclude-dir=node_modules
# Should return no imports

rm data/location-params.json
git add data/location-params.json
git commit -m "Remove stale location-params.json with old URL format"
```

---

### Task 1.10: Test Bug Fix with Sample Data

**Priority:** P0
**Estimated Time:** 45 minutes
**Dependencies:** Task 1.4, Task 1.8

**Description:**
Create test cases with null/undefined country values to verify the bug fix works correctly.

**Test Cases:**
1. **Null country, US state** → Should infer US
2. **Undefined country, Canadian province** → Should infer Canada
3. **Invalid country name, US state** → Should infer US
4. **Ambiguous location** → Should skip with warning

**Implementation:**
Create `web/scripts/test-country-normalization.js`:

```javascript
const { normalizeCountry } = require('./utils/normalize-country');

// Mock getProvinceAbbrev
const getProvinceAbbrev = (province) => {
  const map = {
    'Texas': 'TX',
    'Ontario': 'ON',
    'California': 'CA',
    'Unknown': 'UN'
  };
  return map[province] || province.substring(0, 2).toUpperCase();
};

console.log('=== Country Normalization Tests ===\n');

// Test 1: Null country, US state
console.log('Test 1: Null country, US state');
const test1 = normalizeCountry(null, 'Texas', 'Houston', getProvinceAbbrev);
console.log('Result:', test1);
console.log('Expected: {country: "United States", countrySlug: "us"}');
console.log('Status:', test1?.countrySlug === 'us' ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 2: Undefined country, Canadian province
console.log('Test 2: Undefined country, Canadian province');
const test2 = normalizeCountry(undefined, 'Ontario', 'Toronto', getProvinceAbbrev);
console.log('Result:', test2);
console.log('Expected: {country: "Canada", countrySlug: "ca"}');
console.log('Status:', test2?.countrySlug === 'ca' ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 3: Invalid country, US state
console.log('Test 3: Invalid country name, US state');
const test3 = normalizeCountry('Murica', 'California', 'LA', getProvinceAbbrev);
console.log('Result:', test3);
console.log('Expected: {country: "United States", countrySlug: "us"}');
console.log('Status:', test3?.countrySlug === 'us' ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 4: Ambiguous location
console.log('Test 4: Ambiguous location');
const test4 = normalizeCountry(null, 'Unknown', 'Mystery', getProvinceAbbrev);
console.log('Result:', test4);
console.log('Expected: null');
console.log('Status:', test4 === null ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 5: Explicit US variants
console.log('Test 5: Explicit "United States of America"');
const test5 = normalizeCountry('United States of America', 'Texas', 'Dallas', getProvinceAbbrev);
console.log('Result:', test5);
console.log('Expected: {country: "United States", countrySlug: "us"}');
console.log('Status:', test5?.countrySlug === 'us' ? '✅ PASS' : '❌ FAIL');
```

**Acceptance Criteria:**
- [ ] Test file created
- [ ] All 5 test cases pass
- [ ] Warnings logged for inferred countries
- [ ] Errors logged for ambiguous cases
- [ ] Test output saved for documentation

**Testing:**
```bash
cd web
node scripts/test-country-normalization.js > ../Bugs/test-results-$(date +%Y%m%d).txt 2>&1
```

---

### Task 1.11: Run Full Prebuild with Validation

**Priority:** P0
**Estimated Time:** 30 minutes
**Dependencies:** Task 1.6, Task 1.8

**Description:**
Execute the full prebuild process with validation enabled to ensure no errors.

**Acceptance Criteria:**
- [ ] Prebuild completes successfully
- [ ] Validation script passes (exit code 0)
- [ ] All data files generated correctly
- [ ] No corruption in generated files
- [ ] Build logs reviewed for warnings

**Testing:**
```bash
cd web
npm run prebuild
# Should complete with: ✅ VALIDATION PASSED

# Verify generated files
ls -lh data/*.json
```

---

### Task 1.12: Commit Phase 1 Changes

**Priority:** P0
**Estimated Time:** 30 minutes
**Dependencies:** All Phase 1 tasks

**Description:**
Commit all Phase 1 changes with a comprehensive commit message.

**Files to Commit:**
- `web/scripts/utils/geo-constants.js` (NEW)
- `web/scripts/utils/normalize-country.js` (NEW)
- `web/scripts/validate-location-data.js` (NEW)
- `web/scripts/report-missing-locations.js` (MODIFIED)
- `web/package.json` (MODIFIED)
- `web/data/locations.json` (MODIFIED - cleaned)
- `web/data/location-params.json` (DELETED)

**Commit Message Template:**
```
Fix critical bug in location data generation (PRD-2025-001 Phase 1)

Root Cause:
- report-missing-locations.js line 484 defaulted US cities to "Canada"
  when country field was null/undefined
- Caused 200+ malformed URLs like /pumpkin-patches/near/henderson-tx-canada/

Changes:
1. Created geo-constants.js with US states and Canadian provinces lists
2. Created normalize-country.js utility with safe province-based fallback
3. Fixed bug in report-missing-locations.js (line 484 and related functions)
4. Added validate-location-data.js to detect future corruption
5. Integrated validation into prebuild pipeline (package.json)
6. Cleaned corrupted entries in locations.json
7. Removed stale location-params.json

Testing:
- All test cases pass (test-country-normalization.js)
- Validation script passes with 0 errors
- Full prebuild completes successfully

Impact:
- Prevents future location data corruption
- Blocks builds with invalid data
- Safe fallback for missing country data

Related: Bugs/PRD-404-Error-Resolution.md, Bugs/PROJECT-BRIEF-404-Root-Cause.md

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Acceptance Criteria:**
- [ ] All Phase 1 files staged for commit
- [ ] Comprehensive commit message written
- [ ] Commit created successfully
- [ ] No uncommitted changes remain

**Testing:**
```bash
cd web
git status
git add -A
git commit -m "$(cat commit-message.txt)"
git log -1 --stat
```

---

## 🟡 Phase 2: Redirect Implementation (HIGH - Day 2)

**Goal:** Implement comprehensive 301 redirects to fix broken URLs
**Timeline:** Day 2 (3-4 hours)
**Assignee:** Developer

---

### Task 2.1: Analyze Current next.config.js Redirects

**Priority:** P1
**Estimated Time:** 30 minutes
**Dependencies:** None

**Description:**
Review existing `web/next.config.js` to understand current redirect configuration.

**Acceptance Criteria:**
- [ ] Identified existing redirect rules
- [ ] Documented redirect structure
- [ ] Verified Next.js 15 compatibility
- [ ] Identified any conflicts with new rules

**Testing:**
```bash
cd web
cat next.config.js | grep -A 20 "redirects"
```

---

### Task 2.2: Create Redirect Configuration Module

**Priority:** P1
**Estimated Time:** 1 hour
**Dependencies:** Task 2.1

**Description:**
Create a separate module for 404 redirect rules to keep `next.config.js` clean.

**File:** `web/redirects/404-fix-redirects.js` (NEW FILE)

**Implementation:**
```javascript
/**
 * Redirects for 404 Error Resolution (PRD-2025-001)
 * Handles three patterns of broken URLs:
 * 1. US cities incorrectly tagged as Canada (bug-created)
 * 2. Full country names instead of codes (historical)
 * 3. Full province names instead of codes (historical)
 */

// Pattern 1: US states incorrectly tagged as Canada
const usStatesCanadaRedirects = [
  {
    source: '/:category/near/:city-:state(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy|dc)-canada',
    destination: '/:category/near/:city-:state-us',
    permanent: true,
  },
];

// Pattern 2: Full country names to codes
const fullCountryNameRedirects = [
  {
    source: '/:category/near/:location-united-states',
    destination: '/:category/near/:location-us',
    permanent: true,
  },
];

// Pattern 3: Full province names to codes (Canadian)
const fullProvinceNameRedirects = [
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
    source: '/:category/near/:city-newfoundland-and-labrador-canada',
    destination: '/:category/near/:city-nl-ca',
    permanent: true,
  },
  {
    source: '/:category/near/:city-prince-edward-island-canada',
    destination: '/:category/near/:city-pe-ca',
    permanent: true,
  },
  {
    source: '/:category/near/:city-northwest-territories-canada',
    destination: '/:category/near/:city-nt-ca',
    permanent: true,
  },
  {
    source: '/:category/near/:city-nunavut-canada',
    destination: '/:category/near/:city-nu-ca',
    permanent: true,
  },
  {
    source: '/:category/near/:city-yukon-canada',
    destination: '/:category/near/:city-yt-ca',
    permanent: true,
  },
];

module.exports = {
  get404FixRedirects: () => [
    ...usStatesCanadaRedirects,
    ...fullCountryNameRedirects,
    ...fullProvinceNameRedirects,
  ],
};
```

**Acceptance Criteria:**
- [ ] Module created with proper structure
- [ ] All 3 redirect patterns included
- [ ] All 50 US states + DC covered in regex
- [ ] All 13 Canadian provinces covered
- [ ] Redirects are permanent (301)
- [ ] JSDoc comments added

**Testing:**
```bash
cd web
node -e "const r = require('./redirects/404-fix-redirects.js'); console.log(r.get404FixRedirects().length);"
# Should output total number of redirect rules
```

---

### Task 2.3: Integrate Redirects into next.config.js

**Priority:** P1
**Estimated Time:** 30 minutes
**Dependencies:** Task 2.2

**Description:**
Import and integrate the 404 redirect rules into Next.js configuration.

**File:** `web/next.config.js`

**Changes:**
```javascript
// Add to top of file
const { get404FixRedirects } = require('./redirects/404-fix-redirects');

// Update redirects function
async redirects() {
  return [
    ...get404FixRedirects(),
    // ... existing redirects
  ];
}
```

**Acceptance Criteria:**
- [ ] Redirects module imported
- [ ] 404 fix redirects added to redirects array
- [ ] Placed before other redirects (priority)
- [ ] No syntax errors
- [ ] Config validates successfully

**Testing:**
```bash
cd web
node -c next.config.js  # Check syntax
npm run build  # Verify Next.js accepts config
```

---

### Task 2.4: Build and Test Redirects Locally

**Priority:** P1
**Estimated Time:** 1 hour
**Dependencies:** Task 2.3

**Description:**
Build the site locally and test sample redirect URLs.

**Test URLs (from Table.csv):**
1. `/pumpkin-patches/near/henderson-tx-canada/` → `/pumpkin-patches/near/henderson-tx-us/`
2. `/christmas-tree-farms/near/jesup-ga-canada/` → `/christmas-tree-farms/near/jesup-ga-us/`
3. `/all-farms-near/near/philadelphia-pa-united-states/` → `/all-farms-near/near/philadelphia-pa-us/`
4. `/christmas-tree-farms/near/toronto-ontario-canada/` → `/christmas-tree-farms/near/toronto-on-ca/`

**Acceptance Criteria:**
- [ ] Build completes successfully
- [ ] Local server starts
- [ ] All 4 test URLs redirect correctly
- [ ] Redirects return 301 status code
- [ ] Destination URLs load successfully
- [ ] Query parameters preserved (if any)

**Testing:**
```bash
cd web
npm run build
npm run start

# In another terminal:
curl -I http://localhost:3000/pumpkin-patches/near/henderson-tx-canada/
# Should see: HTTP/1.1 301 Moved Permanently
# Should see: Location: /pumpkin-patches/near/henderson-tx-us/

curl -I http://localhost:3000/christmas-tree-farms/near/jesup-ga-canada/
curl -I http://localhost:3000/all-farms-near/near/philadelphia-pa-united-states/
curl -I http://localhost:3000/christmas-tree-farms/near/toronto-ontario-canada/
```

**Output:** Test results document with status codes and redirect chains

---

### Task 2.5: Create Redirect Testing Script

**Priority:** P1
**Estimated Time:** 45 minutes
**Dependencies:** Task 2.4

**Description:**
Create an automated script to test all redirect patterns from the 404 table.

**File:** `Bugs/test-redirects.sh` (NEW FILE)

**Implementation:**
```bash
#!/bin/bash

# Redirect Testing Script for PRD-2025-001
# Tests sample URLs from each 404 pattern

BASE_URL="${1:-http://localhost:3000}"
RESULTS_FILE="redirect-test-results-$(date +%Y%m%d-%H%M%S).txt"

echo "Testing redirects on: $BASE_URL" | tee $RESULTS_FILE
echo "======================================" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE

# Pattern 1: US states → Canada
echo "=== Pattern 1: US States Tagged as Canada ===" | tee -a $RESULTS_FILE
urls=(
  "/pumpkin-patches/near/henderson-tx-canada/"
  "/christmas-tree-farms/near/jesup-ga-canada/"
  "/christmas-tree-farms/near/cadott-wi-canada/"
  "/pumpkin-patches/near/livingston-tx-canada/"
  "/christmas-tree-farms/near/madison-wi-canada/"
)

for url in "${urls[@]}"; do
  echo "Testing: $url" | tee -a $RESULTS_FILE
  response=$(curl -I -s "$BASE_URL$url")
  status=$(echo "$response" | grep "HTTP" | awk '{print $2}')
  location=$(echo "$response" | grep -i "location:" | cut -d' ' -f2 | tr -d '\r')

  if [ "$status" = "301" ]; then
    echo "  ✅ Status: $status" | tee -a $RESULTS_FILE
    echo "  ✅ Redirects to: $location" | tee -a $RESULTS_FILE
  else
    echo "  ❌ Status: $status (expected 301)" | tee -a $RESULTS_FILE
    echo "  ❌ Location: $location" | tee -a $RESULTS_FILE
  fi
  echo "" | tee -a $RESULTS_FILE
done

# Pattern 2: Full country names
echo "=== Pattern 2: Full Country Names ===" | tee -a $RESULTS_FILE
urls=(
  "/all-farms-near/near/philadelphia-pa-united-states/"
  "/christmas-tree-farms/near/new-york-ny-united-states/"
  "/pumpkin-patches/near/albany-ny-united-states/"
)

for url in "${urls[@]}"; do
  echo "Testing: $url" | tee -a $RESULTS_FILE
  response=$(curl -I -s "$BASE_URL$url")
  status=$(echo "$response" | grep "HTTP" | awk '{print $2}')
  location=$(echo "$response" | grep -i "location:" | cut -d' ' -f2 | tr -d '\r')

  if [ "$status" = "301" ]; then
    echo "  ✅ Status: $status" | tee -a $RESULTS_FILE
    echo "  ✅ Redirects to: $location" | tee -a $RESULTS_FILE
  else
    echo "  ❌ Status: $status (expected 301)" | tee -a $RESULTS_FILE
    echo "  ❌ Location: $location" | tee -a $RESULTS_FILE
  fi
  echo "" | tee -a $RESULTS_FILE
done

# Pattern 3: Full province names
echo "=== Pattern 3: Full Province Names ===" | tee -a $RESULTS_FILE
urls=(
  "/christmas-tree-farms/near/toronto-ontario-canada/"
  "/pumpkin-patches/near/hamilton-ontario-canada/"
  "/all-farms-near/near/vancouver-british-columbia-canada/"
)

for url in "${urls[@]}"; do
  echo "Testing: $url" | tee -a $RESULTS_FILE
  response=$(curl -I -s "$BASE_URL$url")
  status=$(echo "$response" | grep "HTTP" | awk '{print $2}')
  location=$(echo "$response" | grep -i "location:" | cut -d' ' -f2 | tr -d '\r')

  if [ "$status" = "301" ]; then
    echo "  ✅ Status: $status" | tee -a $RESULTS_FILE
    echo "  ✅ Redirects to: $location" | tee -a $RESULTS_FILE
  else
    echo "  ❌ Status: $status (expected 301)" | tee -a $RESULTS_FILE
    echo "  ❌ Location: $location" | tee -a $RESULTS_FILE
  fi
  echo "" | tee -a $RESULTS_FILE
done

echo "======================================" | tee -a $RESULTS_FILE
echo "Test complete. Results saved to: $RESULTS_FILE" | tee -a $RESULTS_FILE
```

**Acceptance Criteria:**
- [ ] Script created with proper shebang
- [ ] Tests all 3 redirect patterns
- [ ] Outputs clear pass/fail status
- [ ] Saves results to timestamped file
- [ ] Accepts BASE_URL parameter
- [ ] Script is executable

**Testing:**
```bash
chmod +x Bugs/test-redirects.sh
./Bugs/test-redirects.sh http://localhost:3000
```

---

### Task 2.6: Verify No Redirect Loops

**Priority:** P1
**Estimated Time:** 30 minutes
**Dependencies:** Task 2.4

**Description:**
Test that redirect rules don't create infinite loops or chain redirects.

**Test Cases:**
1. Verify old URL redirects to new URL (1 hop only)
2. Verify new URL does NOT redirect (loads directly)
3. Verify redirect doesn't affect valid URLs
4. Check for unintended pattern matches

**Acceptance Criteria:**
- [ ] No redirect loops detected
- [ ] All redirects are single-hop (301 directly to final URL)
- [ ] Valid URLs remain unaffected
- [ ] No false positive matches

**Testing:**
```bash
# Test that new format URLs DON'T redirect
curl -I http://localhost:3000/pumpkin-patches/near/henderson-tx-us/
# Should be: HTTP/1.1 200 OK (or 404 if page doesn't exist yet)
# Should NOT be: 301 Moved Permanently

# Test valid URLs still work
curl -I http://localhost:3000/pumpkin-patches/near/madison-wi-us/
# Should be: HTTP/1.1 200 OK
```

---

### Task 2.7: Deploy to Staging/Production

**Priority:** P1
**Estimated Time:** 30 minutes
**Dependencies:** Task 2.5, Task 2.6

**Description:**
Deploy the changes to staging (or production if no staging environment).

**Pre-deployment Checklist:**
- [ ] All Phase 1 changes committed
- [ ] All Phase 2 changes committed
- [ ] Local tests passing
- [ ] No redirect loops detected
- [ ] Build completes successfully
- [ ] Validation script passes

**Deployment Steps:**
```bash
cd web
git status  # Verify clean state
git push origin main-clean  # Push to remote

# Cloudflare Pages will auto-deploy
# Monitor deployment in Cloudflare dashboard
```

**Acceptance Criteria:**
- [ ] Code pushed to main branch
- [ ] Cloudflare Pages deployment triggered
- [ ] Build succeeds on Cloudflare
- [ ] Site deployed successfully
- [ ] No errors in deployment logs

---

### Task 2.8: Test Production Redirects

**Priority:** P1
**Estimated Time:** 45 minutes
**Dependencies:** Task 2.7

**Description:**
Test redirect rules on production URLs from the 404 table.

**Acceptance Criteria:**
- [ ] Tested 20+ URLs from `Bugs/Table.csv`
- [ ] All redirects return 301 status
- [ ] All destination URLs load correctly
- [ ] No 404 errors on destination pages
- [ ] Redirect success rate >95%

**Testing:**
```bash
./Bugs/test-redirects.sh https://pickafarm.com

# Test additional URLs from Table.csv
curl -I https://pickafarm.com/pumpkin-patches/near/henderson-tx-canada/
curl -I https://pickafarm.com/christmas-tree-farms/near/jesup-ga-canada/
# ... test 20+ URLs
```

**Output:** Production test results document

---

## 🟢 Phase 3: Google Search Console Cleanup (MEDIUM - Week 1)

**Goal:** Clean up Google Search Console and accelerate re-indexing
**Timeline:** Week 1 (2-3 hours spread over 3-5 days)
**Assignee:** SEO Manager / Developer

---

### Task 3.1: Submit Updated Sitemap to GSC

**Priority:** P2
**Estimated Time:** 15 minutes
**Dependencies:** Task 2.7 (Production deployed)

**Description:**
Submit the updated sitemap to Google Search Console to notify Google of correct URLs.

**Steps:**
1. Log in to Google Search Console
2. Navigate to Sitemaps section
3. Remove old sitemap (if present)
4. Submit `https://pickafarm.com/sitemap.xml`
5. Request indexing

**Acceptance Criteria:**
- [ ] Updated sitemap submitted to GSC
- [ ] Sitemap validated successfully
- [ ] No errors in sitemap
- [ ] Indexing requested

**Documentation:** Screenshot sitemap submission confirmation

---

### Task 3.2: Use URL Removal Tool for Pattern 1 (US → Canada)

**Priority:** P2
**Estimated Time:** 30 minutes
**Dependencies:** Task 3.1

**Description:**
Use Google Search Console URL Removal Tool to mark bug-created URLs as outdated.

**URL Patterns to Remove:**
- `pickafarm.com/*/near/*-tx-canada/`
- `pickafarm.com/*/near/*-ga-canada/`
- `pickafarm.com/*/near/*-wi-canada/`
- `pickafarm.com/*/near/*-il-canada/`
- (Add patterns for other affected states from Table.csv)

**Steps:**
1. Navigate to GSC → Removals
2. Click "New Request"
3. Select "Temporarily hide"
4. Enter URL pattern
5. Mark as "Outdated content"
6. Repeat for each state pattern

**Acceptance Criteria:**
- [ ] Removal requests submitted for all US state patterns
- [ ] Marked as "Outdated content"
- [ ] Requests approved by GSC
- [ ] Status tracked in spreadsheet

**Documentation:** Track removal requests in spreadsheet with status

---

### Task 3.3: Use URL Removal Tool for Pattern 2 (Full Country Names)

**Priority:** P2
**Estimated Time:** 15 minutes
**Dependencies:** Task 3.1

**Description:**
Submit removal requests for old format URLs with full country names.

**URL Patterns to Remove:**
- `pickafarm.com/*/near/*-united-states/`

**Acceptance Criteria:**
- [ ] Removal request submitted
- [ ] Request approved by GSC
- [ ] Status tracked

---

### Task 3.4: Use URL Removal Tool for Pattern 3 (Full Province Names)

**Priority:** P2
**Estimated Time:** 30 minutes
**Dependencies:** Task 3.1

**Description:**
Submit removal requests for old Canadian URL formats with full province names.

**URL Patterns to Remove:**
- `pickafarm.com/*/near/*-ontario-canada/`
- `pickafarm.com/*/near/*-quebec-canada/`
- `pickafarm.com/*/near/*-british-columbia-canada/`
- (Add remaining provinces)

**Acceptance Criteria:**
- [ ] Removal requests submitted for all province patterns
- [ ] Requests approved by GSC
- [ ] Status tracked

---

### Task 3.5: Request Re-crawl of Sample URLs

**Priority:** P2
**Estimated Time:** 30 minutes
**Dependencies:** Task 3.2, Task 3.3, Task 3.4

**Description:**
Use "Request Indexing" feature in GSC to accelerate re-crawling of corrected URLs.

**Steps:**
1. Select 50 URLs from Table.csv
2. For each URL, find the CORRECT version (e.g., `-tx-us` instead of `-tx-canada`)
3. Use GSC → URL Inspection
4. Enter correct URL
5. Click "Request Indexing"

**Acceptance Criteria:**
- [ ] 50+ correct URLs requested for re-indexing
- [ ] Mix of all 3 patterns included
- [ ] Requests queued successfully
- [ ] Tracking spreadsheet updated

---

### Task 3.6: Set Up GSC Monitoring Dashboard

**Priority:** P2
**Estimated Time:** 1 hour
**Dependencies:** Task 3.1

**Description:**
Create a monitoring dashboard to track 404 error reduction over time.

**Metrics to Track:**
1. Total 404 count (weekly)
2. 404 count by pattern (Pattern 1, 2, 3)
3. Redirect traffic (Cloudflare Analytics)
4. Organic traffic trend
5. Crawl stats

**Tools:**
- Google Search Console
- Cloudflare Analytics
- Google Analytics
- Spreadsheet for tracking

**Acceptance Criteria:**
- [ ] Tracking spreadsheet created
- [ ] Baseline metrics recorded (Day 0)
- [ ] Weekly tracking schedule established
- [ ] Automated alerts configured (if possible)

**Output:** `Bugs/404-tracking-dashboard.xlsx` or Google Sheets

---

## 🔵 Phase 4: Monitoring & Refinement (ONGOING - Weeks 2-4)

**Goal:** Monitor resolution progress and refine approach
**Timeline:** Weeks 2-4 (1-2 hours per week)
**Assignee:** SEO Manager / Developer

---

### Task 4.1: Week 1 Monitoring Report

**Priority:** P2
**Estimated Time:** 30 minutes
**Dependencies:** Task 3.6

**Description:**
Create Week 1 progress report with key metrics.

**Metrics:**
- 404 count change (baseline → week 1)
- Redirect success rate
- GSC removal request status
- Organic traffic change
- Any new unexpected 404s

**Acceptance Criteria:**
- [ ] Report created with all metrics
- [ ] Graphs/charts included
- [ ] Issues identified (if any)
- [ ] Recommendations for Week 2

**Output:** `Bugs/week-1-progress-report.md`

---

### Task 4.2: Week 2 Monitoring Report

**Priority:** P2
**Estimated Time:** 30 minutes
**Dependencies:** Task 4.1

**Description:**
Create Week 2 progress report.

**Target:** 50% reduction in 404 count

**Acceptance Criteria:**
- [ ] Report created
- [ ] 50%+ reduction achieved (or document blockers)
- [ ] Redirect traffic analyzed

**Output:** `Bugs/week-2-progress-report.md`

---

### Task 4.3: Week 4 Monitoring Report

**Priority:** P2
**Estimated Time:** 30 minutes
**Dependencies:** Task 4.2

**Description:**
Create Week 4 progress report.

**Target:** 80% reduction in 404 count

**Acceptance Criteria:**
- [ ] Report created
- [ ] 80%+ reduction achieved (or document blockers)
- [ ] Organic traffic recovered

**Output:** `Bugs/week-4-progress-report.md`

---

### Task 4.4: Investigate Any New Unexpected 404s

**Priority:** P2
**Estimated Time:** Variable
**Dependencies:** Task 4.1, 4.2, 4.3

**Description:**
If new 404s appear during monitoring, investigate and resolve.

**Process:**
1. Export new 404 URLs from GSC
2. Analyze patterns
3. Determine root cause
4. Implement fix (redirect or data correction)
5. Document in post-mortem

**Acceptance Criteria:**
- [ ] New 404s investigated
- [ ] Root cause identified
- [ ] Fix implemented (if needed)
- [ ] Documented in tracking sheet

---

### Task 4.5: Create Shared Utility for Country Normalization (OPTIONAL)

**Priority:** P3 (Nice to have)
**Estimated Time:** 2 hours
**Dependencies:** Phase 1 complete

**Description:**
Consolidate all country normalization logic across ALL scripts into the shared utility.

**Files to Update:**
- `web/scripts/generate-state-data.js`
- `web/scripts/generate-location-data.js`
- Any other scripts with country logic

**Acceptance Criteria:**
- [ ] All scripts use shared `normalize-country.js` utility
- [ ] No duplicate country normalization logic
- [ ] All scripts tested and working
- [ ] Code reduction achieved

---

### Task 4.6: Add Unit Tests for Country Normalization (OPTIONAL)

**Priority:** P3 (Nice to have)
**Estimated Time:** 2 hours
**Dependencies:** Task 1.3

**Description:**
Create comprehensive unit tests for the `normalize-country.js` utility.

**File:** `web/scripts/utils/normalize-country.test.js`

**Test Framework:** Jest or Node.js native test runner

**Test Cases:**
- All US country variants
- All Canadian country variants
- Null/undefined country values
- Province-based inference (US)
- Province-based inference (Canada)
- Ambiguous cases returning null
- Warning logging
- Error logging

**Acceptance Criteria:**
- [ ] Test file created with 20+ test cases
- [ ] All tests pass
- [ ] Code coverage >90%
- [ ] Tests run in CI/CD pipeline (if available)

---

### Task 4.7: Document Post-Mortem & Lessons Learned

**Priority:** P2
**Estimated Time:** 2 hours
**Dependencies:** Task 4.3 (Week 4 complete)

**Description:**
Create comprehensive post-mortem document with lessons learned.

**Sections:**
1. Timeline of events
2. Root cause analysis
3. Fix implementation summary
4. Results and metrics
5. What went well
6. What could be improved
7. Preventive measures implemented
8. Recommendations for future

**Acceptance Criteria:**
- [ ] Post-mortem document created
- [ ] All sections completed
- [ ] Metrics and graphs included
- [ ] Reviewed by team
- [ ] Shared with stakeholders

**Output:** `Bugs/POST-MORTEM-404-Resolution.md`

---

### Task 4.8: Update Project Documentation

**Priority:** P2
**Estimated Time:** 1 hour
**Dependencies:** Task 4.7

**Description:**
Update project documentation to reflect new validation pipeline and learnings.

**Files to Update:**
- `CLAUDE.md` - Add note about validation pipeline
- `.agent/Docs/DOC_Build-Scripts-Data-Generation.md` - Document validation script
- `web/scripts/README.md` (if exists) - Document new utilities

**Acceptance Criteria:**
- [ ] CLAUDE.md updated
- [ ] DOC files updated
- [ ] New utilities documented
- [ ] Best practices added

---

## 📈 Success Metrics Dashboard

Track these metrics throughout implementation:

| Metric | Baseline | Week 1 | Week 2 | Week 4 | Target |
|--------|----------|--------|--------|--------|--------|
| Total 404 count | 400+ | | | | <20 |
| Pattern 1 404s (US→CA) | ~200 | | | | 0 |
| Pattern 2 404s (Full country) | ~100 | | | | 0 |
| Pattern 3 404s (Full province) | ~100 | | | | 0 |
| Redirect success rate | N/A | | | | >95% |
| Organic traffic | Baseline | | | | Stable/↑ |
| Data validation errors | Unknown | 0 | 0 | 0 | 0 |

---

## 🚨 Risk Mitigation Checklist

Before each phase, verify:

### Phase 1 Risks
- [ ] Backup `locations.json` before making changes
- [ ] Test bug fix with sample data before production
- [ ] Verify validation script exits correctly (code 0/1)
- [ ] Review all warnings logged during testing

### Phase 2 Risks
- [ ] Test redirects locally before deploying
- [ ] Verify no redirect loops
- [ ] Check that valid URLs are not affected
- [ ] Test with trailing slash and without

### Phase 3 Risks
- [ ] Don't remove URLs that are actually working
- [ ] Verify removal patterns are correct
- [ ] Monitor for increased 404s after removal requests

### Phase 4 Risks
- [ ] Set up alerts for unexpected 404 spikes
- [ ] Don't make changes without testing
- [ ] Document all changes for audit trail

---

## 📝 Task Assignment Template

Use this template when assigning tasks:

```markdown
**Task:** [Task Number and Name]
**Assignee:** [Developer Name]
**Priority:** [P0/P1/P2/P3]
**Due Date:** [Date]
**Estimated Time:** [Hours]
**Dependencies:** [Task Numbers]

**Status:** [ ] Not Started | [ ] In Progress | [ ] Blocked | [ ] Complete

**Notes:**
-
-

**Completion Date:** ___________
**Actual Time:** ___________
```

---

## 🎯 Quick Reference: Critical Path

The absolute minimum to fix the issue:

1. **Task 1.4** - Apply bug fix ⚡
2. **Task 1.5** - Create validation script ⚡
3. **Task 1.6** - Add to build pipeline ⚡
4. **Task 1.8** - Fix corrupted data ⚡
5. **Task 2.2** - Create redirects ⚡
6. **Task 2.3** - Integrate redirects ⚡
7. **Task 2.7** - Deploy to production ⚡

**Minimum Time to Fix:** 6-8 hours

---

## 📚 Related Documents

- **PRD:** `Bugs/PRD-404-Error-Resolution.md`
- **Root Cause Analysis:** `Bugs/ANALYST-REVIEW-404-Root-Cause.md`
- **Project Brief:** `Bugs/PROJECT-BRIEF-404-Root-Cause.md`
- **404 URLs:** `Bugs/Table.csv`

---

**END OF TASK LIST**
