const fs = require('fs');
const path = require('path');

console.log('🔍 PHASE 0: Data Validation for State Pages\n');
console.log('='.repeat(60));

// Read farms data
const farmsDataPath = path.join(__dirname, '../web/data/farms.json');
const farmsData = JSON.parse(fs.readFileSync(farmsDataPath, 'utf8'));

console.log(`\n📊 Total farms in database: ${farmsData.length}`);

// Validation checks
let validationErrors = [];
let validationWarnings = [];

// Check 1: Farms with missing state_province
const farmsWithoutState = farmsData.filter((farm) => !farm.state_province);
if (farmsWithoutState.length > 0) {
  validationErrors.push(`❌ ${farmsWithoutState.length} farms missing state_province field`);
  farmsWithoutState.slice(0, 5).forEach((farm) => {
    console.log(`   - ${farm.name} (ID: ${farm.id})`);
  });
}

// Check 2: Farms with invalid coordinates
const farmsWithoutCoords = farmsData.filter(
  (farm) => !farm.latitude || !farm.longitude || farm.latitude === 0 || farm.longitude === 0
);
if (farmsWithoutCoords.length > 0) {
  validationWarnings.push(
    `⚠️  ${farmsWithoutCoords.length} farms with missing/invalid coordinates`
  );
}

// Check 3: Active farms only
const activeFarms = farmsData.filter((farm) => farm.active === 1 || farm.active === true);
console.log(`\n✅ Active farms: ${activeFarms.length}`);
console.log(`⏸️  Inactive farms: ${farmsData.length - activeFarms.length}`);

// Check 4: Group by state/province
const stateGroups = {};
const stateVariations = new Set();

activeFarms.forEach((farm) => {
  const state = farm.state_province;
  if (state) {
    stateVariations.add(state);

    // Normalize state name
    const normalizedState = normalizeStateName(state);

    if (!stateGroups[normalizedState]) {
      stateGroups[normalizedState] = {
        count: 0,
        variations: new Set(),
        farms: [],
      };
    }
    stateGroups[normalizedState].count++;
    stateGroups[normalizedState].variations.add(state);
    stateGroups[normalizedState].farms.push(farm);
  }
});

console.log(`\n🌎 States/Provinces found: ${Object.keys(stateGroups).length}`);
console.log(`\n📋 State name variations detected: ${stateVariations.size}`);

// Check 5: Inconsistent state naming
console.log('\n🔤 State Name Analysis:');
console.log('─'.repeat(60));

Object.entries(stateGroups).forEach(([stateName, data]) => {
  console.log(`\n${stateName}:`);
  console.log(`  Farms: ${data.count}`);
  console.log(`  Name variations: ${Array.from(data.variations).join(', ')}`);

  // Check if variations are inconsistent
  if (data.variations.size > 1) {
    validationWarnings.push(`⚠️  "${stateName}" has ${data.variations.size} naming variations`);
  }

  // Check minimum threshold
  if (data.count < 5) {
    validationWarnings.push(
      `⚠️  "${stateName}" has only ${data.count} farms (below minimum threshold of 5)`
    );
  }
});

// Check 6: Farms eligible for state pages
const eligibleStates = Object.entries(stateGroups)
  .filter(([_, data]) => data.count >= 5)
  .sort((a, b) => b[1].count - a[1].count);

console.log('\n\n✅ States Eligible for State Pages (≥5 farms):');
console.log('─'.repeat(60));
eligibleStates.forEach(([stateName, data]) => {
  console.log(`${stateName.padEnd(30)} ${data.count.toString().padStart(4)} farms`);
});

// Check 7: Country detection
const countryCounts = {};
activeFarms.forEach((farm) => {
  const country = farm.country || 'Unknown';
  countryCounts[country] = (countryCounts[country] || 0) + 1;
});

console.log('\n\n🌍 Farms by Country:');
console.log('─'.repeat(60));
Object.entries(countryCounts).forEach(([country, count]) => {
  console.log(`${country.padEnd(20)} ${count} farms`);
});

// Summary
console.log('\n\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));

console.log(`\n✅ Total active farms: ${activeFarms.length}`);
console.log(`✅ States/provinces with farms: ${Object.keys(stateGroups).length}`);
console.log(`✅ States eligible for pages: ${eligibleStates.length}`);
console.log(`✅ Total state pages to generate: ${eligibleStates.length}`);

if (validationErrors.length > 0) {
  console.log('\n\n❌ CRITICAL ERRORS:');
  validationErrors.forEach((error) => console.log(error));
  console.log('\n⚠️  Fix these errors before proceeding!');
  process.exit(1);
}

if (validationWarnings.length > 0) {
  console.log('\n\n⚠️  WARNINGS:');
  validationWarnings.forEach((warning) => console.log(warning));
  console.log("\n💡 These should be reviewed but won't block generation.");
}

console.log('\n\n✨ Data validation complete!');
console.log('✅ Ready to proceed with state page generation.\n');

// Helper function to normalize state names
function normalizeStateName(state) {
  if (!state) return 'Unknown';

  const normalized = state.trim();

  // Common variations
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
    MB: 'Manitoba',
    Mb: 'Manitoba',
    manitoba: 'Manitoba',
    SK: 'Saskatchewan',
    Sk: 'Saskatchewan',
    saskatchewan: 'Saskatchewan',
    NS: 'Nova Scotia',
    Ns: 'Nova Scotia',
    'nova scotia': 'Nova Scotia',
    NB: 'New Brunswick',
    Nb: 'New Brunswick',
    'new brunswick': 'New Brunswick',
    NL: 'Newfoundland and Labrador',
    Nl: 'Newfoundland and Labrador',
    'newfoundland and labrador': 'Newfoundland and Labrador',
    PE: 'Prince Edward Island',
    Pe: 'Prince Edward Island',
    'prince edward island': 'Prince Edward Island',
    YT: 'Yukon',
    Yt: 'Yukon',
    yukon: 'Yukon',
    NT: 'Northwest Territories',
    Nt: 'Northwest Territories',
    'northwest territories': 'Northwest Territories',
    NU: 'Nunavut',
    Nu: 'Nunavut',
    nunavut: 'Nunavut',
    // US States (if needed)
    CA: 'California',
    california: 'California',
    NY: 'New York',
    'new york': 'New York',
    TX: 'Texas',
    texas: 'Texas',
    FL: 'Florida',
    florida: 'Florida',
  };

  return mappings[normalized] || normalized;
}
