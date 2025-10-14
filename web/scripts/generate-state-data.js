const fs = require('fs');
const path = require('path');

console.log('🗺️  PHASE 1: Generating State-Level Farm Data\n');
console.log('='.repeat(60));

// Read farms data
const farmsDataPath = path.join(__dirname, '../data/farms.json');
const farmsData = JSON.parse(fs.readFileSync(farmsDataPath, 'utf8'));

// Read locations data to get city slugs (from locations-with-farms.json which has correct slugs)
const locationsDataPath = path.join(__dirname, '../data/locations-with-farms.json');
const locationsData = JSON.parse(fs.readFileSync(locationsDataPath, 'utf8'));

// Filter active farms only
const activeFarms = farmsData.filter((farm) => farm.active === 1 || farm.active === true);
console.log(`📊 Total active farms: ${activeFarms.length}\n`);

// State/Province name to slug mapping (CLEAN - NO -farms suffix!)
const STATE_SLUG_MAP = {
  // Canada
  Ontario: 'ontario',
  Quebec: 'quebec',
  'British Columbia': 'british-columbia',
  Alberta: 'alberta',
  Manitoba: 'manitoba',
  Saskatchewan: 'saskatchewan',
  'Nova Scotia': 'nova-scotia',
  'New Brunswick': 'new-brunswick',
  'Newfoundland and Labrador': 'newfoundland-and-labrador',
  'Prince Edward Island': 'prince-edward-island',
  Yukon: 'yukon',
  'Northwest Territories': 'northwest-territories',
  Nunavut: 'nunavut',
  // United States
  Alabama: 'alabama',
  Alaska: 'alaska',
  Arizona: 'arizona',
  Arkansas: 'arkansas',
  California: 'california',
  Colorado: 'colorado',
  Connecticut: 'connecticut',
  Delaware: 'delaware',
  Florida: 'florida',
  Georgia: 'georgia',
  Hawaii: 'hawaii',
  Idaho: 'idaho',
  Illinois: 'illinois',
  Indiana: 'indiana',
  Iowa: 'iowa',
  Kansas: 'kansas',
  Kentucky: 'kentucky',
  Louisiana: 'louisiana',
  Maine: 'maine',
  Maryland: 'maryland',
  Massachusetts: 'massachusetts',
  Michigan: 'michigan',
  Minnesota: 'minnesota',
  Mississippi: 'mississippi',
  Missouri: 'missouri',
  Montana: 'montana',
  Nebraska: 'nebraska',
  Nevada: 'nevada',
  'New Hampshire': 'new-hampshire',
  'New Jersey': 'new-jersey',
  'New Mexico': 'new-mexico',
  'New York': 'new-york',
  'North Carolina': 'north-carolina',
  'North Dakota': 'north-dakota',
  Ohio: 'ohio',
  Oklahoma: 'oklahoma',
  Oregon: 'oregon',
  Pennsylvania: 'pennsylvania',
  'Rhode Island': 'rhode-island',
  'South Carolina': 'south-carolina',
  'South Dakota': 'south-dakota',
  Tennessee: 'tennessee',
  Texas: 'texas',
  Utah: 'utah',
  Vermont: 'vermont',
  Virginia: 'virginia',
  Washington: 'washington',
  'West Virginia': 'west-virginia',
  Wisconsin: 'wisconsin',
  Wyoming: 'wyoming',
};

// State/Province code mapping
const STATE_CODE_MAP = {
  // Canada
  Ontario: 'ON',
  Quebec: 'QC',
  'British Columbia': 'BC',
  Alberta: 'AB',
  Manitoba: 'MB',
  Saskatchewan: 'SK',
  'Nova Scotia': 'NS',
  'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL',
  'Prince Edward Island': 'PE',
  Yukon: 'YT',
  'Northwest Territories': 'NT',
  Nunavut: 'NU',
  // United States
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
};

// Zoom levels by geographic size
const STATE_ZOOM_LEVELS = {
  // Canada (larger provinces)
  Ontario: 6,
  Quebec: 5,
  'British Columbia': 5,
  Alberta: 6,
  Manitoba: 6,
  Saskatchewan: 6,
  'Nova Scotia': 7,
  'New Brunswick': 7,
  'Newfoundland and Labrador': 5,
  'Prince Edward Island': 9,
  Yukon: 4,
  'Northwest Territories': 4,
  Nunavut: 3,
  // US (varies)
  California: 6,
  Texas: 6,
  'New York': 7,
  Pennsylvania: 7,
  Florida: 6,
  Illinois: 7,
  Ohio: 7,
  Michigan: 6,
  Wisconsin: 7,
  Minnesota: 6,
  Washington: 7,
  Oregon: 6,
};

// Normalize state names (handle variations)
function normalizeStateName(state) {
  if (!state) return null;

  const normalized = state.trim();

  const mappings = {
    ON: 'Ontario',
    On: 'Ontario',
    ontario: 'Ontario',
    QC: 'Quebec',
    Qc: 'Quebec',
    quebec: 'Quebec',
    BC: 'British Columbia',
    Bc: 'British Columbia',
    'british columbia': 'British Columbia',
    AB: 'Alberta',
    Ab: 'Alberta',
    alberta: 'Alberta',
    NY: 'New York',
    'new york': 'New York',
  };

  return mappings[normalized] || normalized;
}

// Detect country from state name
function detectCountry(stateName) {
  const canadianProvinces = [
    'Ontario',
    'Quebec',
    'British Columbia',
    'Alberta',
    'Manitoba',
    'Saskatchewan',
    'Nova Scotia',
    'New Brunswick',
    'Newfoundland and Labrador',
    'Prince Edward Island',
    'Yukon',
    'Northwest Territories',
    'Nunavut',
  ];

  if (canadianProvinces.includes(stateName)) {
    return { name: 'Canada', code: 'CA', type: 'Province' };
  }
  return { name: 'United States', code: 'US', type: 'State' };
}

// Generate location slug from city name, state, and country
function generateLocationSlug(cityName, stateName) {
  const citySlug = cityName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const stateCode = STATE_CODE_MAP[stateName] || stateName.substring(0, 2).toLowerCase();
  const countryInfo = detectCountry(stateName);
  const countryCode = countryInfo.code.toLowerCase();

  // Format: city-state-country (e.g., new-york-ny-us)
  return `${citySlug}-${stateCode.toLowerCase()}-${countryCode}`;
}

// Calculate distance using Haversine formula (in kilometers)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Group farms by state/province
const farmsByState = {};

activeFarms.forEach((farm) => {
  const state = normalizeStateName(farm.state_province);

  if (!state) {
    console.warn(`⚠️  Farm "${farm.name}" (ID: ${farm.id}) missing state_province field`);
    return;
  }

  if (!farmsByState[state]) {
    farmsByState[state] = [];
  }

  farmsByState[state].push(farm);
});

console.log(`🌎 Found ${Object.keys(farmsByState).length} states/provinces\n`);

// Generate state data
const statesData = [];
let skippedStates = [];

Object.entries(farmsByState).forEach(([stateName, farms]) => {
  const stateSlug = STATE_SLUG_MAP[stateName];

  if (!stateSlug) {
    console.warn(`⚠️  No slug mapping for state: "${stateName}" - skipping`);
    skippedStates.push({ name: stateName, farms: farms.length });
    return;
  }

  // Skip states with fewer than 5 farms
  if (farms.length < 5) {
    console.log(`⏭️  Skipping ${stateName} (only ${farms.length} farms)`);
    skippedStates.push({ name: stateName, farms: farms.length });
    return;
  }

  // Calculate state center (average of all farm coordinates)
  const validCoords = farms.filter(
    (f) => f.latitude && f.longitude && f.latitude !== 0 && f.longitude !== 0
  );

  if (validCoords.length === 0) {
    console.warn(`⚠️  No valid coordinates for ${stateName} - skipping`);
    skippedStates.push({ name: stateName, farms: farms.length });
    return;
  }

  const centerLat = validCoords.reduce((sum, f) => sum + f.latitude, 0) / validCoords.length;
  const centerLng = validCoords.reduce((sum, f) => sum + f.longitude, 0) / validCoords.length;

  // Count featured farms
  const featuredCount = farms.filter((f) => f.featured === 1 || f.featured === true).length;

  // Get all location pages for this state
  const stateLocations = locationsData.filter((loc) => loc.province === stateName);

  // Calculate farm count within 100km radius of each location
  const cities = stateLocations
    .map((location) => {
      const cityLat = location.coordinates?.latitude;
      const cityLng = location.coordinates?.longitude;

      // Count farms within 100km of this location
      let farmCount = 0;
      if (cityLat && cityLng) {
        farms.forEach((farm) => {
          if (farm.latitude && farm.longitude) {
            const distance = calculateHaversineDistance(
              cityLat,
              cityLng,
              farm.latitude,
              farm.longitude
            );
            if (distance <= 100) {
              // 100km radius
              farmCount++;
            }
          }
        });
      }

      return {
        name: location.name,
        slug: location.location_slug,
        farm_count: farmCount,
      };
    })
    .filter((city) => city.farm_count > 0) // Only show cities with farms nearby
    .sort((a, b) => b.farm_count - a.farm_count)
    .slice(0, 20); // Top 20 cities

  // Extract unique categories
  const categoriesMap = new Map();
  farms.forEach((farm) => {
    if (farm.categories) {
      const cats = farm.categories.split(',').map((c) => c.trim());
      cats.forEach((cat) => {
        if (cat) {
          if (!categoriesMap.has(cat)) {
            categoriesMap.set(cat, 0);
          }
          categoriesMap.set(cat, categoriesMap.get(cat) + 1);
        }
      });
    }
  });

  const categories = Array.from(categoriesMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 categories

  // Detect country
  const countryInfo = detectCountry(stateName);

  // Determine if pagination needed (>100 farms)
  const needsPagination = farms.length > 100;
  const totalPages = needsPagination ? Math.ceil(farms.length / 50) : 1;

  const stateData = {
    state_slug: stateSlug,
    state_name: stateName,
    state_code: STATE_CODE_MAP[stateName] || stateName.substring(0, 2).toUpperCase(),
    country: countryInfo.name,
    country_code: countryInfo.code,
    geographic_type: countryInfo.type,
    total_farms: farms.length,
    featured_count: featuredCount,
    center_latitude: Math.round(centerLat * 1000000) / 1000000,
    center_longitude: Math.round(centerLng * 1000000) / 1000000,
    zoom_level: STATE_ZOOM_LEVELS[stateName] || 7,
    needs_pagination: needsPagination,
    total_pages: totalPages,
    farms_per_page: needsPagination ? 50 : farms.length,
    cities: cities,
    categories: categories,
    farms: farms.map((farm) => ({
      ...farm,
      distance_km: 0, // State pages don't use distance
    })),
  };

  statesData.push(stateData);

  const paginationNote = needsPagination ? ` (${totalPages} pages)` : '';
  console.log(
    `✅ ${stateName} (${stateSlug}): ${farms.length} farms${paginationNote}, ${cities.length} cities`
  );
});

// Sort by total farms (descending)
statesData.sort((a, b) => b.total_farms - a.total_farms);

// Write to file
const outputPath = path.join(__dirname, '../data/states-with-farms.json');
fs.writeFileSync(outputPath, JSON.stringify(statesData, null, 2));

// Summary
console.log('\n' + '='.repeat(60));
console.log('✨ State Data Generation Complete!');
console.log('='.repeat(60));

console.log(`\n📁 Output: ${outputPath}`);
console.log(`📊 States generated: ${statesData.length}`);
console.log(`📊 Total farms included: ${statesData.reduce((sum, s) => sum + s.total_farms, 0)}`);
console.log(`⏭️  States skipped: ${skippedStates.length} (below threshold or no slug)`);

// Stats by country
const canadaStates = statesData.filter((s) => s.country_code === 'CA');
const usStates = statesData.filter((s) => s.country_code === 'US');

console.log(
  `\n🇨🇦 Canada: ${canadaStates.length} provinces, ${canadaStates.reduce((sum, s) => sum + s.total_farms, 0)} farms`
);
console.log(
  `🇺🇸 United States: ${usStates.length} states, ${usStates.reduce((sum, s) => sum + s.total_farms, 0)} farms`
);

// States requiring pagination
const paginatedStates = statesData.filter((s) => s.needs_pagination);
if (paginatedStates.length > 0) {
  console.log(`\n📄 States with pagination (>100 farms):`);
  paginatedStates.forEach((s) => {
    console.log(`   - ${s.state_name}: ${s.total_farms} farms across ${s.total_pages} pages`);
  });
}

console.log('\n✅ Ready for Phase 2: State page route creation!\n');
