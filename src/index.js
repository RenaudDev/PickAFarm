/* ============================
   PICKAFARM API - CLOUDFLARE WORKER
   ============================

   Cloudflare Worker serving as the backend API for PickAFarm.
   Handles farm data management, user authentication, Zoho CRM webhooks,
   and email notifications.

   Key Features:
   - Zoho CRM integration (OAuth 2.0 authentication)
   - Clerk authentication for users
   - Farm subscription and notification management
   - Image processing and R2 storage for farm branding
   - Cloudflare D1 database operations
   - Resend email service integration
   - Structured logging and monitoring
*/

/* === MONITORING & LOGGING UTILITIES === */
import { createLogger, logEvent, LogLevel } from './utils/logger.js';
import { sendCliqAlert, Severity } from './utils/cliq.js';
import { logAuditEvent, AuditAction, ResourceType } from './utils/audit.js';
import { trackMetric, MetricName } from './utils/metrics.js';

/* === MAGIC LINK AUTHENTICATION (Story 2.2) === */
import {
  handleAdminMagicLink,
  handleValidateToken,
  handleClerkWebhook
} from './handlers/magic-link.js';

/* === CLERK JWT AUTHENTICATION (Story 2.3) === */
import {
  verifyJWTSignature,
  authenticateUser,
  authenticateFarmer,
  InvalidTokenError,
  UserNotFoundError,
  NotAFarmerError,
  DatabaseError
} from './lib/clerk-auth.js';

/* === ZOHO CRM INTEGRATION === */

/**
 * Obtains a fresh Zoho OAuth access token using a refresh token.
 *
 * The access token is short-lived and must be refreshed for each API request.
 * Supports multi-region Zoho data centers (com, ca, eu, etc).
 *
 * @param {Object} env - Cloudflare Worker environment bindings
 * @param {string} env.ZOHO_REFRESH_TOKEN - Long-lived refresh token from Zoho OAuth
 * @param {string} env.ZOHO_CLIENT_ID - OAuth client ID
 * @param {string} env.ZOHO_CLIENT_SECRET - OAuth client secret
 * @param {string} env.ZOHO_DC - Data center ('ca' for Canada, 'com' for US, etc.)
 * @returns {Promise<string>} Fresh access token valid for ~1 hour
 * @throws {Error} If credentials are missing or token refresh fails
 */
async function zohoAccessToken(env) {
  const refreshToken = env.ZOHO_REFRESH_TOKEN;
  const clientId = env.ZOHO_CLIENT_ID;
  const clientSecret = env.ZOHO_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("Missing Zoho credentials: ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, or ZOHO_CLIENT_SECRET");
  }

  // Construct region-specific OAuth endpoint
  // Canada (.ca) requires special subdomain: zohocloud.ca
  const dc = env.ZOHO_DC || 'com';
  const tokenUrl = dc === 'ca' ? 'https://accounts.zohocloud.ca/oauth/v2/token' : `https://accounts.zoho.${dc}/oauth/v2/token`;
  
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token"
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
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
 * Fetches attachments (files) associated with a Zoho CRM Account record.
 *
 * Used to retrieve farm images (logos, cover photos) uploaded to Zoho.
 * Attachments API is separate from the main Accounts API.
 *
 * @param {Object} env - Cloudflare Worker environment bindings
 * @param {string} accessToken - Valid Zoho OAuth access token
 * @param {string} accountId - Numeric Zoho Account ID (without 'zcrm_' prefix)
 * @returns {Promise<Array>} Array of attachment objects with file metadata
 */
async function zohoFetchAttachments(env, accessToken, accountId) {
  const dc = env.ZOHO_DC || 'com';
  const apiUrl = `https://www.zohoapis.${dc}/crm/v3/Accounts/${encodeURIComponent(accountId)}/Attachments`;

  console.log(`📎 Fetching attachments for account ${accountId}`);

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Authorization": `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`Attachments API warning: ${response.status} - ${errorText}`);
    return []; // Non-critical: farm can exist without attachments
  }

  const data = await response.json();

  if (data.data && Array.isArray(data.data)) {
    console.log(`📎 Found ${data.data.length} attachments`);
    return data.data;
  }

  return [];
}

/**
 * Fetches a complete Account record from Zoho CRM with all farm data fields.
 *
 * This is the main function to retrieve farm information from Zoho.
 * Uses v3 API endpoint with explicit field selection for optimal performance.
 *
 * @param {Object} env - Cloudflare Worker environment bindings
 * @param {string} accessToken - Valid Zoho OAuth access token
 * @param {string} accountId - Numeric Zoho Account ID (without 'zcrm_' prefix)
 * @returns {Promise<Object>} Complete farm record with all fields
 * @throws {Error} If account not found or API request fails
 */
async function zohoFetchAccount(env, accessToken, accountId) {
  if (!accessToken) {
    throw new Error("Access token is required");
  }

  if (!accountId) {
    throw new Error("Account ID is required");
  }

  const dc = env.ZOHO_DC || 'com';

  // Explicit field selection for all farm data points
  // Note: Field names are case-sensitive in Zoho API
  const fields = [
    "Account_Name","Website","Phone","Email",
    "Billing_Street","Billing_City","Billing_State","Billing_Code","Billing_Country",
    "Description","Google_My_Business","Facebook","Instagram","PlaceID",
    "Type_of_Farm","Amenities","Varieties","Payment_Methods","Services_Type",
    "Pet_Friendly","Year_Established","Open_Date","Close_Day",
    "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
    "latitude","longitude","Price_Range","Slug","Featured","Verified",
    "Logo1","Cover"  // File Upload fields for farm branding images
  ];

  // Construct API URL with all required fields to minimize API calls
  const apiUrl = `https://www.zohoapis.${dc}/crm/v3/Accounts/${encodeURIComponent(accountId)}?fields=${fields.join(",")}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Authorization": `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zoho API request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data.code === "INVALID_TOKEN") {
    throw new Error("Invalid or expired access token");
  }

  if (data.code && data.code !== "SUCCESS") {
    throw new Error(`Zoho API error: ${data.code} - ${data.message || ''}`);
  }

  // Zoho API returns data as an array (even for single record requests)
  if (data.data && Array.isArray(data.data) && data.data.length > 0) {
    const record = data.data[0];

    // Debug logging for development/troubleshooting
    console.log(`🔍 Full record for ${record.Account_Name}:`);
    console.log(JSON.stringify(record, null, 2));

    // Log image field structure for debugging file upload handling
    if (record.Logo !== undefined || record.Cover_Image !== undefined) {
      console.log(`📸 Image fields for ${record.Account_Name}:`);
      console.log(`  Logo type: ${typeof record.Logo}, value: ${JSON.stringify(record.Logo)}`);
      console.log(`  Cover_Image type: ${typeof record.Cover_Image}, value: ${JSON.stringify(record.Cover_Image)}`);
    }

    return record;
  }

  throw new Error("No account data found in response");
}

/* === UTILITY FUNCTIONS === */

/**
 * Converts various Zoho field types to CSV string format.
 *
 * Zoho multi-select and picklist fields return as arrays or objects.
 * This normalizes them to comma-separated strings for D1 storage.
 *
 * @param {*} v - Value from Zoho (array, object, string, etc.)
 * @returns {string|null} CSV string or null
 */
function toCSV(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/**
 * Generates URL-friendly slug from farm name.
 *
 * Used for creating human-readable URLs: /farms/{slug}/
 *
 * @param {string} name - Farm name
 * @returns {string} URL-safe slug (max 120 characters)
 */
function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "")       // Remove leading/trailing hyphens
    .slice(0, 120);                // Limit length for URL compatibility
}

/* === DATABASE OPERATIONS === */

// ===== AMENITIES WHITELIST =====
// Only these 18 canonical amenities are allowed from Zoho CRM.
// Any other values will be rejected to prevent data contamination.
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

/**
 * Auto-discover and populate field options from farm data.
 *
 * Extracts unique values from multi-select fields and stores them in
 * the farm_field_options table. Called after each farm upsert to ensure
 * new values from Zoho become available as form options immediately.
 *
 * WHITELIST FILTER: Amenities are filtered against APPROVED_AMENITIES to
 * prevent garbage data from being discovered. Only approved values are inserted.
 *
 * @param {Object} env - Cloudflare Worker environment bindings
 * @param {Object} record - Farm record data from Zoho
 * @param {string} farmId - Farm ID (zoho_record_id)
 */
async function discoverFieldOptions(env, record, farmId) {
  // Multi-select fields to extract options from
  const multiSelectFields = {
    'categories': record.Type_of_Farm,
    'amenities': record.Amenities,
    'varieties': record.Varieties,
    'payment_methods': record.Payment_Methods,
  };

  try {
    for (const [fieldName, fieldValue] of Object.entries(multiSelectFields)) {
      if (!fieldValue) continue;

      // Parse CSV or array format
      const values = Array.isArray(fieldValue)
        ? fieldValue
        : String(fieldValue).split(',').map(v => v.trim());

      for (const value of values) {
        if (!value) continue;

        // WHITELIST FILTER: Reject amenities that aren't approved
        if (fieldName === 'amenities' && !APPROVED_AMENITIES.has(value)) {
          console.warn(`[AMENITIES WHITELIST] Rejected "${value}" for farm ${farmId} - not in approved list`);
          continue;
        }

        try {
          // Insert option if not exists
          await env.DB.prepare(`
            INSERT OR IGNORE INTO farm_field_options
            (field_name, option_value, option_label, sort_order)
            VALUES (?, ?, ?, ?)
          `).bind(fieldName, value, value, 0).run();

          // Track usage
          await env.DB.prepare(`
            INSERT OR REPLACE INTO farm_field_option_usage
            (farm_id, field_name, option_value, last_used)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(farmId, fieldName, value).run();
        } catch (err) {
          console.warn(`Failed to discover option ${fieldName}=${value}:`, err);
        }
      }
    }
  } catch (error) {
    console.error('Field option discovery error:', error);
    // Non-critical: don't fail the sync if auto-discovery fails
  }
}

/**
 * Inserts or updates a farm record in D1 database.
 *
 * This is the main function for syncing Zoho data to D1. Handles all field
 * transformations including:
 * - Boolean conversions (Pet_Friendly: "TRUE"/"FALSE" -> 1/0)
 * - CSV field normalization (Type_of_Farm array -> comma-separated string)
 * - Date field conversions
 * - Geocoding fallback for missing coordinates
 *
 * IMPORTANT: Image URLs (logo_url, background_url) are set separately by
 * the image processor after downloading from Zoho.
 *
 * @param {Object} env - Cloudflare Worker environment (includes DB binding)
 * @param {Object} rec - Farm record from Zoho with 'id' prefixed with 'zcrm_'
 * @returns {Promise<void>}
 */
async function upsertFarm(env, rec) {
  const d1Id = rec.id; // Primary key: zcrm_<zoho_account_id>
  const name = rec.Account_Name || "";
  let slug = slugify(name);

  // Handle slug collisions: check if slug already exists and append number if needed
  try {
    let slugExists = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM farms WHERE slug = ?"
    ).bind(slug).first();

    let counter = 1;
    let originalSlug = slug;

    while (slugExists && slugExists.count > 0) {
      slug = `${originalSlug}-${counter}`;
      counter++;

      if (counter > 100) {
        // Fallback: use zoho ID to make it truly unique
        slug = `${originalSlug}-${d1Id.substring(0, 8)}`;
        break;
      }

      slugExists = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM farms WHERE slug = ?"
      ).bind(slug).first();
    }

    if (slug !== originalSlug) {
      console.log(`⚠️ Slug collision detected for "${name}". Using: ${slug}`);
    }
  } catch (slugCheckError) {
    console.warn(`Could not check for slug collision: ${slugCheckError.message}. Using original slug.`);
  }

  // Transform Zoho multi-select fields to CSV strings for D1 TEXT columns
  const categories = toCSV(rec.Type_of_Farm);      // e.g., ["Christmas Trees", "Pumpkins"] -> "Christmas Trees, Pumpkins"
  const type = toCSV(rec.Services_Type);            // Operational type: U-Pick, Pre-Cut, etc.
  const amenities = toCSV(rec.Amenities);           // Farm facilities
  const varieties = toCSV(rec.Varieties);           // Crop varieties offered

  // Payment methods field handling (can be array or string)
  const paymentMethods = rec.Payment_Methods ?
    (Array.isArray(rec.Payment_Methods) ? rec.Payment_Methods.join(', ') : String(rec.Payment_Methods)) : null;

  // Season dates (format: YYYY-MM-DD from Zoho)
  const openingDate = rec.Open_Date ? String(rec.Open_Date) : null;
  const closingDate = rec.Close_Day ? String(rec.Close_Day) : null;

  // Operating hours (free-text format from Zoho, e.g., "9am - 5pm")
  const mondayHours = rec.Monday ? String(rec.Monday) : null;
  const tuesdayHours = rec.Tuesday ? String(rec.Tuesday) : null;
  const wednesdayHours = rec.Wednesday ? String(rec.Wednesday) : null;
  const thursdayHours = rec.Thursday ? String(rec.Thursday) : null;
  const fridayHours = rec.Friday ? String(rec.Friday) : null;
  const saturdayHours = rec.Saturday ? String(rec.Saturday) : null;
  const sundayHours = rec.Sunday ? String(rec.Sunday) : null;

  // Pet-friendly tri-state: Zoho sends "TRUE"/"FALSE" strings, or null for "Unknown"
  // DB stores as: 1 (yes), 0 (no), null (unknown)
  const petFriendly = rec.Pet_Friendly === "TRUE" ? 1 : (rec.Pet_Friendly === "FALSE" ? 0 : null);

  // Boolean checkboxes from Zoho (true/false) -> INTEGER 1/0 in D1
  const featured = rec.Featured === true ? 1 : 0;
  const verified = rec.Verified === true ? 1 : 0;

  console.log(`DEBUG - ${name} boolean fields:`, {
    Pet_Friendly: rec.Pet_Friendly,
    Featured: rec.Featured,
    Verified: rec.Verified,
    petFriendly,
    featured,
    verified
  });

  // UPSERT statement: INSERT new farm or UPDATE if zoho_record_id exists
  // This ensures idempotent webhook handling (can replay safely)
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
  name=excluded.name, slug=excluded.slug, website=excluded.website,
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

  // Coordinate handling: prefer Zoho coordinates, fall back to geocoding
  let lat = rec.latitude !== "" && rec.latitude != null ? Number(rec.latitude) : null;
  let lng = rec.longitude !== "" && rec.longitude != null ? Number(rec.longitude) : null;

  // Geocoding fallback for farms without coordinates
  // TODO: Integrate geocoding service (Google Maps, Mapbox, etc.) if needed
  if ((lat === null || lng === null) && rec.Billing_Street && rec.Billing_City) {
    try {
      const address = `${rec.Billing_Street}, ${rec.Billing_City}, ${rec.Billing_State || ''}, ${rec.Billing_Country || ''}`.trim();
      console.log(`⚠️ Coordinates missing for ${name} - address: ${address}`);
      console.log(`   Consider adding latitude/longitude to Zoho CRM or implementing geocoding service`);
    } catch (error) {
      console.error(`Geocoding failed for ${name}:`, error);
    }
  }

  // Image URLs are populated later by the image processing pipeline
  // These fields remain null initially and are updated via separate UPDATE query
  const logoUrl = rec.logo_url || null;
  const backgroundUrl = rec.background_url || null;
  const logoUpdatedAt = rec.logo_updated_at || null;
  const backgroundUpdatedAt = rec.background_updated_at || null;

  try {
    const result = await env.DB.prepare(sql).bind(
      d1Id, name, slug,
      rec.Website, rec.Phone, rec.Email, rec.Description,
      rec.Billing_Street, rec.Billing_City, rec.Billing_Code,
      rec.Billing_State, rec.Billing_Country, lat, lng,
      rec.Facebook, rec.Instagram,
      categories, type, amenities, varieties,
      petFriendly, rec.Price_Range,
      new Date().toISOString(), new Date().toISOString(),
      paymentMethods, openingDate, closingDate,
      mondayHours, tuesdayHours, wednesdayHours,
      thursdayHours, fridayHours, saturdayHours, sundayHours,
      featured, verified,
      logoUrl, backgroundUrl, logoUpdatedAt, backgroundUpdatedAt
    ).run();
    console.log(`✅ Farm upserted successfully: ${d1Id}`);
  } catch (sqlError) {
    console.error(`❌ SQL UPSERT ERROR for farm ${d1Id}:`, {
      errorMessage: sqlError.message,
      errorName: sqlError.name,
      errorCause: sqlError.cause,
      sqlAttempted: "INSERT INTO farms (...) ON CONFLICT...",
      farmName: name,
      farmSlug: slug,
      fullError: String(sqlError)
    });
    throw sqlError;
  }
}

/**
 * Deletes a farm from the D1 database with complete cascade cleanup.
 *
 * Called when a farm is deleted in Zoho CRM via webhook.
 *
 * Cascade deletion flow:
 * 1. Fetch farm details (for image URLs and audit logging)
 * 2. Delete related records from all junction and dependent tables:
 *    - saved_farms (user subscriptions)
 *    - notification_log (email history)
 *    - in_app_notifications (user notifications)
 *    - in_app_notifications_archive (archived notifications)
 *    - marketing_analytics (QR code tracking)
 *    - qr_codes (marketing materials)
 *    - wordpress_queue (pending posts)
 *    - farm_categories_rel, farm_operational_types_rel, farm_varieties_rel,
 *      farm_amenities_rel, farm_payment_methods_rel (from schema.sql)
 *    - farm_hours (operating hours)
 *    - seasonal_availability (crop status)
 *    - farm_reviews (user reviews)
 *    - crowdsourced_updates (status reports)
 * 3. Delete images from R2 storage (logo and background)
 * 4. Delete the farm record itself
 * 5. Log audit trail
 *
 * @param {Object} env - Cloudflare Worker environment
 * @param {string} id - Farm ID with 'zcrm_' prefix
 * @returns {Promise<Object>} Deletion summary with counts
 */
async function deleteFarm(env, id) {
  console.log(`🗑️  Starting cascade deletion for farm: ${id}`);

  const deletionSummary = {
    farmId: id,
    deleted: {},
    errors: []
  };

  try {
    // Step 1: Fetch farm details before deletion (for audit log and R2 cleanup)
    const farm = await env.DB.prepare(
      "SELECT zoho_record_id, name, logo_url, background_url FROM farms WHERE zoho_record_id = ?"
    ).bind(id).first();

    if (!farm) {
      console.warn(`⚠️  Farm ${id} not found in database`);
      return {
        ...deletionSummary,
        notFound: true
      };
    }

    deletionSummary.farmName = farm.name;
    console.log(`📋 Found farm: ${farm.name}`);

    // Step 2: Delete all related records (order matters for foreign key constraints)

    // User-facing tables
    const savedFarmsResult = await env.DB.prepare(
      "DELETE FROM saved_farms WHERE farm_id = ?"
    ).bind(id).run();
    deletionSummary.deleted.savedFarms = savedFarmsResult.meta.changes || 0;
    console.log(`  ✓ Deleted ${deletionSummary.deleted.savedFarms} saved farm subscriptions`);

    const notificationLogResult = await env.DB.prepare(
      "DELETE FROM notification_log WHERE farm_id = ?"
    ).bind(id).run();
    deletionSummary.deleted.notificationLog = notificationLogResult.meta.changes || 0;
    console.log(`  ✓ Deleted ${deletionSummary.deleted.notificationLog} notification logs`);

    // In-app notifications (if tables exist - added in migration 0009)
    try {
      const inAppNotificationsResult = await env.DB.prepare(
        "DELETE FROM in_app_notifications WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.inAppNotifications = inAppNotificationsResult.meta.changes || 0;
      console.log(`  ✓ Deleted ${deletionSummary.deleted.inAppNotifications} in-app notifications`);

      const archivedNotificationsResult = await env.DB.prepare(
        "DELETE FROM in_app_notifications_archive WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.archivedNotifications = archivedNotificationsResult.meta.changes || 0;
      console.log(`  ✓ Deleted ${deletionSummary.deleted.archivedNotifications} archived notifications`);
    } catch (e) {
      // Tables may not exist in older schemas
      console.log(`  ⚠️  Skipping in_app_notifications (table may not exist): ${e.message}`);
    }

    // Marketing tables (if they exist)
    try {
      const marketingResult = await env.DB.prepare(
        "DELETE FROM marketing_analytics WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.marketingAnalytics = marketingResult.meta.changes || 0;
      console.log(`  ✓ Deleted ${deletionSummary.deleted.marketingAnalytics} marketing analytics`);

      const qrCodesResult = await env.DB.prepare(
        "DELETE FROM qr_codes WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.qrCodes = qrCodesResult.meta.changes || 0;
      console.log(`  ✓ Deleted ${deletionSummary.deleted.qrCodes} QR codes`);

      const wordpressQueueResult = await env.DB.prepare(
        "DELETE FROM wordpress_queue WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.wordpressQueue = wordpressQueueResult.meta.changes || 0;
      console.log(`  ✓ Deleted ${deletionSummary.deleted.wordpressQueue} WordPress queue items`);
    } catch (e) {
      console.log(`  ⚠️  Skipping marketing tables (may not exist): ${e.message}`);
    }

    // Junction tables from schema.sql (these have ON DELETE CASCADE but we'll clean explicitly for clarity)
    try {
      const categoriesRelResult = await env.DB.prepare(
        "DELETE FROM farm_categories_rel WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.categoriesRel = categoriesRelResult.meta.changes || 0;

      const opTypesRelResult = await env.DB.prepare(
        "DELETE FROM farm_operational_types_rel WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.opTypesRel = opTypesRelResult.meta.changes || 0;

      const varietiesRelResult = await env.DB.prepare(
        "DELETE FROM farm_varieties_rel WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.varietiesRel = varietiesRelResult.meta.changes || 0;

      const amenitiesRelResult = await env.DB.prepare(
        "DELETE FROM farm_amenities_rel WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.amenitiesRel = amenitiesRelResult.meta.changes || 0;

      const paymentRelResult = await env.DB.prepare(
        "DELETE FROM farm_payment_methods_rel WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.paymentRel = paymentRelResult.meta.changes || 0;

      const hoursResult = await env.DB.prepare(
        "DELETE FROM farm_hours WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.farmHours = hoursResult.meta.changes || 0;

      const seasonalResult = await env.DB.prepare(
        "DELETE FROM seasonal_availability WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.seasonalAvailability = seasonalResult.meta.changes || 0;

      const reviewsResult = await env.DB.prepare(
        "DELETE FROM farm_reviews WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.farmReviews = reviewsResult.meta.changes || 0;

      const crowdsourcedResult = await env.DB.prepare(
        "DELETE FROM crowdsourced_updates WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.crowdsourcedUpdates = crowdsourcedResult.meta.changes || 0;

      console.log(`  ✓ Deleted ${deletionSummary.deleted.categoriesRel + deletionSummary.deleted.opTypesRel + deletionSummary.deleted.varietiesRel + deletionSummary.deleted.amenitiesRel + deletionSummary.deleted.paymentRel} junction table records`);
      console.log(`  ✓ Deleted ${deletionSummary.deleted.farmHours} farm hours, ${deletionSummary.deleted.seasonalAvailability} seasonal records`);
      console.log(`  ✓ Deleted ${deletionSummary.deleted.farmReviews} reviews, ${deletionSummary.deleted.crowdsourcedUpdates} crowdsourced updates`);
    } catch (e) {
      console.log(`  ⚠️  Some schema.sql tables may not exist: ${e.message}`);
    }

    // Step 3: Delete images from R2 storage
    if (env.ASSETS_BUCKET) {
      try {
        const imagePathsDeleted = [];

        // Delete logo from R2
        if (farm.logo_url) {
          const logoPath = `farms/${id}/logo.webp`;
          await env.ASSETS_BUCKET.delete(logoPath);
          imagePathsDeleted.push(logoPath);
          console.log(`  ✓ Deleted logo from R2: ${logoPath}`);
        }

        // Delete background from R2
        if (farm.background_url) {
          const backgroundPath = `farms/${id}/background.webp`;
          await env.ASSETS_BUCKET.delete(backgroundPath);
          imagePathsDeleted.push(backgroundPath);
          console.log(`  ✓ Deleted background from R2: ${backgroundPath}`);
        }

        // Also delete any other potential files in the farm's directory
        // R2 doesn't have native "delete folder" so we list and delete
        const farmPrefix = `farms/${id}/`;
        const listed = await env.ASSETS_BUCKET.list({ prefix: farmPrefix });

        for (const object of listed.objects) {
          await env.ASSETS_BUCKET.delete(object.key);
          imagePathsDeleted.push(object.key);
        }

        deletionSummary.deleted.r2Images = imagePathsDeleted.length;
        if (imagePathsDeleted.length > 0) {
          console.log(`  ✓ Deleted ${imagePathsDeleted.length} files from R2 storage`);
        }
      } catch (e) {
        console.error(`  ❌ R2 image cleanup failed: ${e.message}`);
        deletionSummary.errors.push(`R2 cleanup: ${e.message}`);
      }
    } else {
      console.log(`  ⚠️  R2 bucket not configured, skipping image cleanup`);
    }

    // Step 3.5: Delete from tables without FK constraints or without CASCADE
    console.log(`  🧹 Cleaning up tables without FK constraints or CASCADE...`);
    
    try {
      const adminAuditResult = await env.DB.prepare(
        "DELETE FROM admin_audit_log WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.adminAuditLog = adminAuditResult.meta.changes || 0;
      console.log(`  ✓ Deleted ${deletionSummary.deleted.adminAuditLog} admin audit log entries`);
    } catch (e) {
      console.log(`  ⚠️  admin_audit_log may not exist: ${e.message}`);
    }

    try {
      const fieldUsageResult = await env.DB.prepare(
        "DELETE FROM farm_field_option_usage WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.farmFieldOptionUsage = fieldUsageResult.meta.changes || 0;
      console.log(`  ✓ Deleted ${deletionSummary.deleted.farmFieldOptionUsage} field option usage records`);
    } catch (e) {
      console.log(`  ⚠️  farm_field_option_usage may not exist: ${e.message}`);
    }

    try {
      const farmersResult = await env.DB.prepare(
        "DELETE FROM farmers WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.farmers = farmersResult.meta.changes || 0;
      console.log(`  ✓ Deleted ${deletionSummary.deleted.farmers} farmer records`);
    } catch (e) {
      console.log(`  ⚠️  farmers table may not exist: ${e.message}`);
    }

    // CRITICAL: Delete pending_farmer_claims (has FK without CASCADE)
    try {
      const pendingClaimsResult = await env.DB.prepare(
        "DELETE FROM pending_farmer_claims WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.pendingFarmerClaims = pendingClaimsResult.meta.changes || 0;
      console.log(`  ✓ Deleted ${deletionSummary.deleted.pendingFarmerClaims} pending farmer claims`);
    } catch (e) {
      console.log(`  ⚠️  pending_farmer_claims may not exist: ${e.message}`);
    }

    // Step 3.6: Find and demote associated users in Clerk before local cleanup
    try {
      const usersToDemote = await env.DB.prepare(
        "SELECT clerk_user_id FROM users WHERE farm_id = ?"
      ).bind(id).all();

      if (usersToDemote.results && usersToDemote.results.length > 0) {
        console.log(`  - Found ${usersToDemote.results.length} user(s) to demote from farmer role.`);
        let demotedCount = 0;

        for (const user of usersToDemote.results) {
          if (!user.clerk_user_id) continue;

          try {
            const clerkApiUrl = `https://api.clerk.com/v1/users/${user.clerk_user_id}`;
            const clerkResponse = await fetch(clerkApiUrl, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${env.CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                public_metadata: {
                  role: 'user',
                  farmId: null
                }
              })
            });

            if (!clerkResponse.ok) {
              const errorText = await clerkResponse.text();
              console.error(`  ❌ Failed to demote user ${user.clerk_user_id} in Clerk: ${clerkResponse.status} - ${errorText}`);
              deletionSummary.errors.push(`Clerk demotion failed for ${user.clerk_user_id}`);
            } else {
              console.log(`  ✓ Demoted user ${user.clerk_user_id} in Clerk.`);
              demotedCount++;
            }
          } catch (e) {
            console.error(`  ❌ Error calling Clerk API for user ${user.clerk_user_id}: ${e.message}`);
            deletionSummary.errors.push(`Clerk API call failed for ${user.clerk_user_id}`);
          }
        }
        deletionSummary.deleted.usersDemotedInClerk = demotedCount;
      }

      // Unlink users from the farm in the local D1 database and reset role
      const usersResult = await env.DB.prepare(
        "UPDATE users SET farm_id = NULL, role = 'user' WHERE farm_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.usersUnlinked = usersResult.meta.changes || 0;
      console.log(`  ✓ Unlinked ${deletionSummary.deleted.usersUnlinked} users from farm in D1.`);

    } catch (e) {
      console.log(`  ⚠️  User demotion/unlinking failed: ${e.message}`);
      deletionSummary.errors.push(`User demotion process failed: ${e.message}`);
    }

    // Step 4: Delete from FTS table first (FTS5 content= creates implicit FK constraint)
    console.log(`  🔍 Deleting from FTS table first...`);
    try {
      await env.DB.prepare(
        "INSERT INTO farms_fts(farms_fts, rowid, name, description, street) VALUES('delete', ?, NULL, NULL, NULL)"
      ).bind(id).run();
      console.log(`  ✓ Deleted from FTS index`);
    } catch (ftsError) {
      console.log(`  ⚠️  FTS deletion failed (non-critical): ${ftsError.message}`);
    }

    // Step 5: Delete the farm record itself
    console.log(`  🎯 About to delete farm record from farms table...`);
    try {
      const farmResult = await env.DB.prepare(
        "DELETE FROM farms WHERE zoho_record_id = ?"
      ).bind(id).run();
      deletionSummary.deleted.farm = farmResult.meta.changes || 0;
      console.log(`  ✓ Deleted farm record (${deletionSummary.deleted.farm} rows affected)`);
    } catch (farmDeleteError) {
      console.error(`  ❌ FARM DELETION FAILED:`, farmDeleteError);
      throw farmDeleteError;
    }


    // Step 5: Audit logging
    try {
      const { logAuditEvent, AuditAction, ResourceType } = await import('./utils/audit.js');
      await logAuditEvent(
        env,
        null, // System action, no specific user
        AuditAction.FARM_DELETED,
        ResourceType.FARM,
        id,
        {
          farmName: farm.name,
          deletionSummary: deletionSummary.deleted,
          triggeredBy: 'zoho_webhook'
        }
      );
      console.log(`  ✓ Logged audit trail`);
    } catch (e) {
      console.error(`  ⚠️  Audit logging failed: ${e.message}`);
      deletionSummary.errors.push(`Audit log: ${e.message}`);
    }

    console.log(`✅ Cascade deletion completed for ${farm.name}`);
    return deletionSummary;

  } catch (error) {
    console.error(`❌ Cascade deletion failed for ${id}:`, error);
    deletionSummary.errors.push(error.message);
    throw error;
  }
}

/**
 * Triggers a GitHub Actions workflow to rebuild the static site.
 *
 * Used after farm data changes to regenerate static JSON files and pages.
 * Optional: only called if env.GITHUB_TOKEN is configured.
 *
 * @param {Object} env - Cloudflare Worker environment
 * @param {Object} payload - Custom payload to send to GitHub Actions
 * @throws {Error} If GitHub API request fails
 */
async function triggerGithub(env, payload) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/dispatches`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event_type: env.GITHUB_EVENT, client_payload: payload }),
  });
  if (!r.ok) throw new Error(`GitHub dispatch HTTP ${r.status}`);
}

/**
 * Tests Zoho CRM connection and API credentials.
 *
 * Debug endpoint to verify OAuth configuration is working correctly.
 * Makes a test API call to fetch one account record.
 *
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Promise<Object>} Connection test results
 */
async function testZohoConnection(env) {
  try {
    const accessToken = await zohoAccessToken(env);
    const dc = env.ZOHO_DC || 'com';
    
    // Test with accounts endpoint which matches your scope
    const response = await fetch(`https://www.zohoapis.${dc}/crm/v2/Accounts?per_page=1`, {
      method: "GET",
      headers: {
        "Authorization": `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Test API call failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: "Successfully connected to Zoho CRM",
      accounts_found: data.data ? data.data.length : 0,
      first_account: data.data?.[0]?.Account_Name || "No accounts found",
      dc: dc
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/* === CORS CONFIGURATION === */

/**
 * CORS headers for API responses.
 *
 * WARNING: Using wildcard "*" allows any origin to access the API.
 * Consider restricting to specific domains in production:
 * "Access-Control-Allow-Origin": "https://pickafarm.com"
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-token",
};

/* === ERROR RESPONSE UTILITIES === */

/**
 * Create standardized error response
 *
 * Returns a consistent JSON error response format for all API endpoints.
 * Includes timestamp and optional details for debugging.
 *
 * @param {number} statusCode - HTTP status code (401, 403, 404, 500, etc.)
 * @param {string} message - Error message (user-facing)
 * @param {string} [details] - Optional additional details for debugging
 * @param {string} [correlationId] - Optional correlation ID for request tracing
 * @returns {Response} HTTP response with JSON error body
 */
function errorResponse(statusCode, message, details = null, correlationId = null) {
  const body = {
    error: message,
    timestamp: new Date().toISOString()
  };

  if (details) {
    body.details = details;
  }

  if (correlationId) {
    body.correlationId = correlationId;
  }

  const headers = {
    "Content-Type": "application/json",
    ...corsHeaders
  };

  if (correlationId) {
    headers['X-Correlation-ID'] = correlationId;
  }

  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers
  });
}

/**
 * Handle authentication errors for farmer endpoints
 *
 * Maps authentication error types to appropriate HTTP responses.
 *
 * @param {Error} error - Authentication error
 * @param {string} correlationId - Request correlation ID
 * @returns {Response} HTTP error response
 */
function handleAuthenticationError(error, correlationId) {
  if (error.name === 'InvalidTokenError') {
    return errorResponse(401, "Missing or invalid authentication token", error.message, correlationId);
  }
  if (error.name === 'NotAFarmerError') {
    return errorResponse(403, "User is not authorized to access farmer resources", error.message, correlationId);
  }
  if (error.name === 'UserNotFoundError') {
    return errorResponse(403, "User not found in database", error.message, correlationId);
  }
  if (error.name === 'DatabaseError') {
    return errorResponse(500, "Authentication service unavailable", "Database error occurred", correlationId);
  }
  // Generic error fallback
  return errorResponse(500, "Internal server error", error.message, correlationId);
}

/* === CLERK AUTHENTICATION === */

/**
 * Verify Clerk JWT token with cryptographic signature verification
 *
 * ✅ UPDATED (Story 2.3): Now uses proper RS256 signature verification with Clerk JWKS
 * (Previously only decoded and checked expiration - security vulnerability FIXED)
 *
 * This function now verifies:
 * 1. JWT signature using Clerk's public keys (RS256 cryptographic verification)
 * 2. Token expiration
 * 3. Token format and structure
 *
 * @deprecated For farmer endpoints, use authenticateFarmer() from clerk-auth module
 * @deprecated For general user endpoints, use authenticateUser() from clerk-auth module
 *
 * @param {Request} request - HTTP request with Authorization header
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Promise<Object>} User context: { userId, email, sessionId }
 * @throws {Error} If token is missing, invalid, expired, or signature verification fails
 */
async function verifyClerkToken(request, env) {
  console.log("🔐 Verifying Clerk token (with signature verification)...");

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("❌ Missing or invalid Authorization header");
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7);
  console.log(`📋 Token received, length: ${token.length}`);

  try {
    // Verify JWT signature cryptographically using Clerk JWKS
    // (verifyJWTSignature imported at top of file)
    const payload = await verifyJWTSignature(token, env);

    console.log("✅ JWT signature verified and decoded successfully:", {
      sub: payload.sub?.substring(0, 20) + '...',
      exp: payload.exp,
      iss: payload.iss
    });

    // Extract user information from standard JWT claims
    return {
      userId: payload.sub,    // Subject: Clerk user ID
      email: payload.email || payload.primary_email_address?.email_address,
      sessionId: payload.sid  // Session ID
    };
  } catch (error) {
    console.error("❌ JWT verification failed:", error.message);
    throw new Error(`JWT verification failed: ${error.message}`);
  }
}

/**
 * Generates a RFC4122 v4-compliant UUID.
 *
 * Used for creating unique IDs for saved_farms, notification_log, etc.
 * This is a client-side implementation suitable for Cloudflare Workers.
 *
 * @returns {string} UUID in format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/* === ZOHO WEBHOOK HANDLERS === */

/**
 * Handles farm deletion webhooks from Zoho CRM.
 *
 * DELETE endpoint: POST /api/zoho-delete
 * Triggered when a farm (Account) is deleted in Zoho CRM.
 *
 * Security: Requires WEBHOOK_SHARED_SECRET token (header or query param).
 *
 * Query parameters:
 * - ?rebuild=true: Optionally trigger site rebuild after deletion
 *
 * @param {Request} request - HTTP request
 * @param {Object} env - Cloudflare Worker environment
 * @param {string} method - HTTP method
 * @returns {Promise<Response>} JSON response with deletion status
 */
async function handleZohoDelete(request, env, method) {
  if (method === "GET") {
    return new Response(JSON.stringify({ 
      ok: true, 
      route: "/api/zoho-delete", 
      mode: "delete-endpoint",
      expectedBody: {
        action: "delete",
        record_id: "38729000000230847",
        module: "Accounts",
        deleted_at: "2025-09-20T19:30:00Z"
      }
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Security: Verify webhook token (supports both header and query param)
  // Zoho can send token via custom header or URL query parameter
  const url = new URL(request.url);
  const tokenFromHeader = request.headers.get("x-webhook-token");
  const tokenFromQuery = url.searchParams.get("token");
  const provided = tokenFromHeader || tokenFromQuery;

  if (!provided || provided !== env.WEBHOOK_SHARED_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Parse deletion payload from Zoho
  let payload = {};
  try {
    const ct = (request.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("application/json")) {
      payload = await request.json();
    } else {
      const text = await request.text();
      try { payload = JSON.parse(text); } catch { payload = {}; }
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Validate delete payload structure
  if (payload.action !== "delete") {
    return new Response(JSON.stringify({ 
      error: "Invalid delete request", 
      expected: { action: "delete", record_id: "..." }
    }), {
      status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Extract record ID
  const zohoId = payload.record_id;
  if (!zohoId) {
    return new Response(JSON.stringify({ error: "Missing record_id in delete request" }), {
      status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Optional rebuild trigger (prevents automatic rebuilds on every deletion)
  const shouldRebuild = url.searchParams.get("rebuild") === "true";

  // Normalize Zoho ID to D1 primary key format (zcrm_ prefix)
  const rawId = String(zohoId);
  const d1Id = rawId.startsWith("zcrm_") ? rawId : `zcrm_${rawId}`;

  try {
    // Remove farm from D1 database
    const deleteResult = await deleteFarm(env, d1Id);

    // Trigger static site rebuild to remove deleted farm from JSON files
    // Only runs if explicitly requested via ?rebuild=true
    let rebuildStatus = "disabled";
    if (shouldRebuild && env.CLOUDFLARE_DEPLOY_HOOK) {
      await fetch(env.CLOUDFLARE_DEPLOY_HOOK, { method: 'POST' });
      rebuildStatus = "triggered";
    }

    return new Response(JSON.stringify({
      ok: true,
      action: "delete",
      record_id: zohoId,
      d1_id: d1Id,
      module: payload.module || "Accounts",
      deleted_at: payload.deleted_at || new Date().toISOString(),
      database: "deleted",
      rowsAffected: deleteResult.changes || 0,
      rebuild: rebuildStatus
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (e) {
    console.error("Delete webhook FAILED:", e);
    return new Response(JSON.stringify({ 
      error: "Delete operation failed", 
      message: String(e),
      record_id: zohoId,
      d1_id: d1Id
    }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

/**
 * Main Zoho CRM webhook handler for farm create/update operations.
 *
 * PRIMARY endpoint: POST /api/zoho-webhook
 * Triggered when a farm (Account) is created or updated in Zoho CRM.
 *
 * Workflow:
 * 1. Verify webhook token for security
 * 2. Extract Zoho Account ID from payload
 * 3. Fetch current farm data from D1 (to detect changes)
 * 4. Fetch complete record from Zoho API
 * 5. Upsert farm data to D1
 * 6. Process Logo1 and Cover images (if changed)
 *    - Download from Zoho
 *    - Upload to R2 bucket
 *    - Update D1 with CDN URLs
 * 7. Check for season date changes (opening_date, closing_date)
 * 8. Send email notifications to subscribers (if dates changed)
 * 9. Optionally trigger static site rebuild
 *
 * Security: Requires WEBHOOK_SHARED_SECRET token.
 * Query parameters:
 * - ?rebuild=true: Trigger site rebuild after sync
 *
 * RATE LIMITING: Zoho API has rate limits (100 API calls/minute).
 * This webhook makes 2-3 API calls per farm (token, account, attachments).
 *
 * @param {Request} request - HTTP request from Zoho
 * @param {Object} env - Cloudflare Worker environment
 * @param {string} method - HTTP method
 * @returns {Promise<Response>} JSON response with sync status
 */
async function handleZohoWebhook(request, env, method) {
  if (method === "GET") {
    return new Response(JSON.stringify({ 
      ok: true, 
      route: "/api/zoho-webhook", 
      mode: "production-ready",
      features: ["zoho-fetch", "d1-integration", "cloudflare-rebuild"] 
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Security check - require webhook token
  const url = new URL(request.url);
  const tokenFromHeader = request.headers.get("x-webhook-token");
  const tokenFromQuery = url.searchParams.get("token");
  const provided = tokenFromHeader || tokenFromQuery;
  
  if (!provided || provided !== env.WEBHOOK_SHARED_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Parse request body
  let payload = {};
  try {
    const ct = (request.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("application/json")) {
      payload = await request.json();
    } else if (ct.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      payload = Object.fromEntries(new URLSearchParams(text));
    } else {
      const text = await request.text();
      try { payload = JSON.parse(text); } catch { payload = {}; }
    }
  } catch {}

  // Extract Zoho record ID
  const zohoId = payload?.data?.[0]?.id ?? payload?.id ?? url.searchParams.get("id");
  if (!zohoId) {
    return new Response(JSON.stringify({ error: "Missing Zoho record id" }), {
      status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Check if rebuild is requested via query parameter
  const shouldRebuild = url.searchParams.get("rebuild") === "true";

  // Normalize: API wants numeric; D1 PK uses zcrm_<id>
  const rawId = String(zohoId);
  const apiId = rawId.replace(/^zcrm_/, "");
  const d1Id = rawId.startsWith("zcrm_") ? rawId : `zcrm_${rawId}`;

  try {
    // STEP 1: Capture current state for change detection
    // We need to know old values to trigger notifications on changes
    let oldFarm = null;
    try {
      oldFarm = await env.DB.prepare(
        "SELECT opening_date, closing_date FROM farms WHERE zoho_record_id = ?"
      ).bind(d1Id).first();
    } catch (e) {
      console.log("No existing farm found, this is a new farm");
    }

    // STEP 2: Fetch fresh data from Zoho CRM
    const accessToken = await zohoAccessToken(env);
    const record = await zohoFetchAccount(env, accessToken, apiId);
    record.id = d1Id; // Normalize to D1 format: zcrm_<id>

    // STEP 2.5: Fetch file attachments (for logo and cover image fallback)
    // Note: Attachments API is separate from the main Account record
    const attachments = await zohoFetchAttachments(env, accessToken, apiId);

    // Match logo and cover images from attachment filenames
    // This is a fallback if Logo1/Cover fields are not populated
    if (attachments.length > 0) {
      console.log(`📎 Processing ${attachments.length} attachments`);

      for (const att of attachments) {
        const fileName = (att.File_Name || '').toLowerCase();
        console.log(`  - ${att.File_Name} (${att.Size} bytes)`);

        // Fuzzy matching for logo files
        if (fileName.includes('logo') && !record.Logo) {
          record.Logo = att.$link_url;
          console.log(`✅ Matched Logo: ${att.File_Name}`);
        }

        // Fuzzy matching for cover/background files
        if ((fileName.includes('cover') || fileName.includes('background')) && !record.Cover_Image) {
          record.Cover_Image = att.$link_url;
          console.log(`✅ Matched Cover_Image: ${att.File_Name}`);
        }
      }
    }

    // STEP 3: Save farm data to D1 database
    try {
      await upsertFarm(env, record);
    } catch (dbError) {
      console.error("❌ UPSERT FAILED - Database Error:", {
        name: dbError.name,
        message: dbError.message,
        cause: dbError.cause,
        farmId: d1Id,
        farmName: record.Account_Name
      });
      throw dbError; // Re-throw to be caught by outer catch
    }

    // STEP 3.3: Auto-discover field options from farm data
    // This ensures new Zoho values become available as form options immediately
    await discoverFieldOptions(env, record, record.id);

    // STEP 3.5: Process farm branding images (Logo1 and Cover fields)
    // This downloads images from Zoho and uploads to R2 bucket with CDN URLs
    const { processImage } = await import('./lib/image-processor.js');
    const { sendImageErrorEmail } = await import('./lib/email-notifications.js');

    /**
     * Extracts downloadable URL from Zoho File Upload field.
     *
     * Zoho File Upload fields return different structures:
     * - Array with file_Id and attachment_Id (v3 API)
     * - Direct URL string (legacy)
     *
     * @returns {string|null} Zoho Attachments API URL or null
     */
    const extractFileDownloadUrl = (fileField, dc, recordId) => {
      if (!fileField) return null;

      // Modern structure: Array with file_Id and attachment_Id
      if (Array.isArray(fileField) && fileField.length > 0) {
        const fileId = fileField[0]?.file_Id;
        const attachmentId = fileField[0]?.attachment_Id;

        if (fileId && attachmentId) {
          // Construct Zoho v3 Attachments API download URL
          // Requires OAuth token for authentication
          // API docs: https://www.zoho.com/crm/developer/docs/api/v3/get-attachments.html
          return `https://www.zohoapis.${dc}/crm/v3/Accounts/${recordId}/Attachments/${attachmentId}`;
        }
      }

      // Legacy structure: Direct URL string (rare)
      if (typeof fileField === 'string') {
        return fileField;
      }

      return null;
    };

    const dc = env.ZOHO_DC || 'com';
    const logoUrl = extractFileDownloadUrl(record.Logo1, dc, apiId);
    const coverUrl = extractFileDownloadUrl(record.Cover, dc, apiId);

    console.log(`🔍 Image URL check - Logo1: ${logoUrl ? 'Found' : 'None'}, Cover: ${coverUrl ? 'Found' : 'None'}`);

    // Process images if either logo or cover is present
    if (logoUrl || coverUrl) {
      console.log(`📸 Processing images for ${record.Account_Name || d1Id}`);

      // LOGO PROCESSING
      if (logoUrl) {
        try {
          console.log(`⬇️ Processing logo from URL: ${logoUrl}`);

          // Downloads image from Zoho, validates size, uploads to R2
          // See lib/image-processor.js for implementation
          const result = await processImage({
            imageUrl: logoUrl,
            farmId: d1Id,
            imageType: 'logo',              // Stored as: /farms/{farmId}/logo.{ext}
            bucket: env.ASSETS_BUCKET,      // R2 bucket binding
            cdnDomain: env.CDN_DOMAIN,      // e.g., https://cdn.pickafarm.com
            accessToken: accessToken        // Required for Zoho authenticated downloads
          });

          // Update D1 with CDN URL and timestamp for cache-busting
          await env.DB.prepare(
            'UPDATE farms SET logo_url = ?, logo_updated_at = ? WHERE zoho_record_id = ?'
          ).bind(result.url, new Date().toISOString(), d1Id).run();

          console.log(`✅ Logo processed: ${result.url}`);
        } catch (error) {
          console.error(`❌ Logo processing failed:`, error);
          // Non-blocking error notification via Resend
          // Webhook succeeds even if image processing fails
          sendImageErrorEmail(env, d1Id, record.Account_Name, 'logo', error).catch(err =>
            console.error('Failed to send error email:', err)
          );
        }
      }

      // COVER IMAGE PROCESSING
      if (coverUrl) {
        try {
          console.log(`⬇️ Processing cover image from URL: ${coverUrl}`);

          const result = await processImage({
            imageUrl: coverUrl,
            farmId: d1Id,
            imageType: 'background',        // Stored as: /farms/{farmId}/background.{ext}
            bucket: env.ASSETS_BUCKET,
            cdnDomain: env.CDN_DOMAIN,
            accessToken: accessToken
          });

          // Update D1 with CDN URL and timestamp
          await env.DB.prepare(
            'UPDATE farms SET background_url = ?, background_updated_at = ? WHERE zoho_record_id = ?'
          ).bind(result.url, new Date().toISOString(), d1Id).run();

          console.log(`✅ Background processed: ${result.url}`);
        } catch (error) {
          console.error(`❌ Background processing failed:`, error);
          sendImageErrorEmail(env, d1Id, record.Account_Name, 'background', error).catch(err =>
            console.error('Failed to send error email:', err)
          );
        }
      }
    }

    // STEP 4: Detect changes and send notifications to subscribers
    // Only opening_date and closing_date changes trigger emails currently
    const newOpeningDate = record.Open_Date || null;
    const newClosingDate = record.Close_Day || null;
    const oldOpeningDate = oldFarm?.opening_date || null;
    const oldClosingDate = oldFarm?.closing_date || null;

    let notificationSent = false;
    if (oldFarm && (newOpeningDate !== oldOpeningDate || newClosingDate !== oldClosingDate)) {
      console.log("📧 Season dates changed - notifying subscribers...");

      // Construct changes object for email template
      const changes = {
        type: "Season Dates Updated"
      };
      
      if (newOpeningDate !== oldOpeningDate) {
        changes.opening_date = {
          old: oldOpeningDate,
          new: newOpeningDate
        };
      }
      
      if (newClosingDate !== oldClosingDate) {
        changes.closing_date = {
          old: oldClosingDate,
          new: newClosingDate
        };
      }

      // Send email notifications (non-blocking - webhook succeeds even if emails fail)
      try {
        // Fetch farm details needed for email template
        const farm = await env.DB.prepare(`
          SELECT zoho_record_id, name, slug, city, state, phone, website, email
          FROM farms WHERE zoho_record_id = ?
        `).bind(d1Id).first();

        // Get list of subscribers who opted in to email notifications
        const subscribers = await env.DB.prepare(`
          SELECT u.email, u.first_name, u.last_name
          FROM saved_farms sf
          JOIN users u ON sf.user_id = u.id
          WHERE sf.farm_id = ? AND u.opt_in_notifications = 1
        `).bind(d1Id).all();

        if (subscribers.results && subscribers.results.length > 0) {
          console.log(`📨 Sending to ${subscribers.results.length} subscribers`);

          // Send individual emails via Resend API
          let successCount = 0;
          let failureCount = 0;
          const emailResults = [];

          for (const subscriber of subscribers.results) {
            const result = await sendFarmUpdateEmail(env, subscriber.email, farm, changes);
            emailResults.push({
              email: subscriber.email,
              ...result
            });

            if (result.success) {
              successCount++;
            } else {
              failureCount++;
            }
          }

          // Record notification in audit log for tracking and analytics
          const logId = generateUUID();
          await env.DB.prepare(`
            INSERT INTO notification_log (
              id, farm_id, notification_type, recipient_count,
              recipients_list, triggered_by, farm_changes,
              success_count, failure_count, sent_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            logId,
            d1Id,
            changes.type,
            subscribers.results.length,
            JSON.stringify(emailResults.map(r => r.email)),
            'zoho_webhook_auto',  // Source: automatic from webhook
            JSON.stringify(changes),
            successCount,
            failureCount
          ).run();

          notificationSent = true;
          console.log(`✅ Notifications sent: ${successCount} success, ${failureCount} failed`);
        } else {
          console.log("ℹ️ No subscribers to notify");
        }
      } catch (notifError) {
        console.error("❌ Failed to send notifications:", notifError);
        // Non-critical: webhook succeeds even if notification sending fails
      }
    }

    // STEP 5: Optionally trigger static site rebuild
    // Disabled by default to prevent excessive rebuilds on every farm update
    let rebuildStatus = "disabled";
    if (shouldRebuild && env.CLOUDFLARE_DEPLOY_HOOK) {
      await fetch(env.CLOUDFLARE_DEPLOY_HOOK, { method: 'POST' });
      rebuildStatus = "triggered";
    }

    return new Response(JSON.stringify({
      ok: true,
      id: d1Id,
      source: "zoho",
      database: "updated",
      rebuild: rebuildStatus,
      notifications_sent: notificationSent
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (e) {
    console.error("Webhook FAILED:", e);
    console.error("Error details:", {
      name: e.name,
      message: e.message,
      cause: e.cause,
      stack: e.stack,
      fullError: JSON.stringify(e, null, 2)
    });
    return new Response(JSON.stringify({
      error: "Zoho webhook failed",
      message: String(e),
      errorName: e.name,
      errorDetails: e.message,
      zoho_id: apiId,
      d1_id: d1Id,
      fullError: String(e)
    }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

// Debug endpoint
async function handleZohoDebug(request, env, method) {
  if (method === "GET") {
    try {
      const testResult = await testZohoConnection(env);
      
      return new Response(JSON.stringify({
        endpoint: "/api/zoho-debug",
        timestamp: new Date().toISOString(),
        environment_check: {
          ZOHO_REFRESH_TOKEN: env.ZOHO_REFRESH_TOKEN ? "✓ Set" : "✗ Missing",
          ZOHO_CLIENT_ID: env.ZOHO_CLIENT_ID ? "✓ Set" : "✗ Missing",
          ZOHO_CLIENT_SECRET: env.ZOHO_CLIENT_SECRET ? "✓ Set" : "✗ Missing",
          ZOHO_DC: env.ZOHO_DC || "com (default)",
          WEBHOOK_SHARED_SECRET: env.WEBHOOK_SHARED_SECRET ? "✓ Set" : "✗ Missing",
          CLOUDFLARE_DEPLOY_HOOK: env.CLOUDFLARE_DEPLOY_HOOK ? "✓ Set" : "✗ Missing"
        },
        connection_test: testResult
      }, null, 2), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        endpoint: "/api/zoho-debug",
        error: "Debug test failed",
        message: error.message,
        environment_check: {
          ZOHO_REFRESH_TOKEN: env.ZOHO_REFRESH_TOKEN ? "✓ Set" : "✗ Missing",
          ZOHO_CLIENT_ID: env.ZOHO_CLIENT_ID ? "✓ Set" : "✗ Missing",
          ZOHO_CLIENT_SECRET: env.ZOHO_CLIENT_SECRET ? "✓ Set" : "✗ Missing",
          ZOHO_DC: env.ZOHO_DC || "com (default)",
          WEBHOOK_SHARED_SECRET: env.WEBHOOK_SHARED_SECRET ? "✓ Set" : "✗ Missing",
          CLOUDFLARE_DEPLOY_HOOK: env.CLOUDFLARE_DEPLOY_HOOK ? "✓ Set" : "✗ Missing"
        }
      }, null, 2), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

// Token debug endpoint
async function handleTokenDebug(request, env, method) {
  if (method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const refreshToken = env.ZOHO_REFRESH_TOKEN;
  const clientId = env.ZOHO_CLIENT_ID;
  const clientSecret = env.ZOHO_CLIENT_SECRET;
  const dc = env.ZOHO_DC || 'com';

  // Show token info (safely)
  const tokenInfo = {
    refresh_token_present: !!refreshToken,
    refresh_token_length: refreshToken ? refreshToken.length : 0,
    refresh_token_starts_with: refreshToken ? refreshToken.substring(0, 10) + "..." : null,
    client_id_present: !!clientId,
    client_secret_present: !!clientSecret,
    dc: dc,
    token_url: dc === 'ca' ? 'https://accounts.zohocloud.ca/oauth/v2/token' : `https://accounts.zoho.${dc}/oauth/v2/token`
  };

  // Try to get a token with detailed error info
  if (refreshToken && clientId && clientSecret) {
    try {
      const tokenUrl = dc === 'ca' ? 'https://accounts.zohocloud.ca/oauth/v2/token' : `https://accounts.zoho.${dc}/oauth/v2/token`;
      const body = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token"
      });

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString()
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw_response: responseText };
      }

      return new Response(JSON.stringify({
        token_info: tokenInfo,
        request_details: {
          url: tokenUrl,
          status: response.status,
          status_text: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        },
        response_data: responseData
      }, null, 2), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        token_info: tokenInfo,
        error: "Request failed",
        message: error.message
      }, null, 2), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }

  return new Response(JSON.stringify({
    token_info: tokenInfo,
    error: "Missing required credentials"
  }, null, 2), {
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

/* === PUBLIC API ENDPOINTS === */

/**
 * Calculates distance between two coordinates using Haversine formula.
 *
 * Haversine formula accounts for Earth's spherical shape, providing
 * accurate distance calculations for lat/lng pairs.
 *
 * @param {number} lat1 - Latitude of first point (degrees)
 * @param {number} lon1 - Longitude of first point (degrees)
 * @param {number} lat2 - Latitude of second point (degrees)
 * @param {number} lon2 - Longitude of second point (degrees)
 * @returns {number} Distance in kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET /api/farms - List farms with filtering and location-based search.
 *
 * Query parameters:
 * - state: Filter by state/province (e.g., "Wisconsin", "New York")
 * - city: Filter by city name
 * - category: Filter by farm type (e.g., "Christmas Trees", "Pumpkin Patch")
 * - lat, lng, radius: Location-based search (default radius: 50km)
 * - limit: Max results (default: 200)
 *
 * Returns farms sorted by:
 * 1. Featured status
 * 2. Verified status
 * 3. Name (alphabetical)
 *
 * For location searches, results are sorted by distance instead.
 *
 * @param {Request} request - HTTP request
 * @param {Object} env - Cloudflare Worker environment
 * @param {string} method - HTTP method
 * @returns {Promise<Response>} JSON array of farm objects
 */
async function handleFarms(request, env, method) {
  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const url = new URL(request.url);
    const state = url.searchParams.get("state");
    const city = url.searchParams.get("city");
    const category = url.searchParams.get("category");
    const limit = parseInt(url.searchParams.get("limit") || "200", 10);

    // Location-based radius search parameters
    const lat = parseFloat(url.searchParams.get("lat"));
    const lng = parseFloat(url.searchParams.get("lng"));
    const radius = parseFloat(url.searchParams.get("radius") || "50"); // Default: 50km

    let query = `
      SELECT
        zoho_record_id as id,
        name, slug, street,
        city as city_name, postal_code,
        state as state_province, country,
        latitude, longitude, phone, email,
        website, facebook, instagram,
        description, categories, type, amenities, varieties,
        pet_friendly, price_range,
        verified, featured, active, updated_at,
        payment_methods, opening_date, closing_date,
        monday_hours, tuesday_hours, wednesday_hours,
        thursday_hours, friday_hours, saturday_hours, sunday_hours,
        logo_url, background_url, logo_updated_at, background_updated_at
      FROM farms
      WHERE active = 1 AND latitude IS NOT NULL AND longitude IS NOT NULL
    `;

    const params = [];
    if (state) { query += " AND state = ?"; params.push(state); }
    if (city) { query += " AND city = ?"; params.push(city); }
    if (category) { query += " AND (categories LIKE ? OR type LIKE ?)"; params.push(`%${category}%`, `%${category}%`); }

    query += " ORDER BY featured DESC, verified DESC, name ASC";
    query += " LIMIT ?";
    params.push(limit);

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all();

    let farms = result.results || [];

    // Post-process location-based filtering (DB doesn't support geospatial queries)
    // Calculate Haversine distance for each farm and filter by radius
    if (!isNaN(lat) && !isNaN(lng)) {
      farms = farms
        .map(farm => {
          if (farm.latitude && farm.longitude) {
            const distance = calculateHaversineDistance(
              lat, lng,
              parseFloat(farm.latitude), parseFloat(farm.longitude)
            );
            return { ...farm, distance: Math.round(distance * 10) / 10 }; // Round to 1 decimal place
          }
          return null; // Exclude farms without coordinates
        })
        .filter(farm => farm !== null && farm.distance <= radius)
        .sort((a, b) => a.distance - b.distance); // Sort by nearest first
    }

    return new Response(
      JSON.stringify({
        farms,
        count: farms.length,
        filters: { state, city, category, lat, lng, radius, limit },
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Farms API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch farms", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

async function handleCities(request, env, method) {
  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const url = new URL(request.url);
    const state = url.searchParams.get("state");

    let query = `
      SELECT 
        c.id, c.name, c.slug, c.state_province, c.country, c.tier,
        COUNT(f.zoho_record_id) as farm_count
      FROM cities c
      LEFT JOIN farms f ON c.name = f.city AND f.active = 1
    `;

    const params = [];
    if (state) { query += " WHERE c.state_province = ?"; params.push(state); }

    query += " GROUP BY c.id ORDER BY c.tier ASC, c.name ASC";

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all();

    return new Response(
      JSON.stringify({ cities: result.results || [], count: result.results?.length || 0 }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Cities API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch cities", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

/**
 * GET /api/field-options/:fieldName - Get options for a specific multi-select field
 * GET /api/field-options - Batch fetch all field options
 *
 * Returns options for form fields with usage counts and sorting.
 * Cached for 1 hour at CDN level.
 */
async function handleFieldOptions(request, env, method, url) {
  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Extract field name from path: /api/field-options/:fieldName
    const pathParts = url.pathname.split('/');
    const fieldName = pathParts[3]; // Index 3 is the field name after /api/field-options/

    // Valid field names for validation
    const validFields = [
      'categories', 'activities', 'amenities', 'varieties', 'products',
      'payment_methods', 'seasonal_activities',
      'christmas_trees_available', 'christmas_activities', 'christmas_products',
      'service_types', 'type' // Added service_types and type as valid fields
    ];

    // Single field fetch
    if (fieldName && fieldName.length > 0) {
      if (!validFields.includes(fieldName)) {
        return new Response(JSON.stringify({ error: 'Invalid field name' }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Special handling for service types - return hardcoded approved values
      if (fieldName === 'service_types' || fieldName === 'type') {
        const serviceTypes = [
          { option_value: 'U-Pick', option_label: 'U-Pick', sort_order: 1, usage_count: 0 },
          { option_value: 'Pre-Cut', option_label: 'Pre-Cut', sort_order: 2, usage_count: 0 },
          { option_value: 'You Choose, We Cut', option_label: 'You Choose, We Cut', sort_order: 3, usage_count: 0 },
          { option_value: 'Retail', option_label: 'Retail', sort_order: 4, usage_count: 0 },
          { option_value: 'Delivery', option_label: 'Delivery', sort_order: 5, usage_count: 0 }
        ];

        return new Response(
          JSON.stringify({
            field: fieldName,
            options: serviceTypes,
            count: serviceTypes.length
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=3600",
              ...corsHeaders
            }
          }
        );
      }

      // Special handling for varieties - return hardcoded approved values (19 total)
      if (fieldName === 'varieties') {
        const varieties = [
          { option_value: 'Balsam Fir', option_label: 'Balsam Fir', sort_order: 1, usage_count: 0 },
          { option_value: 'Black Hills Spruce', option_label: 'Black Hills Spruce', sort_order: 2, usage_count: 0 },
          { option_value: 'Canaan Fir', option_label: 'Canaan Fir', sort_order: 3, usage_count: 0 },
          { option_value: 'Colorado Blue Spruce', option_label: 'Colorado Blue Spruce', sort_order: 4, usage_count: 0 },
          { option_value: 'Concolor Fir', option_label: 'Concolor Fir', sort_order: 5, usage_count: 0 },
          { option_value: 'Cook Blue Fir', option_label: 'Cook Blue Fir', sort_order: 6, usage_count: 0 },
          { option_value: 'Douglas Fir', option_label: 'Douglas Fir', sort_order: 7, usage_count: 0 },
          { option_value: 'Fraser Fir', option_label: 'Fraser Fir', sort_order: 8, usage_count: 0 },
          { option_value: 'Grand Fir', option_label: 'Grand Fir', sort_order: 9, usage_count: 0 },
          { option_value: 'Leyland Cypress', option_label: 'Leyland Cypress', sort_order: 10, usage_count: 0 },
          { option_value: 'Lodgepole Pine', option_label: 'Lodgepole Pine', sort_order: 11, usage_count: 0 },
          { option_value: 'Monterrey Pines', option_label: 'Monterrey Pines', sort_order: 12, usage_count: 0 },
          { option_value: 'Noble Fir', option_label: 'Noble Fir', sort_order: 13, usage_count: 0 },
          { option_value: 'Nordmann Fir', option_label: 'Nordmann Fir', sort_order: 14, usage_count: 0 },
          { option_value: 'Scotch Pine', option_label: 'Scotch Pine', sort_order: 15, usage_count: 0 },
          { option_value: 'Serbian Spruce', option_label: 'Serbian Spruce', sort_order: 16, usage_count: 0 },
          { option_value: 'Virginia Pine', option_label: 'Virginia Pine', sort_order: 17, usage_count: 0 },
          { option_value: 'White Pine', option_label: 'White Pine', sort_order: 18, usage_count: 0 },
          { option_value: 'White Spruce', option_label: 'White Spruce', sort_order: 19, usage_count: 0 }
        ];

        return new Response(
          JSON.stringify({
            field: fieldName,
            options: varieties,
            count: varieties.length
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=3600",
              ...corsHeaders
            }
          }
        );
      }

      const result = await env.DB.prepare(`
        SELECT
          option_value,
          option_label,
          sort_order,
          (SELECT COUNT(DISTINCT farm_id)
           FROM farm_field_option_usage
           WHERE field_name = ? AND option_value = ffo.option_value) as usage_count
        FROM farm_field_options ffo
        WHERE field_name = ? AND is_active = 1
        ORDER BY sort_order ASC, usage_count DESC, option_label ASC
      `).bind(fieldName, fieldName).all();

      return new Response(
        JSON.stringify({
          field: fieldName,
          options: result.results || [],
          count: (result.results || []).length
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
            ...corsHeaders
          }
        }
      );
    }

    // Batch fetch all field options
    const result = await env.DB.prepare(`
      SELECT field_name, option_value, option_label, sort_order
      FROM farm_field_options
      WHERE is_active = 1
      ORDER BY field_name, sort_order, option_label
    `).all();

    // Group by field name
    const grouped = {};

    for (const row of result.results || []) {
      if (!grouped[row.field_name]) {
        grouped[row.field_name] = [];
      }

      grouped[row.field_name].push({
        value: row.option_value,
        label: row.option_label,
        sort_order: row.sort_order
      });
    }

    // Add hardcoded service types to the batch response
    grouped['service_types'] = [
      { value: 'U-Pick', label: 'U-Pick', sort_order: 1 },
      { value: 'Pre-Cut', label: 'Pre-Cut', sort_order: 2 },
      { value: 'You Choose, We Cut', label: 'You Choose, We Cut', sort_order: 3 },
      { value: 'Retail', label: 'Retail', sort_order: 4 },
      { value: 'Delivery', label: 'Delivery', sort_order: 5 }
    ];
    grouped['type'] = grouped['service_types']; // Alias for backward compatibility

    // Add hardcoded varieties to the batch response (19 approved varieties)
    grouped['varieties'] = [
      { value: 'Balsam Fir', label: 'Balsam Fir', sort_order: 1 },
      { value: 'Black Hills Spruce', label: 'Black Hills Spruce', sort_order: 2 },
      { value: 'Canaan Fir', label: 'Canaan Fir', sort_order: 3 },
      { value: 'Colorado Blue Spruce', label: 'Colorado Blue Spruce', sort_order: 4 },
      { value: 'Concolor Fir', label: 'Concolor Fir', sort_order: 5 },
      { value: 'Cook Blue Fir', label: 'Cook Blue Fir', sort_order: 6 },
      { value: 'Douglas Fir', label: 'Douglas Fir', sort_order: 7 },
      { value: 'Fraser Fir', label: 'Fraser Fir', sort_order: 8 },
      { value: 'Grand Fir', label: 'Grand Fir', sort_order: 9 },
      { value: 'Leyland Cypress', label: 'Leyland Cypress', sort_order: 10 },
      { value: 'Lodgepole Pine', label: 'Lodgepole Pine', sort_order: 11 },
      { value: 'Monterrey Pines', label: 'Monterrey Pines', sort_order: 12 },
      { value: 'Noble Fir', label: 'Noble Fir', sort_order: 13 },
      { value: 'Nordmann Fir', label: 'Nordmann Fir', sort_order: 14 },
      { value: 'Scotch Pine', label: 'Scotch Pine', sort_order: 15 },
      { value: 'Serbian Spruce', label: 'Serbian Spruce', sort_order: 16 },
      { value: 'Virginia Pine', label: 'Virginia Pine', sort_order: 17 },
      { value: 'White Pine', label: 'White Pine', sort_order: 18 },
      { value: 'White Spruce', label: 'White Spruce', sort_order: 19 }
    ];

    return new Response(
      JSON.stringify(grouped),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error("Field Options API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch field options", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

async function handleSearch(request, env, method) {
  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    if (!q || q.length < 2) {
      return new Response(
        JSON.stringify({ error: "Search query must be at least 2 characters", farms: [], count: 0 }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Simple search without FTS table for now
    const query = `
      SELECT 
        f.zoho_record_id as id,
        f.name, f.slug, f.street, f.description,
        f.city as city_name, f.state as state_province
      FROM farms f
      WHERE (f.name LIKE ? OR f.description LIKE ? OR f.city LIKE ?) 
      AND f.active = 1
      ORDER BY f.name ASC
      LIMIT ?
    `;

    const searchTerm = `%${q}%`;
    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(searchTerm, searchTerm, searchTerm, limit).all();

    return new Response(
      JSON.stringify({ farms: result.results || [], count: result.results?.length || 0, query: q }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Search API Error:", error);
    return new Response(
      JSON.stringify({ error: "Search failed", message: error.message, farms: [], count: 0 }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

/* === AUTHENTICATED USER ENDPOINTS === */
// All endpoints in this section require Clerk JWT authentication

/**
 * POST /api/users/sync - Synchronize Clerk user to D1 database.
 *
 * Called by frontend after successful Clerk sign-up/sign-in.
 * Creates or updates user record in D1 for farm subscriptions.
 *
 * Security: Requires valid Clerk JWT in Authorization header.
 *
 * Request body:
 * - email: User's email address
 * - firstName: User's first name
 * - lastName: User's last name
 *
 * Handles race conditions with UPSERT on email collision.
 *
 * @param {Request} request - HTTP request with Clerk JWT
 * @param {Object} env - Cloudflare Worker environment
 * @param {string} method - HTTP method
 * @returns {Promise<Response>} JSON with user_id and action (created/updated/existing)
 */
async function handleUserSync(request, env, method) {
  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    console.log("User sync started");
    
    // Verify Clerk JWT
    let clerkUser;
    try {
      clerkUser = await verifyClerkToken(request, env);
      console.log("Clerk user verified:", clerkUser.userId);
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError.message);
      return new Response(JSON.stringify({
        error: "JWT verification failed",
        message: jwtError.message,
        details: "Check Authorization header format: 'Bearer <token>'"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    // Parse request body
    const body = await request.json();
    const { email, firstName, lastName } = body;
    console.log("User data:", { email, firstName, lastName });

    // Check if user already exists by clerk_user_id OR email
    const existingUser = await env.DB.prepare(
      "SELECT id, clerk_user_id, email FROM users WHERE clerk_user_id = ? OR email = ?"
    ).bind(clerkUser.userId, email).first();

    if (existingUser) {
      // Update existing user
      await env.DB.prepare(`
        UPDATE users 
        SET clerk_user_id = ?, email = ?, first_name = ?, last_name = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(clerkUser.userId, email, firstName, lastName, existingUser.id).run();

      console.log(`✅ User updated: ${existingUser.id}`);
      
      return new Response(JSON.stringify({
        success: true,
        user_id: existingUser.id,
        action: "updated"
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    } else {
      // Create new user with UPSERT to handle race conditions
      const newUserId = generateUUID();
      
      try {
        await env.DB.prepare(`
          INSERT INTO users (id, clerk_user_id, email, first_name, last_name, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(email) DO UPDATE SET
            clerk_user_id = excluded.clerk_user_id,
            first_name = excluded.first_name,
            last_name = excluded.last_name,
            updated_at = datetime('now')
        `).bind(newUserId, clerkUser.userId, email, firstName, lastName).run();

        console.log(`✅ User created: ${newUserId}`);

        return new Response(JSON.stringify({
          success: true,
          user_id: newUserId,
          action: "created"
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (insertError) {
        // If still fails, try to get the existing user and return it
        console.error("Insert failed, fetching existing user:", insertError.message);
        const fallbackUser = await env.DB.prepare(
          "SELECT id FROM users WHERE email = ?"
        ).bind(email).first();
        
        if (fallbackUser) {
          return new Response(JSON.stringify({
            success: true,
            user_id: fallbackUser.id,
            action: "existing"
          }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        throw insertError;
      }
    }
  } catch (error) {
    console.error("User sync error:", error);
    return new Response(JSON.stringify({
      error: "Failed to sync user",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

// POST /api/users/update-location - Update user's GPS location
async function handleUpdateUserLocation(request, env, method) {
  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Verify Clerk JWT
    const clerkUser = await verifyClerkToken(request, env);
    
    // Get D1 user ID
    const user = await env.DB.prepare(
      "SELECT id FROM users WHERE clerk_user_id = ?"
    ).bind(clerkUser.userId).first();

    if (!user) {
      return new Response(JSON.stringify({
        error: "User not found. Please sync user first."
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Parse request body
    const body = await request.json();
    const { latitude, longitude, city, region } = body;

    if (!latitude || !longitude) {
      return new Response(JSON.stringify({ 
        error: "latitude and longitude are required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Update user location
    await env.DB.prepare(`
      UPDATE users 
      SET latitude = ?, longitude = ?, location_city = ?, location_region = ?, 
          location_updated_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(latitude, longitude, city || null, region || null, user.id).run();

    console.log(`✅ User location updated: ${user.id} -> ${latitude}, ${longitude}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Location updated successfully",
      location: { latitude, longitude, city, region }
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Update location error:", error);
    return new Response(JSON.stringify({
      error: "Failed to update location",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

/* === FARM SUBSCRIPTION ENDPOINTS === */
// Users can save farms and receive email notifications about changes

/**
 * POST /api/farms/save - Subscribe to farm updates.
 *
 * Saves a farm to user's watchlist and opts them in to email notifications.
 * User will receive emails when farm's opening_date or closing_date changes.
 *
 * Security: Requires Clerk JWT authentication.
 *
 * Request body:
 * - farm_id: Farm's zoho_record_id (e.g., "zcrm_123456")
 * - farm_name: Farm name (for display in dashboard)
 * - farm_city, farm_state, farm_phone, farm_website: Metadata (optional)
 * - consent_given: REQUIRED boolean - user's consent to receive emails
 *
 * Tracks consent with timestamp and IP address for GDPR/CAN-SPAM compliance.
 * Invalidates subscriber count cache after successful save.
 *
 * @param {Request} request - HTTP request with Clerk JWT
 * @param {Object} env - Cloudflare Worker environment
 * @param {string} method - HTTP method
 * @returns {Promise<Response>} JSON with success status and saved_farm_id
 */
async function handleSaveFarm(request, env, method) {
  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Verify Clerk JWT
    const clerkUser = await verifyClerkToken(request, env);
    
    // Get D1 user ID
    const user = await env.DB.prepare(
      "SELECT id FROM users WHERE clerk_user_id = ?"
    ).bind(clerkUser.userId).first();

    if (!user) {
      return new Response(JSON.stringify({
        error: "User not found. Please sync user first."
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Parse request body
    const body = await request.json();
    const { farm_id, farm_name, farm_city, farm_state, farm_phone, farm_website, consent_given } = body;

    if (!farm_id) {
      return new Response(JSON.stringify({ error: "farm_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Require consent for new subscriptions
    if (!consent_given) {
      return new Response(JSON.stringify({
        error: "Consent required",
        message: "You must agree to receive email notifications to subscribe to farm updates"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Check if already saved
    const existing = await env.DB.prepare(
      "SELECT id FROM saved_farms WHERE user_id = ? AND farm_id = ?"
    ).bind(user.id, farm_id).first();

    if (existing) {
      return new Response(JSON.stringify({
        success: true,
        message: "Already subscribed to this farm",
        saved_farm_id: existing.id
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Get client IP for consent tracking
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';

    // Save the farm with metadata and consent tracking
    const savedFarmId = generateUUID();
    const farmSlug = farm_name ? farm_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : null;

    await env.DB.prepare(`
      INSERT INTO saved_farms (
        id, user_id, farm_id, farm_name, farm_slug, farm_city, farm_state,
        farm_phone, farm_website, saved_at, consent_given_at, consent_ip_address, consent_version
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, 'v1')
    `).bind(
      savedFarmId,
      user.id,
      farm_id,
      farm_name || null,
      farmSlug,
      farm_city || null,
      farm_state || null,
      farm_phone || null,
      farm_website || null,
      clientIP
    ).run();

    // Invalidate Cloudflare Edge Cache for subscriber count endpoint
    // Ensures public count reflects new subscription immediately
    try {
      const cache = caches.default;
      const cacheUrl = new URL(`/api/farms/${farm_id}/subscriber-count`, request.url);
      const deleted = await cache.delete(new Request(cacheUrl.toString()));
      if (deleted) {
        console.log(`✅ Cache invalidated for farm ${farm_id} after subscription`);
      } else {
        console.log(`ℹ️ No cache entry found for farm ${farm_id}`);
      }
    } catch (cacheError) {
      console.error(`⚠️ Cache invalidation failed for farm ${farm_id}:`, cacheError);
      // Non-critical: user is subscribed, cache will refresh on next request
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Subscribed to farm updates successfully",
      saved_farm_id: savedFarmId
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Save farm error:", error);
    return new Response(JSON.stringify({
      error: "Failed to save farm",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

// POST /api/farms/unsave - Unsave a farm
async function handleUnsaveFarm(request, env, method) {
  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Verify Clerk JWT
    const clerkUser = await verifyClerkToken(request, env);
    
    // Get D1 user ID
    const user = await env.DB.prepare(
      "SELECT id FROM users WHERE clerk_user_id = ?"
    ).bind(clerkUser.userId).first();

    if (!user) {
      return new Response(JSON.stringify({
        error: "User not found"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Parse request body
    const body = await request.json();
    const { farm_id } = body;

    if (!farm_id) {
      return new Response(JSON.stringify({ error: "farm_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Delete the saved farm
    const result = await env.DB.prepare(
      "DELETE FROM saved_farms WHERE user_id = ? AND farm_id = ?"
    ).bind(user.id, farm_id).run();

    // Invalidate cache for this farm's subscriber count
    try {
      const cache = caches.default;
      const cacheUrl = new URL(`/api/farms/${farm_id}/subscriber-count`, request.url);
      const deleted = await cache.delete(new Request(cacheUrl.toString()));
      if (deleted) {
        console.log(`✅ Cache invalidated for farm ${farm_id} after unsubscription`);
      } else {
        console.log(`ℹ️ No cache entry found for farm ${farm_id}`);
      }
    } catch (cacheError) {
      console.error(`⚠️ Cache invalidation failed for farm ${farm_id}:`, cacheError);
      // Non-critical - don't fail the request
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Farm unsaved successfully",
      rows_deleted: result.changes || 0
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Unsave farm error:", error);
    return new Response(JSON.stringify({
      error: "Failed to unsave farm",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

// GET /api/farms/saved - Get user's saved farms
async function handleGetSavedFarms(request, env, method) {
  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Verify Clerk JWT
    const clerkUser = await verifyClerkToken(request, env);
    console.log(`📋 Getting saved farms for Clerk user: ${clerkUser.userId}`);
    
    // Get D1 user ID
    const user = await env.DB.prepare(
      "SELECT id, email FROM users WHERE clerk_user_id = ?"
    ).bind(clerkUser.userId).first();

    if (!user) {
      console.error(`❌ User not found for clerk_user_id: ${clerkUser.userId}`);
      return new Response(JSON.stringify({
        saved_farms: [],
        count: 0,
        message: "User not found"
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log(`✅ User found: ${user.id} (${user.email})`);

    // Get saved farms (farm metadata is stored in saved_farms table)
    const query = `
      SELECT 
        id as saved_farm_id,
        saved_at,
        notify_on_hours_change,
        notify_on_opening_change,
        notify_on_status_change,
        farm_id,
        farm_name,
        farm_slug,
        farm_city,
        farm_state,
        farm_phone,
        farm_website
      FROM saved_farms
      WHERE user_id = ?
      ORDER BY saved_at DESC
    `;

    const result = await env.DB.prepare(query).bind(user.id).all();
    console.log(`📊 Found ${result.results?.length || 0} saved farms for user ${user.id}`);

    return new Response(JSON.stringify({
      saved_farms: result.results || [],
      count: result.results?.length || 0
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("❌ Get saved farms error:", error);
    return new Response(JSON.stringify({
      error: "Failed to get saved farms",
      message: error.message,
      saved_farms: [],
      count: 0
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

// GET /api/user/preferences - Get user notification preferences
async function handleGetUserPreferences(request, env, method) {
  console.log('🔔 handleGetUserPreferences called, method:', method);

  if (method !== "GET") {
    console.log('🔔 Method not GET, returning 405');
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Temporary: Return success to test routing
  console.log('🔔 TESTING: Returning test response');
  return new Response(JSON.stringify({
    message: "Endpoint is working!",
    timestamp: new Date().toISOString()
  }), {
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });

  try {
    console.log('🔔 Verifying Clerk token...');
    const clerkUser = await verifyClerkToken(request, env);
    console.log('🔔 Clerk user verified:', clerkUser.userId);

    const user = await env.DB.prepare(
      "SELECT id FROM users WHERE clerk_user_id = ?"
    ).bind(clerkUser.userId).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Get or create user preferences
    let prefs = await env.DB.prepare(
      "SELECT * FROM user_preferences WHERE user_id = ?"
    ).bind(user.id).first();

    if (!prefs) {
      // Create default preferences
      await env.DB.prepare(`
        INSERT INTO user_preferences (user_id, first_subscription_consent_shown, email_notifications_enabled)
        VALUES (?, 0, 1)
      `).bind(user.id).run();

      prefs = {
        user_id: user.id,
        first_subscription_consent_shown: 0,
        email_notifications_enabled: 1,
        consent_version: 'v1'
      };
    }

    return new Response(JSON.stringify({
      preferences: prefs
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    return new Response(JSON.stringify({
      error: "Failed to get user preferences",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

// PUT /api/user/preferences - Update user notification preferences
async function handleUpdateUserPreferences(request, env, method) {
  if (method !== "PUT") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const clerkUser = await verifyClerkToken(request, env);

    const user = await env.DB.prepare(
      "SELECT id FROM users WHERE clerk_user_id = ?"
    ).bind(clerkUser.userId).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const body = await request.json();
    const { first_subscription_consent_shown, email_notifications_enabled } = body;

    // Update preferences
    await env.DB.prepare(`
      INSERT INTO user_preferences (user_id, first_subscription_consent_shown, email_notifications_enabled, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        first_subscription_consent_shown = COALESCE(excluded.first_subscription_consent_shown, first_subscription_consent_shown),
        email_notifications_enabled = COALESCE(excluded.email_notifications_enabled, email_notifications_enabled),
        updated_at = datetime('now')
    `).bind(
      user.id,
      first_subscription_consent_shown !== undefined ? first_subscription_consent_shown : null,
      email_notifications_enabled !== undefined ? email_notifications_enabled : null
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: "Preferences updated successfully"
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    return new Response(JSON.stringify({
      error: "Failed to update preferences",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

/* === EMAIL NOTIFICATION SYSTEM === */

/**
 * Sends a farm update notification email via Resend API.
 *
 * Email service: Resend (resend.com)
 * Rate limits: Resend free tier has sending limits (check resend.com/pricing)
 *
 * @param {Object} env - Cloudflare Worker environment (needs RESEND_API_KEY)
 * @param {string} subscriberEmail - Recipient's email address
 * @param {Object} farmData - Farm info (name, city, state, phone, website, slug)
 * @param {Object} changes - What changed (type, opening_date, closing_date, etc.)
 * @returns {Promise<Object>} {success: boolean, messageId?: string, error?: string}
 */
async function sendFarmUpdateEmail(env, subscriberEmail, farmData, changes) {
  if (!env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  const emailBody = generateEmailHTML(farmData, changes);
  
  const emailData = {
    from: env.FROM_EMAIL || "PickAFarm <notifications@pickafarm.com>",
    to: subscriberEmail,
    subject: `Update: ${farmData.name} - ${changes.type}`,
    html: emailBody,
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      return { success: false, error: error };
    }

    const result = await response.json();
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generates HTML email template for farm update notifications.
 *
 * Uses inline CSS for maximum email client compatibility.
 * Template includes farm branding colors (#2d5016 green theme).
 *
 * @param {Object} farmData - Farm information
 * @param {Object} changes - Changes to highlight in email
 * @returns {string} HTML email body
 */
function generateEmailHTML(farmData, changes) {
  const changeDetails = [];

  // Build list of changes in user-friendly format
  if (changes.opening_date) {
    changeDetails.push(`<li><strong>Opening Date:</strong> ${changes.opening_date.old || 'Not set'} → <strong>${changes.opening_date.new}</strong></li>`);
  }
  if (changes.closing_date) {
    changeDetails.push(`<li><strong>Closing Date:</strong> ${changes.closing_date.old || 'Not set'} → <strong>${changes.closing_date.new}</strong></li>`);
  }
  if (changes.hours) {
    changeDetails.push(`<li><strong>Hours Updated:</strong> ${changes.hours}</li>`);
  }

  // Inline CSS required for email client compatibility
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Farm Update Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #2d5016; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎄 Farm Update</h1>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
    <h2 style="color: #2d5016; margin-top: 0;">${farmData.name}</h2>
    
    <p>Good news! One of your saved farms has updated their information:</p>
    
    <ul style="background: white; padding: 20px; border-radius: 4px; border-left: 4px solid #2d5016;">
      ${changeDetails.join('')}
    </ul>
    
    <div style="margin-top: 30px;">
      <h3 style="color: #2d5016;">Farm Details:</h3>
      <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${farmData.city}, ${farmData.state}</p>
      ${farmData.phone ? `<p style="margin: 5px 0;"><strong>📞 Phone:</strong> ${farmData.phone}</p>` : ''}
      ${farmData.website ? `<p style="margin: 5px 0;"><strong>🌐 Website:</strong> <a href="${farmData.website}" style="color: #2d5016;">${farmData.website}</a></p>` : ''}
    </div>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
      <a href="https://pickafarm.com/farms/${farmData.slug}" 
         style="background-color: #2d5016; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
        View Farm Details
      </a>
    </div>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center;">
      <p>You're receiving this because you saved ${farmData.name} on PickAFarm.</p>
      <p><a href="https://pickafarm.com/saved-farms" style="color: #666;">Manage your saved farms</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/* === ZOHO FLOW INTEGRATION === */
// Endpoints designed for Zoho Flow automation workflows

/**
 * GET /api/farms/:farm_id/subscribers - Get list of farm subscribers.
 *
 * Protected endpoint for Zoho Flow to retrieve subscriber list.
 * Used in automation workflows to send custom notifications.
 *
 * Security: Requires WEBHOOK_SHARED_SECRET token.
 *
 * Returns only users who:
 * - Saved this specific farm
 * - Have opt_in_notifications = 1
 *
 * @param {Request} request - HTTP request
 * @param {Object} env - Cloudflare Worker environment
 * @param {string} method - HTTP method
 * @param {string} farmId - Farm's zoho_record_id
 * @returns {Promise<Response>} JSON with subscribers array and count
 */
async function handleGetSubscribers(request, env, method, farmId) {
  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Verify webhook token (reuse existing pattern)
    const url = new URL(request.url);
    const tokenFromHeader = request.headers.get("x-webhook-token");
    const tokenFromQuery = url.searchParams.get("token");
    const provided = tokenFromHeader || tokenFromQuery;
    
    if (!provided || provided !== env.WEBHOOK_SHARED_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get all users who saved this farm and opted in to notifications
    const query = `
      SELECT 
        u.email,
        u.first_name,
        u.last_name,
        sf.saved_at,
        sf.notify_on_hours_change,
        sf.notify_on_opening_change,
        sf.notify_on_status_change
      FROM saved_farms sf
      JOIN users u ON sf.user_id = u.id
      WHERE sf.farm_id = ?
        AND u.opt_in_notifications = 1
      ORDER BY sf.saved_at ASC
    `;

    const result = await env.DB.prepare(query).bind(farmId).all();

    return new Response(JSON.stringify({
      farm_id: farmId,
      subscribers: result.results || [],
      count: result.results?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Get subscribers error:", error);
    return new Response(JSON.stringify({
      error: "Failed to get subscribers",
      message: error.message,
      farm_id: farmId,
      subscribers: [],
      count: 0
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

/**
 * GET /api/farms/:farm_id/subscriber-count - Get public subscriber count.
 *
 * PUBLIC endpoint (no authentication required).
 * Displays how many users are watching this farm.
 *
 * CACHING: Results cached at Cloudflare Edge for 5 minutes.
 * Cache is invalidated when users save/unsave the farm.
 *
 * Used to display social proof on farm pages.
 *
 * @param {Request} request - HTTP request
 * @param {Object} env - Cloudflare Worker environment
 * @param {string} method - HTTP method
 * @param {string} farmId - Farm's zoho_record_id
 * @returns {Promise<Response>} JSON with subscriber_count and cached_at timestamp
 */
async function handleGetSubscriberCount(request, env, method, farmId) {
  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Leverage Cloudflare's global Edge Cache for fast responses
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);
    let cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      console.log(`✅ Cache HIT for farm ${farmId}`);
      return cachedResponse;
    }

    console.log(`❌ Cache MISS for farm ${farmId} - querying database`);

    // Cache miss: Query D1 for current subscriber count
    const query = `
      SELECT COUNT(*) as count
      FROM saved_farms
      WHERE farm_id = ?
    `;

    const result = await env.DB.prepare(query).bind(farmId).first();

    // Create response with cache headers
    const response = new Response(JSON.stringify({
      farm_id: farmId,
      subscriber_count: result?.count || 0,
      cached_at: new Date().toISOString()
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=300", // 5 minutes
        ...corsHeaders
      }
    });

    // Store in cache
    await cache.put(cacheKey, response.clone());
    console.log(`💾 Cached subscriber count for farm ${farmId}`);

    return response;
  } catch (error) {
    console.error("Get subscriber count error:", error);
    return new Response(JSON.stringify({
      error: "Failed to get subscriber count",
      message: error.message,
      farm_id: farmId,
      subscriber_count: 0
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

// GET /api/farms/stats - Get subscriber counts for multiple farms (bulk endpoint)
async function handleFarmsStats(request, env, method) {
  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  try {
    // Check cache first
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);
    let cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      console.log('✅ Cache HIT for bulk stats');
      return cachedResponse;
    }

    console.log('❌ Cache MISS for bulk stats - querying database');

    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids");

    if (!idsParam) {
      return new Response(JSON.stringify({
        error: "Missing 'ids' parameter",
        message: "Provide comma-separated farm IDs (e.g., ?ids=zcrm_123,zcrm_456)"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const farmIds = idsParam.split(",").map(id => id.trim()).filter(id => id);

    if (farmIds.length === 0) {
      return new Response(JSON.stringify({
        error: "No valid farm IDs provided"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (farmIds.length > 100) {
      return new Response(JSON.stringify({
        error: "Too many farm IDs",
        message: "Maximum 100 farm IDs allowed per request"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Build query with parameterized placeholders
    const placeholders = farmIds.map(() => "?").join(",");
    const query = `
      SELECT
        farm_id,
        COUNT(*) as subscriber_count
      FROM saved_farms
      WHERE farm_id IN (${placeholders})
      GROUP BY farm_id
    `;

    const result = await env.DB.prepare(query).bind(...farmIds).all();

    // Create map of farm_id -> subscriber_count
    const statsMap = {};
    result.results.forEach(row => {
      statsMap[row.farm_id] = row.subscriber_count;
    });

    // Ensure all requested farms have an entry (even if 0 subscribers)
    const stats = farmIds.map(id => ({
      farm_id: id,
      subscriber_count: statsMap[id] || 0
    }));

    const response = new Response(JSON.stringify({
      stats,
      count: stats.length,
      cached_at: new Date().toISOString()
    }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=300", // 5 minutes
        ...corsHeaders
      }
    });

    // Store in cache
    await cache.put(cacheKey, response.clone());
    console.log(`💾 Cached bulk stats for ${stats.length} farms`);

    return response;

  } catch (error) {
    console.error("Bulk stats error:", error);
    return new Response(JSON.stringify({
      error: "Failed to fetch farm stats",
      message: error.message,
      stats: []
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

// POST /api/notifications/send - Send notification emails (called by Zoho Flow)
async function handleSendNotifications(request, env, method) {
  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Verify webhook token
    const url = new URL(request.url);
    const tokenFromHeader = request.headers.get("x-webhook-token");
    const tokenFromQuery = url.searchParams.get("token");
    const provided = tokenFromHeader || tokenFromQuery;
    
    if (!provided || provided !== env.WEBHOOK_SHARED_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse request body
    const body = await request.json();
    const { farm_id, changes } = body;

    if (!farm_id) {
      return new Response(JSON.stringify({ error: "farm_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Get farm details
    const farm = await env.DB.prepare(`
      SELECT zoho_record_id, name, slug, city, state, phone, website, email
      FROM farms WHERE zoho_record_id = ?
    `).bind(farm_id).first();

    if (!farm) {
      return new Response(JSON.stringify({ error: "Farm not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Get subscribers who opted in
    const subscribers = await env.DB.prepare(`
      SELECT u.email, u.first_name, u.last_name
      FROM saved_farms sf
      JOIN users u ON sf.user_id = u.id
      WHERE sf.farm_id = ? AND u.opt_in_notifications = 1
    `).bind(farm_id).all();

    const emailResults = [];
    let successCount = 0;
    let failureCount = 0;

    // Send emails to all subscribers
    for (const subscriber of subscribers.results || []) {
      const result = await sendFarmUpdateEmail(env, subscriber.email, farm, changes);
      emailResults.push({
        email: subscriber.email,
        ...result
      });
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    // Log the notification
    const logId = generateUUID();
    await env.DB.prepare(`
      INSERT INTO notification_log (
        id, farm_id, notification_type, recipient_count,
        recipients_list, triggered_by, farm_changes,
        success_count, failure_count, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      logId,
      farm_id,
      changes.type || 'farm_update',
      subscribers.results?.length || 0,
      JSON.stringify(emailResults.map(r => r.email)),
      'zoho_flow',
      JSON.stringify(changes),
      successCount,
      failureCount
    ).run();

    return new Response(JSON.stringify({
      success: true,
      farm_id: farm_id,
      farm_name: farm.name,
      emails_sent: successCount,
      emails_failed: failureCount,
      total_subscribers: subscribers.results?.length || 0,
      log_id: logId,
      results: emailResults
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error("Send notifications error:", error);
    return new Response(JSON.stringify({
      error: "Failed to send notifications",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

/* =============================================
   MAIN REQUEST ROUTER
   =============================================

   Cloudflare Workers ES Module format export.
   All API requests are routed through this fetch handler.

   Architecture:
   - RESTful routing with pattern matching
   - CORS enabled for all endpoints
   - Authentication via Clerk JWT for protected routes
   - Webhook security via shared secret token

   Performance:
   - Edge caching for public endpoints (/subscriber-count, /stats)
   - D1 database for persistent storage
   - R2 bucket for image assets

   Environment variables required:
   - DB: D1 database binding
   - ASSETS_BUCKET: R2 bucket binding (for images)
   - ZOHO_*: OAuth credentials for Zoho CRM
   - CLERK_SECRET_KEY: For JWT verification
   - RESEND_API_KEY: For email notifications
   - WEBHOOK_SHARED_SECRET: For webhook security
   - CLOUDFLARE_DEPLOY_HOOK: For triggering rebuilds (optional)
*/

export default {
  async fetch(request, env, ctx) {
    // Generate correlation ID for request tracing
    const correlationId = crypto.randomUUID();
    const requestStartTime = Date.now();

    // Create a simple context object for passing correlationId to utilities
    const requestContext = {
      get: (key) => key === 'correlationId' ? correlationId : undefined,
      correlationId
    };

    // Create logger bound to this request
    const logger = createLogger(requestContext);

    const url = new URL(request.url);
    const method = request.method;

    // Log incoming request
    logger.info('Incoming request', {
      method,
      path: url.pathname,
      userAgent: request.headers.get('user-agent')
    });

    // Handle CORS preflight requests (OPTIONS method)
    if (method === "OPTIONS") {
      const response = new Response(null, { headers: corsHeaders });
      response.headers.set('X-Correlation-ID', correlationId);
      return response;
    }

    /* === ROUTE DEFINITIONS === */

    // PUBLIC ENDPOINTS (no authentication required)
    if (url.pathname === "/api/farms") {
      return handleFarms(request, env, method);
    }

    // IMPORTANT: Static routes must be defined before dynamic routes
    // Otherwise /api/farms/stats would match /api/farms/:id pattern
    if (url.pathname === "/api/farms/stats") {
      return handleFarmsStats(request, env, method);
    }

    if (url.pathname === "/api/cities") {
      return handleCities(request, env, method);
    }

    // Field options endpoints: /api/field-options or /api/field-options/:fieldName
    if (url.pathname.startsWith("/api/field-options")) {
      return handleFieldOptions(request, env, method, url);
    }

    if (url.pathname === "/api/search") {
      return handleSearch(request, env, method);
    }
    
    // DEBUG/TEST ENDPOINTS
    if (url.pathname === "/api/test-jwt") {
      // Test Clerk JWT authentication (requires valid token)
      try {
        const clerkUser = await verifyClerkToken(request, env);
        return new Response(JSON.stringify({
          success: true,
          userId: clerkUser.userId,
          email: clerkUser.email,
          sessionId: clerkUser.sessionId
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: error.message,
          stack: error.stack
        }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // AUTHENTICATED ENDPOINTS (require Clerk JWT)
    if (url.pathname === "/api/users/sync") {
      return handleUserSync(request, env, method);
    }

    if (url.pathname === "/api/users/update-location") {
      return handleUpdateUserLocation(request, env, method);
    }

    if (url.pathname === "/api/farms/save") {
      return handleSaveFarm(request, env, method);
    }

    if (url.pathname === "/api/farms/unsave") {
      return handleUnsaveFarm(request, env, method);
    }

    if (url.pathname === "/api/farms/saved") {
      return handleGetSavedFarms(request, env, method);
    }

    if (url.pathname === "/api/user/preferences") {
      console.log('🔔 Worker: User preferences endpoint hit, method:', method);
      if (method === "GET") {
        console.log('🔔 Worker: Calling handleGetUserPreferences');
        return handleGetUserPreferences(request, env, method);
      } else if (method === "PUT") {
        console.log('🔔 Worker: Calling handleUpdateUserPreferences');
        return handleUpdateUserPreferences(request, env, method);
      }
      console.log('🔔 Worker: Method not GET or PUT, falling through');
    }

    // DYNAMIC ROUTES (pattern matching with regex)
    // Pattern: /api/farms/:farm_id/subscribers
    const subscribersMatch = url.pathname.match(/^\/api\/farms\/([^\/]+)\/subscribers$/);
    if (subscribersMatch) {
      return handleGetSubscribers(request, env, method, subscribersMatch[1]);
    }

    // Pattern: /api/farms/:farm_id/subscriber-count (PUBLIC, cached)
    const subscriberCountMatch = url.pathname.match(/^\/api\/farms\/([^\/]+)\/subscriber-count$/);
    if (subscriberCountMatch) {
      return handleGetSubscriberCount(request, env, method, subscriberCountMatch[1]);
    }

    // ZOHO FLOW INTEGRATION
    if (url.pathname === "/api/notifications/send") {
      return handleSendNotifications(request, env, method);
    }

    // ZOHO CRM WEBHOOKS (secured with WEBHOOK_SHARED_SECRET)
    if (url.pathname === "/api/zoho-webhook") {
      return handleZohoWebhook(request, env, method);
    }

    if (url.pathname === "/api/zoho-delete") {
      return handleZohoDelete(request, env, method);
    }

    // MAGIC LINK AUTHENTICATION ENDPOINTS (Story 2.2)
    if (url.pathname === "/api/admin/magic-link") {
      return handleAdminMagicLink(request, env, method);
    }

    if (url.pathname === "/api/claim/validate-token") {
      return handleValidateToken(request, env, method);
    }

    if (url.pathname === "/api/webhooks/clerk") {
      return handleClerkWebhook(request, env, method);
    }

    // FARMER DASHBOARD ENDPOINTS (Story 2.3 - Protected with farmer authentication)
    if (url.pathname === "/api/farmer/dashboard") {
      // Test endpoint for farmer authentication middleware
      try {
        // Authenticate farmer (throws if not authorized)
        // (authenticateFarmer imported at top of file)
        const farmer = await authenticateFarmer(request, env);

        logger.info('Farmer authenticated successfully', {
          userId: farmer.userId,
          farmId: farmer.farmId,
          email: farmer.email
        });

        // Return farmer context
        return new Response(JSON.stringify({
          success: true,
          message: "Farmer dashboard access granted",
          farmer: {
            userId: farmer.userId,
            farmId: farmer.farmId,
            email: farmer.email,
            role: farmer.role
          },
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
            'X-Correlation-ID': correlationId
          }
        });
      } catch (error) {
        logger.error('Farmer authentication failed', {
          error: error.message,
          errorName: error.name
        });

        return handleAuthenticationError(error, correlationId);
      }
    }

    // REMOVED: Old test endpoint that was intercepting GET requests
    // This was causing a bug where only name, city, state, country were returned
    // The proper GET handler at line ~3540 returns ALL fields including description, postal_code, etc.

    if (url.pathname === "/api/farmer/overview") {
      // Story 2.4: Farmer Dashboard Overview Endpoint
      // Returns metrics, chart data, and quick stats for farmer dashboard home page
      try {
        // Authenticate farmer
        const farmer = await authenticateFarmer(request, env);

        logger.info('Fetching dashboard overview for farmer', {
          userId: farmer.userId,
          farmId: farmer.farmId
        });

        // Query farm data with verification status fields
        let farmData;
        try {
          farmData = await env.DB.prepare(`
            SELECT
              zoho_record_id as id,
              name,
              slug,
              logo_url as logoUrl,
              description,
              phone,
              email,
              website,
              monday_hours,
              tuesday_hours,
              wednesday_hours,
              thursday_hours,
              friday_hours,
              saturday_hours,
              sunday_hours,
              verified
            FROM farms
            WHERE zoho_record_id = ?
          `).bind(farmer.farmId).first();
        } catch (dbError) {
          logger.error('Database query failed for farm data', { error: dbError.message });
          return errorResponse(500, "Failed to fetch farm data", "Database error occurred", correlationId);
        }

        if (!farmData) {
          logger.error('Farm not found', { farmId: farmer.farmId });
          return errorResponse(404, "Farm not found", `No farm found with ID: ${farmer.farmId}`, correlationId);
        }

        // Calculate verification status (Story 2.5)
        const missingFields = [];

        // Check description
        if (!farmData.description || farmData.description.trim().length === 0) {
          missingFields.push('description');
        }

        // Check operating hours (at least one day should have hours)
        const hasOperatingHours = farmData.monday_hours || farmData.tuesday_hours ||
          farmData.wednesday_hours || farmData.thursday_hours ||
          farmData.friday_hours || farmData.saturday_hours || farmData.sunday_hours;
        if (!hasOperatingHours) {
          missingFields.push('operating_hours');
        }

        // Check contact info (at least one contact method required)
        const hasContactInfo = farmData.phone || farmData.email || farmData.website;
        if (!hasContactInfo) {
          missingFields.push('contact_info');
        }

        // Determine verification status
        const verificationStatus = missingFields.length === 0 ? 'Active' : 'Pending';

        const verification = {
          status: verificationStatus,
          missingFields: missingFields
        };

        // Query subscriber count
        let subscriberCount = 0;
        try {
          const subscribersResult = await env.DB.prepare(`
            SELECT COUNT(*) as count
            FROM saved_farms
            WHERE farm_id = ? AND active = 1
          `).bind(farmer.farmId).first();
          subscriberCount = subscribersResult?.count || 0;
        } catch (dbError) {
          logger.warn('Failed to query subscriber count', { error: dbError.message });
          // Non-critical, continue with 0
        }

        // Query recent broadcasts (Story 2.8+ - table may not exist yet)
        let broadcastCount = 0;
        let newSubscribersThisWeek = 0;
        try {
          const broadcastsResult = await env.DB.prepare(`
            SELECT COUNT(*) as count
            FROM broadcasts
            WHERE farm_id = ? AND created_at >= datetime('now', '-7 days')
          `).bind(farmer.farmId).first();
          broadcastCount = broadcastsResult?.count || 0;
        } catch (dbError) {
          logger.info('Broadcasts table not yet created (expected for Story 2.4)', { error: dbError.message });
          // Non-critical, table will be created in Story 2.8
        }

        // Query new subscribers this week
        try {
          const newSubsResult = await env.DB.prepare(`
            SELECT COUNT(*) as count
            FROM saved_farms
            WHERE farm_id = ? AND active = 1 AND created_at >= datetime('now', '-7 days')
          `).bind(farmer.farmId).first();
          newSubscribersThisWeek = newSubsResult?.count || 0;
        } catch (dbError) {
          logger.warn('Failed to query new subscribers', { error: dbError.message });
          // Non-critical, continue with 0
        }

        // Calculate days until opening (TODO: Add opening_date column to farms table)
        const daysUntilOpening = null;

        // Mock chart data (TODO: Replace with real analytics data in Story 2.12)
        const chartData = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return {
            date: date.toISOString().split('T')[0],
            views: Math.floor(Math.random() * 150) + 50 // Mock data: 50-200 views per day
          };
        });

        // Return dashboard overview response
        const response = {
          farm: {
            id: farmData.id,
            name: farmData.name,
            slug: farmData.slug,
            logoUrl: farmData.logoUrl || null,
            status: verificationStatus, // Story 2.5: Dynamic verification status
            rating: 0, // TODO: Calculate from reviews table
            reviewCount: 0 // TODO: Count from reviews table
          },
          verification: verification, // Story 2.5: Verification status and missing fields
          metrics: {
            subscribers: subscriberCount,
            pageViews: 0, // TODO: Implement analytics tracking (Story 2.12)
            rating: 0, // TODO: Calculate from reviews table
            daysUntilOpening
          },
          recentActivity: {
            broadcasts: broadcastCount,
            lastBroadcastDate: null, // TODO: Query last broadcast timestamp (Story 2.8)
            newSubscribersThisWeek
          },
          chartData
        };

        logger.info('Dashboard overview retrieved successfully', {
          farmId: farmer.farmId,
          subscribers: subscriberCount,
          broadcasts: broadcastCount
        });

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
            'X-Correlation-ID': correlationId
          }
        });
      } catch (error) {
        logger.error('Farmer dashboard overview fetch failed', {
          error: error.message,
          errorName: error.name,
          stack: error.stack
        });

        return handleAuthenticationError(error, correlationId);
      }
    }

    if (url.pathname === "/api/farmer/farm" && method === "GET") {
      // Story 2.5: Get Farm Data for Editing
      // Returns all editable farm fields for farmer dashboard edit form
      try {
        // Authenticate farmer
        const farmer = await authenticateFarmer(request, env);

        logger.info('Fetching farm data for editing', {
          userId: farmer.userId,
          farmId: farmer.farmId
        });

        // Query all editable farm fields
        let farmData;
        try {
          farmData = await env.DB.prepare(`
            SELECT
              name, slug, description,
              street, city, state, postal_code, country,
              phone, email, website,
              monday_hours, tuesday_hours, wednesday_hours,
              thursday_hours, friday_hours, saturday_hours, sunday_hours,
              categories, type, amenities, varieties,
              pet_friendly, price_range, payment_methods,
              opening_date, closing_date,
              latitude, longitude,
              verified, featured
            FROM farms
            WHERE zoho_record_id = ?
          `).bind(farmer.farmId).first();
        } catch (dbError) {
          logger.error('Database query failed for farm data', { error: dbError.message });
          return errorResponse(500, "Failed to fetch farm data", "Database error occurred", correlationId);
        }

        if (!farmData) {
          logger.error('Farm not found', { farmId: farmer.farmId });
          return errorResponse(404, "Farm not found", `No farm found with ID: ${farmer.farmId}`, correlationId);
        }

        // Debug logging for TEST FARM 2
        if (farmer.farmId === 'zcrm_38729000000440064' || farmData.name === 'TEST FARM 2') {
          logger.info('DEBUG: TEST FARM raw data from DB', {
            farmId: farmer.farmId,
            name: farmData.name,
            description: farmData.description,
            descriptionLength: farmData.description ? farmData.description.length : 0,
            descriptionType: typeof farmData.description,
            allFields: Object.keys(farmData).join(', ')
          });
        }

        // Format response for form population
        // Convert CSV strings to arrays for multi-select fields
        const response = {
          farm: {
            name: farmData.name || '',
            slug: farmData.slug || '',
            description: farmData.description || '',
            street: farmData.street || '',
            city: farmData.city || '',
            state: farmData.state || '',
            postal_code: farmData.postal_code || '',
            country: farmData.country || '',
            phone: farmData.phone || '',
            email: farmData.email || '',
            website: farmData.website || '',
            monday_hours: farmData.monday_hours || '',
            tuesday_hours: farmData.tuesday_hours || '',
            wednesday_hours: farmData.wednesday_hours || '',
            thursday_hours: farmData.thursday_hours || '',
            friday_hours: farmData.friday_hours || '',
            saturday_hours: farmData.saturday_hours || '',
            sunday_hours: farmData.sunday_hours || '',
            categories: farmData.categories ? farmData.categories.split(',').filter(c => c.trim()).map(c => c.trim()) : [],
            type: farmData.type || '',
            amenities: farmData.amenities ? farmData.amenities.split(',').filter(a => a.trim()).map(a => a.trim()) : [],
            varieties: farmData.varieties ? farmData.varieties.split(',').filter(v => v.trim()).map(v => v.trim()) : [],
            pet_friendly: Boolean(farmData.pet_friendly),
            price_range: farmData.price_range || '',
            payment_methods: farmData.payment_methods ? farmData.payment_methods.split(',').filter(p => p.trim()).map(p => p.trim()) : [],
            opening_date: farmData.opening_date || null,
            closing_date: farmData.closing_date || null,
            latitude: farmData.latitude, // Read-only
            longitude: farmData.longitude // Read-only
          }
        };

        // Calculate verification status for the form
        const missingFields = [];

        // Check description
        if (!farmData.description || farmData.description.trim().length === 0) {
          missingFields.push('description');
        }

        // Check operating hours (at least one day should have hours)
        const hasOperatingHours = farmData.monday_hours || farmData.tuesday_hours ||
          farmData.wednesday_hours || farmData.thursday_hours ||
          farmData.friday_hours || farmData.saturday_hours || farmData.sunday_hours;
        if (!hasOperatingHours) {
          missingFields.push('operating_hours');
        }

        // Check contact info (at least one contact method required)
        const hasContactInfo = farmData.phone || farmData.email || farmData.website;
        if (!hasContactInfo) {
          missingFields.push('contact_info');
        }

        // Determine verification status
        const verificationStatus = missingFields.length === 0 ? 'Active' : 'Pending';

        // Add verification to response
        response.verification = {
          status: verificationStatus,
          missingFields: missingFields
        };

        // Debug logging for TEST FARM 2 response
        if (farmer.farmId === 'zcrm_38729000000440064' || farmData.name === 'TEST FARM 2') {
          logger.info('DEBUG: TEST FARM response being sent', {
            farmId: farmer.farmId,
            hasDescription: !!response.farm.description,
            descriptionValue: response.farm.description,
            hasCategories: response.farm.categories.length > 0,
            categoriesCount: response.farm.categories.length,
            hasVarieties: response.farm.varieties.length > 0,
            varietiesValues: response.farm.varieties.join(', '),
            hasAmenities: response.farm.amenities.length > 0,
            amenitiesValues: response.farm.amenities.join(', ')
          });
        }

        logger.info('Farm data retrieved successfully for editing', {
          farmId: farmer.farmId,
          farmName: farmData.name,
          verificationStatus,
          missingFieldsCount: missingFields.length
        });

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
            'X-Correlation-ID': correlationId
          }
        });
      } catch (error) {
        logger.error('Farmer farm data fetch failed', {
          error: error.message,
          errorName: error.name
        });

        return handleAuthenticationError(error, correlationId);
      }
    }

    if (url.pathname === "/api/farmer/dashboard/stats" && method === "GET") {
      // Dashboard Stats Endpoint
      // Returns aggregated statistics for farmer dashboard overview
      try {
        const farmer = await authenticateFarmer(request, env);
        
        logger.info('Fetching dashboard stats', {
          userId: farmer.userId,
          farmId: farmer.farmId
        });

        // Step 1: Get farm data for completion calculation
        const farm = await env.DB.prepare(`
          SELECT 
            zoho_record_id,
            name,
            slug,
            description,
            logo_url,
            background_url,
            monday_hours, 
            tuesday_hours, 
            wednesday_hours, 
            thursday_hours,
            friday_hours, 
            saturday_hours, 
            sunday_hours,
            amenities,
            phone, 
            email, 
            website,
            verified
          FROM farms
          WHERE zoho_record_id = ?
        `).bind(farmer.farmId).first();

        if (!farm) {
          logger.error('Farm not found for stats', { farmId: farmer.farmId });
          return errorResponse(404, "Farm not found", `No farm found with ID: ${farmer.farmId}`, correlationId);
        }

        // Step 2: Calculate profile completion (5 critical tasks)
        const tasks = [
          { 
            id: 'description',
            completed: !!farm.description && farm.description.length >= 10 
          },
          { 
            id: 'photos',
            completed: !!farm.logo_url && !!farm.background_url 
          },
          { 
            id: 'hours',
            completed: [
              farm.monday_hours, farm.tuesday_hours, farm.wednesday_hours,
              farm.thursday_hours, farm.friday_hours, farm.saturday_hours, farm.sunday_hours
            ].some(h => h && h.length > 0)
          },
          { 
            id: 'contact',
            completed: !!farm.phone || !!farm.email || !!farm.website 
          },
          { 
            id: 'amenities',
            completed: !!farm.amenities && farm.amenities.length > 0 
          }
        ];
        
        const completedCount = tasks.filter(t => t.completed).length;
        const completionPercentage = Math.round((completedCount / tasks.length) * 100);

        // Step 3: Get subscriber count
        const subscriberResult = await env.DB.prepare(`
          SELECT COUNT(*) as subscriber_count
          FROM saved_farms
          WHERE farm_id = ?
        `).bind(farmer.farmId).first();
        
        const subscriberCount = subscriberResult?.subscriber_count || 0;

        // Step 4: Get views with trend (last 30 days vs previous 30 days)
        const viewsData = await env.DB.prepare(`
          SELECT 
            SUM(CASE 
              WHEN created_at >= datetime('now', '-30 days') 
              THEN 1 ELSE 0 
            END) as views_last_30,
            SUM(CASE 
              WHEN created_at >= datetime('now', '-60 days') 
               AND created_at < datetime('now', '-30 days') 
              THEN 1 ELSE 0 
            END) as views_prev_30
          FROM marketing_analytics
          WHERE farm_id = ? AND event_type = 'profile_view'
        `).bind(farmer.farmId).first();

        const viewsLast30 = viewsData?.views_last_30 || 0;
        const viewsPrev30 = viewsData?.views_prev_30 || 0;
        
        // Calculate trend percentage
        let viewsTrend = null;
        if (viewsPrev30 > 0) {
          const percentChange = ((viewsLast30 - viewsPrev30) / viewsPrev30) * 100;
          viewsTrend = percentChange > 0 
            ? `+${Math.round(percentChange)}%` 
            : `${Math.round(percentChange)}%`;
        } else if (viewsLast30 > 0) {
          viewsTrend = '+100%';
        }

        // Step 5: Determine verification status
        const missingFields = [];
        
        if (!farm.description || farm.description.length < 10) {
          missingFields.push('description');
        }
        
        if (!tasks[2].completed) {
          missingFields.push('operating_hours');
        }
        
        if (!tasks[3].completed) {
          missingFields.push('contact_info');
        }
        
        const verificationStatus = farm.verified === 1 
          ? 'Active' 
          : missingFields.length === 0 
            ? 'Active' 
            : 'Pending';

        // Step 6: Build response
        const response = {
          farmSlug: farm.slug,
          profileCompletion: {
            percentage: completionPercentage,
            completedTasks: completedCount,
            totalTasks: tasks.length,
            tasks: tasks // Include individual task completion status
          },
          verification: {
            status: verificationStatus,
            missingFields: missingFields.length > 0 ? missingFields : null
          },
          views: {
            total: viewsLast30,
            trend: viewsTrend,
            period: 'last 30 days'
          },
          subscribers: {
            total: subscriberCount,
            period: 'all time'
          }
        };

        logger.info('Dashboard stats retrieved successfully', {
          farmId: farmer.farmId,
          farmName: farm.name,
          completionPercentage,
          verificationStatus,
          subscriberCount,
          viewsLast30
        });

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
            'X-Correlation-ID': correlationId,
            'Cache-Control': 'private, max-age=60' // Cache for 1 minute
          }
        });

      } catch (error) {
        logger.error('Dashboard stats fetch failed', {
          error: error.message,
          errorName: error.name
        });

        return handleAuthenticationError(error, correlationId);
      }
    }

    if (url.pathname === "/api/farmer/farm" && method === "PUT") {
      // Story 2.5: Update Farm Data
      // Updates farm information from farmer dashboard and syncs to Zoho CRM
      try {
        // Authenticate farmer
        const farmer = await authenticateFarmer(request, env);

        logger.info('Updating farm data', {
          userId: farmer.userId,
          farmId: farmer.farmId
        });

        // Parse request body
        const data = await request.json();
        
        // Log incoming data for debugging
        logger.info('Incoming farm update data', {
          farmId: farmer.farmId,
          fields: Object.keys(data),
          hasName: 'name' in data,
          hasDescription: 'description' in data,
          hasCity: 'city' in data,
          hasState: 'state' in data
        });

        // Get existing farm data to merge with partial updates
        let existingFarm;
        try {
          existingFarm = await env.DB.prepare(`
            SELECT 
              name, description, street, city, state, postal_code, country,
              phone, email, website,
              monday_hours, tuesday_hours, wednesday_hours, thursday_hours,
              friday_hours, saturday_hours, sunday_hours,
              categories, type, amenities, varieties, pet_friendly, price_range, payment_methods,
              opening_date, closing_date,
              latitude, longitude
            FROM farms
            WHERE zoho_record_id = ?
          `).bind(farmer.farmId).first();
        } catch (dbError) {
          logger.error('Failed to query existing farm data', { error: dbError.message });
          return errorResponse(500, "Database error", "Failed to query existing farm data", correlationId);
        }

        if (!existingFarm) {
          logger.error('Farm not found for update', { farmId: farmer.farmId });
          return errorResponse(404, "Farm not found", `No farm found with ID: ${farmer.farmId}`, correlationId);
        }

        // Merge existing data with incoming partial updates
        // This allows partial updates while preserving existing values
        const updateData = {
          name: data.name !== undefined ? data.name : existingFarm.name,
          description: data.description !== undefined ? data.description : existingFarm.description,
          street: data.street !== undefined ? data.street : existingFarm.street,
          city: data.city !== undefined ? data.city : existingFarm.city,
          state: data.state !== undefined ? data.state : existingFarm.state,
          postal_code: data.postal_code !== undefined ? data.postal_code : existingFarm.postal_code,
          country: data.country !== undefined ? data.country : existingFarm.country,
          phone: data.phone !== undefined ? data.phone : existingFarm.phone,
          email: data.email !== undefined ? data.email : existingFarm.email,
          website: data.website !== undefined ? data.website : existingFarm.website,
          monday_hours: data.monday_hours !== undefined ? data.monday_hours : existingFarm.monday_hours,
          tuesday_hours: data.tuesday_hours !== undefined ? data.tuesday_hours : existingFarm.tuesday_hours,
          wednesday_hours: data.wednesday_hours !== undefined ? data.wednesday_hours : existingFarm.wednesday_hours,
          thursday_hours: data.thursday_hours !== undefined ? data.thursday_hours : existingFarm.thursday_hours,
          friday_hours: data.friday_hours !== undefined ? data.friday_hours : existingFarm.friday_hours,
          saturday_hours: data.saturday_hours !== undefined ? data.saturday_hours : existingFarm.saturday_hours,
          sunday_hours: data.sunday_hours !== undefined ? data.sunday_hours : existingFarm.sunday_hours,
          categories: data.categories !== undefined ? data.categories : (existingFarm.categories ? existingFarm.categories.split(', ').filter(Boolean) : []),
          type: data.type !== undefined ? data.type : existingFarm.type,
          amenities: data.amenities !== undefined ? data.amenities : (existingFarm.amenities ? existingFarm.amenities.split(', ').filter(Boolean) : []),
          varieties: data.varieties !== undefined ? data.varieties : (existingFarm.varieties ? existingFarm.varieties.split(', ').filter(Boolean) : []),
          pet_friendly: data.pet_friendly !== undefined ? data.pet_friendly : existingFarm.pet_friendly,
          price_range: data.price_range !== undefined ? data.price_range : existingFarm.price_range,
          payment_methods: data.payment_methods !== undefined ? data.payment_methods : (existingFarm.payment_methods ? existingFarm.payment_methods.split(', ').filter(Boolean) : []),
          opening_date: data.opening_date !== undefined ? data.opening_date : existingFarm.opening_date,
          closing_date: data.closing_date !== undefined ? data.closing_date : existingFarm.closing_date,
        };

        // Validate required fields only if they're being updated
        // Check for empty strings, null, or undefined
        if (data.name !== undefined) {
          if (!data.name || (typeof data.name === 'string' && data.name.trim().length === 0)) {
            logger.warn('Invalid name in farm update', { farmId: farmer.farmId, name: data.name });
            return errorResponse(400, "Validation error", "Farm name cannot be empty", correlationId);
          }
        }
        if (data.city !== undefined) {
          if (!data.city || (typeof data.city === 'string' && data.city.trim().length === 0)) {
            logger.warn('Invalid city in farm update', { farmId: farmer.farmId, city: data.city });
            return errorResponse(400, "Validation error", "City cannot be empty", correlationId);
          }
        }
        if (data.state !== undefined) {
          if (!data.state || (typeof data.state === 'string' && data.state.trim().length === 0)) {
            logger.warn('Invalid state in farm update', { farmId: farmer.farmId, state: data.state });
            return errorResponse(400, "Validation error", "State cannot be empty", correlationId);
          }
        }

        // Convert arrays to CSV strings for database storage
        const categoriesCSV = updateData.categories && Array.isArray(updateData.categories) ? updateData.categories.join(', ') : (updateData.categories || null);
        const amenitiesCSV = updateData.amenities && Array.isArray(updateData.amenities) ? updateData.amenities.join(', ') : (updateData.amenities || null);
        const varietiesCSV = updateData.varieties && Array.isArray(updateData.varieties) ? updateData.varieties.join(', ') : (updateData.varieties || null);
        const paymentMethodsCSV = updateData.payment_methods && Array.isArray(updateData.payment_methods) ? updateData.payment_methods.join(', ') : (updateData.payment_methods || null);

        // Update D1 database
        try {
          await env.DB.prepare(`
            UPDATE farms SET
              name = ?,
              description = ?,
              street = ?,
              city = ?,
              state = ?,
              postal_code = ?,
              country = ?,
              phone = ?,
              email = ?,
              website = ?,
              monday_hours = ?,
              tuesday_hours = ?,
              wednesday_hours = ?,
              thursday_hours = ?,
              friday_hours = ?,
              saturday_hours = ?,
              sunday_hours = ?,
              categories = ?,
              type = ?,
              amenities = ?,
              varieties = ?,
              pet_friendly = ?,
              price_range = ?,
              payment_methods = ?,
              opening_date = ?,
              closing_date = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE zoho_record_id = ?
          `).bind(
            updateData.name,
            updateData.description,
            updateData.street,
            updateData.city,
            updateData.state,
            updateData.postal_code,
            updateData.country,
            updateData.phone,
            updateData.email,
            updateData.website,
            updateData.monday_hours,
            updateData.tuesday_hours,
            updateData.wednesday_hours,
            updateData.thursday_hours,
            updateData.friday_hours,
            updateData.saturday_hours,
            updateData.sunday_hours,
            categoriesCSV,
            updateData.type,
            amenitiesCSV,
            varietiesCSV,
            updateData.pet_friendly,
            updateData.price_range,
            paymentMethodsCSV,
            updateData.opening_date,
            updateData.closing_date,
            farmer.farmId
          ).run();

          logger.info('Farm data updated in D1', { farmId: farmer.farmId });
        } catch (dbError) {
          logger.error('Failed to update farm in D1', { error: dbError.message });
          return errorResponse(500, "Database error", "Failed to update farm data", correlationId);
        }

        // Sync to Zoho CRM (Story 2.5)
        try {
          const accessToken = await zohoAccessToken(env);
          const dc = env.ZOHO_DC || 'com';
          // Remove 'zcrm_' prefix from farmId for Zoho API
          const zohoId = farmer.farmId.replace('zcrm_', '');
          const zohoApiUrl = `https://www.zohoapis.${dc}/crm/v3/Accounts/${zohoId}`;

          // Build Zoho payload with only fields that were actually updated
          const zohoData = {};
          
          // Only include fields that were in the original request (partial update)
          if (data.name !== undefined) zohoData.Account_Name = updateData.name;
          if (data.description !== undefined) zohoData.Description = updateData.description;
          if (data.street !== undefined) zohoData.Billing_Street = updateData.street;
          if (data.city !== undefined) zohoData.Billing_City = updateData.city;
          if (data.state !== undefined) zohoData.Billing_State = updateData.state;
          if (data.postal_code !== undefined) zohoData.Billing_Code = updateData.postal_code;
          if (data.country !== undefined) zohoData.Billing_Country = updateData.country;
          if (data.phone !== undefined) zohoData.Phone = updateData.phone;
          if (data.email !== undefined) zohoData.Email = updateData.email;
          if (data.website !== undefined) zohoData.Website = updateData.website;
          if (data.monday_hours !== undefined) zohoData.Monday = updateData.monday_hours;
          if (data.tuesday_hours !== undefined) zohoData.Tuesday = updateData.tuesday_hours;
          if (data.wednesday_hours !== undefined) zohoData.Wednesday = updateData.wednesday_hours;
          if (data.thursday_hours !== undefined) zohoData.Thursday = updateData.thursday_hours;
          if (data.friday_hours !== undefined) zohoData.Friday = updateData.friday_hours;
          if (data.saturday_hours !== undefined) zohoData.Saturday = updateData.saturday_hours;
          if (data.sunday_hours !== undefined) zohoData.Sunday = updateData.sunday_hours;
          
          // Zoho expects arrays for these multi-select fields
          if (data.categories !== undefined) zohoData.Type_of_Farm = Array.isArray(updateData.categories) ? updateData.categories : [];
          if (data.type !== undefined) zohoData.Services_Type = updateData.type ? (Array.isArray(updateData.type) ? updateData.type : [updateData.type]) : [];
          if (data.amenities !== undefined) zohoData.Amenities = Array.isArray(updateData.amenities) ? updateData.amenities : [];
          if (data.varieties !== undefined) zohoData.Varieties = Array.isArray(updateData.varieties) ? updateData.varieties : [];
          if (data.pet_friendly !== undefined) zohoData.Pet_Friendly = updateData.pet_friendly ? 'TRUE' : 'FALSE';
          if (data.price_range !== undefined) zohoData.Price_Range = updateData.price_range;
          if (data.payment_methods !== undefined) zohoData.Payment_Methods = Array.isArray(updateData.payment_methods) ? updateData.payment_methods : [];

          // Only sync to Zoho if there are fields to update
          if (Object.keys(zohoData).length > 0) {
            const zohoResponse = await fetch(zohoApiUrl, {
              method: 'PUT',
              headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ data: [zohoData] })
            });

            if (!zohoResponse.ok) {
              const errorText = await zohoResponse.text();
              logger.error('Zoho CRM sync failed', {
                status: zohoResponse.status,
                error: errorText,
                farmId: farmer.farmId
              });
              // Don't fail the request, just log the error
              // D1 update succeeded, which is the primary concern
            } else {
              logger.info('Farm data synced to Zoho CRM', { farmId: farmer.farmId });
            }
          } else {
            logger.info('No fields to sync to Zoho CRM (partial update with no changes)', { farmId: farmer.farmId });
          }
        } catch (zohoError) {
          logger.error('Zoho CRM sync error', {
            error: zohoError.message,
            farmId: farmer.farmId
          });
          // Don't fail the request, just log the error
        }

        // Check if address changed (trigger geocoding if needed)
        const addressChanged =
          (data.street !== undefined && existingFarm.street !== updateData.street) ||
          (data.city !== undefined && existingFarm.city !== updateData.city) ||
          (data.state !== undefined && existingFarm.state !== updateData.state) ||
          (data.postal_code !== undefined && existingFarm.postal_code !== updateData.postal_code);

        if (addressChanged && env.GOOGLE_MAPS_API_KEY) {
          logger.info('Address changed, triggering geocoding', { farmId: farmer.farmId });

          try {
            const address = `${updateData.street || ''}, ${updateData.city || ''}, ${updateData.state || ''} ${updateData.postal_code || ''}`.trim();
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${env.GOOGLE_MAPS_API_KEY}`;

            const geocodeResponse = await fetch(geocodeUrl);
            const geocodeData = await geocodeResponse.json();

            if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
              const location = geocodeData.results[0].geometry.location;

              await env.DB.prepare(`
                UPDATE farms SET
                  latitude = ?,
                  longitude = ?,
                  place_id = ?
                WHERE zoho_record_id = ?
              `).bind(
                location.lat,
                location.lng,
                geocodeData.results[0].place_id,
                farmer.farmId
              ).run();

              logger.info('Geocoding successful, coordinates updated', {
                farmId: farmer.farmId,
                lat: location.lat,
                lng: location.lng
              });
            } else {
              logger.warn('Geocoding failed', {
                farmId: farmer.farmId,
                status: geocodeData.status
              });
            }
          } catch (geocodeError) {
            logger.error('Geocoding error', {
              error: geocodeError.message,
              farmId: farmer.farmId
            });
            // Don't fail the request, geocoding is optional
          }
        }

        // Calculate updated verification status (use merged data)
        const missingFields = [];
        if (!updateData.description || updateData.description.trim().length === 0) {
          missingFields.push('description');
        }
        const hasOperatingHours = updateData.monday_hours || updateData.tuesday_hours ||
          updateData.wednesday_hours || updateData.thursday_hours ||
          updateData.friday_hours || updateData.saturday_hours || updateData.sunday_hours;
        if (!hasOperatingHours) {
          missingFields.push('operating_hours');
        }
        const hasContactInfo = updateData.phone || updateData.email || updateData.website;
        if (!hasContactInfo) {
          missingFields.push('contact_info');
        }

        const verificationStatus = missingFields.length === 0 ? 'Active' : 'Pending';
        const isVerified = missingFields.length === 0;

        // Update the verified field in D1 if farm is now complete
        if (isVerified) {
          try {
            await env.DB.prepare(`
              UPDATE farms SET
                verified = 1,
                featured = 1
              WHERE zoho_record_id = ?
            `).bind(farmer.farmId).run();

            logger.info('Farm marked as verified and featured', { farmId: farmer.farmId });

            // Also update Zoho CRM with verification status
            try {
              const accessToken = await zohoAccessToken(env);
              const dc = env.ZOHO_DC || 'com';
              const zohoId = farmer.farmId.replace('zcrm_', '');
              const zohoApiUrl = `https://www.zohoapis.${dc}/crm/v3/Accounts/${zohoId}`;

              const zohoVerificationUpdate = {
                Verified: true,
                Featured: true
              };

              await fetch(zohoApiUrl, {
                method: 'PUT',
                headers: {
                  'Authorization': `Zoho-oauthtoken ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: [zohoVerificationUpdate] })
              });

              logger.info('Zoho CRM updated with verified status', { farmId: farmer.farmId });
            } catch (zohoError) {
              logger.error('Failed to update Zoho verification status', {
                error: zohoError.message,
                farmId: farmer.farmId
              });
              // Don't fail the request, D1 update succeeded
            }
          } catch (dbError) {
            logger.error('Failed to update verified status in D1', { error: dbError.message });
            // Don't fail the main request
          }
        }

        logger.info('Farm update completed', {
          farmId: farmer.farmId,
          verificationStatus,
          missingFieldsCount: missingFields.length,
          isVerified
        });

        // Return success response with updated verification status
        return new Response(JSON.stringify({
          success: true,
          verification: {
            status: verificationStatus,
            missingFields: missingFields
          }
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
            'X-Correlation-ID': correlationId
          }
        });
      } catch (error) {
        logger.error('Farmer farm update failed', {
          error: error.message,
          errorName: error.name,
          stack: error.stack
        });

        return handleAuthenticationError(error, correlationId);
      }
    }

    // FARMER IMAGE UPLOAD ENDPOINT
    if (url.pathname === "/api/farmer/farm/images" && method === "POST") {
      // Story 2.5: Upload Farm Images (Logo and Cover Photo)
      // Uploads images to R2 and updates D1 database
      try {
        // Authenticate farmer
        const farmer = await authenticateFarmer(request, env);

        logger.info('Uploading farm image', {
          userId: farmer.userId,
          farmId: farmer.farmId
        });

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get('file');
        const imageType = formData.get('imageType'); // 'logo' or 'background'

        if (!file || !(file instanceof File)) {
          return errorResponse(400, "Validation error", "File is required", correlationId);
        }

        if (!imageType || !['logo', 'background'].includes(imageType)) {
          return errorResponse(400, "Validation error", "imageType must be 'logo' or 'background'", correlationId);
        }

        // Validate file size (logo: 5MB max, background: 10MB max)
        const maxSize = imageType === 'logo' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          return errorResponse(400, "Validation error", `File size exceeds ${imageType === 'logo' ? '5MB' : '10MB'} limit`, correlationId);
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
          return errorResponse(400, "Validation error", "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed", correlationId);
        }

        // Convert File to ArrayBuffer
        const imageBuffer = await file.arrayBuffer();

        // Process and upload image using existing pipeline
        const { processImage } = await import('./lib/image-processor.js');
        const result = await processImage({
          imageBuffer: imageBuffer,
          farmId: farmer.farmId,
          imageType: imageType,
          bucket: env.ASSETS_BUCKET,
          cdnDomain: env.CDN_DOMAIN
        });

        // Update D1 database with new image URL
        const updateField = imageType === 'logo' ? 'logo_url' : 'background_url';
        const timestampField = imageType === 'logo' ? 'logo_updated_at' : 'background_updated_at';

        await env.DB.prepare(`
          UPDATE farms SET
            ${updateField} = ?,
            ${timestampField} = ?
          WHERE zoho_record_id = ?
        `).bind(result.url, new Date().toISOString(), farmer.farmId).run();

        logger.info('Farm image uploaded successfully', {
          farmId: farmer.farmId,
          imageType,
          url: result.url
        });

        return new Response(JSON.stringify({
          success: true,
          imageType,
          url: result.url,
          size: result.size
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
            'X-Correlation-ID': correlationId
          }
        });

      } catch (error) {
        logger.error('Farm image upload failed', {
          error: error.message,
          errorName: error.name
        });

        return handleAuthenticationError(error, correlationId);
      }
    }

    // ZOHO DEBUG ENDPOINTS
    if (url.pathname === "/api/zoho-debug") {
      return handleZohoDebug(request, env, method);
    }

    if (url.pathname === "/api/token-debug") {
      return handleTokenDebug(request, env, method);
    }

    if (url.pathname === "/api/test-zoho-fetch") {
      if (method !== "GET") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405, headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      try {
        const url = new URL(request.url);
        const recordId = url.searchParams.get("id") || "38729000000292133"; // Default to Quinn Farm

        const accessToken = await zohoAccessToken(env);
        const record = await zohoFetchAccount(env, accessToken, recordId);
        const attachments = await zohoFetchAttachments(env, accessToken, recordId);

        return new Response(JSON.stringify({
          success: true,
          record_id: recordId,
          full_record: record,
          logo1_field: record.Logo1,
          cover_field: record.Cover,
          logo1_type: typeof record.Logo1,
          cover_type: typeof record.Cover,
          attachments: attachments,
          attachments_count: attachments.length
        }, null, 2), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: "Test fetch failed",
          message: error.message
        }, null, 2), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // MONITORING DASHBOARD ENDPOINT
    // Provides monitoring metrics and statistics for admin dashboard
    if (url.pathname === "/api/admin/monitoring") {
      if (method !== "GET") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // Require admin API key for authentication
      const apiKey = request.headers.get('X-API-Key');
      const adminApiKey = env.ADMIN_API_KEY || env.GITHUB_TOKEN; // Fallback to GITHUB_TOKEN for now

      if (!adminApiKey || apiKey !== adminApiKey) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      try {
        // Import metrics module
        const { getBroadcastStats, getErrorRateStats, getActiveFarmerCount } = await import('./utils/metrics.js');

        // Get last successful build time from KV or env (placeholder for now)
        const lastSuccessfulBuild = env.LAST_BUILD_TIME || new Date().toISOString();

        // Get active farmer count
        const activeFarmerCount = await getActiveFarmerCount(env);

        // Get broadcast volume stats
        const broadcastVolume = await getBroadcastStats(env);

        // Get error rate stats for last 24h
        const errorRateStats = await getErrorRateStats(env, '24h');

        return new Response(JSON.stringify({
          lastSuccessfulBuild,
          activeFarmerCount,
          broadcastVolume,
          errorRate: {
            current: parseFloat(errorRateStats.errorRatePercent) / 100,
            trend: 'stable', // TODO: Calculate trend from historical data
            last24h: errorRateStats.trend.map(point => ({
              hour: point.timestamp,
              rate: point.value
            }))
          },
          averageRecipientsPerBroadcast: broadcastVolume.averageRecipientsPerBroadcast
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        console.error('❌ Monitoring dashboard error:', error);
        return new Response(JSON.stringify({
          error: "Failed to fetch monitoring data",
          message: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // REBUILD TRIGGER ENDPOINT
    // Triggers GitHub Actions workflow to rebuild the static site
    if (url.pathname === "/api/trigger-rebuild") {
      if (method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_EVENT } = env;

      if (!GITHUB_TOKEN) {
        return new Response(JSON.stringify({
          error: "GitHub token not configured"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      try {
        const owner = GITHUB_OWNER || 'RenaudDev';
        const repo = GITHUB_REPO || 'PickAFarm';
        const eventType = GITHUB_EVENT || 'rebuild-farms';

        console.log(`🔄 Triggering rebuild: ${owner}/${repo} (${eventType})`);

        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/dispatches`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github+json',
              'Content-Type': 'application/json',
              'User-Agent': 'PickAFarm-Worker'
            },
            body: JSON.stringify({
              event_type: eventType,
              client_payload: {
                reason: 'Manual trigger via API',
                triggered_at: new Date().toISOString(),
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`GitHub API error: ${response.status} - ${errorText}`);
          throw new Error(`GitHub API error: ${response.status}`);
        }

        console.log(`✅ Rebuild workflow triggered successfully`);

        return new Response(JSON.stringify({
          success: true,
          message: 'Rebuild workflow triggered',
          repository: `${owner}/${repo}`,
          event_type: eventType,
          triggered_at: new Date().toISOString()
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        console.error('Failed to trigger rebuild:', error);
        return new Response(JSON.stringify({
          error: 'Failed to trigger rebuild workflow',
          message: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // API DOCUMENTATION ROOT
    // Provides discoverable endpoint list for developers
    if (url.pathname === "/") {
      return new Response(JSON.stringify({
        message: "PickAFarm API",
        version: "2.1.0",
        endpoints: {
          public: {
            farms: "/api/farms",
            cities: "/api/cities", 
            search: "/api/search"
          },
          authenticated: {
            user_sync: "POST /api/users/sync",
            update_location: "POST /api/users/update-location",
            save_farm: "POST /api/farms/save",
            unsave_farm: "POST /api/farms/unsave",
            get_saved_farms: "GET /api/farms/saved"
          },
          webhooks: {
            zoho_webhook: "/api/zoho-webhook",
            zoho_delete: "/api/zoho-delete",
            get_subscribers: "GET /api/farms/:farm_id/subscribers",
            send_notifications: "POST /api/notifications/send",
            trigger_rebuild: "POST /api/trigger-rebuild"
          },
          debug: {
            zoho_debug: "/api/zoho-debug",
            token_debug: "/api/token-debug"
          },
          admin: {
            monitoring: "GET /api/admin/monitoring"
          }
        }
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Default response
    return new Response(JSON.stringify({ 
      error: "Not found", 
      available_endpoints: [
        "/api/farms",
        "/api/cities",
        "/api/search",
        "/api/users/sync",
        "/api/farms/save",
        "/api/farms/unsave",
        "/api/farms/saved",
        "/api/farms/:farm_id/subscribers",
        "/api/zoho-webhook",
        "/api/zoho-delete",
        "/api/trigger-rebuild",
        "/api/zoho-debug",
        "/api/token-debug"
      ] 
    }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};