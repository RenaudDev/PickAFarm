# Worker Tests Documentation

This directory contains unit tests for the PickAFarm Cloudflare Worker backend (`src/index.js`).

## Overview

**Test Framework**: Vitest 3.2.4
**Environment**: Node (not jsdom)
**Total Tests**: 46 tests across 2 test files
**Execution Time**: ~1.5 seconds
**Coverage Target**: 85% for critical paths (auth, Zoho, notifications)

## Running Tests

### Run All Tests
```bash
npm run test:worker
```

### Run Tests with UI
```bash
npm run test:worker:ui
```

### Run Tests with Coverage
```bash
npm run test:worker:coverage
```

### Run Specific Test File
```bash
npm run test:worker -- src/__tests__/auth.test.js
```

### Watch Mode (Re-run on File Changes)
```bash
npm run test:worker -- --watch
```

## Test Files

### 1. `zoho-integration.test.js`
Tests for Zoho CRM API integration:
- **zohoAccessToken()** - OAuth token refresh for all regions (com, ca, eu)
- **zohoFetchAttachments()** - Farm image fetching
- **zohoFetchAccount()** - Complete farm data retrieval

**Coverage**: 23 tests
- ✅ Successful API calls with valid credentials
- ❌ Error handling (missing credentials, network failures, invalid responses)
- 🌍 Multi-region support (US, Canada, Europe)

### 2. `auth.test.js`
Tests for Clerk JWT authentication:
- **base64UrlDecode()** - Base64URL decoding helper
- **verifyClerkToken()** - JWT token verification and user extraction
- **Protected endpoint behavior** - Authentication middleware

**Coverage**: 23 tests
- ✅ Valid token verification and claim extraction
- ❌ Error handling (expired tokens, malformed tokens, missing headers)
- 🔒 Security validation (expiration checks, format validation)

## Test Utilities

### Mock Environment (`test-utils.js`)

#### `mockEnv(overrides)`
Creates a complete mock Cloudflare Worker environment with all bindings:
```javascript
import { mockEnv } from './test-utils.js';

const env = mockEnv({
  ZOHO_DC: 'ca', // Override specific values
});
```

**Includes**:
- Zoho OAuth credentials
- Clerk authentication key
- D1 database binding (mocked)
- R2 bucket binding (mocked)
- Resend API key
- GitHub token

#### Mock Factories

```javascript
import {
  mockClerkJWT,
  mockExpiredClerkJWT,
  mockZohoTokenResponse,
  mockZohoAccountResponse,
  mockZohoAttachmentsResponse,
} from './test-utils.js';

// Create valid Clerk JWT
const token = mockClerkJWT('user_123', 'test@example.com');

// Create expired JWT for testing error handling
const expiredToken = mockExpiredClerkJWT();

// Mock Zoho API responses
const zohoToken = mockZohoTokenResponse('com');
const farmData = mockZohoAccountResponse('38729000000292133');
const attachments = mockZohoAttachmentsResponse('38729000000292133');
```

#### Data Generators

```javascript
import {
  createMockFarm,
  createMockUser,
  createMockSavedFarm,
} from './test-utils.js';

// Generate test farm data
const farm = createMockFarm({
  name: 'Test Farm',
  city: 'Albany',
});

// Generate test user data
const user = createMockUser({
  email: 'custom@example.com',
});

// Generate test subscription
const savedFarm = createMockSavedFarm({
  user_id: 'user_123',
  farm_id: 'farm_456',
});
```

## Adding New Tests

### 1. Create Test File

Follow naming convention: `feature-name.test.js`

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockEnv } from './test-utils.js';

describe('myFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    const env = mockEnv();

    // Act
    const result = await myFunction(env);

    // Assert
    expect(result).toBeDefined();
  });
});
```

### 2. Test Structure Pattern

**Follow AAA Pattern**:
- **Arrange**: Set up mocks and test data
- **Act**: Execute the function being tested
- **Assert**: Verify the results

### 3. Mocking External APIs

```javascript
beforeEach(() => {
  global.fetch = vi.fn();
});

it('should call external API', async () => {
  // Mock fetch response
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ data: 'mock response' }),
  });

  // Test function
  await myFunction();

  // Verify fetch was called correctly
  expect(global.fetch).toHaveBeenCalledWith(
    'https://api.example.com/endpoint',
    expect.objectContaining({
      method: 'GET',
      headers: expect.any(Object),
    })
  );
});
```

### 4. Testing Error Handling

Always test both success and failure cases:

```javascript
it('should handle API errors gracefully', async () => {
  // Mock error response
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 500,
    text: async () => 'Internal Server Error',
  });

  // Verify error is thrown
  await expect(myFunction()).rejects.toThrow('API request failed');
});
```

## Mock Data Structure Reference

### Zoho OAuth Token Response
```javascript
{
  access_token: 'mock_zoho_access_token_abc123',
  api_domain: 'https://www.zohoapis.com',
  token_type: 'Bearer',
  expires_in: 3600, // 1 hour
}
```

### Zoho Account Data (Farm)
```javascript
{
  id: '38729000000292133',
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
  // ... additional fields
}
```

### Clerk JWT Payload
```javascript
{
  sub: 'user_2abc123', // User ID
  email: 'test@example.com',
  sid: 'sess_xyz789', // Session ID
  exp: 1234567890, // Expiration (Unix timestamp)
  iat: 1234564290, // Issued at
}
```

### D1 Database Response
```javascript
{
  success: true,
  results: [], // Array of query results
  meta: {
    duration: 10, // ms
    changes: 1, // Rows affected
    last_row_id: 123,
  },
}
```

## Common Testing Patterns

### Pattern 1: Testing Authentication
```javascript
it('should verify valid JWT token', async () => {
  const token = mockClerkJWT('user_123', 'test@example.com');
  const request = {
    headers: new Headers({
      'Authorization': `Bearer ${token}`,
    }),
  };

  const result = await verifyClerkToken(request, env);

  expect(result.userId).toBe('user_123');
  expect(result.email).toBe('test@example.com');
});
```

### Pattern 2: Testing Multi-Region Support
```javascript
['com', 'ca', 'eu'].forEach((region) => {
  it(`should work with ${region} region`, async () => {
    const env = mockEnv({ ZOHO_DC: region });
    // Test logic
  });
});
```

### Pattern 3: Testing Database Operations
```javascript
it('should insert farm into D1', async () => {
  const env = mockEnv();
  const farmData = createMockFarm();

  // Mock D1 response
  env.DB.prepare().bind().run.mockResolvedValue({
    success: true,
    meta: { changes: 1, last_row_id: 1 },
  });

  await upsertFarm(env, farmData);

  expect(env.DB.prepare).toHaveBeenCalled();
});
```

## Coverage Notes

**Current Limitation**: Coverage reports show 0% because tests copy functions from the Worker for testability. The Worker exports a single default handler, making individual function imports impossible.

**Future Improvement**: Refactor Worker to export individual functions for direct import and accurate coverage tracking.

**What's Actually Tested**:
- ✅ 46 tests covering critical paths
- ✅ OAuth token refresh (all regions)
- ✅ JWT authentication and validation
- ✅ Error handling for all scenarios
- ✅ Multi-region API support

## CI Integration

These tests are designed to run in GitHub Actions CI pipeline (Story 1.1):

**Requirements Met**:
- ✅ Fast execution (< 2 minutes)
- ✅ No external dependencies (all APIs mocked)
- ✅ Deterministic (same results every run)
- ✅ Self-contained (no cleanup required)

**CI Command**:
```bash
npm run test:worker -- --run --reporter=default --reporter=json --outputFile=test-results.json
```

## Troubleshooting

### Tests Fail with "Module Not Found"
Make sure you're running tests from the project root:
```bash
cd /path/to/pickafarm
npm run test:worker
```

### Mock Functions Not Working
Ensure you're clearing mocks in `beforeEach`:
```javascript
beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn(); // Reset fetch mock
});
```

### "Headers is not defined"
The Node environment includes Headers global. If missing, update Vitest config:
```javascript
test: {
  environment: 'node',
  globals: true,
}
```

## Best Practices

1. **Always mock external APIs** - Never make real network calls in tests
2. **Test both success and failure paths** - Error handling is critical
3. **Use descriptive test names** - Clearly describe what's being tested
4. **Keep tests isolated** - Each test should be independent
5. **Clean up after tests** - Use `beforeEach` to reset mocks
6. **Test edge cases** - Empty arrays, null values, missing fields
7. **Follow AAA pattern** - Arrange, Act, Assert

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Cloudflare Workers Testing Guide](https://developers.cloudflare.com/workers/testing/)
- [Story 1.2 Documentation](../../docs/stories/1.2.unit-testing-framework-implementation.md)
