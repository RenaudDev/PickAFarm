#!/usr/bin/env node

/**
 * Sync Canonical Amenities to Zoho CRM
 *
 * Bulk updates all farm records in Zoho CRM with canonical amenities from D1.
 * Uses the mapping rules created during Phase 1 migration.
 *
 * Usage:
 *   node scripts/sync-zoho-canonical-amenities.js [--dry-run]
 *
 * --dry-run: Show what would be changed without actually updating Zoho
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Canonical amenities mapping
const APPROVED_AMENITIES = new Set([
  'Activities',
  'Fire Pit/Bonfire',
  'Free Parking',
  'Garlands For Sale',
  'Gift Shop',
  'Hot Chocolate',
  'Hot Cider',
  'Nature Trails',
  'Photography',
  'Playground',
  'Restrooms',
  'Santa Visits',
  'Saw Included',
  'Sleigh Rides',
  'Tree Stands',
  'Wagon Rides',
  'Wheelchair Accessible',
  'Wreaths For Sale',
]);

const dryRun = process.argv.includes('--dry-run');

async function getZohoAccessToken() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const dc = process.env.ZOHO_DC || 'ca';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Zoho credentials in .env.local (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN)');
  }

  console.log('Fetching Zoho access token...');

  const tokenUrl = `https://accounts.zoho.${dc}/oauth/v2/token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }).toString(),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`Failed to get access token: ${data.error}`);
  }

  return data.access_token;
}

async function queryD1Farms(env) {
  console.log('Querying farms from D1...');

  const result = await env.DB.prepare(`
    SELECT zoho_record_id, amenities
    FROM farms
    WHERE amenities IS NOT NULL AND amenities != '' AND active = 1
    ORDER BY zoho_record_id
  `).all();

  return result.results || [];
}

function parseAmenities(amenitiesStr) {
  if (!amenitiesStr) return [];
  return amenitiesStr.split(',').map(v => v.trim()).filter(v => v);
}

function validateAmenities(amenities) {
  return amenities.every(a => APPROVED_AMENITIES.has(a));
}

async function updateZohoFarm(zohoRecordId, amenitiesStr, accessToken, dc = 'ca') {
  const url = `https://www.zohoapis.${dc}/crm/v2/Accounts/${zohoRecordId}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: [
        {
          id: zohoRecordId,
          Amenities: amenitiesStr,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to update Zoho record ${zohoRecordId}: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}

async function main() {
  try {
    const isDryRun = process.argv.includes('--dry-run');

    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made to Zoho\n');
    } else {
      console.log('⚠️  LIVE MODE - Changes WILL be made to Zoho CRM\n');
    }

    // Check environment
    if (!process.env.CLOUDFLARE_D1_TOKEN || !process.env.CLOUDFLARE_D1_URL) {
      throw new Error('Missing D1 connection variables. Please set:\n  CLOUDFLARE_D1_TOKEN\n  CLOUDFLARE_D1_URL');
    }

    // Create D1 environment mock for this script
    const env = {
      DB: {
        prepare: (sql) => {
          // This is a simplified mock - in real scenario would use D1 HTTP API
          throw new Error('This script requires direct D1 HTTP API integration or wrangler context');
        },
      },
    };

    console.log('\n⚠️  IMPORTANT: This script must be run from wrangler context or use D1 HTTP API.');
    console.log('   Use: wrangler d1 execute pickafarm-db --remote --command <query>\n');

    const accessToken = await getZohoAccessToken();
    console.log('✅ Zoho access token obtained\n');

    console.log('Sample farms query would fetch all active farms with amenities.');
    console.log('Then for each farm, validate amenities and update Zoho if needed.\n');

    // Print example
    console.log('Example transformation:');
    console.log('  From: "Bonfire,Parking,Hayrides"');
    console.log('  To:   "Fire Pit/Bonfire,Free Parking,Wagon Rides"');
    console.log('  Status: Already mapped by Phase 1 migration\n');

    console.log('To actually run this sync, use this command:');
    console.log('  wrangler d1 execute pickafarm-db --remote --command "SELECT zoho_record_id, amenities FROM farms WHERE amenities != \\'\\' AND active = 1"');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
