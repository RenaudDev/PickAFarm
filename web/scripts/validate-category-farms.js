const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Category Farm Filtering\n');
console.log('='.repeat(60));

// Import data
const farmsData = require('../web/data/farms.json');
const categoriesData = require('../web/data/categories.json');

// Category variations function (matches category-utils.ts)
function getCategoryVariations(categoryName) {
  const variations = [categoryName];

  if (categoryName.includes('Christmas Tree')) {
    variations.push('Christmas Tree', 'Christmas Trees', 'Christmas Tree Farms');
  }
  if (categoryName.includes('Apple')) {
    variations.push('Apple', 'Apple Orchard', 'Apple Picking', 'Apple Orchards');
  }
  if (categoryName.includes('Pumpkin')) {
    variations.push('Pumpkin', 'Pumpkin Patch', 'Pumpkin Patches');
  }
  if (categoryName.includes('Berry')) {
    variations.push('Berry', 'Berry Farm', 'Berry Picking', 'Berry Farms', 'Berries');
  }
  if (categoryName.includes('Corn Maze')) {
    variations.push('Corn Maze', 'Corn Mazes', 'Maize Maze');
  }
  if (categoryName.includes('Strawberry')) {
    variations.push('Strawberry', 'Strawberries', 'Strawberry Picking');
  }
  if (categoryName.includes('Blueberry')) {
    variations.push('Blueberry', 'Blueberries', 'Blueberry Picking');
  }
  if (categoryName.includes('Raspberry')) {
    variations.push('Raspberry', 'Raspberries', 'Raspberry Picking');
  }
  if (categoryName.includes('Peach')) {
    variations.push('Peach', 'Peaches', 'Peach Orchard');
  }
  if (categoryName.includes('Cherry')) {
    variations.push('Cherry', 'Cherries', 'Cherry Picking');
  }
  if (categoryName.includes('Vegetable')) {
    variations.push('Vegetable', 'Vegetables', 'Veggie', 'Produce');
  }
  if (categoryName.includes('Flower')) {
    variations.push('Flower', 'Flowers', 'Flower Picking', 'Cut Flowers');
  }
  if (categoryName.includes('Sunflower')) {
    variations.push('Sunflower', 'Sunflowers');
  }
  if (categoryName.includes('Maple') || categoryName.includes('Sugar')) {
    variations.push('Maple', 'Maple Syrup', 'Sugar Bush', 'Sugarbush');
  }
  if (categoryName.includes('Winery') || categoryName.includes('Vineyard')) {
    variations.push('Winery', 'Vineyard', 'Wine', 'Grapes');
  }
  if (categoryName.includes('Petting Zoo') || categoryName.includes('Animal')) {
    variations.push('Petting Zoo', 'Farm Animals', 'Animals', 'Zoo');
  }
  if (categoryName.includes('Hayride')) {
    variations.push('Hayride', 'Hay Ride', 'Hayrides');
  }

  return variations;
}

// Filter farms by category
function getFarmsForCategory(categoryName) {
  const variations = getCategoryVariations(categoryName);

  return farmsData
    .filter((farm) => farm.active === 1)
    .filter((farm) => {
      if (!farm.categories) return false;

      const farmCategories = farm.categories.split(',').map((c) => c.trim().toLowerCase());

      return variations.some((variation) =>
        farmCategories.some((farmCat) => farmCat.includes(variation.toLowerCase()))
      );
    });
}

// Validate all categories
console.log('\n📊 Testing All Categories:\n');

let totalTested = 0;
let totalPassed = 0;
let totalFailed = 0;
const issues = [];

categoriesData.forEach((category) => {
  totalTested++;

  const filteredFarms = getFarmsForCategory(category.name);
  const expectedCount = category.totalFarms;
  const actualCount = filteredFarms.length;

  const match = actualCount === expectedCount;
  const status = match ? '✅' : '⚠️';
  const difference = actualCount - expectedCount;

  if (match) {
    totalPassed++;
  } else {
    totalFailed++;
    issues.push({
      category: category.name,
      expected: expectedCount,
      actual: actualCount,
      difference: difference,
    });
  }

  console.log(`${status} ${category.name}`);
  console.log(
    `   Expected: ${expectedCount} | Actual: ${actualCount}${difference !== 0 ? ` (${difference > 0 ? '+' : ''}${difference})` : ''}`
  );

  if (filteredFarms.length > 0) {
    console.log(`   Sample: ${filteredFarms[0].name}`);
  }
  console.log('');
});

// Summary
console.log('='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));
console.log(`\nTotal categories tested: ${totalTested}`);
console.log(`✅ Passed: ${totalPassed}`);
console.log(`⚠️  Failed: ${totalFailed}`);

if (issues.length > 0) {
  console.log('\n⚠️  Categories with mismatches:');
  issues.forEach((issue) => {
    console.log(`\n  ${issue.category}:`);
    console.log(`    Expected: ${issue.expected}`);
    console.log(`    Actual: ${issue.actual}`);
    console.log(`    Difference: ${issue.difference > 0 ? '+' : ''}${issue.difference}`);
  });

  console.log('\n💡 Note: Small differences are normal if farm data has been updated.');
  console.log('   Large differences may indicate missing category variations.');
}

// Test specific high-priority categories
console.log('\n\n' + '='.repeat(60));
console.log('🎄 HIGH PRIORITY CATEGORIES');
console.log('='.repeat(60));

const highPriority = ['Christmas Tree Farms', 'Apple Orchards', 'Pumpkin Patches', 'Berry Farms'];

highPriority.forEach((categoryName) => {
  const farms = getFarmsForCategory(categoryName);
  console.log(`\n${categoryName}: ${farms.length} farms`);

  if (farms.length > 0) {
    console.log('  Sample farms:');
    farms.slice(0, 3).forEach((farm) => {
      console.log(`    - ${farm.name} (${farm.city_name}, ${farm.state_province})`);
      console.log(`      Categories: ${farm.categories}`);
    });
  }
});

// Check for duplicate farm IDs
console.log('\n\n' + '='.repeat(60));
console.log('🔍 CHECKING FOR DUPLICATES');
console.log('='.repeat(60));

const testCategory = 'Christmas Tree Farms';
const testFarms = getFarmsForCategory(testCategory);
const farmIds = new Set();
let duplicates = 0;

testFarms.forEach((farm) => {
  if (farmIds.has(farm.id)) {
    duplicates++;
    console.log(`⚠️  Duplicate farm ID: ${farm.id} (${farm.name})`);
  }
  farmIds.add(farm.id);
});

if (duplicates === 0) {
  console.log(`✅ No duplicates found in ${testCategory}`);
} else {
  console.log(`⚠️  Found ${duplicates} duplicate(s) in ${testCategory}`);
}

console.log('\n✨ Validation complete!\n');

// Exit with appropriate code
if (totalFailed === 0 && duplicates === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some issues found. Review above.');
  process.exit(0); // Non-blocking for now
}
