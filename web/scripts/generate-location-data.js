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

// Haversine distance in kilometers between two lat/lng points
function haversineDistance(lat1, lon1, lat2, lon2) {
  function toRad(x) { return (x * Math.PI) / 180; }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function generateLocationData() {
  console.log('🗺️  Building filtered location data (75km radius)...');
  
  try {
    const dataDir = path.join(__dirname, '..', 'data');

    // Prefer the flat locations.json if present, otherwise build from cities.json
    const flatLocationsPath = path.join(dataDir, 'locations.json');
    const citiesPath = path.join(dataDir, 'cities.json');

    let baseLocations = [];

    if (fs.existsSync(flatLocationsPath)) {
      const raw = JSON.parse(fs.readFileSync(flatLocationsPath, 'utf8'));
      // Support either array or { locationPages: [] }
      if (Array.isArray(raw)) {
        baseLocations = raw;
        console.log(`📍 Loaded ${baseLocations.length} locations from locations.json`);
      } else if (raw && Array.isArray(raw.locationPages)) {
        baseLocations = raw.locationPages;
        console.log(`📍 Loaded ${baseLocations.length} locations from locations.json (locationPages)`);
      } else if (raw && raw.metadata && raw.locationPages) {
        baseLocations = raw.locationPages;
        console.log(`📍 Loaded ${baseLocations.length} locations from locations.json (metadata + locationPages)`);
      } else {
        throw new Error('Unsupported locations.json format. Expect an array or an object with locationPages array.');
      }
    } else if (fs.existsSync(citiesPath)) {
      // Backwards compatibility: transform cities.json -> locations
      const citiesData = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
      console.log(`📍 Loaded ${citiesData.metadata.totalCities} cities from ${citiesData.metadata.totalProvinces} provinces`);
      for (const [, provinceData] of Object.entries(citiesData.provinces)) {
        for (const city of provinceData.cities) {
          baseLocations.push({
            ...city,
            province: provinceData.name,
            province_slug: provinceData.slug,
            country: 'Canada',
            country_slug: 'canada',
            location_slug: `${city.slug}-${provinceData.slug}-canada`,
            full_location: `${city.name}, ${provinceData.name}, Canada`,
            seo_title: `Pick Your Own Farms near ${city.name}, ${provinceData.name}`,
            meta_description: `Find the best pick-your-own farms near ${city.name}, ${provinceData.name}. Fresh apples, berries, pumpkins and Christmas trees.`
          });
        }
      }
      console.log(`🔁 Transformed to ${baseLocations.length} flat locations`);
    } else {
      throw new Error('Neither locations.json nor cities.json found in data directory.');
    }

    // Load farms data
    const farmsPath = path.join(dataDir, 'farms.json');
    if (!fs.existsSync(farmsPath)) {
      throw new Error('farms.json not found. Run generate-farm-data.js first.');
    }
    const farms = JSON.parse(fs.readFileSync(farmsPath, 'utf8'));
    console.log(`🌾 Loaded ${farms.length} farms`);

    const RADIUS_KM = 75; // configurable

    // For each location, collect farms within 75km
    const locationsWithFarms = baseLocations.map(loc => {
      const cityLat = loc.coordinates?.latitude ?? loc.latitude;
      const cityLon = loc.coordinates?.longitude ?? loc.longitude;

      if (typeof cityLat !== 'number' || typeof cityLon !== 'number') {
        return { ...loc, farms: [], farmCount: 0 };
      }

      const nearby = farms
        .filter(f => typeof f.latitude === 'number' && typeof f.longitude === 'number' && (f.active === 1 || f.active === true))
        .map(f => {
          const distanceKm = haversineDistance(cityLat, cityLon, f.latitude, f.longitude);
          return { farm: f, distanceKm };
        })
        .filter(({ distanceKm }) => distanceKm <= RADIUS_KM)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .map(({ farm, distanceKm }) => ({
          id: farm.id,
          name: farm.name,
          slug: farm.slug,
          url: `/farms/${farm.slug}`,
          latitude: farm.latitude,
          longitude: farm.longitude,
          city: farm.city_name,
          province: farm.state_province,
          country: farm.country,
          categories: farm.categories,
          featured: farm.featured === 1 || farm.featured === true,
          distance_km: Math.round(distanceKm)
        }));

      return {
        ...loc,
        farms: nearby,
        farmCount: nearby.length
      };
    });

    // Filter out cities with no nearby farms
    const filtered = locationsWithFarms.filter(l => (l.farmCount || 0) > 0);

    // Sort by number of farms desc, then name
    filtered.sort((a, b) => (b.farmCount - a.farmCount) || (a.name || '').localeCompare(b.name || ''));

    // Write outputs
    const filteredLocationsPath = path.join(dataDir, 'locations-with-farms.json');
    fs.writeFileSync(filteredLocationsPath, JSON.stringify(filtered, null, 2));
    console.log(`💾 Saved filtered locations with nearby farms to ${filteredLocationsPath}`);

    // Params for Next.js generateStaticParams (city/near pages)
    const params = filtered.map(l => ({ location: l.location_slug || generateSlug(`${l.name}-${l.province}-canada`) }));
    const paramsPath = path.join(dataDir, 'location-params-filtered.json');
    fs.writeFileSync(paramsPath, JSON.stringify(params, null, 2));
    console.log(`📋 Generated static params for ${params.length} filtered location pages`);

    // Summary logs
    console.log('\n📝 Location Filtering Summary:');
    console.log(`   Total base locations: ${baseLocations.length}`);
    console.log(`   Locations with farms (<= ${RADIUS_KM}km): ${filtered.length}`);

    // Show examples
    filtered.slice(0, 5).forEach(l => {
      console.log(`   • ${l.full_location || `${l.name}, ${l.province}, ${l.country}`} → ${l.farmCount} farms`);
    });

    console.log('\n🎉 Location data build complete!');

  } catch (error) {
    console.error('❌ Error generating location data:', error.message);
    process.exit(1);
  }
}

// Run the script
generateLocationData();
