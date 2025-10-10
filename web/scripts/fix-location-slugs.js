#!/usr/bin/env node

/**
 * Fix Location Slugs Script
 *
 * Fixes location_slug field to use 2-letter province/state codes instead of full names.
 *
 * Before: toronto-ontario-ca
 * After:  toronto-on-ca
 */

const fs = require('fs');
const path = require('path');

// Province/State abbreviation map
const PROVINCE_ABBREV_MAP = {
  // Canadian provinces
  'Alberta': 'AB', 'British Columbia': 'BC', 'Manitoba': 'MB', 'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL', 'Northwest Territories': 'NT', 'Nova Scotia': 'NS',
  'Nunavut': 'NU', 'Ontario': 'ON', 'Prince Edward Island': 'PE', 'Quebec': 'QC',
  'Saskatchewan': 'SK', 'Yukon': 'YT',

  // US states
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH',
  'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC',
  'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA',
  'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN',
  'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
  'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
};

// Map slug format to abbrev (e.g., "south-carolina" -> "SC")
const PROVINCE_SLUG_TO_ABBREV = {};
for (const [fullName, abbrev] of Object.entries(PROVINCE_ABBREV_MAP)) {
  const slug = fullName.toLowerCase().replace(/\s+/g, '-');
  PROVINCE_SLUG_TO_ABBREV[slug] = abbrev;
}

function getProvinceAbbrev(province) {
  // If already an abbreviation, return uppercase
  if (province && province.length === 2) {
    return province.toUpperCase();
  }

  // If full name, look up abbreviation
  return PROVINCE_ABBREV_MAP[province] || province || 'Unknown';
}

function getBaseLocations(locsRaw) {
  if (Array.isArray(locsRaw)) return locsRaw;
  if (locsRaw && Array.isArray(locsRaw.locationPages)) return locsRaw.locationPages;
  if (locsRaw && locsRaw.metadata && Array.isArray(locsRaw.locationPages)) return locsRaw.locationPages;
  throw new Error('Unsupported locations.json format.');
}

function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const locationsPath = path.join(dataDir, 'locations.json');

  console.log('🔧 Fixing location slugs...\n');

  // Load locations.json
  const locsRaw = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
  const locations = getBaseLocations(locsRaw);

  let fixedCount = 0;
  let errorCount = 0;

  // Fix each location
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    let needsFix = false;

    // Fix province_slug if it's a full name instead of abbreviation
    if (loc.province_slug && loc.province_slug.length > 2) {
      const abbrev = PROVINCE_SLUG_TO_ABBREV[loc.province_slug];
      if (abbrev) {
        console.log(`✏️  Location #${i + 1}: ${loc.name} - Fixing province_slug`);
        console.log(`   Old province_slug: ${loc.province_slug}`);
        console.log(`   New province_slug: ${abbrev.toLowerCase()}`);
        loc.province_slug = abbrev.toLowerCase();
        needsFix = true;
      } else {
        console.warn(`⚠️  Location #${i + 1} (${loc.name}): Unknown province slug "${loc.province_slug}"`);
      }
    }

    // Generate correct slugs
    const citySlug = loc.slug || loc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const provinceSlug = loc.province_slug?.toLowerCase();
    const countrySlug = loc.country_slug?.toLowerCase();

    if (!provinceSlug || !countrySlug) {
      console.error(`❌ Location #${i + 1} (${loc.name}): Missing province_slug or country_slug`);
      errorCount++;
      continue;
    }

    // Generate correct location slug
    const correctSlug = `${citySlug}-${provinceSlug}-${countrySlug}`;

    // Check if it needs fixing
    if (loc.location_slug !== correctSlug) {
      console.log(`✏️  Location #${i + 1}: ${loc.name} - Fixing location_slug`);
      console.log(`   Old location_slug: ${loc.location_slug}`);
      console.log(`   New location_slug: ${correctSlug}`);

      loc.location_slug = correctSlug;
      needsFix = true;
    }

    if (needsFix) {
      fixedCount++;
    }
  }

  // Write back to file
  if (fixedCount > 0) {
    let updatedData;
    if (Array.isArray(locsRaw)) {
      updatedData = locations;
    } else {
      updatedData = { ...locsRaw, locationPages: locations };
      if (updatedData.metadata) {
        updatedData.metadata.lastUpdated = new Date().toISOString();
      }
    }

    fs.writeFileSync(locationsPath, JSON.stringify(updatedData, null, 2));
    console.log(`\n✅ Fixed ${fixedCount} location slug(s)`);
  } else {
    console.log('\n✅ No locations needed fixing');
  }

  if (errorCount > 0) {
    console.error(`\n⚠️  ${errorCount} location(s) had errors`);
    process.exit(1);
  }

  console.log(`\nTotal locations processed: ${locations.length}`);
}

main();
