/**
 * Encryption Utilities for Magic Link Tokens
 *
 * Uses Web Crypto API (available in Cloudflare Workers) for:
 * - AES-GCM encryption (256-bit)
 * - HMAC-SHA256 signature for integrity verification
 * - One-time use enforcement via token hashing
 *
 * Security Features:
 * - Random IV (initialization vector) for each encryption
 * - HMAC signature prevents tampering
 * - Base64URL encoding for URL safety
 * - 24-hour token expiration enforced
 */

/**
 * Encrypts a magic link token payload using AES-GCM with HMAC signature
 *
 * @param {Object} payload - Token payload (farmId, email, expires, nonce)
 * @param {string} secretKey - Encryption secret from env.MAGIC_LINK_SECRET
 * @returns {Promise<string>} Base64URL-encoded encrypted token
 * @throws {Error} If encryption fails
 */
export async function encryptToken(payload, secretKey) {
  try {
    // 1. Generate random IV (initialization vector) - 96 bits for AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 2. Derive encryption key from secret
    const keyData = new TextEncoder().encode(secretKey);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData.slice(0, 32), // Use first 32 bytes for AES-256
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // 3. Encrypt payload
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      payloadBytes
    );

    // 4. Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // 5. Generate HMAC signature for integrity verification
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', hmacKey, combined);

    // 6. Combine encrypted data + signature
    const final = new Uint8Array(combined.length + signature.byteLength);
    final.set(combined, 0);
    final.set(new Uint8Array(signature), combined.length);

    // 7. Encode as Base64URL (URL-safe)
    return base64UrlEncode(final);
  } catch (error) {
    console.error('Token encryption failed:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypts and verifies a magic link token
 *
 * @param {string} token - Base64URL-encoded encrypted token
 * @param {string} secretKey - Encryption secret from env.MAGIC_LINK_SECRET
 * @returns {Promise<Object>} Decrypted payload {farmId, email, expires, nonce}
 * @throws {Error} If token is invalid, tampered, expired, or signature doesn't match
 */
export async function decryptToken(token, secretKey) {
  try {
    // 1. Decode from Base64URL
    const data = base64UrlDecode(token);

    // 2. Split encrypted data and signature
    const signatureLength = 32; // HMAC-SHA256 = 32 bytes
    if (data.length < signatureLength + 12) {
      throw new Error('Token too short - possible corruption');
    }

    const encrypted = data.slice(0, -signatureLength);
    const signature = data.slice(-signatureLength);

    // 3. Verify HMAC signature (prevent tampering)
    const keyData = new TextEncoder().encode(secretKey);
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const valid = await crypto.subtle.verify('HMAC', hmacKey, signature, encrypted);
    if (!valid) {
      throw new Error('Token signature verification failed - possible tampering');
    }

    // 4. Split IV and ciphertext
    const iv = encrypted.slice(0, 12);
    const ciphertext = encrypted.slice(12);

    // 5. Decrypt
    const key = await crypto.subtle.importKey(
      'raw',
      keyData.slice(0, 32), // Use first 32 bytes for AES-256
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    // 6. Parse JSON
    const payloadString = new TextDecoder().decode(decrypted);
    const payload = JSON.parse(payloadString);

    // 7. Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.expires < now) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    console.error('Token decryption failed:', error.message);
    if (error.message.includes('expired') || error.message.includes('tampering')) {
      throw error; // Re-throw known errors
    }
    throw new Error('Invalid token format');
  }
}

/**
 * Generates a cryptographic hash of a token for database storage
 * Used to prevent token replay attacks (one-time use enforcement)
 *
 * @param {string} token - Encrypted token string
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
export async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a random UUID v4 (for token nonce)
 *
 * @returns {string} UUID v4 string
 */
export function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Encodes a Uint8Array to Base64URL format (URL-safe, no padding)
 *
 * @param {Uint8Array} buffer - Data to encode
 * @returns {string} Base64URL-encoded string
 */
function base64UrlEncode(buffer) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decodes a Base64URL string to Uint8Array
 *
 * @param {string} str - Base64URL-encoded string
 * @returns {Uint8Array} Decoded data
 */
function base64UrlDecode(str) {
  // Convert Base64URL to standard Base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  const padding = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padding);

  // Decode
  const binary = atob(padded);
  return new Uint8Array([...binary].map(c => c.charCodeAt(0)));
}

/**
 * Validates magic link payload structure
 *
 * @param {Object} payload - Token payload to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateTokenPayload(payload) {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.farmId === 'string' &&
    typeof payload.email === 'string' &&
    typeof payload.expires === 'number' &&
    typeof payload.nonce === 'string' &&
    payload.farmId.length > 0 &&
    payload.email.includes('@') &&
    payload.expires > 0
  );
}
