#!/usr/bin/env node

/**
 * Fix Remaining Location Errors
 * Fixes the last 6 validation errors manually
 */

const fs = require('fs');
const path = require('path');

function getBaseLocations(locsRaw) {
  if (Array.isArray(locsRaw)) return locsRaw;
  if (locsRaw && Array.isArray(locsRaw.locationPages)) return locsRaw.locationPages;
  throw new Error('Unsupported locations.json format.');
}

function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const locationsPath = path.join(dataDir, 'locations.json');

  console.log('🔧 Fixing remaining location errors...\n');

  const locsRaw = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
  const locations = getBaseLocations(locsRaw);

  let fixedCount = 0;

  for (const loc of locations) {
    let fixed = false;

    // Fix 1: Cape Breton - Nova Scotia is "ns" not "sc"
    if (
      loc.name === 'Cape Breton' &&
      loc.province === 'Nova Scotia' &&
      loc.province_slug === 'sc'
    ) {
      console.log(`✏️  Fixing Cape Breton: sc → ns`);
      loc.province_slug = 'ns';
      loc.location_slug = 'cape-breton-ns-ca';
      fixed = true;
    }

    // Fix 2: Eau Claire - WI is US, not Canada
    if (loc.name === 'Eau Claire' && loc.province_slug === 'wi' && loc.country_slug === 'ca') {
      console.log(`✏️  Fixing Eau Claire: ca → us`);
      loc.country = 'United States';
      loc.country_slug = 'us';
      loc.location_slug = 'eau-claire-wi-us';
      loc.full_location = 'Eau Claire, WI, United States';
      fixed = true;
    }

    // Fix 3: Charlottetown - PEI is "pe" not "pei"
    if (
      loc.name === 'Charlottetown' &&
      loc.province === 'Prince Edward Island' &&
      loc.province_slug === 'pei'
    ) {
      console.log(`✏️  Fixing Charlottetown: pei → pe`);
      loc.province_slug = 'pe';
      loc.location_slug = 'charlottetown-pe-ca';
      fixed = true;
    }

    // Fix 4: Yellowknife - NWT is "nt" not "nwt"
    if (
      loc.name === 'Yellowknife' &&
      loc.province === 'Northwest Territories' &&
      loc.province_slug === 'nwt'
    ) {
      console.log(`✏️  Fixing Yellowknife: nwt → nt`);
      loc.province_slug = 'nt';
      loc.location_slug = 'yellowknife-nt-ca';
      fixed = true;
    }

    // Fix 5: Warwick - Puerto Rico is "pr" not "puerto-rico"
    if (loc.name === 'Warwick' && loc.province_slug === 'puerto-rico') {
      console.log(`✏️  Fixing Warwick: puerto-rico → pr`);
      loc.province = 'Puerto Rico';
      loc.province_slug = 'pr';
      loc.location_slug = 'warwick-pr-us';
      fixed = true;
    }

    // Fix 6: Quebec City - false positive (city name contains "quebec" but slug is correct)
    // No fix needed - this is actually correct

    if (fixed) {
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
    console.log(`\n✅ Fixed ${fixedCount} location(s)`);
  } else {
    console.log('\n✅ No locations needed fixing');
  }

  console.log(`Total locations processed: ${locations.length}`);
}

main();
