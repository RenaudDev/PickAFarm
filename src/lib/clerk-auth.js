/**
 * Clerk JWT Authentication & Verification Module
 *
 * Implements proper JWT signature verification using Clerk's JWKS (JSON Web Key Set).
 * This module provides secure authentication for user and farmer endpoints.
 *
 * Key Features:
 * - RS256 cryptographic signature verification using Web Crypto API
 * - JWKS caching (1 hour TTL) to minimize API calls
 * - Graceful key rotation handling
 * - Farmer-specific role validation
 *
 * Security:
 * - Verifies JWT signature cryptographically (not just decoding)
 * - Validates token expiration
 * - Checks D1 database for role authorization
 *
 * @module clerk-auth
 */

/* === CONSTANTS === */

/**
 * JWKS cache time-to-live (1 hour in milliseconds)
 * Balances performance (fewer API calls) with security (key rotation support)
 */
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Maximum JWT token length (16KB)
 * Prevents DoS attacks via excessively large tokens
 */
const MAX_TOKEN_LENGTH = 16 * 1024; // 16KB

/* === JWKS CACHE === */

/**
 * Global JWKS cache with TTL
 * Persists across Worker requests in the same instance
 */
let jwksCache = {
  keys: null,
  expiresAt: 0
};

/* === BASE64 URL UTILITIES === */

/**
 * Decode base64url-encoded string to UTF-8 string
 *
 * Base64url is like base64 but URL-safe:
 * - Uses '-' instead of '+'
 * - Uses '_' instead of '/'
 * - No padding '='
 *
 * @param {string} str - Base64url-encoded string
 * @returns {string} Decoded UTF-8 string
 */
function base64UrlDecode(str) {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  const pad = base64.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error('Invalid base64url string');
    }
    base64 += new Array(5 - pad).join('=');
  }

  // Decode base64 to binary string
  const binaryString = atob(base64);

  // Convert binary string to UTF-8
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new TextDecoder().decode(bytes);
}

/**
 * Decode base64url-encoded string to Uint8Array
 *
 * Used for signature verification (signature is binary data)
 *
 * @param {string} str - Base64url-encoded string
 * @returns {Uint8Array} Decoded binary data
 */
function base64UrlDecodeToBytes(str) {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  const pad = base64.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error('Invalid base64url string');
    }
    base64 += new Array(5 - pad).join('=');
  }

  // Decode base64 to binary string
  const binaryString = atob(base64);

  // Convert to Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

/* === JWKS FETCHING & CACHING === */

/**
 * Fetch Clerk JWKS (JSON Web Key Set) public keys
 *
 * Clerk uses RS256 (RSA Signature with SHA-256) for JWT signing.
 * Public keys are published at the JWKS endpoint for verification.
 *
 * Keys are cached for 1 hour to minimize API calls.
 * Cache is invalidated on signature verification failure (key rotation).
 *
 * @param {Object} env - Cloudflare Worker environment
 * @param {string} env.CLERK_PUBLISHABLE_KEY - Clerk publishable key (for domain extraction)
 * @returns {Promise<Array>} Array of JWK public keys
 * @throws {Error} If JWKS fetch fails
 */
async function fetchClerkJWKS(env) {
  const now = Date.now();

  // Return cached keys if still valid
  if (jwksCache.keys && jwksCache.expiresAt > now) {
    console.log("✅ Using cached JWKS keys (expires in " + Math.round((jwksCache.expiresAt - now) / 1000) + "s)");
    return jwksCache.keys;
  }

  console.log("🔄 Fetching fresh JWKS keys from Clerk...");

  // Extract Clerk domain from publishable key or use default
  // Clerk publishable key format: pk_test_<domain>_<hash> or pk_live_<domain>_<hash>
  // For production, we'll use the standard JWKS endpoint
  const clerkDomain = env.CLERK_FRONTEND_API || 'https://clerk.pickafarm.com';
  const jwksUrl = `${clerkDomain}/.well-known/jwks.json`;

  console.log(`📡 JWKS endpoint: ${jwksUrl}`);

  try {
    const response = await fetch(jwksUrl);

    if (!response.ok) {
      throw new Error(`JWKS fetch failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.keys || !Array.isArray(data.keys) || data.keys.length === 0) {
      throw new Error('Invalid JWKS response: no keys found');
    }

    // Cache keys using configured TTL
    jwksCache.keys = data.keys;
    jwksCache.expiresAt = now + JWKS_CACHE_TTL_MS;

    console.log(`✅ JWKS keys fetched and cached (${data.keys.length} keys, expires in ${JWKS_CACHE_TTL_MS / 1000 / 60} minutes)`);

    return data.keys;
  } catch (error) {
    console.error("❌ Failed to fetch JWKS keys:", error.message);
    throw new Error(`JWKS fetch failed: ${error.message}`);
  }
}

/**
 * Invalidate JWKS cache
 *
 * Called when signature verification fails, allowing retry with fresh keys.
 * Handles Clerk key rotation gracefully.
 */
function invalidateJWKSCache() {
  console.log("🔄 Invalidating JWKS cache (key rotation or verification failure)");
  jwksCache.keys = null;
  jwksCache.expiresAt = 0;
}

/* === RSA PUBLIC KEY IMPORT === */

/**
 * Import RSA public key from JWK format
 *
 * Converts JWK (JSON Web Key) to CryptoKey for signature verification.
 * Uses Web Crypto API (Cloudflare Workers compatible).
 *
 * @param {Object} jwk - JSON Web Key
 * @param {string} jwk.kty - Key type (must be "RSA")
 * @param {string} jwk.n - RSA modulus (base64url-encoded)
 * @param {string} jwk.e - RSA exponent (base64url-encoded, usually "AQAB")
 * @param {string} jwk.alg - Algorithm (must be "RS256")
 * @param {string} jwk.use - Key usage (must be "sig" for signature)
 * @returns {Promise<CryptoKey>} Imported public key
 * @throws {Error} If key import fails
 */
async function importRSAPublicKey(jwk) {
  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      {
        kty: jwk.kty,
        n: jwk.n,
        e: jwk.e,
        alg: jwk.alg || 'RS256',
        ext: true
      },
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false, // Not extractable
      ['verify'] // Can only be used for verification
    );

    return key;
  } catch (error) {
    console.error("❌ Failed to import RSA public key:", error.message);
    throw new Error(`RSA key import failed: ${error.message}`);
  }
}

/* === JWT SIGNATURE VERIFICATION === */

/**
 * Verify JWT signature using Clerk JWKS
 *
 * Process:
 * 1. Parse JWT header to extract kid (key ID)
 * 2. Fetch JWKS from Clerk (cached)
 * 3. Find matching public key by kid
 * 4. Import RSA public key
 * 5. Verify signature using Web Crypto API (RS256)
 * 6. Decode and return payload if valid
 *
 * Security:
 * - Cryptographic signature verification (RS256)
 * - Validates token hasn't been tampered with
 * - Checks token expiration
 *
 * @param {string} token - JWT token
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Promise<Object>} Decoded JWT payload
 * @throws {Error} If signature verification fails
 */
async function verifyJWTSignature(token, env) {
  console.log("🔐 Verifying JWT signature cryptographically...");

  // JWT format: header.payload.signature
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error(`Invalid JWT format: ${parts.length} parts instead of 3`);
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Decode header
  let header;
  try {
    const headerStr = base64UrlDecode(headerB64);
    header = JSON.parse(headerStr);
  } catch (error) {
    throw new Error(`Failed to decode JWT header: ${error.message}`);
  }

  console.log("📋 JWT header:", {
    alg: header.alg,
    typ: header.typ,
    kid: header.kid?.substring(0, 20) + '...'
  });

  // Validate algorithm
  if (header.alg !== 'RS256') {
    throw new Error(`Unsupported algorithm: ${header.alg} (expected RS256)`);
  }

  // Extract key ID
  const kid = header.kid;
  if (!kid) {
    throw new Error('Missing kid (key ID) in JWT header');
  }

  // Fetch JWKS
  const jwks = await fetchClerkJWKS(env);

  // Find matching public key
  const jwk = jwks.find(key => key.kid === kid);

  if (!jwk) {
    console.error(`❌ No matching key found for kid: ${kid}`);
    console.log(`Available kids: ${jwks.map(k => k.kid).join(', ')}`);

    // Invalidate cache and retry once (handles key rotation)
    invalidateJWKSCache();
    const freshJwks = await fetchClerkJWKS(env);
    const retryJwk = freshJwks.find(key => key.kid === kid);

    if (!retryJwk) {
      throw new Error(`No matching public key found for kid: ${kid}`);
    }

    console.log("✅ Found key after cache refresh (key rotation detected)");
    return await verifyWithKey(token, parts, retryJwk);
  }

  return await verifyWithKey(token, parts, jwk);
}

/**
 * Verify JWT signature with a specific public key
 *
 * Helper function to avoid code duplication in verifyJWTSignature.
 *
 * @param {string} token - Full JWT token
 * @param {Array<string>} parts - JWT parts [header, payload, signature]
 * @param {Object} jwk - JSON Web Key
 * @returns {Promise<Object>} Decoded JWT payload
 * @throws {Error} If signature verification fails
 */
async function verifyWithKey(token, parts, jwk) {
  const [headerB64, payloadB64, signatureB64] = parts;

  // Import public key
  const publicKey = await importRSAPublicKey(jwk);

  // Prepare data for verification (header.payload)
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

  // Decode signature
  const signature = base64UrlDecodeToBytes(signatureB64);

  // Verify signature using Web Crypto API
  console.log("🔒 Verifying signature with Web Crypto API...");
  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    signature,
    data
  );

  if (!isValid) {
    console.error("❌ JWT signature verification failed");
    throw new Error('JWT signature verification failed');
  }

  console.log("✅ JWT signature verified successfully");

  // Decode payload
  let payload;
  try {
    const payloadStr = base64UrlDecode(payloadB64);
    payload = JSON.parse(payloadStr);
  } catch (error) {
    throw new Error(`Failed to decode JWT payload: ${error.message}`);
  }

  // Verify token expiration
  if (payload.exp) {
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      const expiredAgo = now - payload.exp;
      throw new Error(`Token expired ${expiredAgo} seconds ago`);
    }
    console.log(`✅ Token valid, expires in ${payload.exp - now} seconds`);
  }

  console.log("✅ JWT verification complete:", {
    sub: payload.sub?.substring(0, 20) + '...',
    exp: payload.exp,
    iss: payload.iss
  });

  return payload;
}

/* === AUTHENTICATION MIDDLEWARE === */

/**
 * Custom error classes for authentication failures
 */
class InvalidTokenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

class UserNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

class NotAFarmerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotAFarmerError';
  }
}

class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Authenticate any user (basic authentication)
 *
 * Validates JWT signature and queries D1 for user record.
 * Does NOT check role or farm_id (use authenticateFarmer for that).
 *
 * Use Cases:
 * - Existing authenticated endpoints (/api/saved-farms, /api/users/sync)
 * - Any endpoint requiring valid authentication
 *
 * @param {Request} request - HTTP request
 * @param {Object} env - Cloudflare Worker environment
 * @param {Object} env.DB - D1 database binding
 * @returns {Promise<Object>} User context: { userId, email, role }
 * @throws {InvalidTokenError} If token is missing, invalid, or expired
 * @throws {UserNotFoundError} If user not found in D1 database
 * @throws {DatabaseError} If database query fails
 */
async function authenticateUser(request, env) {
  console.log("🔐 Authenticating user...");

  // Extract token from Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new InvalidTokenError("Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7);
  console.log(`📋 Token received, length: ${token.length}`);

  // Validate token length (prevent DoS attacks)
  if (token.length > MAX_TOKEN_LENGTH) {
    throw new InvalidTokenError(`Token too large: ${token.length} bytes (max: ${MAX_TOKEN_LENGTH})`);
  }

  // Verify JWT signature
  let payload;
  try {
    payload = await verifyJWTSignature(token, env);
  } catch (error) {
    throw new InvalidTokenError(`JWT verification failed: ${error.message}`);
  }

  // Extract user ID from JWT claims
  const userId = payload.sub;
  if (!userId) {
    throw new InvalidTokenError("Missing sub (user ID) in JWT payload");
  }

  console.log(`👤 Authenticated user: ${userId.substring(0, 20)}...`);

  // Query D1 for user record
  let user;
  try {
    const result = await env.DB.prepare(
      'SELECT clerk_user_id, email, role, farm_id FROM users WHERE clerk_user_id = ?'
    ).bind(userId).first();

    user = result;
  } catch (error) {
    console.error("❌ Database query failed:", error.message);
    throw new DatabaseError(`Database query failed: ${error.message}`);
  }

  // Check if user exists in D1
  if (!user) {
    console.error(`❌ User not found in database: ${userId}`);
    throw new UserNotFoundError("User not found in database");
  }

  console.log(`✅ User authenticated: ${user.email} (role: ${user.role || 'user'})`);

  // Return user context
  return {
    userId: user.clerk_user_id,
    email: user.email,
    role: user.role || 'user'
  };
}

/**
 * Authenticate farmer user (farmer-specific authentication)
 *
 * Validates JWT signature, queries D1, and verifies farmer role.
 *
 * Requirements:
 * - Valid JWT signature
 * - User exists in D1 database
 * - User has role='farmer'
 * - User has farm_id (not null)
 *
 * Use Cases:
 * - All /api/farmer/* endpoints
 * - Farmer dashboard API routes
 *
 * @param {Request} request - HTTP request
 * @param {Object} env - Cloudflare Worker environment
 * @param {Object} env.DB - D1 database binding
 * @returns {Promise<Object>} Farmer context: { userId, farmId, email, role }
 * @throws {InvalidTokenError} If token is missing, invalid, or expired
 * @throws {UserNotFoundError} If user not found in D1 database
 * @throws {NotAFarmerError} If user is not a farmer or has no farm_id
 * @throws {DatabaseError} If database query fails
 */
async function authenticateFarmer(request, env) {
  console.log("🔐 Authenticating farmer...");

  // Extract token from Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new InvalidTokenError("Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7);
  console.log(`📋 Token received, length: ${token.length}`);

  // Validate token length (prevent DoS attacks)
  if (token.length > MAX_TOKEN_LENGTH) {
    throw new InvalidTokenError(`Token too large: ${token.length} bytes (max: ${MAX_TOKEN_LENGTH})`);
  }

  // Verify JWT signature
  let payload;
  try {
    payload = await verifyJWTSignature(token, env);
  } catch (error) {
    throw new InvalidTokenError(`JWT verification failed: ${error.message}`);
  }

  // Extract user ID from JWT claims
  const userId = payload.sub;
  if (!userId) {
    throw new InvalidTokenError("Missing sub (user ID) in JWT payload");
  }

  console.log(`👤 Authenticated user: ${userId.substring(0, 20)}...`);

  // Query D1 for user record with farmer role check
  let user;
  try {
    const result = await env.DB.prepare(
      'SELECT clerk_user_id, email, role, farm_id FROM users WHERE clerk_user_id = ?'
    ).bind(userId).first();

    user = result;
  } catch (error) {
    console.error("❌ Database query failed:", error.message);
    throw new DatabaseError(`Database query failed: ${error.message}`);
  }

  // Check if user exists in D1
  if (!user) {
    console.error(`❌ User not found in database: ${userId}`);
    throw new UserNotFoundError("User not found in database");
  }

  // Verify user is a farmer
  if (user.role !== 'farmer') {
    console.error(`❌ User is not a farmer: ${user.email} (role: ${user.role || 'user'})`);
    throw new NotAFarmerError("User does not have farmer role");
  }

  // Verify user has a farm_id
  if (!user.farm_id) {
    console.error(`❌ Farmer has no farm_id: ${user.email}`);
    throw new NotAFarmerError("Farmer has no associated farm");
  }

  console.log(`✅ Farmer authenticated: ${user.email} (farm: ${user.farm_id})`);

  // Return farmer context
  return {
    userId: user.clerk_user_id,
    farmId: user.farm_id,
    email: user.email,
    role: user.role
  };
}

/* === EXPORTS === */

export {
  // JWT verification
  verifyJWTSignature,

  // Authentication middleware
  authenticateUser,
  authenticateFarmer,

  // Error classes
  InvalidTokenError,
  UserNotFoundError,
  NotAFarmerError,
  DatabaseError,

  // JWKS management (for testing/debugging)
  fetchClerkJWKS,
  invalidateJWKSCache
};
