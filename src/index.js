/* ============================
   /api/zoho-webhook (SMOKE TEST: no auth, no DB, no GitHub)
   ============================ */
   async function handleZohoWebhook(request, env, method, corsHeaders) {
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
      const accessToken = await zohoAccessToken(env); // uses refresh/client/secret
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
  

