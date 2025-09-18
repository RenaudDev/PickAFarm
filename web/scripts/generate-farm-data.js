#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function generateFarmData() {
  console.log('🌾 Fetching farm data for build...');
  
  try {
    // Fetch farm data from API
    const response = await fetch('https://pickafarm-api.94623956quebecinc.workers.dev/api/farms');
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📊 API Response:', { 
      type: typeof data, 
      hasFarmsProperty: 'farms' in data,
      farmsLength: data.farms?.length,
      sample: data.farms?.[0] 
    });
    
    // Extract farms array from response object
    const farms = data.farms;
    
    // Check if farms is actually an array
    if (!Array.isArray(farms)) {
      throw new Error(`Expected farms array but got ${typeof farms}. Response: ${JSON.stringify(data).substring(0, 200)}...`);
    }
    
    console.log(`✅ Fetched ${farms.length} farms from API`);
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write farms data to JSON file
    const farmsFilePath = path.join(dataDir, 'farms.json');
    fs.writeFileSync(farmsFilePath, JSON.stringify(farms, null, 2));
    console.log(`💾 Saved farm data to ${farmsFilePath}`);
    
    // Generate farm IDs for static params
    const farmIds = farms.map(farm => ({ id: farm.id.toString() }));
    const paramsFilePath = path.join(dataDir, 'farm-params.json');
    fs.writeFileSync(paramsFilePath, JSON.stringify(farmIds, null, 2));
    console.log(`📋 Generated static params for ${farmIds.length} farms`);
    
    console.log('🎉 Farm data generation complete!');
    
  } catch (error) {
    console.error('❌ Error generating farm data:', error.message);
    
    // Create fallback data so build doesn't fail
    const fallbackData = [
      { id: 1, name: 'Sample Farm 1' },
      { id: 2, name: 'Sample Farm 2' },
      { id: 3, name: 'Sample Farm 3' },
      { id: 4, name: 'Sample Farm 4' }
    ];
    
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(dataDir, 'farms.json'), JSON.stringify(fallbackData, null, 2));
    fs.writeFileSync(path.join(dataDir, 'farm-params.json'), JSON.stringify([
      { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }
    ], null, 2));
    
    console.log('🔄 Created fallback data to prevent build failure');
  }
}

// Run the script
generateFarmData();
