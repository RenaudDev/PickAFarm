/**
 * Zoho API Integration Tests
 *
 * Tests for Zoho CRM API integration functions:
 * - zohoAccessToken() - OAuth token refresh
 * - zohoFetchAttachments() - Fetch farm images
 * - zohoFetchAccount() - Fetch complete farm data
 *
 * Target Coverage: 85% (critical path)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockEnv,
  mockFetch,
  mockZohoTokenResponse,
  mockZohoAccountResponse,
  mockZohoAttachmentsResponse,
} from './test-utils.js';

// Import functions to test (we need to read them from the Worker)
// Since the Worker exports a default handler, we'll need to import and test the functions directly
// For now, we'll copy the functions here or import them when Worker is refactored

/* ===== FUNCTIONS UNDER TEST ===== */
// Note: These functions are copied from src/index.js for testing purposes
// In a production refactor, these would be extracted to separate modules

async function zohoAccessToken(env) {
  const refreshToken = env.ZOHO_REFRESH_TOKEN;
  const clientId = env.ZOHO_CLIENT_ID;
  const clientSecret = env.ZOHO_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("Missing Zoho credentials: ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, or ZOHO_CLIENT_SECRET");
  }

  const dc = env.ZOHO_DC || 'com';
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

async function zohoFetchAttachments(env, accessToken, accountId) {
  const dc = env.ZOHO_DC || 'com';
  const apiUrl = `https://www.zohoapis.${dc}/crm/v3/Accounts/${encodeURIComponent(accountId)}/Attachments`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Authorization": `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    return []; // Non-critical: farm can exist without attachments
  }

  const data = await response.json();

  if (data.data && Array.isArray(data.data)) {
    return data.data;
  }

  return [];
}

async function zohoFetchAccount(env, accessToken, accountId) {
  if (!accessToken) {
    throw new Error("Access token is required");
  }

  if (!accountId) {
    throw new Error("Account ID is required");
  }

  const dc = env.ZOHO_DC || 'com';

  const fields = [
    "Account_Name","Website","Phone","Email",
    "Billing_Street","Billing_City","Billing_State","Billing_Code","Billing_Country",
    "Description","Google_My_Business","Facebook","Instagram","PlaceID",
    "Type_of_Farm","Amenities","Varieties","Payment_Methods","Services_Type",
    "Pet_Friendly","Year_Established","Open_Date","Close_Day",
    "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
    "latitude","longitude","Price_Range","Slug","Featured","Verified",
    "Logo1","Cover"
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

  if (data.data && Array.isArray(data.data) && data.data.length > 0) {
    return data.data[0];
  }

  throw new Error("No account data found in response");
}

/* ===== TEST SUITES ===== */

describe('zohoAccessToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global fetch mock
    global.fetch = vi.fn();
  });

  it('should successfully refresh token for .com region', async () => {
    // Arrange
    const env = mockEnv({ ZOHO_DC: 'com' });
    const mockResponse = mockZohoTokenResponse('com');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse.json,
      text: async () => JSON.stringify(mockResponse.json),
    });

    // Act
    const token = await zohoAccessToken(env);

    // Assert
    expect(token).toBe('mock_zoho_access_token_abc123');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://accounts.zoho.com/oauth/v2/token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    );
  });

  it('should successfully refresh token for .ca region (Canada)', async () => {
    // Arrange
    const env = mockEnv({ ZOHO_DC: 'ca' });
    const mockResponse = mockZohoTokenResponse('ca');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse.json,
      text: async () => JSON.stringify(mockResponse.json),
    });

    // Act
    const token = await zohoAccessToken(env);

    // Assert
    expect(token).toBe('mock_zoho_access_token_abc123');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://accounts.zohocloud.ca/oauth/v2/token',
      expect.any(Object)
    );
  });

  it('should successfully refresh token for .eu region (Europe)', async () => {
    // Arrange
    const env = mockEnv({ ZOHO_DC: 'eu' });
    const mockResponse = mockZohoTokenResponse('eu');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse.json,
      text: async () => JSON.stringify(mockResponse.json),
    });

    // Act
    const token = await zohoAccessToken(env);

    // Assert
    expect(token).toBe('mock_zoho_access_token_abc123');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://accounts.zoho.eu/oauth/v2/token',
      expect.any(Object)
    );
  });

  it('should throw error when ZOHO_REFRESH_TOKEN is missing', async () => {
    // Arrange
    const env = mockEnv({ ZOHO_REFRESH_TOKEN: undefined });

    // Act & Assert
    await expect(zohoAccessToken(env)).rejects.toThrow(
      'Missing Zoho credentials: ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, or ZOHO_CLIENT_SECRET'
    );
  });

  it('should throw error when ZOHO_CLIENT_ID is missing', async () => {
    // Arrange
    const env = mockEnv({ ZOHO_CLIENT_ID: undefined });

    // Act & Assert
    await expect(zohoAccessToken(env)).rejects.toThrow(
      'Missing Zoho credentials: ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, or ZOHO_CLIENT_SECRET'
    );
  });

  it('should throw error when ZOHO_CLIENT_SECRET is missing', async () => {
    // Arrange
    const env = mockEnv({ ZOHO_CLIENT_SECRET: undefined });

    // Act & Assert
    await expect(zohoAccessToken(env)).rejects.toThrow(
      'Missing Zoho credentials: ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, or ZOHO_CLIENT_SECRET'
    );
  });

  it('should throw error when token refresh returns non-OK status', async () => {
    // Arrange
    const env = mockEnv();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Invalid refresh token',
    });

    // Act & Assert
    await expect(zohoAccessToken(env)).rejects.toThrow(
      'Zoho token refresh failed: 401 - Invalid refresh token'
    );
  });

  it('should throw error when token response contains error field', async () => {
    // Arrange
    const env = mockEnv();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        error: 'invalid_grant',
        error_description: 'The refresh token is invalid or expired',
      }),
    });

    // Act & Assert
    await expect(zohoAccessToken(env)).rejects.toThrow(
      'Zoho token error: invalid_grant - The refresh token is invalid or expired'
    );
  });

  it('should handle network failure gracefully', async () => {
    // Arrange
    const env = mockEnv();
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    // Act & Assert
    await expect(zohoAccessToken(env)).rejects.toThrow('Network error');
  });
});

describe('zohoFetchAttachments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should fetch attachments with valid token and account ID', async () => {
    // Arrange
    const env = mockEnv();
    const accessToken = 'mock_token_123';
    const accountId = '38729000000292133';
    const mockResponse = mockZohoAttachmentsResponse(accountId);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse.json,
    });

    // Act
    const attachments = await zohoFetchAttachments(env, accessToken, accountId);

    // Assert
    expect(attachments).toHaveLength(2);
    expect(attachments[0].File_Name).toBe('logo.jpg');
    expect(attachments[1].File_Name).toBe('background.jpg');
    expect(global.fetch).toHaveBeenCalledWith(
      `https://www.zohoapis.com/crm/v3/Accounts/${accountId}/Attachments`,
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('should return empty array when no attachments exist', async () => {
    // Arrange
    const env = mockEnv();
    const accessToken = 'mock_token_123';
    const accountId = '38729000000292133';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });

    // Act
    const attachments = await zohoFetchAttachments(env, accessToken, accountId);

    // Assert
    expect(attachments).toEqual([]);
  });

  it('should return empty array when API returns non-OK status', async () => {
    // Arrange
    const env = mockEnv();
    const accessToken = 'mock_token_123';
    const accountId = '38729000000292133';

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Account not found',
    });

    // Act
    const attachments = await zohoFetchAttachments(env, accessToken, accountId);

    // Assert
    expect(attachments).toEqual([]);
  });

  it('should return empty array when account ID is invalid', async () => {
    // Arrange
    const env = mockEnv();
    const accessToken = 'mock_token_123';
    const accountId = 'invalid_id';

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Invalid account ID',
    });

    // Act
    const attachments = await zohoFetchAttachments(env, accessToken, accountId);

    // Assert
    expect(attachments).toEqual([]);
  });

  it('should handle response without data field gracefully', async () => {
    // Arrange
    const env = mockEnv();
    const accessToken = 'mock_token_123';
    const accountId = '38729000000292133';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}), // No data field
    });

    // Act
    const attachments = await zohoFetchAttachments(env, accessToken, accountId);

    // Assert
    expect(attachments).toEqual([]);
  });
});

describe('zohoFetchAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should fetch complete farm data with valid credentials', async () => {
    // Arrange
    const env = mockEnv();
    const accessToken = 'mock_token_123';
    const accountId = '38729000000292133';
    const mockResponse = mockZohoAccountResponse(accountId);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse.json,
      text: async () => JSON.stringify(mockResponse.json),
    });

    // Act
    const account = await zohoFetchAccount(env, accessToken, accountId);

    // Assert
    expect(account).toBeDefined();
    expect(account.id).toBe(accountId);
    expect(account.Account_Name).toBe('Mock Farm');
    expect(account.Billing_City).toBe('Albany');
    expect(account.Billing_State).toBe('New York');
    expect(account.latitude).toBe(42.6526);
    expect(account.longitude).toBe(-73.7562);
  });

  it('should handle missing optional fields gracefully', async () => {
    // Arrange
    const env = mockEnv();
    const accessToken = 'mock_token_123';
    const accountId = '38729000000292133';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{
          id: accountId,
          Account_Name: 'Minimal Farm',
          // Missing most optional fields
        }],
      }),
    });

    // Act
    const account = await zohoFetchAccount(env, accessToken, accountId);

    // Assert
    expect(account).toBeDefined();
    expect(account.Account_Name).toBe('Minimal Farm');
    expect(account.Website).toBeUndefined();
    expect(account.Phone).toBeUndefined();
  });

  it('should throw error when account not found (404)', async () => {
    // Arrange
    const env = mockEnv();
    const accessToken = 'mock_token_123';
    const accountId = 'nonexistent_id';

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Account not found',
    });

    // Act & Assert
    await expect(zohoFetchAccount(env, accessToken, accountId)).rejects.toThrow(
      'Zoho API request failed: 404 - Account not found'
    );
  });

  it('should throw error when access token is missing', async () => {
    // Arrange
    const env = mockEnv();
    const accountId = '38729000000292133';

    // Act & Assert
    await expect(zohoFetchAccount(env, null, accountId)).rejects.toThrow(
      'Access token is required'
    );
  });

  it('should throw error when account ID is missing', async () => {
    // Arrange
    const env = mockEnv();
    const accessToken = 'mock_token_123';

    // Act & Assert
    await expect(zohoFetchAccount(env, accessToken, null)).rejects.toThrow(
      'Account ID is required'
    );
  });

  it('should throw error when token is invalid (INVALID_TOKEN code)', async () => {
    // Arrange
    const env = mockEnv();
    const accessToken = 'invalid_token';
    const accountId = '38729000000292133';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        code: 'INVALID_TOKEN',
        message: 'Invalid OAuth token',
      }),
    });

    // Act & Assert
    await expect(zohoFetchAccount(env, accessToken, accountId)).rejects.toThrow(
      'Invalid or expired access token'
    );
  });

  it('should throw error when API returns non-SUCCESS code', async () => {
    // Arrange
    const env = mockEnv();
    const accessToken = 'mock_token_123';
    const accountId = '38729000000292133';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        code: 'MANDATORY_NOT_FOUND',
        message: 'Required field is missing',
      }),
    });

    // Act & Assert
    await expect(zohoFetchAccount(env, accessToken, accountId)).rejects.toThrow(
      'Zoho API error: MANDATORY_NOT_FOUND - Required field is missing'
    );
  });

  it('should throw error when response contains no data', async () => {
    // Arrange
    const env = mockEnv();
    const accessToken = 'mock_token_123';
    const accountId = '38729000000292133';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });

    // Act & Assert
    await expect(zohoFetchAccount(env, accessToken, accountId)).rejects.toThrow(
      'No account data found in response'
    );
  });

  it('should use correct API URL for .ca region', async () => {
    // Arrange
    const env = mockEnv({ ZOHO_DC: 'ca' });
    const accessToken = 'mock_token_123';
    const accountId = '38729000000292133';
    const mockResponse = mockZohoAccountResponse(accountId);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse.json,
      text: async () => JSON.stringify(mockResponse.json),
    });

    // Act
    await zohoFetchAccount(env, accessToken, accountId);

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://www.zohoapis.ca/crm/v3/Accounts/'),
      expect.any(Object)
    );
  });
});
