/**
 * Test Utilities for Cloudflare Worker Testing
 *
 * This file provides mock factories and helper functions for testing
 * the PickAFarm Cloudflare Worker backend (src/index.js).
 *
 * Key utilities:
 * - Mock environment bindings (D1, R2, secrets)
 * - Mock fetch responses for external APIs (Zoho, Clerk, Resend, GitHub)
 * - Test data generators for farms, users, subscriptions
 */

import { vi } from 'vitest';

/* ===== MOCK ENVIRONMENT BINDINGS ===== */

/**
 * Creates a mock Cloudflare Worker environment with all bindings.
 *
 * @param {Object} overrides - Override specific environment variables
 * @returns {Object} Mock env object with D1, R2, and secrets
 */
export function mockEnv(overrides = {}) {
  return {
    // Zoho OAuth credentials
    ZOHO_REFRESH_TOKEN: 'mock_refresh_token_abc123',
    ZOHO_CLIENT_ID: 'mock_client_id',
    ZOHO_CLIENT_SECRET: 'mock_client_secret',
    ZOHO_DC: 'com', // Data center: com, ca, eu

    // Clerk authentication
    CLERK_SECRET_KEY: 'mock_clerk_secret_key_abc123',

    // Email service (Resend)
    RESEND_API_KEY: 'mock_resend_api_key',
    FROM_EMAIL: 'PickAFarm Notifications <updates@notifications.pickafarm.com>',

    // GitHub Actions trigger
    GITHUB_TOKEN: 'mock_github_token',
    GITHUB_OWNER: 'RenaudDev',
    GITHUB_REPO: 'PickAFarm',
    GITHUB_EVENT: 'rebuild-farms',

    // Cloudflare CDN
    CDN_DOMAIN: 'https://cdn.pickafarm.com',

    // Environment
    ENVIRONMENT: 'test',

    // D1 Database binding (mock)
    DB: mockD1Database(),

    // R2 Bucket binding (mock)
    ASSETS_BUCKET: mockR2Bucket(),

    ...overrides,
  };
}

/**
 * Creates a mock D1 database with prepare() method.
 * Returns mock query results for common queries.
 */
export function mockD1Database() {
  const mockResults = {
    farms: [],
    users: [],
    saved_farms: [],
  };

  return {
    prepare: vi.fn((sql) => ({
      bind: vi.fn((...params) => ({
        all: vi.fn(async () => ({
          success: true,
          results: mockResults.farms,
          meta: { duration: 10, changes: 0 },
        })),
        first: vi.fn(async () => mockResults.farms[0] || null),
        run: vi.fn(async () => ({
          success: true,
          meta: { changes: 1, last_row_id: 1 },
        })),
      })),
      all: vi.fn(async () => ({
        success: true,
        results: mockResults.farms,
        meta: { duration: 10, changes: 0 },
      })),
      first: vi.fn(async () => mockResults.farms[0] || null),
      run: vi.fn(async () => ({
        success: true,
        meta: { changes: 1, last_row_id: 1 },
      })),
    })),
    // Helper to set mock data for tests
    _setMockData: (table, data) => {
      mockResults[table] = data;
    },
  };
}

/**
 * Creates a mock R2 bucket with put() and get() methods.
 */
export function mockR2Bucket() {
  const storage = new Map();

  return {
    put: vi.fn(async (key, data, options = {}) => {
      storage.set(key, { data, options });
      return {
        key,
        etag: `mock_etag_${key}`,
        size: data.length || 1024,
        httpMetadata: options.httpMetadata || {},
      };
    }),
    get: vi.fn(async (key) => {
      const item = storage.get(key);
      if (!item) return null;
      return {
        key,
        body: item.data,
        httpMetadata: item.options.httpMetadata || {},
      };
    }),
    delete: vi.fn(async (key) => {
      storage.delete(key);
    }),
    // Helper to check stored items
    _getStorage: () => storage,
  };
}

/* ===== MOCK EXTERNAL API RESPONSES ===== */

/**
 * Mocks global fetch for external API calls.
 *
 * @param {Object} responses - Map of URLs to mock responses
 * @returns {Function} Mocked fetch function
 */
export function mockFetch(responses = {}) {
  return vi.fn(async (url, options) => {
    const urlString = url.toString();

    // Find matching response
    const matchedKey = Object.keys(responses).find(pattern =>
      urlString.includes(pattern)
    );

    if (matchedKey) {
      const response = responses[matchedKey];
      return {
        ok: response.ok !== false,
        status: response.status || 200,
        statusText: response.statusText || 'OK',
        headers: new Headers(response.headers || {}),
        json: async () => response.json,
        text: async () => JSON.stringify(response.json),
        blob: async () => new Blob([JSON.stringify(response.json)]),
      };
    }

    // Default 404 for unmocked URLs
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Not Found',
      json: async () => ({ error: 'Not Found' }),
    };
  });
}

/**
 * Mock Zoho OAuth token response (successful)
 */
export function mockZohoTokenResponse(region = 'com') {
  return {
    ok: true,
    status: 200,
    json: {
      access_token: 'mock_zoho_access_token_abc123',
      api_domain: `https://www.zohoapis.${region}`,
      token_type: 'Bearer',
      expires_in: 3600,
    },
  };
}

/**
 * Mock Zoho Account data response (farm data)
 */
export function mockZohoAccountResponse(accountId = '38729000000292133') {
  return {
    ok: true,
    status: 200,
    json: {
      data: [{
        id: accountId,
        Account_Name: 'Mock Farm',
        Website: 'https://mockfarm.com',
        Phone: '+1-555-0123',
        Email: 'info@mockfarm.com',
        Billing_Street: '123 Farm Road',
        Billing_City: 'Albany',
        Billing_State: 'New York',
        Billing_Code: '12203',
        Billing_Country: 'USA',
        latitude: 42.6526,
        longitude: -73.7562,
        Description: 'A mock farm for testing',
        Slug: 'mock-farm',
        Featured: false,
        Verified: true,
        Type_of_Farm: 'Christmas Tree Farms',
        Amenities: 'Restrooms,Gift Shop',
        Varieties: 'Fraser Fir,Balsam Fir',
        Pet_Friendly: true,
        Price_Range: '$45 - $95',
        Open_Date: '2025-11-25',
        Close_Day: '2025-12-23',
      }],
    },
  };
}

/**
 * Mock Zoho Attachments response (images)
 */
export function mockZohoAttachmentsResponse(accountId = '38729000000292133') {
  return {
    ok: true,
    status: 200,
    json: {
      data: [
        {
          id: 'attach_1',
          File_Name: 'logo.jpg',
          Size: '102400',
          $file_id: 'file_1',
        },
        {
          id: 'attach_2',
          File_Name: 'background.jpg',
          Size: '204800',
          $file_id: 'file_2',
        },
      ],
    },
  };
}

/**
 * Mock Clerk JWT token (valid)
 */
export function mockClerkJWT(userId = 'user_2abc123', email = 'test@example.com') {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    email: email,
    sid: 'sess_xyz789',
    exp: now + 3600, // Expires in 1 hour
    iat: now,
  };

  // Simple base64 encoding (not cryptographically secure, just for testing)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'mock_signature';

  return `${header}.${body}.${signature}`;
}

/**
 * Mock Clerk JWT token (expired)
 */
export function mockExpiredClerkJWT() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: 'user_expired',
    email: 'expired@example.com',
    sid: 'sess_expired',
    exp: now - 3600, // Expired 1 hour ago
    iat: now - 7200,
  };

  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'mock_signature';

  return `${header}.${body}.${signature}`;
}

/**
 * Mock Resend API response (email sent)
 */
export function mockResendResponse() {
  return {
    ok: true,
    status: 200,
    json: {
      id: 'email_abc123',
      from: 'updates@notifications.pickafarm.com',
      to: ['user@example.com'],
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * Mock GitHub API response (rebuild triggered)
 */
export function mockGitHubDispatchResponse() {
  return {
    ok: true,
    status: 204,
    json: {},
  };
}

/* ===== TEST DATA GENERATORS ===== */

/**
 * Creates mock farm data for D1 database
 */
export function createMockFarm(overrides = {}) {
  return {
    id: '38729000000292133',
    zoho_record_id: '38729000000292133',
    name: 'Mock Farm',
    slug: 'mock-farm',
    street: '123 Farm Road',
    city: 'Albany',
    province: 'New York',
    state: 'New York',
    country: 'USA',
    postal_code: '12203',
    latitude: 42.6526,
    longitude: -73.7562,
    phone: '+1-555-0123',
    email: 'info@mockfarm.com',
    website: 'https://mockfarm.com',
    description: 'A mock farm for testing',
    categories: 'Christmas Tree Farms',
    type: 'Cut Your Own',
    amenities: 'Restrooms,Gift Shop',
    varieties: 'Fraser Fir,Balsam Fir',
    pet_friendly: 1,
    price_range: '$45 - $95',
    opening_date: '2025-11-25',
    closing_date: '2025-12-23',
    verified: 1,
    featured: 0,
    active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates mock user data for D1 database
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'user_2abc123',
    clerk_user_id: 'user_2abc123',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates mock saved farm subscription
 */
export function createMockSavedFarm(overrides = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: 'user_2abc123',
    farm_id: '38729000000292133',
    notify_when_ready: 1,
    notify_peak_season: 0,
    active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a Hono request mock for testing endpoints
 */
export function createMockRequest(url, options = {}) {
  const { method = 'GET', headers = {}, body = null } = options;

  return {
    url,
    method,
    headers: new Headers(headers),
    json: async () => (body ? JSON.parse(body) : {}),
    text: async () => body || '',
  };
}

/**
 * Helper to extract JWT payload without verification (for testing only)
 */
export function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    throw new Error(`Failed to decode JWT: ${error.message}`);
  }
}
