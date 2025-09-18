#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

async function generateCategories() {
  console.log('🏷️ Generating categories data for build...');
  
  try {
    // First try to read from local farms.json if it exists (for build-time)
    const dataDir = path.join(__dirname, '..', 'data');
    const farmsFilePath = path.join(dataDir, 'farms.json');
    
    let farms;
    
    if (fs.existsSync(farmsFilePath)) {
      console.log('📊 Reading farms data from local file...');
      const farmsData = JSON.parse(fs.readFileSync(farmsFilePath, 'utf8'));
      farms = Array.isArray(farmsData) ? farmsData : farmsData.farms;
    } else {
      console.log('📊 Fetching farms data from API...');
      // Fallback to API if local file doesn't exist
      const response = await fetch('https://pickafarm-api.94623956quebecinc.workers.dev/api/farms');
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      farms = data.farms;
    }
    
    if (!Array.isArray(farms)) {
      throw new Error(`Expected farms array but got ${typeof farms}`);
    }
    
    console.log(`✅ Processing ${farms.length} farms for categories`);
    
    // Extract unique categories from farms
    const categoriesSet = new Set();
    const categoryFarmCounts = new Map();
    
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
              const cleanCategory = category.trim();
              categoriesSet.add(cleanCategory);
              
              // Count farms per category
              const count = categoryFarmCounts.get(cleanCategory) || 0;
              categoryFarmCounts.set(cleanCategory, count + 1);
            }
          });
        }
      }
      
      // Also extract from 'type' field if available
      if (farm.type) {
        const type = farm.type.trim();
        categoriesSet.add(type);
        const count = categoryFarmCounts.get(type) || 0;
        categoryFarmCounts.set(type, count + 1);
      }
    });
    
    // Convert to array and create category objects with slugs
    const categories = Array.from(categoriesSet)
      .sort()
      .map(categoryName => ({
        slug: createSlug(categoryName),
        name: categoryName,
        farmCount: categoryFarmCounts.get(categoryName) || 0
      }))
      .filter(category => category.farmCount > 0); // Only include categories with farms
    
    console.log(`✅ Found ${categories.length} categories with farms`);
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write categories data to JSON file
    const categoriesFilePath = path.join(dataDir, 'categories.json');
    fs.writeFileSync(categoriesFilePath, JSON.stringify(categories, null, 2));
    console.log(`💾 Saved categories data to ${categoriesFilePath}`);
    
    // Also generate a simple array for generateStaticParams
    const categoryParams = categories.map(category => ({ slug: category.slug }));
    const paramsFilePath = path.join(dataDir, 'category-params.json');
    fs.writeFileSync(paramsFilePath, JSON.stringify(categoryParams, null, 2));
    console.log(`📋 Generated static params for ${categoryParams.length} categories`);
    
    console.log('🎉 Categories generation complete!');
    console.log('Categories:', categories.map(c => `${c.name} (${c.farmCount})`).join(', '));
    
  } catch (error) {
    console.error('❌ Error generating categories:', error.message);
    
    // Create fallback data so build doesn't fail
    const fallbackCategories = [
      { slug: 'christmas-trees', name: 'Christmas Trees', farmCount: 1 },
      { slug: 'apple-orchards', name: 'Apple Orchards', farmCount: 1 },
      { slug: 'pumpkin-patches', name: 'Pumpkin Patches', farmCount: 1 },
      { slug: 'berry-farms', name: 'Berry Farms', farmCount: 1 }
    ];
    
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(dataDir, 'categories.json'), JSON.stringify(fallbackCategories, null, 2));
    fs.writeFileSync(path.join(dataDir, 'category-params.json'), JSON.stringify([
      { slug: 'christmas-trees' },
      { slug: 'apple-orchards' },
      { slug: 'pumpkin-patches' },
      { slug: 'berry-farms' }
    ], null, 2));
    
    console.log('🔄 Created fallback categories to prevent build failure');
  }
}

// Run the script
generateCategories();
