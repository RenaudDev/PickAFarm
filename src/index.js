/* ============================
   Cloudflare Worker - ES Module Format with Production Webhook
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
    "Latitude","Longitude","Price_Range","Slug"
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

// Helper functions from production code
function toCSV(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

function parsePetFriendly(x) {
  if (x == null || x === "") return null;
  const s = String(x).trim().toLowerCase();
  if (["true","yes","1"].includes(s)) return 1;
  if (["false","no","0"].includes(s)) return 0;
  return null;
}

function parsePriceRange(pr) {
  if (!pr) return { min: null, max: null };
  const nums = Array.from(String(pr).matchAll(/(\d+(\.\d+)?)/g)).map(m => parseFloat(m[1]));
  if (!nums.length) return { min: null, max: null };
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function ensureUniqueSlug(env, base, id) {
  let candidate = base || "farm";
  let i = 2;
  while (true) {
    const row = await env.DB.prepare(
      "SELECT 1 FROM farms WHERE slug = ? AND zoho_record_id != ?"
    ).bind(candidate, id).first();
    if (!row) return candidate;
    candidate = `${base}-${i++}`;
  }
}

// D1 Upsert function from production code
async function upsertFarm(env, rec) {
  const id = rec.id; // zcrm_<id>
  const name = rec.Account_Name || "";

  const desiredSlug = rec.Slug ? slugify(rec.Slug) : slugify(name);
  const slug = await ensureUniqueSlug(env, desiredSlug, id);

  const categoriesCSV = toCSV(rec.Type_of_Farm);
  const typeCSV = toCSV(rec.Services_Type);
  const amenitiesCSV = toCSV(rec.Amenities);
  const varietiesCSV = toCSV(rec.Varieties);
  const payCSV = toCSV(rec.Payment_Methods);

  const pet = parsePetFriendly(rec.Pet_Friendly);
  const { min: priceMin, max: priceMax } = parsePriceRange(rec.Price_Range);

  const lat = rec.Latitude !== "" && rec.Latitude != null ? Number(rec.Latitude) : null;
  const lng = rec.Longitude !== "" && rec.Longitude != null ? Number(rec.Longitude) : null;

  const sql = `
INSERT INTO farms (
  zoho_record_id, name, slug,
  website, location_link, facebook, instagram, categories, established_in,
  opening_date, closing_date, type, amenities, varieties, pet_friendly, price_range, payment_methods,
  sunday_hours, monday_hours, tuesday_hours, wednesday_hours, thursday_hours, friday_hours, saturday_hours,
  description, street, city, postal_code, state, country, latitude, longitude, place_id, phone, email,
  city_id, price_range_min, price_range_max, zoho_last_sync
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
ON CONFLICT(zoho_record_id) DO UPDATE SET
  name=excluded.name, slug=excluded.slug,
  website=excluded.website, location_link=excluded.location_link, facebook=excluded.facebook, instagram=excluded.instagram,
  categories=excluded.categories, established_in=excluded.established_in, opening_date=excluded.opening_date, closing_date=excluded.closing_date,
  type=excluded.type, amenities=excluded.amenities, varieties=excluded.varieties, pet_friendly=excluded.pet_friendly,
  price_range=excluded.price_range, payment_methods=excluded.payment_methods,
  sunday_hours=excluded.sunday_hours, monday_hours=excluded.monday_hours, tuesday_hours=excluded.tuesday_hours,
  wednesday_hours=excluded.wednesday_hours, thursday_hours=excluded.thursday_hours, friday_hours=excluded.friday_hours, saturday_hours=excluded.saturday_hours,
  description=excluded.description, street=excluded.street, city=excluded.city, postal_code=excluded.postal_code,
  state=excluded.state, country=excluded.country, latitude=excluded.latitude, longitude=excluded.longitude, place_id=excluded.place_id,
  phone=excluded.phone, email=excluded.email, city_id=excluded.city_id, price_range_min=excluded.price_range_min, price_range_max=excluded.price_range_max,
  zoho_last_sync=excluded.zoho_last_sync, updated_at=CURRENT_TIMESTAMP;
`;

  await env.DB.prepare(sql).bind(
    id, name, slug,
    rec.Website ?? null, rec.Google_My_Business ?? null, rec.Facebook ?? null, rec.Instagram ?? null, categoriesCSV ?? null,
    rec.Year_Established ? Number(rec.Year_Established) : null,
    rec.Open_Date ?? null, rec.Close_Day ?? null, typeCSV ?? null, amenitiesCSV ?? null, varietiesCSV ?? null,
    pet, rec.Price_Range ?? null, payCSV ?? null,
    rec.Sunday ?? null, rec.Monday ?? null, rec.Tuesday ?? null, rec.Wednesday ?? null, rec.Thursday ?? null, rec.Friday ?? null, rec.Saturday ?? null,
    rec.Description ?? null, rec.Billing_Street ?? null, rec.Billing_City ?? null, rec.Billing_Code ?? null, rec.Billing_State ?? null, rec.Billing_Country ?? null,
    lat, lng, rec.PlaceID ?? null, rec.Phone ?? null, rec.Email ?? null,
    null, priceMin, priceMax
  ).run();
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

// Updated Production Webhook Handler
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
    // Step 1: Fetch from Zoho
    const accessToken = await zohoAccessToken(env);
    const record = await zohoFetchAccount(env, accessToken, apiId);
    record.id = d1Id; // ensure D1 uses zcrm_...

    // Step 2: Upsert to D1
    await upsertFarm(env, record);

    // Step 3: Trigger Cloudflare Pages rebuild
    if (env.CLOUDFLARE_DEPLOY_HOOK) {
      await fetch(env.CLOUDFLARE_DEPLOY_HOOK, { method: 'POST' });
    }

    // Step 4: Optional GitHub repository_dispatch
    if (env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPO && env.GITHUB_EVENT) {
      await triggerGithub(env, { zoho_record_id: d1Id, reason: "zoho-account-updated" });
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      id: d1Id,
      source: "zoho",
      database: "updated", 
      rebuild: env.CLOUDFLARE_DEPLOY_HOOK ? "triggered" : "not-configured"
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
        f.website, f.facebook, f.instagram, f.location_link,
        f.description, f.categories, f.type, f.amenities, f.varieties,
        f.pet_friendly, f.price_range, f.price_range_min, f.price_range_max,
        f.payment_methods,
        f.established_in, f.opening_date, f.closing_date,
        f.sunday_hours, f.monday_hours, f.tuesday_hours, f.wednesday_hours,
        f.thursday_hours, f.friday_hours, f.saturday_hours,
        f.verified, f.featured, f.active, f.updated_at
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

    const query = `
      SELECT 
        f.zoho_record_id as id,
        f.name, f.slug, f.street, f.description,
        f.city as city_name, f.state as state_province,
        farms_fts.rank
      FROM farms_fts
      JOIN farms f ON farms_fts.rowid = f.zoho_record_id
      WHERE farms_fts MATCH ? AND f.active = 1
      ORDER BY farms_fts.rank
      LIMIT ?
    `;

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(q, limit).all();

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
    
    if (url.pathname === "/api/zoho-webhook") {
      return handleZohoWebhook(request, env, method);
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
        version: "1.1.0",
        endpoints: {
          farms: "/api/farms",
          cities: "/api/cities", 
          search: "/api/search",
          zoho_webhook: "/api/zoho-webhook",
          zoho_debug: "/api/zoho-debug",
          token_debug: "/api/token-debug"
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
        "/api/zoho-webhook", 
        "/api/zoho-debug", 
        "/api/token-debug"
      ] 
    }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};