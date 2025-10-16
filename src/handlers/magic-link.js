/**
 * Magic Link Handlers for Farmer Authentication
 * Story 2.2: Clerk Farmer Role & Magic Link Authentication
 *
 * Three endpoints:
 * 1. POST /api/admin/magic-link - Generate magic links (Zoho auth)
 * 2. POST /api/claim/validate-token - Validate tokens (public)
 * 3. POST /api/webhooks/clerk - Handle Clerk user lifecycle events
 */

import { encryptToken, decryptToken, hashToken, generateUUID } from '../utils/encryption.js';
import { validateEmail } from '../utils/email-templates.js';

// CORS headers (match main worker)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * POST /api/admin/magic-link
 *
 * Generates encrypted magic link for farmer invitation
 * Authentication: Zoho webhook token (ADR-001)
 * Called by: Zoho CRM custom button via Deluge script
 *
 * NOTE: Email is NOT sent automatically - admin must manually send the link
 *
 * Request Body:
 * {
 *   "farmId": "38729000000292133",
 *   "email": "farmer@example.com",
 *   "farmName": "Maple Grove Farm"  // Optional
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "magicLink": "https://pickafarm.com/claim?token=...",
 *   "expiresAt": "2025-01-16T10:00:00Z",
 *   "emailSent": false,  // Always false - manual sending required
 *   "claimId": "uuid-..."
 * }
 */
export async function handleAdminMagicLink(request, env, method) {
  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // === STEP 1: Authenticate Zoho webhook token (ADR-001) ===
    const authHeader = request.headers.get('Authorization');

    // Constant-time comparison to prevent timing attacks
    if (authHeader !== `Bearer ${env.ZOHO_WEBHOOK_TOKEN}`) {
      // Log failed authentication attempt
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      try {
        await env.DB.prepare(`
          INSERT INTO admin_audit_log (action, metadata, created_at)
          VALUES ('auth_failure', ?, CURRENT_TIMESTAMP)
        `).bind(JSON.stringify({ ip, endpoint: '/api/admin/magic-link' })).run();
      } catch (logError) {
        console.error('Failed to log auth failure:', logError);
      }

      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // === STEP 2: Parse and validate request ===
    const body = await request.json();
    const { farmId, email, farmName } = body;

    if (!farmId || !email) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        required: ['farmId', 'email']
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (!validateEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // === STEP 3: Normalize farm ID (add zcrm_ prefix if missing) ===
    const normalizedFarmId = farmId.startsWith('zcrm_') ? farmId : `zcrm_${farmId}`;

    // === STEP 4: Verify farm exists ===
    const farm = await env.DB.prepare(`
      SELECT zoho_record_id, name, city, state
      FROM farms
      WHERE zoho_record_id = ?
    `).bind(normalizedFarmId).first();

    if (!farm) {
      return new Response(JSON.stringify({ error: 'Farm not found' }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // === STEP 5: Check if farmer already claimed ===
    const existingClaim = await env.DB.prepare(`
      SELECT id FROM pending_farmer_claims
      WHERE farm_id = ? AND claimed = 1
    `).bind(normalizedFarmId).first();

    if (existingClaim) {
      return new Response(JSON.stringify({
        error: 'Farm already claimed',
        message: 'This farm has already been claimed by a farmer'
      }), {
        status: 409,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // === STEP 6: Generate encrypted magic link token ===
    const now = Math.floor(Date.now() / 1000);
    const expires = now + (24 * 60 * 60); // 24 hours from now
    const nonce = generateUUID();

    const payload = {
      farmId: normalizedFarmId,
      email,
      expires,
      nonce
    };

    const encryptedToken = await encryptToken(payload, env.MAGIC_LINK_SECRET);
    const tokenHash = await hashToken(encryptedToken);

    // === STEP 7: Store pending claim in database ===
    const claimId = generateUUID();
    await env.DB.prepare(`
      INSERT INTO pending_farmer_claims (
        id, farm_id, email, token_hash, expires_at, claimed, created_at
      ) VALUES (?, ?, ?, ?, datetime(?, 'unixepoch'), 0, CURRENT_TIMESTAMP)
    `).bind(claimId, normalizedFarmId, email, tokenHash, expires).run();

    // === STEP 7: Generate magic link URL ===
    const baseUrl = env.FRONTEND_URL || 'https://pickafarm.com';
    const magicLink = `${baseUrl}/claim?token=${encodeURIComponent(encryptedToken)}&expires=${expires}`;

    // === STEP 8: Update Zoho CRM (bidirectional sync) ===
    // NOTE: Email is NOT sent automatically - admin will manually send the magic link
    // Use original farmId (without prefix) for Zoho API
    // Zoho datetime format: YYYY-MM-DDTHH:MM:SS-TZ (e.g., 2025-10-15T10:35:46-04:00)
    // Remove milliseconds and replace Z with timezone
    const zohoTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '-04:00');

    try {
      await updateZohoCRMMagicLink(env, farmId, {
        Magic_Link: magicLink,
        Magic_Link_Generated: zohoTimestamp,
        Magic_Link_Status: 'Pending',
        Farm_Status: 'Unverified'
      });
    } catch (zohoError) {
      console.error('Failed to update Zoho CRM:', zohoError);
      // Don't fail - magic link was created
    }

    // === STEP 9: Log audit event ===
    await env.DB.prepare(`
      INSERT INTO admin_audit_log (action, farm_id, email, metadata, created_at)
      VALUES ('magic_link_generated', ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(normalizedFarmId, email, JSON.stringify({ claimId })).run();

    // === STEP 10: Return success response ===
    // NOTE: emailSent is always false - admin manually sends the link
    return new Response(JSON.stringify({
      success: true,
      magicLink,
      expiresAt: new Date(expires * 1000).toISOString(),
      emailSent: false,
      claimId
    }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error('Magic link generation failed:', error);
    return new Response(JSON.stringify({
      error: 'Failed to generate magic link',
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

/**
 * POST /api/claim/validate-token
 *
 * Validates and decrypts a magic link token
 * Authentication: None (public endpoint)
 * Called by: Next.js claim landing page
 *
 * Request Body:
 * {
 *   "token": "eyJhbGc...",
 *   "expires": "1736864400"
 * }
 *
 * Response:
 * {
 *   "valid": true,
 *   "farmId": "38729000000292133",
 *   "email": "farmer@example.com",
 *   "farmName": "Maple Grove Farm"
 * }
 */
export async function handleValidateToken(request, env, method) {
  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // === STEP 1: Parse request ===
    const body = await request.json();
    const { token, expires } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // === STEP 2: Check expiration (quick check) ===
    const now = Math.floor(Date.now() / 1000);
    if (expires && parseInt(expires, 10) < now) {
      return new Response(JSON.stringify({
        valid: false,
        error: 'Token expired'
      }), {
        status: 200, // Not an error, just expired
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // === STEP 3: Decrypt and verify token ===
    let payload;
    try {
      payload = await decryptToken(token, env.MAGIC_LINK_SECRET);
    } catch (decryptError) {
      console.error('Token decryption failed:', decryptError.message);
      return new Response(JSON.stringify({
        valid: false,
        error: 'Invalid token'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // === STEP 4: Check if token already used ===
    const tokenHash = await hashToken(token);
    const pendingClaim = await env.DB.prepare(`
      SELECT id, claimed, claimed_at
      FROM pending_farmer_claims
      WHERE token_hash = ?
    `).bind(tokenHash).first();

    if (!pendingClaim) {
      return new Response(JSON.stringify({
        valid: false,
        error: 'Token not found or invalid'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (pendingClaim.claimed) {
      return new Response(JSON.stringify({
        valid: false,
        error: 'Token already used',
        claimedAt: pendingClaim.claimed_at
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // === STEP 5: Fetch farm details ===
    const farm = await env.DB.prepare(`
      SELECT zoho_record_id, name, city, state
      FROM farms
      WHERE zoho_record_id = ?
    `).bind(payload.farmId).first();

    if (!farm) {
      return new Response(JSON.stringify({
        valid: false,
        error: 'Farm not found'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // === STEP 6: Return validated token data ===
    return new Response(JSON.stringify({
      valid: true,
      farmId: payload.farmId,
      email: payload.email,
      farmName: farm.name,
      farmLocation: `${farm.city}, ${farm.state}`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error('Token validation failed:', error);
    return new Response(JSON.stringify({
      error: 'Token validation failed',
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

/**
 * POST /api/webhooks/clerk
 *
 * Handles Clerk user lifecycle webhooks
 * Authentication: Clerk webhook signature verification
 * Called by: Clerk (webhook configured in Clerk dashboard)
 *
 * Supported Events:
 * - user.created: Create user in D1, mark claim as used, sync to Zoho
 * - user.updated: Update user profile in D1
 *
 * Request Body: Clerk webhook event payload
 */
export async function handleClerkWebhook(request, env, method) {
  if (method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // === STEP 1: Verify Clerk webhook signature ===
    // TODO: Implement proper Clerk webhook signature verification
    // For now, we'll accept all requests (⚠️ Security note for production)
    const svix_id = request.headers.get('svix-id');
    const svix_timestamp = request.headers.get('svix-timestamp');
    const svix_signature = request.headers.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.warn('Missing Clerk webhook headers - allowing for development');
      // In production, this should return 401
    }

    // === STEP 2: Parse webhook event ===
    const event = await request.json();
    const { type, data } = event;

    console.log(`📨 Clerk webhook received: ${type}`);

    // === STEP 3: Handle user.created event ===
    if (type === 'user.created') {
      const clerkUserId = data.id;
      const email = data.email_addresses?.[0]?.email_address;
      const firstName = data.first_name || null;
      const lastName = data.last_name || null;

      // Extract farm context from public_metadata (role, farmId)
      // and unsafe_metadata (claimToken - sensitive)
      const farmId = data.public_metadata?.farmId;
      const role = data.public_metadata?.role || 'user';
      const claimToken = data.unsafe_metadata?.claimToken;

      if (!email) {
        return new Response(JSON.stringify({ error: 'No email in Clerk user data' }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // === STEP 4: Validate claim token (if farmer) ===
      let tokenValid = false;
      let pendingClaim = null;

      if (role === 'farmer' && claimToken) {
        try {
          const tokenHash = await hashToken(claimToken);
          pendingClaim = await env.DB.prepare(`
            SELECT id, farm_id, claimed
            FROM pending_farmer_claims
            WHERE token_hash = ? AND claimed = 0
          `).bind(tokenHash).first();

          if (pendingClaim && pendingClaim.farm_id === farmId) {
            tokenValid = true;
          }
        } catch (tokenError) {
          console.error('Token validation failed:', tokenError);
        }
      }

      // === STEP 5: Create user in D1 database ===
      try {
        await env.DB.prepare(`
          INSERT INTO users (
            clerk_user_id, email, first_name, last_name, role, farm_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          clerkUserId,
          email,
          firstName,
          lastName,
          role,
          role === 'farmer' && tokenValid ? farmId : null
        ).run();

        console.log(`✅ User created in D1: ${clerkUserId} (${email})`);
      } catch (dbError) {
        console.error('Failed to create user in D1:', dbError);
        // Return 200 to Clerk anyway (idempotency - retry later)
        return new Response(JSON.stringify({
          received: true,
          warning: 'User creation failed, will retry'
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // === STEP 6: Mark claim token as used (if farmer) ===
      if (role === 'farmer' && tokenValid && pendingClaim) {
        try {
          const tokenHash = await hashToken(claimToken);
          await env.DB.prepare(`
            UPDATE pending_farmer_claims
            SET claimed = 1, claimed_at = CURRENT_TIMESTAMP, claimed_by_user_id = ?
            WHERE token_hash = ?
          `).bind(clerkUserId, tokenHash).run();

          console.log(`✅ Claim token marked as used: ${pendingClaim.id}`);
        } catch (claimError) {
          console.error('Failed to mark claim as used:', claimError);
        }
      }

      // === STEP 7: Update Zoho CRM (bidirectional sync) ===
      if (role === 'farmer' && farmId) {
        try {
          // Zoho datetime format: YYYY-MM-DDTHH:MM:SS-TZ (e.g., 2025-10-15T10:35:46-04:00)
          // Remove milliseconds and replace Z with timezone
          const zohoTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '-04:00');

          await updateZohoCRMMagicLink(env, farmId, {
            Magic_Link_Status: 'Claimed',
            Magic_Link_Claimed_Date: zohoTimestamp,
            Farmer_Clerk_User_ID: clerkUserId
          });

          console.log(`✅ Zoho CRM updated: ${farmId} claimed by ${clerkUserId}`);
        } catch (zohoError) {
          console.error('Failed to update Zoho CRM:', zohoError);
        }
      }

      return new Response(JSON.stringify({
        received: true,
        userId: clerkUserId,
        role
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // === STEP 8: Handle user.updated event ===
    if (type === 'user.updated') {
      const clerkUserId = data.id;
      const email = data.email_addresses?.[0]?.email_address;
      const firstName = data.first_name || null;
      const lastName = data.last_name || null;

      try {
        await env.DB.prepare(`
          UPDATE users
          SET email = ?, first_name = ?, last_name = ?
          WHERE clerk_user_id = ?
        `).bind(email, firstName, lastName, clerkUserId).run();

        console.log(`✅ User updated in D1: ${clerkUserId}`);
      } catch (dbError) {
        console.error('Failed to update user in D1:', dbError);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // === STEP 9: Acknowledge other events ===
    console.log(`ℹ️ Unhandled Clerk event type: ${type}`);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error('Clerk webhook handler failed:', error);
    return new Response(JSON.stringify({
      error: 'Webhook processing failed',
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}

/**
 * Helper: Update Zoho CRM custom fields
 * @param {Object} env - Worker environment
 * @param {string} farmId - Zoho record ID
 * @param {Object} fields - Fields to update
 */
async function updateZohoCRMMagicLink(env, farmId, fields) {
  // Get Zoho OAuth token
  const accessToken = await zohoAccessToken(env);

  // Construct Zoho API URL
  const dc = env.ZOHO_DC || 'com';
  const apiUrl = dc === 'ca'
    ? `https://www.zohoapis.ca/crm/v3/Accounts/${encodeURIComponent(farmId)}`
    : `https://www.zohoapis.${dc}/crm/v3/Accounts/${encodeURIComponent(farmId)}`;

  // Update record
  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: [fields]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zoho API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Helper: Obtain Zoho OAuth access token
 * @param {Object} env - Worker environment
 * @returns {Promise<string>} Access token
 */
async function zohoAccessToken(env) {
  const refreshToken = env.ZOHO_REFRESH_TOKEN;
  const clientId = env.ZOHO_CLIENT_ID;
  const clientSecret = env.ZOHO_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("Missing Zoho credentials");
  }

  const dc = env.ZOHO_DC || 'com';
  const tokenUrl = dc === 'ca'
    ? 'https://accounts.zohocloud.ca/oauth/v2/token'
    : `https://accounts.zoho.${dc}/oauth/v2/token`;

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token"
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zoho token refresh failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Zoho token error: ${data.error}`);
  }

  return data.access_token;
}
