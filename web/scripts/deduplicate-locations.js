#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Deduplicate location slugs in locations.json and locations-with-farms.json
 * Keeps the first occurrence and removes duplicates
 */

function deduplicateLocations() {
  console.log('🔧 Starting location deduplication...\n');
  
  const dataDir = path.join(__dirname, '..', 'data');
  
  // Process locations.json
  const locationsPath = path.join(dataDir, 'locations.json');
  if (fs.existsSync(locationsPath)) {
    console.log('📋 Processing locations.json...');
    const locationsData = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
    
    if (locationsData.locationPages && Array.isArray(locationsData.locationPages)) {
      const seen = new Set();
      const duplicates = [];
      const original = locationsData.locationPages.length;
      
      locationsData.locationPages = locationsData.locationPages.filter((location, index) => {
        const slug = location.location_slug;
        if (seen.has(slug)) {
          duplicates.push({ slug, name: location.name, index });
          return false;
        }
        seen.add(slug);
        return true;
      });
      
      const removed = original - locationsData.locationPages.length;
      
      if (removed > 0) {
        console.log(`   ✅ Removed ${removed} duplicate(s):`);
        duplicates.forEach(dup => {
          console.log(`      - "${dup.name}" (${dup.slug}) at index ${dup.index}`);
        });
        
        // Update metadata
        locationsData.metadata.totalLocationPages = locationsData.locationPages.length;
        locationsData.metadata.lastUpdated = new Date().toISOString();
        
        fs.writeFileSync(locationsPath, JSON.stringify(locationsData, null, 2));
        console.log(`   💾 Saved ${locationsData.locationPages.length} unique locations\n`);
      } else {
        console.log(`   ✅ No duplicates found\n`);
      }
    }
  }
  
  // Process locations-with-farms.json
  const locationsWithFarmsPath = path.join(dataDir, 'locations-with-farms.json');
  if (fs.existsSync(locationsWithFarmsPath)) {
    console.log('📋 Processing locations-with-farms.json...');
    const locationsWithFarms = JSON.parse(fs.readFileSync(locationsWithFarmsPath, 'utf8'));
    
    if (Array.isArray(locationsWithFarms)) {
      const seen = new Set();
      const duplicates = [];
      const original = locationsWithFarms.length;
      
      const deduplicated = locationsWithFarms.filter((location, index) => {
        const slug = location.location_slug;
        if (seen.has(slug)) {
          duplicates.push({ 
            slug, 
            name: location.name, 
            farmCount: location.farmCount || location.farms?.length || 0,
            index 
          });
          return false;
        }
        seen.add(slug);
        return true;
      });
      
      const removed = original - deduplicated.length;
      
      if (removed > 0) {
        console.log(`   ✅ Removed ${removed} duplicate(s):`);
        duplicates.forEach(dup => {
          console.log(`      - "${dup.name}" (${dup.slug}) with ${dup.farmCount} farms at index ${dup.index}`);
        });
        
        fs.writeFileSync(locationsWithFarmsPath, JSON.stringify(deduplicated, null, 2));
        console.log(`   💾 Saved ${deduplicated.length} unique locations\n`);
      } else {
        console.log(`   ✅ No duplicates found\n`);
      }
    }
  }
  
  console.log('🎉 Deduplication complete!');
}

// Run the script
deduplicateLocations();
