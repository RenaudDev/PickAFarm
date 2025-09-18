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

function createBoilerplateCategory(categoryName) {
  return {
    name: categoryName,
    slug: createSlug(categoryName),
    intro: `Discover local ${categoryName.toLowerCase()} offering fresh produce, seasonal activities, and authentic farm experiences. Support local agriculture while creating lasting memories with your family.`,
    description: `Find the best ${categoryName.toLowerCase()} near you for seasonal picking and farm activities.`,
    faqs: [
      {
        question: `When is the best time to visit ${categoryName.toLowerCase()}?`,
        answer: `Seasonal timing varies by location and weather. We recommend calling ahead to confirm availability and peak seasons for the best experience.`
      },
      {
        question: `What should I bring when visiting farms?`,
        answer: `Wear comfortable, closed-toe shoes and clothes you don't mind getting dirty. Bring sunscreen, water, and any containers the farm recommends for your harvest.`
      },
      {
        question: `Are there activities for children?`,
        answer: `Many farms offer family-friendly activities. Check with individual farms about specific amenities like playgrounds, petting zoos, or educational tours.`
      }
    ]
  };
}

async function generateCategories() {
  console.log('🏷️  Generating rich categories data for build...');
  
  const dataDir = path.join(__dirname, '..', 'data');
  const farmsFilePath = path.join(dataDir, 'farms.json');
  const contentFilePath = path.join(dataDir, 'category-content.json');

  try {
    // Check if required files exist
    if (!fs.existsSync(farmsFilePath)) {
      throw new Error(`farms.json not found at ${farmsFilePath}. Run generate-farm-data.js first.`);
    }

    if (!fs.existsSync(contentFilePath)) {
      throw new Error(`category-content.json not found at ${contentFilePath}. Please create this file with category content.`);
    }

    // Load farm data
    const farmsData = JSON.parse(fs.readFileSync(farmsFilePath, 'utf8'));
    const farms = Array.isArray(farmsData) ? farmsData : farmsData.farms;

    if (!Array.isArray(farms)) {
      throw new Error('Farm data is not in the expected array format.');
    }

    // Load category content
    let categoryContent = JSON.parse(fs.readFileSync(contentFilePath, 'utf8'));
    console.log(`✅ Loaded content for ${Object.keys(categoryContent).length} categories`);

    console.log(`✅ Processing ${farms.length} farms to build categories...`);

    const categoriesMap = new Map();
    const discoveredCategories = new Set();

    // Group farms by category and track all discovered categories
    farms.forEach(farm => {
      const farmCategories = new Set();
      if (farm.categories) {
        try {
          JSON.parse(farm.categories).forEach(cat => {
            const cleanCat = cat.trim();
            farmCategories.add(cleanCat);
            discoveredCategories.add(cleanCat);
          });
        } catch {
          farm.categories.split(',').forEach(cat => {
            const cleanCat = cat.trim();
            farmCategories.add(cleanCat);
            discoveredCategories.add(cleanCat);
          });
        }
      }
      if (farm.type) {
        const cleanType = farm.type.trim();
        farmCategories.add(cleanType);
        discoveredCategories.add(cleanType);
      }

      farmCategories.forEach(categoryName => {
        if (!categoryName) return;
        if (!categoriesMap.has(categoryName)) {
          categoriesMap.set(categoryName, []);
        }
        categoriesMap.get(categoryName).push(farm);
      });
    });

    // Check for new categories and add boilerplate entries
    let contentUpdated = false;
    const newCategories = [];
    
    discoveredCategories.forEach(categoryName => {
      if (!categoryContent[categoryName]) {
        console.log(`🆕 Found new category: "${categoryName}" - adding boilerplate content`);
        categoryContent[categoryName] = createBoilerplateCategory(categoryName);
        newCategories.push(categoryName);
        contentUpdated = true;
      }
    });

    // Save updated content file if new categories were added
    if (contentUpdated) {
      fs.writeFileSync(contentFilePath, JSON.stringify(categoryContent, null, 2));
      console.log(`📝 Updated category-content.json with ${newCategories.length} new categories: ${newCategories.join(', ')}`);
    }

    const finalCategories = [];

    for (const [categoryName, categoryFarms] of categoriesMap.entries()) {
      // 1. Get content data for this category
      const content = categoryContent[categoryName] || categoryContent['_default'];
      
      if (!content) {
        console.warn(`⚠️  No content found for category "${categoryName}", skipping...`);
        continue;
      }

      // 2. Calculate Top Cities
      const cityCounts = categoryFarms.reduce((acc, farm) => {
        if (farm.city && farm.region_code && farm.country_code) {
            const cityKey = `${farm.city}, ${farm.region_code}`;
            acc[cityKey] = (acc[cityKey] || 0) + 1;
        }
        return acc;
      }, {});

      const topCities = Object.entries(cityCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([cityKey, farmCount]) => {
            const [city, region] = cityKey.split(', ');
            const farmInCity = categoryFarms.find(f => f.city === city && f.region_code === region);
            return {
                name: city,
                regionCode: region,
                countryCode: farmInCity.country_code,
                slug: createSlug(`${city} ${region} ${farmInCity.country_code}`),
                farmCount
            };
        });

      // 3. Select Featured Farms (up to 3)
      const featuredFarms = categoryFarms
        .filter(f => f.is_featured === 1 || f.is_featured === true) // Prioritize featured flag
        .slice(0, 3)
        .map(farm => ({
          id: farm.id,
          name: farm.name,
          city: farm.city,
          region: farm.region,
          url: `/farm/${farm.slug}`,
          blurb: farm.description_short || farm.description?.substring(0, 150) + '...',
        }));
      
      // If not enough featured, fill with non-featured
      if (featuredFarms.length < 3) {
        const nonFeatured = categoryFarms
            .filter(f => !f.is_featured)
            .slice(0, 3 - featuredFarms.length)
            .map(farm => ({
                id: farm.id,
                name: farm.name,
                city: farm.city,
                region: farm.region,
                url: `/farm/${farm.slug}`,
                blurb: farm.description_short || farm.description?.substring(0, 150) + '...',
            }));
        featuredFarms.push(...nonFeatured);
      }

      // 4. Assemble final category object using content from JSON file
      finalCategories.push({
        slug: content.slug || createSlug(categoryName),
        name: content.name || categoryName,
        totalFarms: categoryFarms.length,
        description: content.description,
        intro: content.intro,
        faqs: content.faqs || [],
        topCities,
        featuredFarms,
      });
    }

    console.log(`✅ Generated rich data for ${finalCategories.length} categories.`);

    // Write the rich data to categories.json
    fs.writeFileSync(path.join(dataDir, 'categories.json'), JSON.stringify(finalCategories, null, 2));
    console.log(`💾 Saved rich category data to data/categories.json`);

    // Also generate the simple params file for generateStaticParams
    const categoryParams = finalCategories.map(category => ({ slug: category.slug }));
    fs.writeFileSync(path.join(dataDir, 'category-params.json'), JSON.stringify(categoryParams, null, 2));
    console.log(`📋 Generated static params for ${categoryParams.length} categories.`);

    console.log('🎉 Categories generation complete!');
    console.log('Categories generated:', finalCategories.map(c => `${c.name} (${c.totalFarms} farms)`).join(', '));

    if (newCategories.length > 0) {
      console.log(`\n📝 NOTE: ${newCategories.length} new categories were added to category-content.json with boilerplate content.`);
      console.log(`You may want to review and customize the content for: ${newCategories.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error generating categories:', error.message);
    // Create a minimal fallback to prevent build failure
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'categories.json'), '[]');
    fs.writeFileSync(path.join(dataDir, 'category-params.json'), '[]');
    console.log('🔄 Created empty fallback files to prevent build failure.');
    process.exit(1); // Exit with error to signal a problem
  }
}

// Run the script
generateCategories();
