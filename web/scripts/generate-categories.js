#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function createSlug(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

async function generateCategories() {
  console.log('📂 Generating categories from curated content...');
  
  try {
    const dataDir = path.join(__dirname, '..', 'data');
    
    // Read curated category content (this is the source of truth)
    const categoryContentPath = path.join(dataDir, 'category-content.json');
    if (!fs.existsSync(categoryContentPath)) {
      throw new Error('category-content.json not found. This file defines which categories to create.');
    }
    
    const curatedContent = JSON.parse(fs.readFileSync(categoryContentPath, 'utf8'));
    console.log(`📝 Loaded ${Object.keys(curatedContent).length} curated categories`);
    
    // Read farms data to add dynamic information
    const farmsPath = path.join(dataDir, 'farms.json');
    let farms = [];
    
    if (fs.existsSync(farmsPath)) {
      farms = JSON.parse(fs.readFileSync(farmsPath, 'utf8'));
      console.log(`🌾 Loaded ${farms.length} farms for dynamic data`);
    } else {
      console.warn('⚠️  farms.json not found. Categories will have no farm data.');
    }
    
    // Build farm data by category
    const farmsByCategory = {};
    
    farms.forEach(farm => {
      const farmCategories = new Set();
      
      // Extract from categories field
      if (farm.categories) {
        try {
          const categories = JSON.parse(farm.categories);
          categories.forEach(cat => farmCategories.add(cat.trim()));
        } catch (error) {
          // Fallback to comma-separated parsing
          farm.categories.split(',').forEach(cat => farmCategories.add(cat.trim()));
        }
      }
      
      // Extract from type field
      if (farm.type) {
        farmCategories.add(farm.type.trim());
      }
      
      // Match farm categories to curated categories
      farmCategories.forEach(farmCategory => {
        // Find matching curated category (case-insensitive, flexible matching)
        const matchingCuratedKey = Object.keys(curatedContent).find(curatedKey => {
          const curatedName = curatedContent[curatedKey].name.toLowerCase();
          const farmCat = farmCategory.toLowerCase();
          
          // Exact match
          if (curatedName === farmCat) return true;
          
          // Partial match (e.g., "Apple Orchard" matches "Apple Orchards")
          if (curatedName.includes(farmCat) || farmCat.includes(curatedName)) return true;
          
          // Slug match
          if (curatedContent[curatedKey].slug === createSlug(farmCategory)) return true;
          
          // More precise word-based matching
          const curatedWords = curatedName.split(' ').filter(word => word.length > 2); // Ignore short words like "of", "the"
          const farmWords = farmCat.split(' ').filter(word => word.length > 2);
          
          // For word-based matching, require:
          // 1. At least 2 words to match
          // 2. The main subject word must match (first significant word)
          const commonWords = curatedWords.filter(word => 
            farmWords.some(farmWord => farmWord === word) // Exact word match only
          );
          
          // Check if the first significant word matches (main subject)
          const curatedMainWord = curatedWords[0];
          const farmMainWord = farmWords[0];
          const mainWordMatches = curatedMainWord === farmMainWord;
          
          // Require main word match AND at least 2 common words for word-based matching
          if (mainWordMatches && commonWords.length >= 2) {
            return true;
          }
          
          return false;
        });
        
        if (matchingCuratedKey) {
          if (!farmsByCategory[matchingCuratedKey]) {
            farmsByCategory[matchingCuratedKey] = [];
          }
          
          // Avoid duplicates
          if (!farmsByCategory[matchingCuratedKey].find(f => f.id === farm.id)) {
            farmsByCategory[matchingCuratedKey].push({
              id: farm.id,
              name: farm.name,
              slug: farm.slug,
              url: `/farms/${farm.slug}`,
              blurb: farm.description ? farm.description.substring(0, 120) + '...' : 'Farm description coming soon...',
              city: farm.city_name,
              province: farm.state_province,
              featured: farm.featured === 1 || farm.featured === true
            });
            
            // Debug logging
            console.log(`   🔗 Matched "${farmCategory}" → "${curatedContent[matchingCuratedKey].name}"`);
          }
        } else {
          // Debug: log unmatched categories
          console.log(`   ⚠️  No match found for farm category: "${farmCategory}"`);
        }
      });
    });
    
    // Create final categories array from curated content + dynamic farm data
    const finalCategories = [];
    
    Object.entries(curatedContent).forEach(([key, curatedCategory]) => {
      const categoryFarms = farmsByCategory[key] || [];
      
      // Sort farms: featured first, then by name
      categoryFarms.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.name.localeCompare(b.name);
      });
      
      const finalCategory = {
        slug: curatedCategory.slug,
        name: curatedCategory.name,
        totalFarms: categoryFarms.length,
        description: curatedCategory.description,
        intro: curatedCategory.intro,
        faqs: curatedCategory.faqs || [],
        topCities: [], // Could be populated from farm locations if needed
        featuredFarms: categoryFarms.slice(0, 3) // Show top 3 farms
      };
      
      finalCategories.push(finalCategory);
      
      console.log(`✅ ${curatedCategory.name}: ${categoryFarms.length} farms`);
    });
    
    // Sort by farm count (most popular first), but keep categories with 0 farms
    finalCategories.sort((a, b) => b.totalFarms - a.totalFarms);
    
    console.log(`📊 Generated ${finalCategories.length} categories (${finalCategories.filter(c => c.totalFarms > 0).length} with farms)`);
    
    // Write the final categories
    const categoriesPath = path.join(dataDir, 'categories.json');
    fs.writeFileSync(categoriesPath, JSON.stringify(finalCategories, null, 2));
    console.log(`💾 Saved categories to ${categoriesPath}`);
    
    // Create category params for static generation (only categories with farms)
    const categoriesWithFarms = finalCategories.filter(cat => cat.totalFarms > 0);
    const categoryParams = categoriesWithFarms.map(cat => ({ slug: cat.slug }));
    const paramsPath = path.join(dataDir, 'category-params.json');
    fs.writeFileSync(paramsPath, JSON.stringify(categoryParams, null, 2));
    console.log(`📋 Generated static params for ${categoryParams.length} categories with farms`);
    
    // Log summary
    console.log('\n📝 Category Summary:');
    finalCategories.forEach(cat => {
      const status = cat.totalFarms > 0 ? `${cat.totalFarms} farms` : 'no farms (page not generated)';
      console.log(`   ${cat.slug}: ${status}`);
    });
    
    console.log('\n🎉 Category generation complete!');
    console.log(`📊 Only manually curated categories are included. Add new categories to category-content.json to create new pages.`);
    
  } catch (error) {
    console.error('❌ Error generating categories:', error.message);
    process.exit(1);
  }
}

// Run the script
generateCategories();
