/* ============================
   Cloudflare Worker - ES Module Format
   ============================ */

// Zoho Integration Functions
async function zohoAccessToken(env) {
  const refreshToken = env.ZOHO_REFRESH_TOKEN;
  const clientId = env.ZOHO_CLIENT_ID;
  const clientSecret = env.ZOHO_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("Missing Zoho credentials: ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, or ZOHO_CLIENT_SECRET");
  }

  // Use the correct Zoho data center - for Canada, use zohocloud.ca for auth
  const dc = env.ZOHO_DC || 'com'; // You have 'ca' set in your env
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

async function zohoFetchAccount(env, accessToken, accountId) {
  if (!accessToken) {
    throw new Error("Access token is required");
  }

  if (!accountId) {
    throw new Error("Account ID is required");
  }

  // Use the correct Zoho data center
  const dc = env.ZOHO_DC || 'com'; // You have 'ca' set
  
  // Updated to use all the fields from your production handler
  const fields = [
    "Account_Name","Website","Phone","Email",
    "Billing_Street","Billing_City","Billing_State","Billing_Code","Billing_Country",
    "Description","Google_My_Business","Facebook","Instagram","PlaceID",
    "Type_of_Farm","Amenities","Varieties","Payment_Methods","Services_Type",
    "Pet_Friendly","Year_Established","Open_Date","Close_Day",
    "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
    "latitude","longitude","Price_Range","Slug","Featured","Verified"
  ];
  
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

  // Return the first record from the data array
  if (data.data && Array.isArray(data.data) && data.data.length > 0) {
    return data.data[0];
  }

  throw new Error("No account data found in response");
}

// Helper functions
function toCSV(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

// Simplified D1 Upsert function - only uses essential columns
async function upsertFarm(env, rec) {
  const d1Id = rec.id; // zcrm_<id>
  const name = rec.Account_Name || "";
  const slug = slugify(name);

  // Convert complex fields to strings
  const categories = toCSV(rec.Type_of_Farm);
  const type = toCSV(rec.Services_Type);
  const amenities = toCSV(rec.Amenities);
  const varieties = toCSV(rec.Varieties);

  // Convert payment methods to string if it's an array or object
  const paymentMethods = rec.Payment_Methods ? 
    (Array.isArray(rec.Payment_Methods) ? rec.Payment_Methods.join(', ') : String(rec.Payment_Methods)) : null;
  
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
  const petFriendly = rec.Pet_Friendly === "TRUE" ? 1 : (rec.Pet_Friendly === "FALSE" ? 0 : null);
  
  // Convert Featured and Verified: checkboxes (true = 1, false = 0)
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

  const sql = `
INSERT INTO farms (
  zoho_record_id, name, slug, website, phone, email, description, 
  street, city, postal_code, state, country, latitude, longitude,
  facebook, instagram, categories, type, amenities, varieties,
  pet_friendly, price_range, zoho_last_sync, updated_at,
  payment_methods, opening_date, closing_date,
  monday_hours, tuesday_hours, wednesday_hours,
  thursday_hours, friday_hours, saturday_hours, sunday_hours,
  featured, verified
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
  featured=excluded.featured, verified=excluded.verified;
`;

  // Handle coordinates - try Zoho first, then geocode if missing
  let lat = rec.latitude !== "" && rec.latitude != null ? Number(rec.latitude) : null;
  let lng = rec.longitude !== "" && rec.longitude != null ? Number(rec.longitude) : null;
  
  // If coordinates are missing, try to geocode from address
  if ((lat === null || lng === null) && rec.Billing_Street && rec.Billing_City) {
    try {
      const address = `${rec.Billing_Street}, ${rec.Billing_City}, ${rec.Billing_State || ''}, ${rec.Billing_Country || ''}`.trim();
      console.log(`Geocoding address: ${address}`);
      
      // Note: You'd need a geocoding service API key for this to work
      // For now, we'll just log and keep null values
      console.log(`Coordinates missing for ${name} - consider adding to Zoho CRM`);
    } catch (error) {
      console.error(`Geocoding failed for ${name}:`, error);
    }
  }

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
    featured, verified
  ).run();
}

// Delete function
async function deleteFarm(env, id) {
  const sql = "DELETE FROM farms WHERE zoho_record_id = ?";
  const result = await env.DB.prepare(sql).bind(id).run();
  return result;
}

// GitHub dispatch function (optional)
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

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-token",
};

// ============================
// Clerk JWT Verification
// ============================

// Base64 decode helper for Workers
function base64UrlDecode(str) {
  // Replace URL-safe characters with standard base64 characters
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (str.length % 4) {
    str += '=';
  }
  // Decode using TextDecoder (Workers-compatible)
  try {
    const binString = atob(str);
    return binString;
  } catch (e) {
    // Fallback for Workers if atob fails
    const bytes = Uint8Array.from(str, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
}

async function verifyClerkToken(request, env) {
  console.log("Verifying Clerk token...");
  
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Missing or invalid Authorization header");
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7);
  console.log("Token length:", token.length);
  
  // For now, we'll decode the JWT without full verification
  // In production, you should verify the signature with Clerk's public key
  try {
    const parts = token.split('.');
    console.log("JWT parts:", parts.length);
    
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }
    
    // Decode the payload (second part of JWT)
    console.log("Decoding payload...");
    const payloadStr = base64UrlDecode(parts[1]);
    console.log("Payload decoded, parsing JSON...");
    const payload = JSON.parse(payloadStr);
    console.log("Payload parsed:", { sub: payload.sub, exp: payload.exp });
    
    // Check expiration - temporarily disabled for testing
    const now = Date.now() / 1000;
    console.log("Checking expiration:", { exp: payload.exp, now, expired: payload.exp < now });
    
    // TODO: Re-enable expiration check after testing
    // if (payload.exp && payload.exp < now) {
    //   throw new Error("Token expired");
    // }
    
    return {
      userId: payload.sub,
      email: payload.email || payload.primary_email,
      sessionId: payload.sid
    };
  } catch (error) {
    console.error("JWT verification exception:", error.message, error.stack);
    throw new Error(`JWT verification failed: ${error.message}`);
  }
}

// ============================
// Helper: Generate UUID
// ============================
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Separate Delete Webhook Handler
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

  // Parse delete request body
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

  // Normalize: D1 PK uses zcrm_<id>
  const rawId = String(zohoId);
  const d1Id = rawId.startsWith("zcrm_") ? rawId : `zcrm_${rawId}`;

  try {
    // Delete from D1
    const deleteResult = await deleteFarm(env, d1Id);
    
    // Trigger Cloudflare Pages rebuild
    if (env.CLOUDFLARE_DEPLOY_HOOK) {
      await fetch(env.CLOUDFLARE_DEPLOY_HOOK, { method: 'POST' });
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
      rebuild: env.CLOUDFLARE_DEPLOY_HOOK ? "triggered" : "not-configured"
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

// Production Webhook Handler
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

  // Normalize: API wants numeric; D1 PK uses zcrm_<id>
  const rawId = String(zohoId);
  const apiId = rawId.replace(/^zcrm_/, "");
  const d1Id = rawId.startsWith("zcrm_") ? rawId : `zcrm_${rawId}`;

  try {
    // Step 1: Get current farm data (before update) to detect changes
    let oldFarm = null;
    try {
      oldFarm = await env.DB.prepare(
        "SELECT opening_date, closing_date FROM farms WHERE zoho_record_id = ?"
      ).bind(d1Id).first();
    } catch (e) {
      console.log("No existing farm found, this is a new farm");
    }

    // Step 2: Fetch from Zoho
    const accessToken = await zohoAccessToken(env);
    const record = await zohoFetchAccount(env, accessToken, apiId);
    record.id = d1Id; // ensure D1 uses zcrm_...

    // Step 3: Upsert to D1
    await upsertFarm(env, record);

    // Step 4: Check if opening_date changed and send notifications
    const newOpeningDate = record.Open_Date || null;
    const newClosingDate = record.Close_Day || null;
    const oldOpeningDate = oldFarm?.opening_date || null;
    const oldClosingDate = oldFarm?.closing_date || null;

    let notificationSent = false;
    if (oldFarm && (newOpeningDate !== oldOpeningDate || newClosingDate !== oldClosingDate)) {
      console.log("Opening/Closing date changed, sending notifications...");
      
      // Build changes object
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

      // Send notifications asynchronously (don't wait for it)
      try {
        // Get farm details for notification
        const farm = await env.DB.prepare(`
          SELECT zoho_record_id, name, slug, city, state, phone, website, email
          FROM farms WHERE zoho_record_id = ?
        `).bind(d1Id).first();

        // Get subscribers
        const subscribers = await env.DB.prepare(`
          SELECT u.email, u.first_name, u.last_name
          FROM saved_farms sf
          JOIN users u ON sf.user_id = u.id
          WHERE sf.farm_id = ? AND u.opt_in_notifications = 1
        `).bind(d1Id).all();

        if (subscribers.results && subscribers.results.length > 0) {
          console.log(`Sending to ${subscribers.results.length} subscribers`);
          
          // Send emails
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
            d1Id,
            changes.type,
            subscribers.results.length,
            JSON.stringify(emailResults.map(r => r.email)),
            'zoho_webhook_auto',
            JSON.stringify(changes),
            successCount,
            failureCount
          ).run();

          notificationSent = true;
          console.log(`Notifications sent: ${successCount} success, ${failureCount} failed`);
        } else {
          console.log("No subscribers to notify");
        }
      } catch (notifError) {
        console.error("Failed to send notifications:", notifError);
        // Don't fail the webhook if notifications fail
      }
    }

    // Step 5: Trigger Cloudflare Pages rebuild
    if (env.CLOUDFLARE_DEPLOY_HOOK) {
      await fetch(env.CLOUDFLARE_DEPLOY_HOOK, { method: 'POST' });
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      id: d1Id,
      source: "zoho",
      database: "updated", 
      rebuild: env.CLOUDFLARE_DEPLOY_HOOK ? "triggered" : "not-configured",
      notifications_sent: notificationSent
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (e) {
    console.error("Webhook FAILED:", e);
    return new Response(JSON.stringify({ 
      error: "Zoho webhook failed", 
      message: String(e),
      zoho_id: apiId,
      d1_id: d1Id
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

// API Handler Functions (your existing functions)
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
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    let query = `
      SELECT 
        f.zoho_record_id as id,
        f.name, f.slug, f.street,
        f.city as city_name, f.postal_code,
        f.state as state_province, f.country,
        f.latitude, f.longitude, f.phone, f.email,
        f.website, f.facebook, f.instagram,
        f.description, f.categories, f.type, f.amenities, f.varieties,
        f.pet_friendly, f.price_range,
        f.verified, f.featured, f.active, f.updated_at,
        f.payment_methods, f.opening_date, f.closing_date,
        f.monday_hours, f.tuesday_hours, f.wednesday_hours,
        f.thursday_hours, f.friday_hours, f.saturday_hours, f.sunday_hours
      FROM farms f
      WHERE f.active = 1
    `;

    const params = [];
    if (state) { query += " AND f.state = ?"; params.push(state); }
    if (city) { query += " AND f.city = ?"; params.push(city); }

    query += " ORDER BY f.featured DESC, f.verified DESC, f.name ASC";
    query += " LIMIT ?";
    params.push(limit);

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all();

    return new Response(
      JSON.stringify({
        farms: result.results || [],
        count: result.results?.length || 0,
        filters: { state, city, category, limit },
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

// ============================
// User Management Endpoints
// ============================

// POST /api/users/sync - Sync Clerk user to D1
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

    // Check if user already exists
    const existingUser = await env.DB.prepare(
      "SELECT id FROM users WHERE clerk_user_id = ?"
    ).bind(clerkUser.userId).first();

    if (existingUser) {
      // Update existing user
      await env.DB.prepare(`
        UPDATE users 
        SET email = ?, first_name = ?, last_name = ?, updated_at = datetime('now')
        WHERE clerk_user_id = ?
      `).bind(email, firstName, lastName, clerkUser.userId).run();

      return new Response(JSON.stringify({
        success: true,
        user_id: existingUser.id,
        action: "updated"
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    } else {
      // Create new user
      const newUserId = generateUUID();
      await env.DB.prepare(`
        INSERT INTO users (id, clerk_user_id, email, first_name, last_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(newUserId, clerkUser.userId, email, firstName, lastName).run();

      return new Response(JSON.stringify({
        success: true,
        user_id: newUserId,
        action: "created"
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
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

// ============================
// Farm Save/Unsave Endpoints
// ============================

// POST /api/farms/save - Save a farm
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
    const { farm_id } = body;

    if (!farm_id) {
      return new Response(JSON.stringify({ error: "farm_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Check if farm exists (farms table uses zoho_record_id as primary key)
    const farm = await env.DB.prepare(
      "SELECT zoho_record_id FROM farms WHERE zoho_record_id = ?"
    ).bind(farm_id).first();

    if (!farm) {
      return new Response(JSON.stringify({ error: "Farm not found" }), {
        status: 404,
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
        message: "Farm already saved",
        saved_farm_id: existing.id
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Save the farm
    const savedFarmId = generateUUID();
    await env.DB.prepare(`
      INSERT INTO saved_farms (id, user_id, farm_id, saved_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(savedFarmId, user.id, farm_id).run();

    return new Response(JSON.stringify({
      success: true,
      message: "Farm saved successfully",
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
    
    // Get D1 user ID
    const user = await env.DB.prepare(
      "SELECT id FROM users WHERE clerk_user_id = ?"
    ).bind(clerkUser.userId).first();

    if (!user) {
      return new Response(JSON.stringify({
        saved_farms: [],
        count: 0,
        message: "User not found"
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Get saved farms with full farm details
    const query = `
      SELECT 
        sf.id as saved_farm_id,
        sf.saved_at,
        sf.notify_on_hours_change,
        sf.notify_on_opening_change,
        sf.notify_on_status_change,
        f.zoho_record_id as farm_id,
        f.name as farm_name,
        f.slug as farm_slug,
        f.city as farm_city,
        f.state as farm_state,
        f.street as farm_street,
        f.phone as farm_phone,
        f.email as farm_email,
        f.website as farm_website,
        f.opening_date as farm_opening_date,
        f.closing_date as farm_closing_date,
        f.monday_hours as farm_monday_hours,
        f.tuesday_hours as farm_tuesday_hours,
        f.wednesday_hours as farm_wednesday_hours,
        f.thursday_hours as farm_thursday_hours,
        f.friday_hours as farm_friday_hours,
        f.saturday_hours as farm_saturday_hours,
        f.sunday_hours as farm_sunday_hours
      FROM saved_farms sf
      JOIN farms f ON sf.farm_id = f.zoho_record_id
      WHERE sf.user_id = ?
      ORDER BY sf.saved_at DESC
    `;

    const result = await env.DB.prepare(query).bind(user.id).all();

    return new Response(JSON.stringify({
      saved_farms: result.results || [],
      count: result.results?.length || 0
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Get saved farms error:", error);
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

// ============================
// Email Functions (Resend)
// ============================

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

function generateEmailHTML(farmData, changes) {
  const changeDetails = [];
  
  if (changes.opening_date) {
    changeDetails.push(`<li><strong>Opening Date:</strong> ${changes.opening_date.old || 'Not set'} → <strong>${changes.opening_date.new}</strong></li>`);
  }
  if (changes.closing_date) {
    changeDetails.push(`<li><strong>Closing Date:</strong> ${changes.closing_date.old || 'Not set'} → <strong>${changes.closing_date.new}</strong></li>`);
  }
  if (changes.hours) {
    changeDetails.push(`<li><strong>Hours Updated:</strong> ${changes.hours}</li>`);
  }

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

// ============================
// Zoho Flow Integration
// ============================

// GET /api/farms/:farm_id/subscribers - Get subscribers for a farm
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

// Main fetch handler (ES Module format)
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Route requests
    if (url.pathname === "/api/farms") {
      return handleFarms(request, env, method);
    }
    
    if (url.pathname === "/api/cities") {
      return handleCities(request, env, method);
    }
    
    if (url.pathname === "/api/search") {
      return handleSearch(request, env, method);
    }
    
    // Test endpoint to verify JWT
    if (url.pathname === "/api/test-jwt") {
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
    
    // User management
    if (url.pathname === "/api/users/sync") {
      return handleUserSync(request, env, method);
    }
    
    // Farm save/unsave operations
    if (url.pathname === "/api/farms/save") {
      return handleSaveFarm(request, env, method);
    }
    
    if (url.pathname === "/api/farms/unsave") {
      return handleUnsaveFarm(request, env, method);
    }
    
    if (url.pathname === "/api/farms/saved") {
      return handleGetSavedFarms(request, env, method);
    }
    
    // Dynamic route for subscribers: /api/farms/:farm_id/subscribers
    const subscribersMatch = url.pathname.match(/^\/api\/farms\/([^\/]+)\/subscribers$/);
    if (subscribersMatch) {
      return handleGetSubscribers(request, env, method, subscribersMatch[1]);
    }
    
    // Notification endpoint
    if (url.pathname === "/api/notifications/send") {
      return handleSendNotifications(request, env, method);
    }
    
    // Zoho webhooks
    if (url.pathname === "/api/zoho-webhook") {
      return handleZohoWebhook(request, env, method);
    }
    
    if (url.pathname === "/api/zoho-delete") {
      return handleZohoDelete(request, env, method);
    }
    
    if (url.pathname === "/api/zoho-debug") {
      return handleZohoDebug(request, env, method);
    }

    if (url.pathname === "/api/token-debug") {
      return handleTokenDebug(request, env, method);
    }

    // Root endpoint
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
            save_farm: "POST /api/farms/save",
            unsave_farm: "POST /api/farms/unsave",
            get_saved_farms: "GET /api/farms/saved"
          },
          webhooks: {
            zoho_webhook: "/api/zoho-webhook",
            zoho_delete: "/api/zoho-delete",
            get_subscribers: "GET /api/farms/:farm_id/subscribers",
            send_notifications: "POST /api/notifications/send"
          },
          debug: {
            zoho_debug: "/api/zoho-debug",
            token_debug: "/api/token-debug"
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
        "/api/zoho-debug", 
        "/api/token-debug"
      ] 
    }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};