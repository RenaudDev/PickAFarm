#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Generate URL-friendly slug
function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

async function generateLocationData() {
  console.log('🗺️  Transforming cities data for location pages...');
  
  try {
    const dataDir = path.join(__dirname, '..', 'data');
    
    // Read existing cities data
    const citiesPath = path.join(dataDir, 'cities.json');
    if (!fs.existsSync(citiesPath)) {
      throw new Error('cities.json not found. Please ensure the file exists.');
    }
    
    const citiesData = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
    console.log(`📍 Loaded ${citiesData.metadata.totalCities} cities from ${citiesData.metadata.totalProvinces} provinces`);
    
    // Create a flat array of all cities with location page data
    const locationPages = [];
    
    // Process each province
    for (const [provinceKey, provinceData] of Object.entries(citiesData.provinces)) {
      console.log(`Processing ${provinceData.name}...`);
      
      // Process each city in the province
      for (const city of provinceData.cities) {
        const locationPage = {
          // Original city data
          ...city,
          
          // Province information
          province: provinceData.name,
          province_slug: provinceData.slug,
          
          // Country information
          country: "Canada",
          country_slug: "canada",
          
          // URL slug for location pages: city-province-canada
          location_slug: `${city.slug}-${provinceData.slug}-canada`,
          
          // Full location name for display
          full_location: `${city.name}, ${provinceData.name}, Canada`,
          
          // SEO-friendly title
          seo_title: `Pick Your Own Farms near ${city.name}, ${provinceData.name}`,
          
          // Meta description
          meta_description: `Find the best pick-your-own farms near ${city.name}, ${provinceData.name}. Fresh apples, berries, pumpkins and Christmas trees.`
        };
        
        locationPages.push(locationPage);
      }
    }
    
    console.log(`✅ Generated ${locationPages.length} location pages`);
    
    // Create the transformed data structure
    const transformedData = {
      metadata: {
        ...citiesData.metadata,
        description: "Canadian cities transformed for location page generation",
        urlStructure: "category/near/city-province-canada",
        lastUpdated: new Date().toISOString(),
        totalLocationPages: locationPages.length
      },
      locationPages: locationPages
    };
    
    // Also create a simple params file for Next.js generateStaticParams
    const locationParams = locationPages.map(page => ({
      location: page.location_slug
    }));
    
    // Write the transformed data
    const locationsFilePath = path.join(dataDir, 'locations.json');
    fs.writeFileSync(locationsFilePath, JSON.stringify(transformedData, null, 2));
    console.log(`💾 Saved location data to ${locationsFilePath}`);
    
    // Write the params file
    const paramsFilePath = path.join(dataDir, 'location-params.json');
    fs.writeFileSync(paramsFilePath, JSON.stringify(locationParams, null, 2));
    console.log(`📋 Generated static params for ${locationParams.length} location pages`);
    
    // Log some examples
    console.log('\n📝 Example location slugs:');
    locationPages.slice(0, 5).forEach(page => {
      console.log(`   ${page.location_slug} -> ${page.full_location}`);
    });
    
    console.log('\n🎉 Location data transformation complete!');
    console.log(`📊 Summary: ${locationPages.length} location pages ready for generation`);
    
  } catch (error) {
    console.error('❌ Error generating location data:', error.message);
    process.exit(1);
  }
}

// Run the script
generateLocationData();
