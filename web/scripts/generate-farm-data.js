#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// Load API credentials from environment variables
const CLOUDFLARE_D1_TOKEN = process.env.CLOUDFLARE_D1_TOKEN;
const CLOUDFLARE_D1_URL = process.env.CLOUDFLARE_D1_URL;

// D1 Database functions using REST API
async function fetchFarmsFromD1() {
  if (!CLOUDFLARE_D1_URL || !CLOUDFLARE_D1_TOKEN) {
    console.warn('Cloudflare D1 credentials not provided. Falling back to API.');
    return null;
  }

  try {
    console.log('🔍 Querying D1 database using REST API...');
    
    const query = `
      SELECT
        f.zoho_record_id as id,
        f.name,
        f.slug,
        f.street,
        f.city as city_name,
        f.state as state_province,
        f.country,
        f.postal_code,
        f.latitude,
        f.longitude,
        f.phone,
        f.email,
        f.website,
        f.facebook,
        f.instagram,
        f.description,
        f.categories,
        f.type,
        f.amenities,
        f.varieties,
        f.pet_friendly,
        f.price_range,
        f.verified,
        f.featured,
        f.active,
        f.updated_at,
        f.payment_methods,
        f.opening_date,
        f.closing_date,
        f.monday_hours,
        f.tuesday_hours,
        f.wednesday_hours,
        f.thursday_hours,
        f.friday_hours,
        f.saturday_hours,
        f.sunday_hours,
        f.logo_url,
        f.background_url,
        f.logo_updated_at,
        f.background_updated_at,
        COALESCE(COUNT(sf.id), 0) as subscriber_count
      FROM farms f
      LEFT JOIN saved_farms sf ON f.zoho_record_id = sf.farm_id
      WHERE f.active = 1
      GROUP BY f.zoho_record_id
    `;

    const response = await fetch(CLOUDFLARE_D1_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_D1_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: query
      })
    });

    if (!response.ok) {
      throw new Error(`D1 API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle different response structures
    let farms = null;
    if (data.success && data.result) {
      if (Array.isArray(data.result) && data.result[0] && data.result[0].results) {
        // D1 returns: { result: [{ results: [...] }] }
        farms = data.result[0].results;
      } else if (data.result.results) {
        farms = data.result.results;
      } else if (Array.isArray(data.result)) {
        farms = data.result;
      } else {
        console.error('Unexpected D1 response structure:', data);
        throw new Error('Invalid D1 response format');
      }
      
      console.log(`✅ Fetched ${farms.length} farms from D1 database`);
      return farms;
    }
    
    throw new Error('Invalid D1 response format');
  } catch (error) {
    console.error('Failed to fetch farms from D1:', error.message);
    return null;
  }
}

// Fetch review aggregates from WordPress
async function fetchAllReviews() {
  try {
    const response = await fetch(
      'https://admin.pickafarm.com/wp-json/reviews/v1/all-listings',
      { headers: { 'User-Agent': 'PickAFarm-Build-Script' } }
    );

    if (!response.ok) {
      console.warn('⚠️  Bulk reviews endpoint not available, falling back to individual calls');
      return null;
    }

    const data = await response.json();
    // Convert array to map for O(1) lookups: { farmId: { reviews, rating } }
    const reviewsMap = {};
    data.forEach(item => {
      reviewsMap[item.listing_id] = {
        reviews: item.count || 0,
        rating: item.average_rating || null
      };
    });

    return reviewsMap;
  } catch (error) {
    console.warn('⚠️  Failed to fetch bulk reviews:', error.message);
    return null;
  }
}

async function fetchReviewsForFarm(farmId) {
  try {
    const response = await fetch(
      `https://admin.pickafarm.com/wp-json/reviews/v1/listing/${farmId}`,
      { headers: { 'User-Agent': 'PickAFarm-Build-Script' } }
    );

    if (!response.ok) {
      return { reviews: 0, rating: null };
    }

    const data = await response.json();
    return {
      reviews: data.count || 0,
      rating: data.average_rating || null
    };
  } catch (error) {
    console.error(`Failed to fetch reviews for ${farmId}:`, error.message);
    return { reviews: 0, rating: null };
  }
}

async function generateFarmData() {
  console.log('🌾 Fetching farm data for build...');
  
  try {
    // Try to fetch from D1 first, fallback to API
    let farms = await fetchFarmsFromD1();
    
    if (!farms) {
      console.log('📡 Falling back to API...');
      // Fetch farm data from API with all fields
      const response = await fetch('https://pickafarm-api.94623956quebecinc.workers.dev/api/farms?include_all_fields=true');
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 API Response:', { 
        type: typeof data, 
        hasFarmsProperty: 'farms' in data,
        farmsLength: data.farms?.length,
        sampleFields: data.farms?.[0] ? Object.keys(data.farms[0]) : 'no farms'
      });
      
      // Extract farms array from response object
      farms = data.farms;
    }
    
    // Check if farms is actually an array
    if (!Array.isArray(farms)) {
    }
    
    console.log(`✅ Fetched ${farms.length} farms`);
    console.log(`📋 Sample farm fields:`, farms[0] ? Object.keys(farms[0]).join(', ') : 'No farms available');

    // Fetch review data from WordPress
    console.log('📊 Fetching review data from WordPress...');

    // Try bulk endpoint first
    let reviewsMap = await fetchAllReviews();

    const farmsWithReviews = [];

    if (reviewsMap) {
      // Use bulk data (fast path - single API call)
      console.log('✅ Using bulk reviews data');
      for (const farm of farms) {
        const reviewData = reviewsMap[farm.id] || { reviews: 0, rating: null };
        farmsWithReviews.push({
          ...farm,
          reviews: reviewData.reviews,
          rating: reviewData.rating
        });
      }
    } else {
      // Fallback to parallel fetches with batching (faster than sequential)
      console.log('⚠️  Bulk endpoint not available, using parallel fetches...');
      const BATCH_SIZE = 20; // Fetch 20 farms at a time

      for (let i = 0; i < farms.length; i += BATCH_SIZE) {
        const batch = farms.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async farm => {
            const reviewData = await fetchReviewsForFarm(farm.id);
            return {
              ...farm,
              reviews: reviewData.reviews,
              rating: reviewData.rating
            };
          })
        );

        farmsWithReviews.push(...batchResults);

        // Log progress
        console.log(`  Processed ${Math.min(i + BATCH_SIZE, farms.length)}/${farms.length} farms...`);
      }
    }

    farms = farmsWithReviews;
    console.log(`✅ Fetched review data for ${farms.length} farms`);
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write farms data to JSON file
    const farmsFilePath = path.join(dataDir, 'farms.json');
    fs.writeFileSync(farmsFilePath, JSON.stringify(farms, null, 2));
    console.log(`💾 Saved farm data to ${farmsFilePath}`);
    
    // Generate farm IDs for static params using slugs
    const farmIds = farms.map(farm => ({ id: farm.slug || farm.id.toString() }));
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
