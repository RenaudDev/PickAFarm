#!/usr/bin/env node

/**
 * Location Data Validation Script
 *
 * Validates locations.json to prevent data corruption that causes 404 errors.
 * This script runs as part of the prebuild process and fails the build if errors are detected.
 *
 * Validation Rules:
 * 1. US states must have country_slug='us', not 'ca'
 * 2. Canadian provinces must have country_slug='ca', not 'us'
 * 3. Location slugs must match format: city-state-country (e.g., "henderson-tx-us")
 * 4. No old format slugs (e.g., "henderson-tx-canada", "toronto-ontario-canada")
 */

const fs = require('fs');
const path = require('path');

// US state abbreviations
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

// Canadian province abbreviations
const CANADIAN_PROVINCES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU',
  'ON', 'PE', 'QC', 'SK', 'YT'
];

// Full province/state names that shouldn't appear in slugs
const FULL_PROVINCE_NAMES = [
  'ontario', 'quebec', 'british-columbia', 'alberta', 'manitoba', 'saskatchewan',
  'nova-scotia', 'new-brunswick', 'prince-edward-island', 'newfoundland-and-labrador',
  'yukon', 'northwest-territories', 'nunavut'
];

// Full country names that shouldn't appear in slugs
const FULL_COUNTRY_NAMES = ['united-states', 'canada'];

function getBaseLocations(locsRaw) {
  if (Array.isArray(locsRaw)) return locsRaw;
  if (locsRaw && Array.isArray(locsRaw.locationPages)) return locsRaw.locationPages;
  if (locsRaw && locsRaw.metadata && Array.isArray(locsRaw.locationPages)) return locsRaw.locationPages;
  throw new Error('Unsupported locations.json format. Expect an array or an object with locationPages array.');
}

function validateLocation(location, index) {
  const errors = [];

  const locationSlug = location.location_slug || `${location.slug}-${location.province_slug}-${location.country_slug}`;
  const provinceSlug = (location.province_slug || '').toUpperCase();
  const countrySlug = (location.country_slug || '').toLowerCase();

  // Rule 1: US states marked as Canada
  if (US_STATES.includes(provinceSlug) && countrySlug === 'ca') {
    errors.push({
      index,
      location_slug: locationSlug,
      error_type: 'US_STATE_AS_CANADA',
      message: `US state "${provinceSlug}" incorrectly marked as Canada`,
      fix: `Change country_slug from 'ca' to 'us'`
    });
  }

  // Rule 2: Canadian provinces marked as US
  if (CANADIAN_PROVINCES.includes(provinceSlug) && countrySlug === 'us') {
    errors.push({
      index,
      location_slug: locationSlug,
      error_type: 'CANADIAN_PROVINCE_AS_US',
      message: `Canadian province "${provinceSlug}" incorrectly marked as US`,
      fix: `Change country_slug from 'us' to 'ca'`
    });
  }

  // Rule 3: Invalid slug format (must be: city-state-country)
  const slugPattern = /^[a-z0-9-]+-[a-z]{2}-[a-z]{2}$/;
  if (!slugPattern.test(locationSlug)) {
    errors.push({
      index,
      location_slug: locationSlug,
      error_type: 'INVALID_SLUG_FORMAT',
      message: `Invalid slug format (expected: city-state-country with 2-letter codes)`,
      fix: `Update slug to match pattern: {city}-{state}-{country}`
    });
  }

  // Rule 4: Old format slugs with full province names
  // Check if province name appears AFTER the city name (not as part of city name)
  const parts = locationSlug.split('-');
  const cityParts = location.slug ? location.slug.split('-') : [];
  const provincePartStart = cityParts.length;

  for (const provinceName of FULL_PROVINCE_NAMES) {
    // Only flag if province name appears after city name (in province position)
    const provinceNameParts = provinceName.split('-');
    let foundInProvincePosition = false;

    // Check if all parts of province name appear consecutively after city
    if (parts.length >= provincePartStart + provinceNameParts.length) {
      foundInProvincePosition = provinceNameParts.every((part, idx) =>
        parts[provincePartStart + idx] === part
      );
    }

    if (foundInProvincePosition) {
      errors.push({
        index,
        location_slug: locationSlug,
        error_type: 'OLD_FORMAT_PROVINCE',
        message: `Old format slug contains full province name "${provinceName}"`,
        fix: `Use 2-letter province code instead of full name`
      });
    }
  }

  // Rule 5: Old format slugs with full country names
  for (const countryName of FULL_COUNTRY_NAMES) {
    if (locationSlug.includes(countryName)) {
      errors.push({
        index,
        location_slug: locationSlug,
        error_type: 'OLD_FORMAT_COUNTRY',
        message: `Old format slug contains full country name "${countryName}"`,
        fix: `Use 2-letter country code (us/ca) instead of full name`
      });
    }
  }

  return errors;
}

function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const locationsPath = path.join(dataDir, 'locations.json');

  console.log('🔍 Validating location data...\n');

  // Check if locations.json exists
  if (!fs.existsSync(locationsPath)) {
    console.error('❌ ERROR: locations.json not found');
    console.error(`   Expected path: ${locationsPath}`);
    process.exit(1);
  }

  // Load and parse locations.json
  let locsRaw;
  try {
    locsRaw = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
  } catch (error) {
    console.error('❌ ERROR: Failed to parse locations.json');
    console.error(`   ${error.message}`);
    process.exit(1);
  }

  // Get base locations array
  let locations;
  try {
    locations = getBaseLocations(locsRaw);
  } catch (error) {
    console.error('❌ ERROR: Invalid locations.json structure');
    console.error(`   ${error.message}`);
    process.exit(1);
  }

  console.log(`📊 Validating ${locations.length} locations...\n`);

  // Validate all locations
  const allErrors = [];
  for (let i = 0; i < locations.length; i++) {
    const errors = validateLocation(locations[i], i);
    allErrors.push(...errors);
  }

  // Report results
  if (allErrors.length === 0) {
    console.log('✅ All locations passed validation!');
    console.log(`   ${locations.length} locations checked, 0 errors found\n`);
    process.exit(0);
  } else {
    console.error(`❌ VALIDATION FAILED: Found ${allErrors.length} error(s)\n`);

    // Group errors by type
    const errorsByType = {};
    for (const error of allErrors) {
      if (!errorsByType[error.error_type]) {
        errorsByType[error.error_type] = [];
      }
      errorsByType[error.error_type].push(error);
    }

    // Print errors grouped by type
    for (const [errorType, errors] of Object.entries(errorsByType)) {
      console.error(`\n━━━ ${errorType} (${errors.length} error${errors.length > 1 ? 's' : ''}) ━━━\n`);

      for (const error of errors) {
        console.error(`Location #${error.index + 1}: ${error.location_slug}`);
        console.error(`  ❌ ${error.message}`);
        console.error(`  💡 Fix: ${error.fix}\n`);
      }
    }

    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.error('⚠️  BUILD BLOCKED: Fix the errors above before deploying\n');
    console.error(`Total errors: ${allErrors.length}`);
    console.error(`File: ${locationsPath}\n`);

    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  main();
}

module.exports = { validateLocation };
