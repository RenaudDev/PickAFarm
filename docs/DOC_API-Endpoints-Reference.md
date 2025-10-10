# API Endpoints Reference

**Document Version**: 1.0
**Last Updated**: October 9, 2025
**API Version**: 2.1.0
**Base URL**: `https://pickafarm-api.94623956quebecinc.workers.dev`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Public Endpoints](#public-endpoints)
3. [Authenticated Endpoints](#authenticated-endpoints)
4. [Webhook Endpoints](#webhook-endpoints)
5. [Debug/Test Endpoints](#debugtest-endpoints)
6. [Error Handling](#error-handling)
7. [Rate Limits & Caching](#rate-limits--caching)

---

## Authentication

### Clerk JWT Authentication

**Protected endpoints** require a valid Clerk JWT token in the `Authorization` header:

```http
Authorization: Bearer <clerk_jwt_token>
```

**JWT Validation Process**:
1. Token structure verified (3 parts: header.payload.signature)
2. Expiration time checked (`exp` claim)
3. User ID extracted from `sub` claim

**Security Note**: Current implementation uses simplified JWT verification (no cryptographic signature check). For production hardening, verify signature against Clerk's JWKS endpoint.

**Common Auth Errors**:
- `401 Unauthorized`: Missing/invalid token
- `401 Token expired`: Token `exp` claim < current time
- `404 User not found`: Valid JWT but user not synced to D1 database (call `/api/users/sync` first)

---

## Public Endpoints

### GET /api/farms

List farms with filtering and location-based search.

**Query Parameters**:

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `state` | string | No | Filter by state/province | `?state=Wisconsin` |
| `city` | string | No | Filter by city name | `?city=Madison` |
| `category` | string | No | Filter by farm type (partial match) | `?category=Christmas%20Tree` |
| `lat` | float | No | Latitude for radius search | `?lat=42.3601` |
| `lng` | float | No | Longitude for radius search | `?lng=-71.0589` |
| `radius` | float | No | Search radius in km (default: 50) | `?radius=25` |
| `limit` | integer | No | Max results (default: 200) | `?limit=50` |

**Request Example**:
```http
GET /api/farms?state=Wisconsin&category=Pumpkin&limit=10
```

**Response** (200 OK):
```json
{
  "farms": [
    {
      "id": "zcrm_38729000000292133",
      "name": "Quinn Farm",
      "slug": "quinn-farm",
      "street": "123 Farm Road",
      "city_name": "Madison",
      "state_province": "Wisconsin",
      "country": "USA",
      "postal_code": "53703",
      "latitude": 43.0731,
      "longitude": -89.4012,
      "phone": "(608) 555-1234",
      "email": "info@quinnfarm.com",
      "website": "https://quinnfarm.com",
      "facebook": "https://facebook.com/quinnfarm",
      "instagram": "https://instagram.com/quinnfarm",
      "description": "Family-owned farm since 1985...",
      "categories": "Pumpkin Patch, Corn Maze",
      "type": "U-Pick, Pre-Cut",
      "amenities": "Restrooms, Gift Shop, Hay Rides",
      "varieties": "Sugar Pumpkins, Jack O'Lanterns",
      "pet_friendly": 1,
      "price_range": "$5 - $25",
      "verified": 1,
      "featured": 0,
      "active": 1,
      "updated_at": "2025-10-01T14:30:00Z",
      "payment_methods": "Cash, Credit Card, Apple Pay",
      "opening_date": "2025-09-15",
      "closing_date": "2025-10-31",
      "monday_hours": "9am - 6pm",
      "tuesday_hours": "9am - 6pm",
      "wednesday_hours": "9am - 6pm",
      "thursday_hours": "9am - 6pm",
      "friday_hours": "9am - 8pm",
      "saturday_hours": "8am - 8pm",
      "sunday_hours": "10am - 6pm",
      "logo_url": "https://cdn.pickafarm.com/logos/zcrm_38729000000292133.jpg",
      "background_url": "https://cdn.pickafarm.com/backgrounds/zcrm_38729000000292133.jpg",
      "logo_updated_at": "2025-09-20T10:15:00Z",
      "background_updated_at": "2025-09-20T10:15:00Z",
      "distance_km": 5.2
    }
  ],
  "count": 1,
  "filters": {
    "state": "Wisconsin",
    "category": "Pumpkin"
  }
}
```

**Sorting Logic**:
- **Default**: `featured DESC, verified DESC, name ASC`
- **With location search** (lat/lng): Results sorted by `distance_km ASC`

**File Location**: `src/index.js:1298`

---

### GET /api/farms/stats

Get subscriber counts for multiple farms (bulk endpoint).

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | string | Yes | Comma-separated farm IDs |

**Request Example**:
```http
GET /api/farms/stats?ids=zcrm_123,zcrm_456,zcrm_789
```

**Response** (200 OK):
```json
{
  "stats": [
    {
      "farm_id": "zcrm_123",
      "subscriber_count": 42
    },
    {
      "farm_id": "zcrm_456",
      "subscriber_count": 17
    },
    {
      "farm_id": "zcrm_789",
      "subscriber_count": 0
    }
  ],
  "cached_at": "2025-10-09T14:30:00Z"
}
```

**Caching**: 5 minutes (300s)
**Max IDs**: 100 per request
**File Location**: `src/index.js:2388`

---

### GET /api/farms/:farm_id/subscriber-count

Get subscriber count for a single farm (cached).

**URL Parameters**:
- `farm_id`: Farm's Zoho record ID (e.g., `zcrm_38729000000292133`)

**Request Example**:
```http
GET /api/farms/zcrm_38729000000292133/subscriber-count
```

**Response** (200 OK):
```json
{
  "farm_id": "zcrm_38729000000292133",
  "subscriber_count": 42,
  "cached_at": "2025-10-09T14:30:00Z"
}
```

**Caching**: 5 minutes (300s)
**Cache Invalidation**: Automatic when user subscribes/unsubscribes
**File Location**: `src/index.js:2316`

---

### GET /api/cities

List cities with farms.

**Response** (200 OK):
```json
{
  "cities": [
    {
      "id": "city_123",
      "name": "Madison",
      "slug": "madison-wi-us",
      "state_province": "Wisconsin",
      "country": "USA",
      "latitude": 43.0731,
      "longitude": -89.4012,
      "farm_count": 15
    }
  ]
}
```

**File Location**: `src/index.js` (handler function for cities endpoint)

---

### GET /api/search

Full-text search across farms.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `limit` | integer | No | Max results (default: 50) |

**Request Example**:
```http
GET /api/search?q=pumpkin%20patch&limit=10
```

**Response** (200 OK):
```json
{
  "results": [
    {
      "id": "zcrm_123",
      "name": "Happy Pumpkin Patch",
      "slug": "happy-pumpkin-patch",
      "description": "Best pumpkin patch in Wisconsin...",
      "relevance_score": 0.95
    }
  ],
  "query": "pumpkin patch",
  "count": 1
}
```

**Search Fields**: Farm name, description, categories, amenities
**Technology**: SQLite FTS5 (Full-Text Search)
**File Location**: `src/index.js` (search handler)

---

## Authenticated Endpoints

All authenticated endpoints require `Authorization: Bearer <clerk_jwt>` header.

### POST /api/users/sync

Sync Clerk user to D1 database (required before other authenticated actions).

**Request Body**:
```json
{
  "clerk_user_id": "user_2abc123xyz",
  "email": "farmer@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user_id": "uuid-123-456",
  "message": "User synced successfully",
  "action": "created"
}
```

**Idempotent**: Safe to call multiple times (creates or updates)
**File Location**: `src/index.js:1527`

---

### POST /api/users/update-location

Update user's location for personalized farm recommendations.

**Request Body**:
```json
{
  "latitude": 43.0731,
  "longitude": -89.4012,
  "city": "Madison",
  "region": "Wisconsin"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Location updated successfully",
  "location": {
    "latitude": 43.0731,
    "longitude": -89.4012,
    "city": "Madison",
    "region": "Wisconsin"
  }
}
```

**File Location**: `src/index.js:1597`

---

### POST /api/farms/save

Subscribe to farm updates (adds farm to user's saved list).

**Request Body**:
```json
{
  "farm_id": "zcrm_38729000000292133",
  "farm_name": "Quinn Farm",
  "farm_slug": "quinn-farm",
  "farm_city": "Madison",
  "farm_state": "Wisconsin",
  "farm_phone": "(608) 555-1234",
  "farm_website": "https://quinnfarm.com",
  "consent_given": true
}
```

**Required Fields**:
- `farm_id`: Farm's Zoho record ID
- `consent_given`: **MUST be `true`** (GDPR/CAN-SPAM compliance)

**Response** (200 OK):
```json
{
  "success": true,
  "saved_farm_id": "uuid-abc-123",
  "message": "Farm saved successfully",
  "consent": {
    "given_at": "2025-10-09T14:30:00Z",
    "ip_address": "192.0.2.1"
  }
}
```

**Response** (409 Conflict - already saved):
```json
{
  "error": "Already saved",
  "message": "You are already subscribed to this farm",
  "saved_farm_id": "existing-uuid"
}
```

**Side Effects**:
- Invalidates subscriber count cache for this farm
- Tracks consent timestamp and IP address
- Sets default notification preferences (all enabled)

**File Location**: `src/index.js:1699`

---

### POST /api/farms/unsave

Unsubscribe from farm updates.

**Request Body**:
```json
{
  "farm_id": "zcrm_38729000000292133"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Farm unsaved successfully",
  "rows_deleted": 1
}
```

**Side Effects**:
- Invalidates subscriber count cache for this farm

**File Location**: `src/index.js:1820`

---

### GET /api/farms/saved

Get user's saved farms.

**Response** (200 OK):
```json
{
  "saved_farms": [
    {
      "saved_farm_id": "uuid-abc-123",
      "saved_at": "2025-10-01T14:30:00Z",
      "notify_on_hours_change": 1,
      "notify_on_opening_change": 1,
      "notify_on_status_change": 1,
      "farm_id": "zcrm_38729000000292133",
      "farm_name": "Quinn Farm",
      "farm_slug": "quinn-farm",
      "farm_city": "Madison",
      "farm_state": "Wisconsin",
      "farm_phone": "(608) 555-1234",
      "farm_website": "https://quinnfarm.com"
    }
  ],
  "count": 1
}
```

**Sorting**: Most recently saved first (`saved_at DESC`)
**File Location**: `src/index.js:1899`

---

### GET /api/user/preferences

Get user's notification preferences.

**Response** (200 OK):
```json
{
  "preferences": {
    "notify_on_hours_change": true,
    "notify_on_opening_change": true,
    "notify_on_status_change": true,
    "email_frequency": "immediate"
  }
}
```

**File Location**: `src/index.js:2719`

---

### PUT /api/user/preferences

Update user's notification preferences.

**Request Body**:
```json
{
  "notify_on_hours_change": true,
  "notify_on_opening_change": false,
  "notify_on_status_change": true,
  "email_frequency": "daily"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Preferences updated successfully"
}
```

**File Location**: `src/index.js:2719`

---

### GET /api/farms/:farm_id/subscribers

**PROTECTED**: Get list of subscribers for a farm (farm owner access).

**URL Parameters**:
- `farm_id`: Farm's Zoho record ID

**Response** (200 OK):
```json
{
  "farm_id": "zcrm_38729000000292133",
  "subscribers": [
    {
      "user_id": "uuid-123",
      "email": "user@example.com",
      "saved_at": "2025-10-01T14:30:00Z",
      "notify_on_opening_change": 1
    }
  ],
  "count": 1
}
```

**Authorization**: Requires farmer authentication (future feature)
**File Location**: `src/index.js:2733`

---

## Webhook Endpoints

### POST /api/zoho-webhook

Primary webhook for Zoho CRM farm create/update operations.

**Security**: Requires `WEBHOOK_SHARED_SECRET` token (header or query param).

**Token Methods**:
- Header: `x-webhook-token: <secret>`
- Query: `?token=<secret>`

**Query Parameters**:
- `rebuild=true`: Trigger static site rebuild after sync (optional)

**Request Body** (from Zoho):
```json
{
  "data": [
    {
      "id": "38729000000292133"
    }
  ]
}
```

**Alternative Formats Supported**:
- `application/json`: `{ "id": "123" }`
- `application/x-www-form-urlencoded`: `id=123`
- Query param: `?id=123`

**Webhook Workflow**:
1. Verify webhook token
2. Extract Zoho Account ID
3. Fetch current farm data from D1 (for change detection)
4. Fetch complete record from Zoho API
5. Fetch Logo1/Cover image URLs from Zoho attachments
6. Upsert farm data to D1
7. Process images (download from Zoho → upload to R2 → update D1 with CDN URLs)
8. Detect opening/closing date changes
9. Send email notifications to subscribers (if dates changed)
10. Trigger GitHub Actions rebuild (if `rebuild=true`)

**Response** (200 OK):
```json
{
  "ok": true,
  "action": "upsert",
  "record_id": "38729000000292133",
  "d1_id": "zcrm_38729000000292133",
  "changes_detected": {
    "opening_date": {
      "old": "2025-09-10",
      "new": "2025-09-15"
    }
  },
  "notifications_sent": 42,
  "images_processed": {
    "logo": "https://cdn.pickafarm.com/logos/zcrm_38729000000292133.jpg",
    "background": "https://cdn.pickafarm.com/backgrounds/zcrm_38729000000292133.jpg"
  },
  "rebuild": "triggered"
}
```

**Error Handling**:
- Invalid token → `401 Unauthorized`
- Missing record ID → `400 Bad Request`
- Zoho API failure → `500 Internal Server Error` (with error details)

**Rate Limits**: Zoho API has 100 calls/minute limit. This webhook makes 2-3 calls per farm.

**File Location**: `src/index.js:773`

---

### POST /api/zoho-delete

Webhook for Zoho CRM farm deletion.

**Security**: Same as `/api/zoho-webhook` (requires `WEBHOOK_SHARED_SECRET`)

**Request Body**:
```json
{
  "action": "delete",
  "record_id": "38729000000292133",
  "module": "Accounts",
  "deleted_at": "2025-09-20T19:30:00Z"
}
```

**Response** (200 OK):
```json
{
  "ok": true,
  "action": "delete",
  "record_id": "38729000000292133",
  "d1_id": "zcrm_38729000000292133",
  "module": "Accounts",
  "deleted_at": "2025-09-20T19:30:00Z",
  "database": "deleted",
  "rowsAffected": 1,
  "rebuild": "triggered"
}
```

**Cascade Deletes**: Also removes related `saved_farms` records (FK constraint)

**File Location**: `src/index.js:625`

---

### POST /api/notifications/send

**ZOHO FLOW INTEGRATION**: Send notifications to farm subscribers.

**Security**: Requires `WEBHOOK_SHARED_SECRET`

**Request Body**:
```json
{
  "farm_id": "zcrm_38729000000292133",
  "message": "Apples are ready for picking!",
  "subject": "Apple Picking Season Starts",
  "from_name": "Quinn Farm"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "farm_id": "zcrm_38729000000292133",
  "emails_sent": 42,
  "failed": 0,
  "recipients": [
    "user1@example.com",
    "user2@example.com"
  ]
}
```

**Email Service**: Resend API
**Template**: Custom farm notification template
**File Location**: `src/index.js:2745`

---

## Debug/Test Endpoints

### GET /api/test-jwt

Test Clerk JWT authentication (requires valid token).

**Response** (200 OK):
```json
{
  "success": true,
  "decoded_token": {
    "userId": "user_2abc123xyz",
    "email": "test@example.com",
    "sessionId": "sess_xyz123"
  },
  "message": "JWT valid and decoded successfully"
}
```

**File Location**: `src/index.js:2675`

---

### GET /api/zoho-debug

Test Zoho OAuth token refresh and API connectivity.

**Response** (200 OK):
```json
{
  "ok": true,
  "access_token_length": 1234,
  "token_preview": "1000.abc123...",
  "dc": "ca",
  "message": "Zoho connection successful"
}
```

**File Location**: `src/index.js:2759`

---

### GET /api/token-debug

Debug token extraction from request.

**Response** (200 OK):
```json
{
  "authHeader": "Bearer eyJ...",
  "token": "eyJ...",
  "tokenLength": 1234
}
```

**File Location**: `src/index.js:2763`

---

### GET /api/test-zoho-fetch

Test fetching a specific farm from Zoho CRM.

**Query Parameters**:
- `id`: Zoho record ID (default: `38729000000292133`)

**Response** (200 OK):
```json
{
  "success": true,
  "record_id": "38729000000292133",
  "full_record": { /* complete Zoho account data */ },
  "logo1_field": "https://zohopublic...",
  "cover_field": "https://zohopublic...",
  "attachments": [
    {
      "File_Name": "logo.jpg",
      "Size": 123456,
      "$link_url": "https://..."
    }
  ],
  "attachments_count": 2
}
```

**File Location**: `src/index.js:2767`

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error category",
  "message": "Detailed error message",
  "details": { /* optional context */ }
}
```

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `200` | OK | Request succeeded |
| `400` | Bad Request | Missing required fields, invalid JSON |
| `401` | Unauthorized | Missing/invalid JWT token |
| `404` | Not Found | Farm not found, user not synced |
| `405` | Method Not Allowed | Wrong HTTP method (e.g., POST to GET endpoint) |
| `409` | Conflict | Duplicate save (farm already saved by user) |
| `500` | Internal Server Error | Database error, Zoho API failure |

### CORS Headers

All responses include CORS headers for cross-origin requests:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, x-webhook-token
```

---

## Rate Limits & Caching

### Cloudflare Worker Limits

- **Requests/day**: 100,000 (free tier)
- **CPU time**: 10ms per request (soft limit)
- **Memory**: 128MB per request

### Cache Strategy

| Endpoint | Cache Duration | Invalidation Trigger |
|----------|----------------|---------------------|
| `/api/farms/:id/subscriber-count` | 5 minutes (300s) | User subscribe/unsubscribe |
| `/api/farms/stats` | 5 minutes (300s) | N/A (bulk endpoint) |

**Cache Headers**:
```http
Cache-Control: public, max-age=300, s-maxage=300
```

### Zoho API Rate Limits

- **100 API calls/minute** per OAuth client
- **Webhook makes 2-3 calls** per farm update:
  1. Token refresh (`zohoAccessToken`)
  2. Fetch account (`zohoFetchAccount`)
  3. Fetch attachments (`zohoFetchAttachments`)

**Recommendation**: Batch webhook triggers (max 30-40 farms/minute).

---

## Quick Reference: Endpoint Summary

### Public (No Auth)
- `GET /api/farms` - List/search farms
- `GET /api/farms/stats` - Bulk subscriber counts
- `GET /api/farms/:id/subscriber-count` - Single farm subscriber count
- `GET /api/cities` - List cities
- `GET /api/search` - Full-text search

### Authenticated (Clerk JWT Required)
- `POST /api/users/sync` - Sync user to D1
- `POST /api/users/update-location` - Update user location
- `POST /api/farms/save` - Subscribe to farm
- `POST /api/farms/unsave` - Unsubscribe from farm
- `GET /api/farms/saved` - Get saved farms
- `GET /api/user/preferences` - Get notification preferences
- `PUT /api/user/preferences` - Update notification preferences
- `GET /api/farms/:id/subscribers` - Get farm subscribers (farm owner only)

### Webhooks (Token Required)
- `POST /api/zoho-webhook` - Farm create/update webhook
- `POST /api/zoho-delete` - Farm deletion webhook
- `POST /api/notifications/send` - Send notifications to subscribers

### Debug/Test
- `GET /api/test-jwt` - Test JWT auth
- `GET /api/zoho-debug` - Test Zoho connection
- `GET /api/token-debug` - Debug token extraction
- `GET /api/test-zoho-fetch` - Test Zoho farm fetch

---

## Related Documentation

- **Database Schema**: `schema.sql` - Complete D1 database structure
- **Worker Code**: `src/index.js` - Full implementation
- **Cloudflare Reference**: `Reference/workers/` - Cloudflare Workers docs
- **D1 Reference**: `Reference/d1/` - Cloudflare D1 database docs

---

**Last Updated**: October 9, 2025
**Maintainer**: Development Team
**Questions**: See `CLAUDE.md` for architecture overview
