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
  const apiUrl = `https://www.zohoapis.${dc}/crm/v2/Accounts/${accountId}`;

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

async function testZohoConnection(env) {
  try {
    const accessToken = await zohoAccessToken(env);
    const dc = env.ZOHO_DC || 'com';
    
    // Test with accounts endpoint which matches your scope: ZohoCRM.modules.accounts.READ
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
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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
          ZOHO_DC: env.ZOHO_DC || "com (default)"
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
          ZOHO_DC: env.ZOHO_DC || "com (default)"
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

// Your existing webhook handler (converted to ES module)
async function handleZohoWebhook(request, env, method) {
  const url = new URL(request.url);

  // Allow a quick GET probe
  if (method === "GET") {
    return new Response(JSON.stringify({ ok: true, route: "/api/zoho-webhook", mode: "smoke-test" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // ---- Parse body robustly: JSON, form, or none (fallback to query) ----
  const ct = (request.headers.get("content-type") || "").toLowerCase();
  let payload = {};
  try {
    if (ct.includes("application/json")) {
      payload = await request.json();
    } else if (ct.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      payload = Object.fromEntries(new URLSearchParams(text));
    } else {
      // try to parse whatever (or leave {})
      const text = await request.text();
      try { payload = JSON.parse(text); } catch { payload = {}; }
    }
  } catch {
    payload = {};
  }

  // Accept id from JSON, form, or query string
  const zohoId =
    payload?.data?.[0]?.id ??
    payload?.id ??
    url.searchParams.get("id");

  if (!zohoId) {
    return new Response(JSON.stringify({ error: "Missing Zoho record id", hint: "send { id } in body or ?id=..." }), {
      status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Normalize ids (Zoho API expects numeric id; we return both)
  const rawId = String(zohoId);
  const apiId = rawId.replace(/^zcrm_/, "");

  // ---- Only hit Zoho; do not touch D1/GitHub in smoke-test ----
  try {
    const accessToken = await zohoAccessToken(env);
    const record = await zohoFetchAccount(env, accessToken, apiId);

    // Return a compact summary so you see it works
    const summary = {
      id: record.id || `zcrm_${apiId}`,
      Account_Name: record.Account_Name ?? null,
      Phone: record.Phone ?? null,
      Email: record.Email ?? null,
      Website: record.Website ?? null,
      City: record.Billing_City ?? null,
      State: record.Billing_State ?? null,
      Country: record.Billing_Country ?? null,
    };

    return new Response(JSON.stringify({ ok: true, source: "zoho", summary }, null, 2), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "Zoho fetch failed", message: String(e) }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
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

// API Handler Functions
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

    if (url.pathname === "/api/mapping-test") {
      return handleZohoMappingTest(request, env, method);
    }

    // Root endpoint
    if (url.pathname === "/") {
      return new Response(JSON.stringify({
        message: "PickAFarm API",
        version: "1.0.3",
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
        "/api/token-debug", 
        "/api/mapping-test"
      ] 
    }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};