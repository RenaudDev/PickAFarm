/* ============================
   Zoho CRM Integration Functions
   ============================ */

/**
 * Get a fresh access token using the refresh token
 */
async function zohoAccessToken(env) {
  const refreshToken = env.ZOHO_REFRESH_TOKEN;
  const clientId = env.ZOHO_CLIENT_ID;
  const clientSecret = env.ZOHO_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("Missing Zoho credentials: ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, or ZOHO_CLIENT_SECRET");
  }

  const tokenUrl = "https://accounts.zoho.com/oauth/v2/token";
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
 * Fetch an account record from Zoho CRM
 */
async function zohoFetchAccount(env, accessToken, accountId) {
  if (!accessToken) {
    throw new Error("Access token is required");
  }

  if (!accountId) {
    throw new Error("Account ID is required");
  }

  // Zoho CRM API endpoint for accounts
  const apiUrl = `https://www.zohoapis.com/crm/v2/Accounts/${accountId}`;

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

/**
 * Test the Zoho connection and return basic info
 */
async function testZohoConnection(env) {
  try {
    const accessToken = await zohoAccessToken(env);
    
    // Test with a simple API call to get user info
    const response = await fetch("https://www.zohoapis.com/crm/v2/users?type=CurrentUser", {
      method: "GET",
      headers: {
        "Authorization": `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Test API call failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      user: data.users?.[0]?.full_name || "Unknown",
      org: data.users?.[0]?.profile?.name || "Unknown"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}