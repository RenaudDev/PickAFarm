/**
 * PickAFarm API - Cloudflare Worker
 * - Serves farm data to web and mobile platforms
 * - Handles Zoho CRM webhooks for real-time updates
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for cross-origin requests (reads can be public)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-token",
    };

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path.startsWith("/api/")) {
        return await handleAPIRequest(request, env, path, corsHeaders);
      }

      // Root info
      return new Response(
        JSON.stringify({
          message: "PickAFarm API",
          version: "1.0.0",
          endpoints: {
            farms: "/api/farms",
            cities: "/api/cities",
            search: "/api/search",
            notifications: "/api/notifications",
            zoho_webhook: "/api/zoho-webhook",
            zoho_fields: "/api/zoho-fields",
          },
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (error) {
      console.error("API Error:", error);
      return new Response(
        JSON.stringify({ error: "Internal Server Error", message: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  },
};

/* ============================
   ROUTER
   ============================ */
async function handleAPIRequest(request, env, path, corsHeaders) {
  const method = request.method;

  // Normalize: strip "/api" at start, remove trailing slashes
  let apiPath = path.replace(/^\/api\b/, "");
  apiPath = apiPath.replace(/\/+$/, "");
  if (apiPath === "") apiPath = "/";

  switch (apiPath) {
    case "/farms":         return await handleFarms(request, env, method, corsHeaders);
    case "/cities":        return await handleCities(request, env, method, corsHeaders);
    case "/search":        return await handleSearch(request, env, method, corsHeaders);
    case "/notifications": return await handleNotifications(request, env, method, corsHeaders);
    case "/zoho-webhook":  return await handleZohoWebhook(request, env, method, corsHeaders);
    case "/zoho-fields":   return await handleZohoFields(request, env, method, corsHeaders);
    default:
      return new Response(
        JSON.stringify({ error: "Endpoint not found", apiPath }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
  }
}

/* ============================
   /api/farms
   ============================ */
async function handleFarms(request, env, method, corsHeaders) {
  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const url = new URL(request.url);
    const state = url.searchParams.get("state");
    const city = url.searchParams.get("city");
    const category = url.searchParams.get("category"); // reserved
    const limit = parseInt(url.searchParams.get("limit") || "50");

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
    if (city)  { query += " AND f.city  = ?"; params.push(city);  }

    query += " ORDER BY f.featured DESC, f.verified DESC, f.name ASC";
    query += " LIMIT ?";
    params.push(limit);

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all();

    return new Response(
      JSON.stringify({ farms: result.results || [], count: result.results?.length || 0, filters: { state, city, category, limit } }),
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

/* ============================
   /api/cities
   ============================ */
async function handleCities(request, env, method, corsHeaders) {
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

/* ============================
   /api/search (FTS)
   ============================ */
async function handleSearch(request, env, method, corsHeaders) {
  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const limit = parseInt(url.searchParams.get("limit") || "20");

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

/* ============================
   /api/notifications (placeholder)
   ============================ */
async function handleNotifications(request, env, method, corsHeaders) {
  return new Response(
    JSON.stringify({ message: "Notifications endpoint - coming soon", method }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}

/* ============================
   /api/zoho-webhook  (secured)
   ============================ */
async function handleZohoWebhook(request, env, method, corsHeaders) {
  // Allow GET for quick probe in browser
  if (method === "GET") {
    return new Response(JSON.stringify({ ok: true, route: "/api/zoho-webhook" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Require the shared secret for POSTs
  const url = new URL(request.url);
  const tokenFromHeader = request.headers.get("x-webhook-token");
  const tokenFromQuery  = url.searchParams.get("token");
  const provided = tokenFromHeader || tokenFromQuery;

  if (!provided || provided !== env.WEBHOOK_SHARED_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Bad JSON" }), {
      status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Zoho sends either { id } or { data: [{ id }] }
  const zohoId = payload?.data?.[0]?.id ?? payload?.id;
  if (!zohoId) {
    return new Response(JSON.stringify({ error: "Missing Zoho record id" }), {
      status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const accessToken = await zohoAccessToken(env);
    const record = await zohoFetchAccount(env, accessToken, zohoId);
    await upsertFarm(env, record);

    // Optional: trigger GitHub dispatch if configured
    if (env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPO && env.GITHUB_EVENT) {
      await triggerGithub(env, { zoho_record_id: zohoId, reason: "zoho-account-updated" });
    }

    return new Response(JSON.stringify({ ok: true, id: zohoId }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("Zoho webhook error:", e);
    return new Response(
      JSON.stringify({ error: "Zoho webhook failed", message: e.message || String(e) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

/* ============================
   /api/zoho-fields
   ============================ */
async function handleZohoFields(request, env, method, corsHeaders) {
  if (method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const token = await zohoAccessToken(env);
    const fRes = await fetch("https://www.zohoapis.com/crm/v3/settings/fields?module=Accounts", {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
    });
    if (!fRes.ok) throw new Error(`Zoho fields HTTP ${fRes.status}`);
    const fields = await fRes.json();

    const simplified = (fields.fields || []).map((f) => ({
      api_name: f.api_name,
      field_label: f.field_label,
      data_type: f.data_type,
    }));

    return new Response(JSON.stringify({ count: simplified.length, fields: simplified }, null, 2), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

/* ============================
   ZOHO HELPERS
   ============================ */
async function zohoAccessToken(env) {
  const url = new URL("https://accounts.zoho.com/oauth/v2/token");
  url.searchParams.set("grant_type", "refresh_token");
  url.searchParams.set("client_id", env.ZOHO_CLIENT_ID);
  url.searchParams.set("client_secret", env.ZOHO_CLIENT_SECRET);
  url.searchParams.set("refresh_token", env.ZOHO_REFRESH_TOKEN);

  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error(`Zoho token HTTP ${res.status}`);
  const j = await res.json();
  if (!j.access_token) throw new Error("Zoho: no access_token");
  return j.access_token;
}

async function zohoFetchAccount(env, token, id) {
  const fields = [
    "Account_Name","Website","Phone","Email",
    "Billing_Street","Billing_City","Billing_State","Billing_Code","Billing_Country",
    "Description","Google_My_Business","Facebook","Instagram","PlaceID",
    "Type_of_Farm","Amenities","Varieties","Payment_Methods","Services_Type",
    "Pet_Friendly","Year_Established","Open_Date","Close_Day",
    "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
    "Latitude","Longitude","Price_Range","Slug"
  ];
  const url = `https://www.zohoapis.com/crm/v3/Accounts/${encodeURIComponent(id)}?fields=${fields.join(",")}`;
  const res = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
  if (!res.ok) throw new Error(`Zoho fetch HTTP ${res.status}`);
  const j = await res.json();
  const rec = j?.data?.[0];
  if (!rec) throw new Error("Zoho: empty record");
  return rec;
}

/* ============================
   NORMALIZATION HELPERS
   ============================ */
function toCSV(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

function parsePetFriendly(x) {
  if (x == null || x === "") return null; // unknown
  const s = String(x).trim().toLowerCase();
  if (["true", "yes", "1"].includes(s)) return 1;
  if (["false", "no", "0"].includes(s)) return 0;
  return null;
}

function parsePriceRange(pr) {
  if (!pr) return { min: null, max: null };
  const nums = Array.from(String(pr).matchAll(/(\d+(\.\d+)?)/g)).map((m) => parseFloat(m[1]));
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

/* ============================
   D1 UPSERT  (keeps verified/featured as-is)
   ============================ */
async function upsertFarm(env, rec) {
  const id = rec.id;
  const name = rec.Account_Name || "";

  const desiredSlug = rec.Slug ? slugify(rec.Slug) : slugify(name);
  const slug = await ensureUniqueSlug(env, desiredSlug, id);

  const categoriesCSV = toCSV(rec.Type_of_Farm);
  const typeCSV       = toCSV(rec.Services_Type);
  const amenitiesCSV  = toCSV(rec.Amenities);
  const varietiesCSV  = toCSV(rec.Varieties);
  const payCSV        = toCSV(rec.Payment_Methods);

  const pet = parsePetFriendly(rec.Pet_Friendly);
  const { min: priceMin, max: priceMax } = parsePriceRange(rec.Price_Range);

  const lat = rec.Latitude  !== "" && rec.Latitude  != null ? Number(rec.Latitude)  : null;
  const lng = rec.Longitude !== "" && rec.Longitude != null ? Number(rec.Longitude) : null;

  // Note: we intentionally do NOT include verified/featured/active here on update,
  // and we rely on table defaults for inserts (verified=0, featured=0, active=1).
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
    null, priceMin, priceMax, new Date().toISOString()
  ).run();
}

/* ============================
   GITHUB DISPATCH (optional)
   ============================ */
async function triggerGithub(env, payload) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event_type: env.GITHUB_EVENT, client_payload: payload }),
  });
  if (!res.ok) throw new Error(`GitHub dispatch HTTP ${res.status}`);
}
