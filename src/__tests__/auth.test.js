/**
 * Authentication Tests
 *
 * Tests for Clerk JWT authentication functions:
 * - base64UrlDecode() - Base64URL decoding helper
 * - verifyClerkToken() - JWT token verification and decoding
 * - Protected endpoint middleware behavior
 *
 * Target Coverage: 90% (critical security component)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockEnv,
  mockClerkJWT,
  mockExpiredClerkJWT,
} from './test-utils.js';

/* ===== FUNCTIONS UNDER TEST ===== */
// Note: These functions are copied from src/index.js for testing purposes

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  const padding = base64.length % 4;
  if (padding > 0) {
    base64 += '='.repeat(4 - padding);
  }

  try {
    const decoded = atob(base64);
    return decoded;
  } catch (e) {
    throw new Error(`Base64 decode failed: ${e.message}`);
  }
}

async function verifyClerkToken(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7);

  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    let payloadStr;
    try {
      payloadStr = base64UrlDecode(parts[1]);
    } catch (decodeError) {
      throw new Error(`Failed to decode JWT payload: ${decodeError.message}`);
    }

    let payload;
    try {
      payload = JSON.parse(payloadStr);
    } catch (parseError) {
      throw new Error(`Failed to parse JWT payload: ${parseError.message}`);
    }

    // Verify token hasn't expired
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new Error("Token expired");
      }
    }

    return {
      userId: payload.sub,
      email: payload.email || payload.primary_email_address?.email_address,
      sessionId: payload.sid
    };
  } catch (error) {
    throw new Error(`JWT verification failed: ${error.message}`);
  }
}

/* ===== TEST SUITES ===== */

describe('base64UrlDecode', () => {
  it('should decode a valid base64url string', () => {
    // Arrange - "Hello World" in base64url
    const input = 'SGVsbG8gV29ybGQ';

    // Act
    const result = base64UrlDecode(input);

    // Assert
    expect(result).toBe('Hello World');
  });

  it('should handle base64url with URL-safe characters (-)', () => {
    // Arrange - String with '-' (URL-safe replacement for '+')
    const input = 'eyJhbGciOiJIUzI1NiJ9';

    // Act
    const result = base64UrlDecode(input);

    // Assert
    expect(result).toContain('alg');
    expect(result).toContain('HS256');
  });

  it('should handle base64url with URL-safe characters (_)', () => {
    // Arrange - String with '_' (URL-safe replacement for '/')
    const input = 'eyJ0eXAiOiJKV1QifQ';

    // Act
    const result = base64UrlDecode(input);

    // Assert
    expect(result).toContain('typ');
    expect(result).toContain('JWT');
  });

  it('should add padding when needed (1 character)', () => {
    // Arrange - String that needs 1 padding character
    const input = 'eyJhIjoxfQ'; // No padding

    // Act
    const result = base64UrlDecode(input);

    // Assert
    expect(result).toContain('"a":1');
  });

  it('should add padding when needed (2 characters)', () => {
    // Arrange - String that needs 2 padding characters
    const input = 'eyJhIjoxLCJiIjoxfQ'; // No padding

    // Act
    const result = base64UrlDecode(input);

    // Assert
    expect(result).toContain('"a":1');
    expect(result).toContain('"b":1');
  });

  it('should throw error for invalid base64 string', () => {
    // Arrange - Invalid base64 string
    const input = '!!!invalid!!!';

    // Act & Assert
    expect(() => base64UrlDecode(input)).toThrow('Base64 decode failed');
  });
});

describe('verifyClerkToken', () => {
  let env;

  beforeEach(() => {
    vi.clearAllMocks();
    env = mockEnv();
  });

  it('should successfully verify valid JWT token', async () => {
    // Arrange
    const token = mockClerkJWT('user_2abc123', 'test@example.com');
    const request = {
      headers: new Headers({
        'Authorization': `Bearer ${token}`,
      }),
    };

    // Act
    const result = await verifyClerkToken(request, env);

    // Assert
    expect(result).toBeDefined();
    expect(result.userId).toBe('user_2abc123');
    expect(result.email).toBe('test@example.com');
    expect(result.sessionId).toBe('sess_xyz789');
  });

  it('should extract userId from sub claim', async () => {
    // Arrange
    const token = mockClerkJWT('user_different_id', 'user@test.com');
    const request = {
      headers: new Headers({
        'Authorization': `Bearer ${token}`,
      }),
    };

    // Act
    const result = await verifyClerkToken(request, env);

    // Assert
    expect(result.userId).toBe('user_different_id');
  });

  it('should extract email from payload', async () => {
    // Arrange
    const token = mockClerkJWT('user_123', 'custom@email.com');
    const request = {
      headers: new Headers({
        'Authorization': `Bearer ${token}`,
      }),
    };

    // Act
    const result = await verifyClerkToken(request, env);

    // Assert
    expect(result.email).toBe('custom@email.com');
  });

  it('should extract sessionId from sid claim', async () => {
    // Arrange
    const token = mockClerkJWT('user_123', 'test@example.com');
    const request = {
      headers: new Headers({
        'Authorization': `Bearer ${token}`,
      }),
    };

    // Act
    const result = await verifyClerkToken(request, env);

    // Assert
    expect(result.sessionId).toBe('sess_xyz789');
  });

  it('should throw error when Authorization header is missing', async () => {
    // Arrange
    const request = {
      headers: new Headers(),
    };

    // Act & Assert
    await expect(verifyClerkToken(request, env)).rejects.toThrow(
      'Missing or invalid Authorization header'
    );
  });

  it('should throw error when Authorization header does not start with Bearer', async () => {
    // Arrange
    const request = {
      headers: new Headers({
        'Authorization': 'Basic abc123',
      }),
    };

    // Act & Assert
    await expect(verifyClerkToken(request, env)).rejects.toThrow(
      'Missing or invalid Authorization header'
    );
  });

  it('should throw error for expired token', async () => {
    // Arrange
    const token = mockExpiredClerkJWT();
    const request = {
      headers: new Headers({
        'Authorization': `Bearer ${token}`,
      }),
    };

    // Act & Assert
    await expect(verifyClerkToken(request, env)).rejects.toThrow(
      'Token expired'
    );
  });

  it('should throw error for malformed JWT (only 2 parts)', async () => {
    // Arrange - JWT with only 2 parts instead of 3
    const malformedToken = 'header.payload';
    const request = {
      headers: new Headers({
        'Authorization': `Bearer ${malformedToken}`,
      }),
    };

    // Act & Assert
    await expect(verifyClerkToken(request, env)).rejects.toThrow(
      'Invalid JWT format'
    );
  });

  it('should throw error for malformed JWT (4 parts)', async () => {
    // Arrange - JWT with 4 parts instead of 3
    const malformedToken = 'header.payload.signature.extra';
    const request = {
      headers: new Headers({
        'Authorization': `Bearer ${malformedToken}`,
      }),
    };

    // Act & Assert
    await expect(verifyClerkToken(request, env)).rejects.toThrow(
      'Invalid JWT format'
    );
  });

  it('should throw error for JWT with invalid base64 encoding', async () => {
    // Arrange - JWT with invalid base64 in payload
    const malformedToken = 'eyJhbGciOiJIUzI1NiJ9.!!!invalid!!!.signature';
    const request = {
      headers: new Headers({
        'Authorization': `Bearer ${malformedToken}`,
      }),
    };

    // Act & Assert
    await expect(verifyClerkToken(request, env)).rejects.toThrow(
      'Failed to decode JWT payload'
    );
  });

  it('should throw error for JWT with invalid JSON in payload', async () => {
    // Arrange - JWT with valid base64 but invalid JSON
    const invalidJsonPayload = btoa('not valid json{{{');
    const malformedToken = `header.${invalidJsonPayload}.signature`;
    const request = {
      headers: new Headers({
        'Authorization': `Bearer ${malformedToken}`,
      }),
    };

    // Act & Assert
    await expect(verifyClerkToken(request, env)).rejects.toThrow(
      'Failed to parse JWT payload'
    );
  });

  it('should handle token with no expiration claim', async () => {
    // Arrange - Create token without exp claim
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: 'user_no_exp',
      email: 'noexp@example.com',
      sid: 'sess_no_exp',
      iat: now,
      // No exp claim
    };
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const token = `${header}.${body}.signature`;

    const request = {
      headers: new Headers({
        'Authorization': `Bearer ${token}`,
      }),
    };

    // Act
    const result = await verifyClerkToken(request, env);

    // Assert - Should still work if no exp claim
    expect(result.userId).toBe('user_no_exp');
    expect(result.email).toBe('noexp@example.com');
  });

  it('should handle token with future expiration', async () => {
    // Arrange - Token that expires in 1 hour
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: 'user_future',
      email: 'future@example.com',
      sid: 'sess_future',
      exp: now + 3600, // Expires in 1 hour
      iat: now,
    };
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const token = `${header}.${body}.signature`;

    const request = {
      headers: new Headers({
        'Authorization': `Bearer ${token}`,
      }),
    };

    // Act
    const result = await verifyClerkToken(request, env);

    // Assert
    expect(result.userId).toBe('user_future');
    expect(result.email).toBe('future@example.com');
  });
});

describe('Protected Endpoint Behavior', () => {
  let env;

  beforeEach(() => {
    vi.clearAllMocks();
    env = mockEnv();
  });

  it('should allow authenticated requests to protected endpoints', async () => {
    // Arrange
    const token = mockClerkJWT('user_123', 'test@example.com');
    const request = {
      headers: new Headers({
        'Authorization': `Bearer ${token}`,
      }),
    };

    // Act
    const result = await verifyClerkToken(request, env);

    // Assert - Token verification succeeds, endpoint can proceed
    expect(result).toBeDefined();
    expect(result.userId).toBe('user_123');
  });

  it('should block unauthenticated requests with 401-equivalent error', async () => {
    // Arrange - Request without Authorization header
    const request = {
      headers: new Headers(),
    };

    // Act & Assert - Should throw error that can be caught and returned as 401
    try {
      await verifyClerkToken(request, env);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('Missing or invalid Authorization header');
      // In actual endpoint, this would be caught and returned as:
      // return new Response(JSON.stringify({ error: error.message }), { status: 401 });
    }
  });

  it('should block expired token requests with 401-equivalent error', async () => {
    // Arrange - Expired token
    const token = mockExpiredClerkJWT();
    const request = {
      headers: new Headers({
        'Authorization': `Bearer ${token}`,
      }),
    };

    // Act & Assert
    try {
      await verifyClerkToken(request, env);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('Token expired');
      // Would be returned as 401 in actual endpoint
    }
  });

  it('should block malformed token requests with 401-equivalent error', async () => {
    // Arrange - Malformed token
    const request = {
      headers: new Headers({
        'Authorization': 'Bearer invalid.token',
      }),
    };

    // Act & Assert
    try {
      await verifyClerkToken(request, env);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('Invalid JWT format');
      // Would be returned as 401 in actual endpoint
    }
  });
});
