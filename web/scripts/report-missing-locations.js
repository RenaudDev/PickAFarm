#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// Load API credentials from environment variables
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const CLOUDFLARE_D1_TOKEN = process.env.CLOUDFLARE_D1_TOKEN;
const CLOUDFLARE_D1_URL = process.env.CLOUDFLARE_D1_URL;

function toRad(x) {
  return (x * Math.PI) / 180;
}
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// Google Maps API functions
async function makeGoogleMapsRequest(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse Google Maps response: ${error.message}`));
          }
        });
      })
      .on('error', reject);
  });
}

async function findNearbyPopulationCenters(latitude, longitude) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not found. Using farm city as fallback.');
    return [];
  }

  try {
    // Search for cities/towns within 100km radius
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=100000&type=locality&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await makeGoogleMapsRequest(url);

    if (response.status === 'OK') {
      const places = [];

      for (const place of response.results) {
        // Filter for actual cities/towns, not tiny villages
        const types = place.types || [];
        if (
          !types.includes('locality') ||
          types.includes('sublocality') ||
          !place.name ||
          place.name.length <= 2
        ) {
          continue;
        }

        const distance_km = haversineDistance(
          latitude,
          longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        );

        // Get more details about this place including population estimates
        const placeDetails = await getPlacePopulationEstimate(place.place_id);

        places.push({
          name: place.name,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          distance_km: distance_km,
          types: place.types,
          population: placeDetails?.population || null,
          rating: place.rating || null,
        });

        // Add delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return places
        .sort((a, b) => a.distance_km - b.distance_km) // Sort by distance
        .slice(0, 3); // Take top 3 closest cities
    }
    return [];
  } catch (error) {
    console.error(
      `Error finding population centers near ${latitude}, ${longitude}:`,
      error.message
    );
    return [];
  }
}

async function getPlacePopulationEstimate(placeId) {
  if (!GOOGLE_MAPS_API_KEY || !placeId) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,types,geometry,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await makeGoogleMapsRequest(url);

    if (response.status === 'OK' && response.result) {
      const result = response.result;

      // Google doesn't provide population directly, but we can make educated estimates
      // based on the place types and administrative level
      let populationEstimate = null;

      const types = result.types || [];

      // Use place types to estimate population ranges
      if (types.includes('administrative_area_level_1')) {
        populationEstimate = 500000; // Province/State level
      } else if (types.includes('administrative_area_level_2')) {
        populationEstimate = 100000; // County/Regional level
      } else if (types.includes('locality')) {
        // For localities, we'll use a conservative estimate
        // This is better than hardcoded constants as it's based on Google's classification
        populationEstimate = 25000; // City/Town level
      }

      return {
        population: populationEstimate,
        types: types,
        formatted_address: result.formatted_address,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error getting place details for ${placeId}:`, error.message);
    return null;
  }
}

async function getLocationDetails(latitude, longitude) {
  if (!GOOGLE_MAPS_API_KEY) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await makeGoogleMapsRequest(url);

    if (response.status === 'OK' && response.results.length > 0) {
      const result = response.results[0];
      const addressComponents = result.address_components || [];

      let province = null;
      let country = null;

      // Extract province/state and country from address components
      for (const component of addressComponents) {
        const types = component.types || [];

        if (types.includes('administrative_area_level_1')) {
          province = component.long_name; // e.g., "Maine", "New Brunswick"
        }

        if (types.includes('country')) {
          country = component.long_name; // e.g., "United States", "Canada"
        }
      }

      return {
        province: province,
        country: country,
        formatted_address: result.formatted_address,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error reverse geocoding ${latitude}, ${longitude}:`, error.message);
    return null;
  }
}

// D1 Database functions using REST API
async function fetchFarmsFromD1() {
  if (!CLOUDFLARE_D1_URL || !CLOUDFLARE_D1_TOKEN) {
    console.warn('Cloudflare D1 credentials not provided. Falling back to JSON files.');
    return null;
  }

  try {
    console.log('🔍 Querying D1 database using REST API...');

    const query = `
      SELECT 
        zoho_record_id as id,
        name, 
        city as city_name,
        state as state_province,
        country,
        latitude,
        longitude,
        active
      FROM farms 
      WHERE active = 1
    `;

    const response = await fetch(CLOUDFLARE_D1_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_D1_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: query,
      }),
    });

    if (!response.ok) {
      throw new Error(`D1 API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // console.log('🔍 D1 Response structure:', JSON.stringify(data, null, 2));

    // Handle different response structures
    let farms = null;
    if (data.success && data.result) {
      if (Array.isArray(data.result) && data.result[0] && data.result[0].results) {
        // D1 returns: { result: [{ results: [...] }] }
        farms = data.result[0].results;
      } else if (data.result.results) {
        farms = data.result.results;
      } else if (Array.isArray(data.result)) {
        farms = data.result;
      } else {
        console.error('Unexpected D1 response structure:', data);
        throw new Error('Invalid D1 response format');
      }

      console.log(`✅ Fetched ${farms.length} farms from D1 database`);

      return farms
        .filter(
          (row) =>
            row.latitude &&
            row.longitude &&
            parseFloat(row.latitude) !== 0 &&
            parseFloat(row.longitude) !== 0
        )
        .map((row) => ({
          id: row.id,
          name: row.name,
          city_name: row.city_name,
          state_province: row.state_province,
          country: row.country,
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),
          active: row.active,
        }));
    }

    throw new Error('Invalid D1 response format');
  } catch (error) {
    console.error('Failed to fetch farms from D1:', error.message);
    return null;
  }
}

// Dynamic population estimation - no constants
function estimatePopulation(cityName, province) {
  // We'll get population data from Google Maps API or use a simple heuristic
  // No hardcoded values - just return null and let Google Maps provide the data
  return null;
}

function getBaseLocations(locsRaw) {
  if (Array.isArray(locsRaw)) return locsRaw;
  if (locsRaw && Array.isArray(locsRaw.locationPages)) return locsRaw.locationPages;
  if (locsRaw && locsRaw.metadata && Array.isArray(locsRaw.locationPages))
    return locsRaw.locationPages;
  throw new Error(
    'Unsupported locations.json format. Expect an array or an object with locationPages array.'
  );
}

(async function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const RADIUS_KM = 100;

  const farmsPath = path.join(dataDir, 'farms.json');
  const locationsPath = path.join(dataDir, 'locations.json');
  const locsWithFarmsPath = path.join(dataDir, 'locations-with-farms.json');

  if (!fs.existsSync(locationsPath) || !fs.existsSync(locsWithFarmsPath)) {
    console.error('Missing required files: locations.json, locations-with-farms.json');
    process.exit(1);
  }

  // Try to fetch farms from D1 first, fallback to JSON
  console.log('🔍 Fetching farms data...');
  let farms = await fetchFarmsFromD1();

  if (!farms) {
    console.log('📁 Loading farms from JSON files...');
    if (!fs.existsSync(farmsPath)) {
      console.error(
        '❌ No farms data available. Please check D1 connection or ensure farms.json exists.'
      );
      process.exit(1);
    }

    const farmsAll = loadJson(farmsPath);
    farms = farmsAll.filter(
      (f) =>
        (f.active === 1 || f.active === true) &&
        typeof f.latitude === 'number' &&
        typeof f.longitude === 'number'
    );
  }

  const locsRaw = loadJson(locationsPath);
  const baseLocations = getBaseLocations(locsRaw);
  const locsWithFarms = loadJson(locsWithFarmsPath);

  const covered = new Set();
  for (const loc of locsWithFarms) {
    for (const f of loc.farms || []) covered.add(f.id);
  }
  const missing = farms.filter((f) => !covered.has(f.id));

  // For each missing farm, find the nearest existing base location
  const detailedMissing = missing.map((f) => {
    let nearest = null;
    for (const loc of baseLocations) {
      const lat = loc.coordinates?.latitude ?? loc.latitude;
      const lon = loc.coordinates?.longitude ?? loc.longitude;
      if (typeof lat !== 'number' || typeof lon !== 'number') continue;
      const d = haversineDistance(lat, lon, f.latitude, f.longitude);
      if (!nearest || d < nearest.d) nearest = { d, loc };
    }
    return {
      id: f.id,
      name: f.name,
      city: f.city_name,
      province: f.state_province,
      country: f.country,
      latitude: f.latitude,
      longitude: f.longitude,
      nearest_city: nearest ? nearest.loc.name || null : null,
      nearest_location_slug: nearest ? nearest.loc.location_slug || null : null,
      nearest_distance_km: nearest ? Math.round(nearest.d) : null,
      within_radius: !!(nearest && nearest.d <= RADIUS_KM),
    };
  });

  // Find proper population centers for uncovered farms using Google Maps
  console.log('\n🔍 Finding proper population centers for uncovered farms...');
  const populationCenters = new Map();

  for (const farm of detailedMissing) {
    // Only consider truly uncovered farms (nearest > RADIUS)
    if (farm.nearest_distance_km == null || farm.nearest_distance_km <= RADIUS_KM) continue;

    console.log(`  Checking: ${farm.name} - Country: ${farm.country}`); // DEBUG

    if (
      farm.country !== 'Canada' &&
      farm.country !== 'United States' &&
      farm.country !== 'United States of America' && // ADD THIS
      farm.country !== 'USA' &&
      farm.country !== 'US'
    ) {
      console.log(`    ❌ Skipped: Invalid country "${farm.country}"`);
      continue;
    }

    console.log(`Analyzing farm: ${farm.name} in ${farm.city}, ${farm.province}`);

    // Find nearby population centers using Google Maps
    const nearbyCities = await findNearbyPopulationCenters(farm.latitude, farm.longitude);

    if (nearbyCities.length === 0) {
      // Fallback to farm's city if no Google Maps results
      const fallbackKey = `${farm.city}-${farm.province}`;
      if (!populationCenters.has(fallbackKey)) {
        populationCenters.set(fallbackKey, {
          name: farm.city,
          province: farm.province,
          latitude: farm.latitude,
          longitude: farm.longitude,
          population: null, // No hardcoded population
          farms: [],
          source: 'fallback',
        });
      }
      populationCenters.get(fallbackKey).farms.push(farm);
    } else {
      // Use the closest proper city found by Google Maps
      const closestCity = nearbyCities[0];

      // We need to determine the province/state of the Google Maps result
      // For now, we'll use a simple approach - if the city is close to the farm, use farm's province
      // Otherwise, we need to geocode the city to get its actual province/state
      const cityKey = `${closestCity.name}-${closestCity.latitude}-${closestCity.longitude}`;

      if (!populationCenters.has(cityKey)) {
        populationCenters.set(cityKey, {
          name: closestCity.name,
          province: null, // We'll determine this later
          country: null, // We'll determine this later
          latitude: closestCity.latitude,
          longitude: closestCity.longitude,
          population: closestCity.population,
          farms: [],
          distance_from_farm: closestCity.distance_km,
          source: 'google_maps',
        });
      }
      populationCenters.get(cityKey).farms.push(farm);
    }
  }

  // Now get the actual province/state and country for Google Maps results
  console.log('🌍 Getting location details for Google Maps results...');
  for (const [key, center] of populationCenters.entries()) {
    if (center.source === 'google_maps' && (!center.province || !center.country)) {
      try {
        const locationDetails = await getLocationDetails(center.latitude, center.longitude);
        if (locationDetails) {
          center.province = locationDetails.province;
          center.country = locationDetails.country;
        }
        // Add delay to respect API limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error getting location details for ${center.name}:`, error.message);
        // Fallback: use the nearest farm's country (prefer farm data over default)
        const farmCountry = center.farms[0]?.country;
        center.country = farmCountry || 'United States'; // Most new farms are US-based
        center.province = center.farms[0]?.province || 'Unknown';
      }
    }
  }

  // Convert to legacy format for compatibility
  const clusters = new Map();
  for (const [key, center] of populationCenters.entries()) {
    // Use farm's actual country data
    const farmCountry = center.farms[0]?.country;
    const normalizedCountry =
      farmCountry === 'United States' || farmCountry === 'USA' || farmCountry === 'US'
        ? 'United States'
        : farmCountry === 'Canada'
          ? 'Canada'
          : 'United States'; // Default to US for new locations

    clusters.set(key, {
      city: center.name,
      province: center.province || center.farms[0]?.province || 'Unknown',
      country: center.country || normalizedCountry,
      count: center.farms.length,
      farms: center.farms.map((f) => ({
        id: f.id,
        name: f.name,
        lat: f.latitude,
        lon: f.longitude,
      })),
      latSum: center.latitude * center.farms.length,
      lonSum: center.longitude * center.farms.length,
    });
  }

  const clusterList = Array.from(clusters.values())
    .map((c) => ({
      city: c.city,
      province: c.province,
      country: c.country,
      missingFarmCount: c.count,
      suggested_coordinates: {
        latitude: +(c.latSum / c.count).toFixed(6),
        longitude: +(c.lonSum / c.count).toFixed(6),
      },
      sampleFarms: c.farms.slice(0, 5),
    }))
    .filter(
      (c) =>
        c.country === 'Canada' ||
        c.country === 'United States' ||
        c.country === 'USA' ||
        c.country === 'US'
    ) // US and Canada
    .sort((a, b) => b.missingFarmCount - a.missingFarmCount);

  // Generate properly formatted location objects for US and Canadian locations
  const formattedLocations = clusterList
    .filter((c) => c.missingFarmCount >= 1) // Include single farms too
    .map((c) => {
      const citySlug = c.city
        ? c.city
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        : 'unknown';

      // Normalize country name with SAFE fallback based on province inference
      const isUS =
        c.country === 'United States' ||
        c.country === 'USA' ||
        c.country === 'US' ||
        c.country === 'United States of America';

      const isCanada = c.country === 'Canada' || c.country === 'CA';

      let country;
      let countrySlug;

      if (isUS) {
        country = 'United States';
        countrySlug = 'us';
      } else if (isCanada) {
        country = 'Canada';
        countrySlug = 'ca';
      } else {
        // ⚠️ FALLBACK: Use province to infer country when country is null/undefined
        const usStates = [
          'AL',
          'AK',
          'AZ',
          'AR',
          'CA',
          'CO',
          'CT',
          'DE',
          'FL',
          'GA',
          'HI',
          'ID',
          'IL',
          'IN',
          'IA',
          'KS',
          'KY',
          'LA',
          'ME',
          'MD',
          'MA',
          'MI',
          'MN',
          'MS',
          'MO',
          'MT',
          'NE',
          'NV',
          'NH',
          'NJ',
          'NM',
          'NY',
          'NC',
          'ND',
          'OH',
          'OK',
          'OR',
          'PA',
          'RI',
          'SC',
          'SD',
          'TN',
          'TX',
          'UT',
          'VT',
          'VA',
          'WA',
          'WV',
          'WI',
          'WY',
          'DC',
        ];

        const canadianProvinces = [
          'AB',
          'BC',
          'MB',
          'NB',
          'NL',
          'NT',
          'NS',
          'NU',
          'ON',
          'PE',
          'QC',
          'SK',
          'YT',
        ];

        const provinceAbbrev = getProvinceAbbrev(c.province);

        if (usStates.includes(provinceAbbrev)) {
          country = 'United States';
          countrySlug = 'us';
          console.warn(
            `⚠️ Inferred country=US for ${c.city}, ${c.province} (original country: ${c.country})`
          );
        } else if (canadianProvinces.includes(provinceAbbrev)) {
          country = 'Canada';
          countrySlug = 'ca';
          console.warn(
            `⚠️ Inferred country=Canada for ${c.city}, ${c.province} (original country: ${c.country})`
          );
        } else {
          console.error(
            `❌ ERROR: Cannot determine country for ${c.city}, ${c.province}, country=${c.country}`
          );
          return null; // Skip this location - better to skip than corrupt
        }
      }

      // Get proper province/state abbreviation
      const provinceAbbrev = getProvinceAbbrev(c.province);
      const provinceSlug = provinceAbbrev.toLowerCase();

      return {
        name: c.city || 'Unknown City',
        slug: citySlug,
        population: populationCenters.get(`${c.city}-${c.province}`)?.population || null,
        coordinates: {
          latitude: c.suggested_coordinates.latitude,
          longitude: c.suggested_coordinates.longitude,
        },
        province: c.province || 'Unknown Province',
        province_slug: provinceSlug,
        country: country,
        country_slug: countrySlug,
        location_slug: `${citySlug}-${provinceSlug}-${countrySlug}`,
        full_location: `${c.city || 'Unknown City'}, ${provinceAbbrev}, ${country}`,
        seo_title: `U-Pick Farms near ${c.city || 'Unknown City'}, ${c.province || 'Unknown Province'}`,
        meta_description: `Find the best U-Pick farms near ${c.city || 'Unknown City'}, ${c.province || 'Unknown Province'}. Fresh apples, berries, pumpkins and Christmas trees.`,
      };
    })
    .filter((loc) => loc !== null); // Remove any locations that couldn't be determined

  // Helper function for province abbreviations
  function getProvinceAbbrev(province) {
    const abbrevMap = {
      // Canadian provinces
      Alberta: 'AB',
      'British Columbia': 'BC',
      Manitoba: 'MB',
      'New Brunswick': 'NB',
      'Newfoundland and Labrador': 'NL',
      'Northwest Territories': 'NT',
      'Nova Scotia': 'NS',
      Nunavut: 'NU',
      Ontario: 'ON',
      'Prince Edward Island': 'PE',
      Quebec: 'QC',
      Saskatchewan: 'SK',
      Yukon: 'YT',

      // US states
      Alabama: 'AL',
      Alaska: 'AK',
      Arizona: 'AZ',
      Arkansas: 'AR',
      California: 'CA',
      Colorado: 'CO',
      Connecticut: 'CT',
      Delaware: 'DE',
      Florida: 'FL',
      Georgia: 'GA',
      Hawaii: 'HI',
      Idaho: 'ID',
      Illinois: 'IL',
      Indiana: 'IN',
      Iowa: 'IA',
      Kansas: 'KS',
      Kentucky: 'KY',
      Louisiana: 'LA',
      Maine: 'ME',
      Maryland: 'MD',
      Massachusetts: 'MA',
      Michigan: 'MI',
      Minnesota: 'MN',
      Mississippi: 'MS',
      Missouri: 'MO',
      Montana: 'MT',
      Nebraska: 'NE',
      Nevada: 'NV',
      'New Hampshire': 'NH',
      'New Jersey': 'NJ',
      'New Mexico': 'NM',
      'New York': 'NY',
      'North Carolina': 'NC',
      'North Dakota': 'ND',
      Ohio: 'OH',
      Oklahoma: 'OK',
      Oregon: 'OR',
      Pennsylvania: 'PA',
      'Rhode Island': 'RI',
      'South Carolina': 'SC',
      'South Dakota': 'SD',
      Tennessee: 'TN',
      Texas: 'TX',
      Utah: 'UT',
      Vermont: 'VT',
      Virginia: 'VA',
      Washington: 'WA',
      'West Virginia': 'WV',
      Wisconsin: 'WI',
      Wyoming: 'WY',
      'District of Columbia': 'DC',
    };
    return abbrevMap[province] || province || 'Unknown';
  }

  // Deduplication diagnostics for duplicate location slugs (useful for React key issues)
  const slugCounts = new Map();
  for (const loc of baseLocations) {
    const slug = loc.location_slug || `${loc.slug}-${loc.province_slug}-${loc.country_slug}`;
    slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
  }
  const duplicateSlugs = Array.from(slugCounts.entries())
    .filter(([, n]) => n > 1)
    .map(([slug, n]) => ({ slug, count: n }));

  const result = formattedLocations;

  // Save the suggestions report
  const reportPath = path.join(dataDir, 'report-missing-locations.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

  console.log(`\n✅ Analysis complete!`);
  console.log(`- Total farms (active with coordinates): ${farms.length}`);
  console.log(`- Covered by current locations: ${farms.length - missing.length}`);
  console.log(`- Missing coverage: ${missing.length}`);
  console.log(`- Suggested US/Canadian locations: ${formattedLocations.length}`);
  console.log('\n📊 Missing farms breakdown:');
  console.log(
    `  Within ${RADIUS_KM}km of existing location: ${detailedMissing.filter((f) => f.within_radius).length}`
  );
  console.log(
    `  Beyond ${RADIUS_KM}km (truly uncovered): ${detailedMissing.filter((f) => !f.within_radius).length}`
  );

  if (formattedLocations.length > 0) {
    console.log('\n🏙️ NEW LOCATIONS TO ADD:');
    for (const loc of formattedLocations.slice(0, 10)) {
      console.log(`• ${loc.name}, ${loc.province} (${loc.country})`);
      console.log(`  Slug: ${loc.location_slug}`);
      console.log(`  Coordinates: ${loc.coordinates.latitude}, ${loc.coordinates.longitude}`);
      console.log('');
    }

    // Append to locations.json
    console.log('📝 Appending new locations to locations.json...');

    // Read existing locations
    const existingLocations = getBaseLocations(locsRaw);

    // Check for duplicates by location_slug
    const existingSlugs = new Set(existingLocations.map((loc) => loc.location_slug));
    const newLocations = formattedLocations.filter((loc) => !existingSlugs.has(loc.location_slug));

    if (newLocations.length > 0) {
      // Append new locations
      const updatedLocations = [...existingLocations, ...newLocations];

      // Write back to locations.json (preserve original structure)
      let updatedData;
      if (Array.isArray(locsRaw)) {
        updatedData = updatedLocations;
      } else {
        updatedData = { ...locsRaw, locationPages: updatedLocations };
      }

      fs.writeFileSync(locationsPath, JSON.stringify(updatedData, null, 2));
      console.log(`✅ Added ${newLocations.length} new locations to locations.json`);

      for (const loc of newLocations) {
        console.log(`  + ${loc.name}, ${loc.province} (${loc.country})`);
      }
    } else {
      console.log('ℹ️ No new locations to add (all suggestions already exist)');
    }
  } else {
    console.log('\nℹ️ No location suggestions generated');
  }
})().catch((error) => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
