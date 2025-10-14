#!/usr/bin/env node

/**
 * Zoho CRM to D1 Batch Sync Script
 *
 * Manually syncs all farms with "LIVE" tag from Zoho CRM to Cloudflare D1 database.
 * Does NOT trigger website rebuilds - for data maintenance only.
 *
 * Usage: npm run sync-zoho
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

/**
 * Validate that all required environment variables are present
 * @throws {Error} If any required environment variables are missing
 */
function validateEnvironment() {
  const requiredVars = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN'];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        `Please ensure these are set in web/.env.local`
    );
  }
}

/**
 * Get Zoho OAuth access token using refresh token
 * Adapted from src/index.js zohoAccessToken function
 * @returns {Promise<string>} Access token
 */
async function zohoAccessToken() {
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;

  // Use the correct Zoho data center
  const dc = process.env.ZOHO_DC || 'com';
  const tokenUrl =
    dc === 'ca'
      ? 'https://accounts.zohocloud.ca/oauth/v2/token'
      : `https://accounts.zoho.${dc}/oauth/v2/token`;

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zoho token refresh failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Zoho token error: ${data.error} - ${data.error_description || ''}`);
  }

  return data.access_token;
}

/**
 * Fetch all farms with LIVE tag from Zoho CRM
 * Handles pagination to get all records
 * @param {string} accessToken - Zoho access token
 * @returns {Promise<Array>} Array of farm records
 */
async function fetchLiveFarms(accessToken) {
  const dc = process.env.ZOHO_DC || 'com';
  let allFarms = [];
  let page = 1;
  let hasMore = true;
  const perPage = 200; // Zoho max per page

  console.log('📋 Fetching LIVE farms from Zoho CRM...');

  while (hasMore) {
    const apiUrl = `https://www.zohoapis.${dc}/crm/v3/Accounts/search?criteria=(Tag:equals:LIVE)&page=${page}&per_page=${perPage}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zoho API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.data && Array.isArray(data.data)) {
      allFarms = allFarms.concat(data.data);
      console.log(
        `   Page ${page}: Found ${data.data.length} farms (total so far: ${allFarms.length})`
      );
    }

    // Check if there are more pages
    hasMore = data.info && data.info.more_records === true;
    page++;

    // Safety check to prevent infinite loops
    if (page > 100) {
      throw new Error('Exceeded maximum page limit (100 pages)');
    }
  }

  console.log(`✅ Total LIVE farms found: ${allFarms.length}`);
  console.log(`   Data Center: ${dc}`);
  console.log('');

  return allFarms;
}

/**
 * Helper function to convert arrays/objects to CSV strings
 * @param {*} v - Value to convert
 * @returns {string|null} CSV string or null
 */
function toCSV(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/**
 * Generate URL-friendly slug from farm name
 * @param {string} name - Farm name
 * @returns {string} Slugified name
 */
function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/**
 * Upsert farm record to D1 database via REST API
 * Adapted from src/index.js upsertFarm function
 * @param {Object} rec - Zoho farm record
 * @returns {Promise<string>} Action performed (inserted/updated)
 */
async function upsertFarmToD1(rec) {
  // Ensure ID has zcrm_ prefix
  const rawId = rec.id || rec.zoho_record_id || '';
  const d1Id = rawId.startsWith('zcrm_') ? rawId : `zcrm_${rawId}`;
  const name = rec.Account_Name || '';
  const slug = slugify(name);

  // Validate required fields
  if (!name || !slug) {
    throw new Error(`Missing required field: name`);
  }

  // Convert complex fields to strings
  const categories = toCSV(rec.Type_of_Farm);
  const type = toCSV(rec.Services_Type);
  const amenities = toCSV(rec.Amenities);
  const varieties = toCSV(rec.Varieties);

  // Convert payment methods to string if it's an array or object
  const paymentMethods = rec.Payment_Methods
    ? Array.isArray(rec.Payment_Methods)
      ? rec.Payment_Methods.join(', ')
      : String(rec.Payment_Methods)
    : null;

  // Convert dates to strings if they exist
  const openingDate = rec.Open_Date ? String(rec.Open_Date) : null;
  const closingDate = rec.Close_Day ? String(rec.Close_Day) : null;

  // Convert operating hours to strings
  const mondayHours = rec.Monday ? String(rec.Monday) : null;
  const tuesdayHours = rec.Tuesday ? String(rec.Tuesday) : null;
  const wednesdayHours = rec.Wednesday ? String(rec.Wednesday) : null;
  const thursdayHours = rec.Thursday ? String(rec.Thursday) : null;
  const fridayHours = rec.Friday ? String(rec.Friday) : null;
  const saturdayHours = rec.Saturday ? String(rec.Saturday) : null;
  const sundayHours = rec.Sunday ? String(rec.Sunday) : null;

  // Convert Pet_Friendly: "TRUE" = 1, "FALSE" = 0, null/undefined = null (3 states)
  const petFriendly = rec.Pet_Friendly === 'TRUE' ? 1 : rec.Pet_Friendly === 'FALSE' ? 0 : null;

  // Convert Featured and Verified: checkboxes (true = 1, false = 0)
  const featured = rec.Featured === true ? 1 : 0;
  const verified = rec.Verified === true ? 1 : 0;

  // Handle coordinates
  let lat = rec.latitude !== '' && rec.latitude != null ? Number(rec.latitude) : null;
  let lng = rec.longitude !== '' && rec.longitude != null ? Number(rec.longitude) : null;

  // Image fields (preserved from existing data if present)
  const logoUrl = rec.logo_url || null;
  const backgroundUrl = rec.background_url || null;
  const logoUpdatedAt = rec.logo_updated_at || null;
  const backgroundUpdatedAt = rec.background_updated_at || null;

  // First, check if farm exists and get its current slug using wrangler
  let existingSlug = null;
  try {
    const checkCmd = `wrangler d1 execute pickafarm-db --remote --json --command "SELECT slug FROM farms WHERE zoho_record_id = '${d1Id.replace(/'/g, "''")}';"`;
    const checkOutput = execSync(checkCmd, {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..', '..'),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const checkResult = JSON.parse(checkOutput);
    if (checkResult[0]?.results?.length > 0) {
      existingSlug = checkResult[0].results[0].slug;
    }
  } catch (error) {
    // If farm doesn't exist, that's fine - we'll use the new slug
  }

  // Use existing slug if record exists, otherwise use generated slug
  const finalSlug = existingSlug || slug;

  const sql = `
INSERT INTO farms (
  zoho_record_id, name, slug, website, phone, email, description,
  street, city, postal_code, state, country, latitude, longitude,
  facebook, instagram, categories, type, amenities, varieties,
  pet_friendly, price_range, zoho_last_sync, updated_at,
  payment_methods, opening_date, closing_date,
  monday_hours, tuesday_hours, wednesday_hours,
  thursday_hours, friday_hours, saturday_hours, sunday_hours,
  featured, verified,
  logo_url, background_url, logo_updated_at, background_updated_at
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
ON CONFLICT(zoho_record_id) DO UPDATE SET
  name=excluded.name, website=excluded.website,
  phone=excluded.phone, email=excluded.email, description=excluded.description,
  street=excluded.street, city=excluded.city, postal_code=excluded.postal_code,
  state=excluded.state, country=excluded.country, latitude=excluded.latitude,
  longitude=excluded.longitude, facebook=excluded.facebook, instagram=excluded.instagram,
  categories=excluded.categories, type=excluded.type, amenities=excluded.amenities,
  varieties=excluded.varieties, pet_friendly=excluded.pet_friendly, price_range=excluded.price_range,
  zoho_last_sync=excluded.zoho_last_sync, updated_at=excluded.updated_at,
  payment_methods=excluded.payment_methods, opening_date=excluded.opening_date, closing_date=excluded.closing_date,
  monday_hours=excluded.monday_hours, tuesday_hours=excluded.tuesday_hours, wednesday_hours=excluded.wednesday_hours,
  thursday_hours=excluded.thursday_hours, friday_hours=excluded.friday_hours, saturday_hours=excluded.saturday_hours, sunday_hours=excluded.sunday_hours,
  featured=excluded.featured, verified=excluded.verified,
  logo_url=excluded.logo_url, background_url=excluded.background_url,
  logo_updated_at=excluded.logo_updated_at, background_updated_at=excluded.background_updated_at;
`;

  // Helper to escape SQL string values
  const escapeSql = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val;
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  // Build VALUES clause with proper escaping
  const values = [
    escapeSql(d1Id),
    escapeSql(name),
    escapeSql(finalSlug),
    escapeSql(rec.Website),
    escapeSql(rec.Phone),
    escapeSql(rec.Email),
    escapeSql(rec.Description),
    escapeSql(rec.Billing_Street),
    escapeSql(rec.Billing_City),
    escapeSql(rec.Billing_Code),
    escapeSql(rec.Billing_State),
    escapeSql(rec.Billing_Country),
    lat || 'NULL',
    lng || 'NULL',
    escapeSql(rec.Facebook),
    escapeSql(rec.Instagram),
    escapeSql(categories),
    escapeSql(type),
    escapeSql(amenities),
    escapeSql(varieties),
    petFriendly === null ? 'NULL' : petFriendly,
    escapeSql(rec.Price_Range),
    escapeSql(new Date().toISOString()),
    escapeSql(new Date().toISOString()),
    escapeSql(paymentMethods),
    escapeSql(openingDate),
    escapeSql(closingDate),
    escapeSql(mondayHours),
    escapeSql(tuesdayHours),
    escapeSql(wednesdayHours),
    escapeSql(thursdayHours),
    escapeSql(fridayHours),
    escapeSql(saturdayHours),
    escapeSql(sundayHours),
    featured,
    verified,
    escapeSql(logoUrl),
    escapeSql(backgroundUrl),
    escapeSql(logoUpdatedAt),
    escapeSql(backgroundUpdatedAt),
  ].join(',');

  const finalSql = sql.replace(
    '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    `(${values})`
  );

  // Execute via wrangler d1 execute using a temp file to avoid command-line escaping issues
  const tempSqlFile = path.join(__dirname, '.temp-sync.sql');
  try {
    // Write SQL to temp file
    fs.writeFileSync(tempSqlFile, finalSql, 'utf-8');

    // Execute using file input
    const execCmd = `wrangler d1 execute pickafarm-db --remote --json --file="${tempSqlFile}"`;
    let output;
    try {
      output = execSync(execCmd, {
        encoding: 'utf-8',
        cwd: path.join(__dirname, '..', '..'),
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (execError) {
      // If execSync throws, it might still have output - try to extract JSON
      output = execError.stdout || execError.output?.join('') || '';
      if (!output) {
        throw new Error(`Wrangler command failed: ${execError.message}`);
      }
    }

    // Extract JSON from wrangler output (skip progress lines)
    // Progress lines start with special characters like ├ │ └
    const lines = output.split('\n');
    const jsonLines = lines.filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed && !trimmed.startsWith('├') && !trimmed.startsWith('│') && !trimmed.startsWith('└')
      );
    });
    const jsonOutput = jsonLines.join('\n');

    if (!jsonOutput.trim()) {
      throw new Error(`No JSON output from wrangler. Raw output: ${output}`);
    }

    const result = JSON.parse(jsonOutput);
    if (!result[0]?.success) {
      throw new Error(`D1 operation failed: ${JSON.stringify(result)}`);
    }

    return 'synced';
  } catch (error) {
    // Save SQL to debug file for inspection
    const debugFile = path.join(__dirname, '.failed-sync.sql');
    try {
      fs.writeFileSync(debugFile, finalSql, 'utf-8');
      throw new Error(
        `D1 execution failed: ${error.message}. SQL saved to ${debugFile} for inspection.`
      );
    } catch (saveError) {
      throw new Error(`D1 execution failed: ${error.message}`);
    }
  } finally {
    // Clean up temp file
    try {
      if (fs.existsSync(tempSqlFile)) {
        fs.unlinkSync(tempSqlFile);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Sleep utility for rate limiting
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const startTime = Date.now();

  console.log('🔄 Zoho CRM → D1 Batch Sync');
  console.log('━'.repeat(50));
  console.log('');

  // Check for test mode (--test or --test=N flag)
  const args = process.argv.slice(2);
  const testArg = args.find((arg) => arg.startsWith('--test'));
  let testMode = false;
  let testLimit = 5; // Default to 5 farms in test mode

  if (testArg) {
    testMode = true;
    if (testArg.includes('=')) {
      testLimit = parseInt(testArg.split('=')[1]) || 5;
    }
    console.log(`🧪 TEST MODE: Will process only ${testLimit} farm(s)`);
    console.log('');
  }

  // Validate environment variables
  validateEnvironment();
  console.log('✅ Environment variables validated');
  console.log('');

  // Get Zoho access token
  console.log('🔐 Authenticating with Zoho CRM...');
  const accessToken = await zohoAccessToken();
  console.log('✅ Authentication successful');
  console.log('');

  // Fetch all LIVE farms
  let farms = await fetchLiveFarms(accessToken);

  if (farms.length === 0) {
    console.log('⚠️  No LIVE farms found to sync');
    return;
  }

  // Limit farms in test mode
  if (testMode) {
    farms = farms.slice(0, testLimit);
    console.log(`🧪 Test mode: Limited to ${farms.length} farm(s)`);
    console.log('');
  }

  // Calculate batch info
  const BATCH_SIZE = 50;
  const RATE_LIMIT = 100; // requests per minute
  const DELAY_MS = (60 * 1000) / RATE_LIMIT; // ~600ms between requests
  const totalBatches = Math.ceil(farms.length / BATCH_SIZE);
  const estimatedMinutes = Math.ceil((farms.length * DELAY_MS) / 60000);

  console.log(
    '⏱️  Estimated time: ~' +
      estimatedMinutes +
      ' minute' +
      (estimatedMinutes > 1 ? 's' : '') +
      ' (respecting rate limits)'
  );
  console.log('');

  // Sync statistics
  let processedCount = 0;
  let syncedCount = 0;

  // Process farms in batches
  for (let i = 0; i < farms.length; i += BATCH_SIZE) {
    const batch = farms.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} farms)...`);

    for (const farm of batch) {
      const farmName = farm.Account_Name || 'Unknown Farm';

      try {
        await upsertFarmToD1(farm);
        processedCount++;
        syncedCount++;
        console.log(`   ✅ ${farmName}`);

        // Rate limiting delay
        await sleep(DELAY_MS);
      } catch (error) {
        // Fail-fast: stop on first error
        console.log('');
        console.error('━'.repeat(50));
        console.error('❌ SYNC FAILED');
        console.error('━'.repeat(50));
        console.error(`Farm: ${farmName} (${farm.id})`);
        console.error(`Error: ${error.message}`);
        console.error(
          `Progress: ${processedCount}/${farms.length} records completed before failure`
        );
        console.error('━'.repeat(50));
        process.exit(1);
      }
    }

    console.log(`✅ Batch ${batchNum}/${totalBatches} complete`);
    console.log('');
  }

  // Final summary
  const duration = Date.now() - startTime;
  const durationSeconds = Math.floor(duration / 1000);
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  console.log('');
  console.log('🎉 Sync Complete!');
  console.log('━'.repeat(50));
  console.log('📈 Summary:');
  console.log(`   Total Processed: ${processedCount}`);
  console.log(`   Successfully Synced: ${syncedCount}`);
  console.log(`   Failed: 0`);
  console.log(`   Duration: ${durationStr}`);
  console.log('━'.repeat(50));
  console.log('');
  console.log('✨ All farms synced successfully!');
  console.log('');
}

// Run the main function
main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
