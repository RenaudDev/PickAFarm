#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function generateSearchData() {
  console.log('🔍 Generating search data for dropdowns...');
  
  try {
    // Fetch farm data to extract categories
    console.log('📊 Fetching farm data...');
    const farmsResponse = await fetch('https://pickafarm-api.94623956quebecinc.workers.dev/api/farms');
    
    if (!farmsResponse.ok) {
      throw new Error(`Farms API request failed: ${farmsResponse.status} ${farmsResponse.statusText}`);
    }
    
    const farmsData = await farmsResponse.json();
    const farms = farmsData.farms;
    
    // Fetch cities data
    console.log('🏙️ Fetching cities data...');
    const citiesResponse = await fetch('https://pickafarm-api.94623956quebecinc.workers.dev/api/cities');
    
    if (!citiesResponse.ok) {
      throw new Error(`Cities API request failed: ${citiesResponse.status} ${citiesResponse.statusText}`);
    }
    
    const citiesData = await citiesResponse.json();
    const cities = citiesData.cities;
    
    // Extract unique categories from farms
    const categoriesSet = new Set();
    farms.forEach(farm => {
      if (farm.categories) {
        // Handle both JSON array and comma-separated string formats
        let categories;
        try {
          categories = JSON.parse(farm.categories);
        } catch {
          categories = farm.categories.split(',').map(cat => cat.trim());
        }
        
        if (Array.isArray(categories)) {
          categories.forEach(category => {
            if (category && category.trim()) {
              categoriesSet.add(category.trim());
            }
          });
        }
      }
      
      // Also extract from 'type' field if available
      if (farm.type) {
        categoriesSet.add(farm.type.trim());
      }
    });
    
    // Convert to sorted array
    const farmCategories = Array.from(categoriesSet).sort();
    
    // Format cities for location dropdown
    const locations = cities
      .filter(city => city.farm_count > 0) // Only cities with farms
      .map(city => {
        // Format as "City, State" or "City, Province"
        return `${city.name}, ${city.state_province}`;
      })
      .sort();
    
    console.log(`✅ Found ${farmCategories.length} categories and ${locations.length} locations`);
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Generate the search data file
    const searchData = {
      categories: farmCategories,
      locations: locations,
      generatedAt: new Date().toISOString()
    };
    
    const searchDataPath = path.join(dataDir, 'search-data.json');
    fs.writeFileSync(searchDataPath, JSON.stringify(searchData, null, 2));
    console.log(`💾 Saved search data to ${searchDataPath}`);
    
    // Also generate TypeScript constants file for better integration
    const tsContent = `// Auto-generated search data - do not edit manually
// Generated at: ${new Date().toISOString()}

export const farmCategories = ${JSON.stringify(farmCategories, null, 2)} as const;

export const locations = ${JSON.stringify(locations, null, 2)} as const;

export type FarmCategory = typeof farmCategories[number];
export type Location = typeof locations[number];
`;
    
    const tsPath = path.join(__dirname, '..', 'src', 'data', 'search-data.ts');
    const tsDir = path.dirname(tsPath);
    if (!fs.existsSync(tsDir)) {
      fs.mkdirSync(tsDir, { recursive: true });
    }
    
    fs.writeFileSync(tsPath, tsContent);
    console.log(`📝 Generated TypeScript constants at ${tsPath}`);
    
    console.log('🎉 Search data generation complete!');
    console.log(`Categories: ${farmCategories.slice(0, 5).join(', ')}${farmCategories.length > 5 ? '...' : ''}`);
    console.log(`Locations: ${locations.slice(0, 5).join(', ')}${locations.length > 5 ? '...' : ''}`);
    
  } catch (error) {
    console.error('❌ Error generating search data:', error.message);
    
    // Create fallback data so build doesn't fail
    const fallbackData = {
      categories: [
        "Apple Picking",
        "Pumpkin Patches", 
        "Berry Picking",
        "Christmas Trees"
      ],
      locations: [
        "Toronto, Ontario",
        "Rochester, New York",
        "Ottawa, Ontario",
        "Fresno, California"
      ],
      generatedAt: new Date().toISOString()
    };
    
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(dataDir, 'search-data.json'), JSON.stringify(fallbackData, null, 2));
    
    // Fallback TypeScript file
    const fallbackTsContent = `// Fallback search data
export const farmCategories = ${JSON.stringify(fallbackData.categories, null, 2)} as const;
export const locations = ${JSON.stringify(fallbackData.locations, null, 2)} as const;
export type FarmCategory = typeof farmCategories[number];
export type Location = typeof locations[number];
`;
    
    const tsPath = path.join(__dirname, '..', 'src', 'data', 'search-data.ts');
    const tsDir = path.dirname(tsPath);
    if (!fs.existsSync(tsDir)) {
      fs.mkdirSync(tsDir, { recursive: true });
    }
    
    fs.writeFileSync(tsPath, fallbackTsContent);
    
    console.log('🔄 Created fallback search data to prevent build failure');
  }
}

// Run the script
generateSearchData();
