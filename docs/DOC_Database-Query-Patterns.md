# Database Query Patterns & Best Practices

**Document Version**: 1.0
**Last Updated**: October 9, 2025
**Database**: Cloudflare D1 (SQLite)
**Schema Version**: See `schema.sql`

---

## Table of Contents

1. [Database Architecture Overview](#database-architecture-overview)
2. [Common Query Patterns](#common-query-patterns)
3. [Geospatial Queries](#geospatial-queries)
4. [Join Patterns](#join-patterns)
5. [Full-Text Search](#full-text-search)
6. [Performance Optimization](#performance-optimization)
7. [Transaction Patterns](#transaction-patterns)
8. [Common Pitfalls](#common-pitfalls)

---

## Database Architecture Overview

### D1 Database Access

**Environment Binding**: `env.DB`

```javascript
// Basic query pattern
const result = await env.DB.prepare(
  "SELECT * FROM farms WHERE id = ?"
).bind(farmId).all();

const farms = result.results || [];
```

### Key Tables

| Table | Primary Key | Purpose | Indexes |
|-------|-------------|---------|---------|
| `farms` | `zoho_record_id` (TEXT) | Farm data from Zoho CRM | `idx_farms_location`, `idx_farms_city` |
| `saved_farms` | `id` (TEXT, UUID) | User subscriptions | Composite FK on (user_id, farm_id) |
| `users` | `id` (TEXT, UUID) | User accounts (synced from Clerk) | `clerk_user_id` unique |
| `cities` | `id` (TEXT) | Metro areas for URL structure | `idx_cities_slug`, `idx_cities_state` |
| `farm_categories` | `id` (TEXT) | Category taxonomy | Primary key |

**Important**: `farms.zoho_record_id` uses format `zcrm_<numeric_id>` (e.g., `zcrm_38729000000292133`)

---

## Common Query Patterns

### 1. Get Single Farm by ID

```javascript
const farm = await env.DB.prepare(`
  SELECT
    zoho_record_id as id,
    name, slug, street,
    city as city_name, postal_code,
    state as state_province, country,
    latitude, longitude, phone, email,
    website, facebook, instagram,
    description, categories, type, amenities, varieties,
    pet_friendly, price_range,
    verified, featured, active, updated_at,
    payment_methods, opening_date, closing_date,
    monday_hours, tuesday_hours, wednesday_hours,
    thursday_hours, friday_hours, saturday_hours, sunday_hours,
    logo_url, background_url
  FROM farms
  WHERE zoho_record_id = ? AND active = 1
`).bind(farmId).first();

if (!farm) {
  // Farm not found or inactive
  return null;
}
```

**Use `.first()`** when expecting single row (returns object or null).
**Use `.all()`** when expecting multiple rows (returns `{ results: [...], success: boolean }`).

---

### 2. List Farms with Filters

```javascript
const state = "Wisconsin";
const category = "Christmas Tree";
const limit = 50;

const query = `
  SELECT
    zoho_record_id as id,
    name, slug, city as city_name,
    state as state_province, country,
    latitude, longitude, categories,
    verified, featured
  FROM farms
  WHERE active = 1
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND state = ?
    AND (categories LIKE ? OR type LIKE ?)
  ORDER BY featured DESC, verified DESC, name ASC
  LIMIT ?
`;

const result = await env.DB.prepare(query)
  .bind(state, `%${category}%`, `%${category}%`, limit)
  .all();

const farms = result.results || [];
```

**Key Points**:
- Always filter `active = 1` to exclude deleted farms
- Use `LIKE` for partial matching on CSV fields (`categories`, `type`, `amenities`)
- Order by `featured DESC, verified DESC` for best UX

---

### 3. Get Subscriber Count for Farm

```javascript
const farmId = "zcrm_38729000000292133";

const result = await env.DB.prepare(`
  SELECT COUNT(*) as count
  FROM saved_farms
  WHERE farm_id = ?
`).bind(farmId).first();

const subscriberCount = result?.count || 0;
```

**Performance**: Add index if this query becomes slow:
```sql
CREATE INDEX idx_saved_farms_farm_id ON saved_farms(farm_id);
```

---

### 4. Bulk Subscriber Counts

```javascript
const farmIds = ["zcrm_123", "zcrm_456", "zcrm_789"];

// Build parameterized query with placeholders
const placeholders = farmIds.map(() => '?').join(',');
const query = `
  SELECT
    farm_id,
    COUNT(*) as subscriber_count
  FROM saved_farms
  WHERE farm_id IN (${placeholders})
  GROUP BY farm_id
`;

const result = await env.DB.prepare(query)
  .bind(...farmIds)
  .all();

const stats = result.results || [];
// Returns: [{ farm_id: "zcrm_123", subscriber_count: 42 }, ...]
```

**Max IDs**: Limit to 100 farms per query (SQLite parameter limit is 999).

---

## Geospatial Queries

### 5. Farms Within Radius (Haversine Distance)

```javascript
const userLat = 43.0731; // Madison, WI
const userLng = -89.4012;
const radiusKm = 50;

// Step 1: Fetch all farms with coordinates
const result = await env.DB.prepare(`
  SELECT
    zoho_record_id as id,
    name, slug, latitude, longitude,
    city as city_name, state as state_province,
    categories, verified, featured
  FROM farms
  WHERE active = 1
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
`).all();

let farms = result.results || [];

// Step 2: Calculate distance and filter in JavaScript
// (SQLite doesn't have native geospatial functions)
farms = farms.map(farm => {
  const distance = calculateHaversineDistance(
    userLat, userLng,
    farm.latitude, farm.longitude
  );
  return { ...farm, distance_km: Math.round(distance * 10) / 10 };
}).filter(farm => farm.distance_km <= radiusKm);

// Step 3: Sort by distance
farms.sort((a, b) => a.distance_km - b.distance_km);
```

**Haversine Formula Implementation**:
```javascript
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

**Performance Note**: For datasets > 10,000 farms, consider bounding box pre-filter:
```sql
WHERE latitude BETWEEN ? AND ?
  AND longitude BETWEEN ? AND ?
```

Calculate bounding box:
```javascript
const latDelta = radiusKm / 111; // 1 degree latitude ≈ 111 km
const lngDelta = radiusKm / (111 * Math.cos(userLat * Math.PI / 180));

const minLat = userLat - latDelta;
const maxLat = userLat + latDelta;
const minLng = userLng - lngDelta;
const maxLng = userLng + lngDelta;
```

---

## Join Patterns

### 6. Farms with Subscriber Counts (LEFT JOIN)

```javascript
const query = `
  SELECT
    f.zoho_record_id as id,
    f.name,
    f.slug,
    f.city as city_name,
    f.state as state_province,
    COALESCE(COUNT(sf.id), 0) as subscriber_count
  FROM farms f
  LEFT JOIN saved_farms sf ON f.zoho_record_id = sf.farm_id
  WHERE f.active = 1
  GROUP BY f.zoho_record_id
  ORDER BY subscriber_count DESC
  LIMIT 50
`;

const result = await env.DB.prepare(query).all();
const farms = result.results || [];
```

**Performance**: This query is used in prebuild scripts (`generate-farm-data.js`).
**Index**: `idx_saved_farms_farm_id` helps JOIN performance.

---

### 7. User's Saved Farms with Farm Details

```javascript
const userId = "uuid-123-456";

const query = `
  SELECT
    sf.id as saved_farm_id,
    sf.saved_at,
    sf.notify_on_hours_change,
    sf.notify_on_opening_change,
    sf.notify_on_status_change,
    sf.farm_id,
    sf.farm_name,
    sf.farm_slug,
    sf.farm_city,
    sf.farm_state,
    sf.farm_phone,
    sf.farm_website
  FROM saved_farms sf
  WHERE sf.user_id = ?
  ORDER BY sf.saved_at DESC
`;

const result = await env.DB.prepare(query).bind(userId).all();
const savedFarms = result.results || [];
```

**Why no JOIN?**: Farm metadata is denormalized in `saved_farms` table for performance.
This avoids JOIN on every "Get Saved Farms" request.

**Trade-off**: If farm name/phone changes, `saved_farms` data goes stale.
**Solution**: Webhook updates `saved_farms` metadata when farm changes (future feature).

---

### 8. Get Farm Subscribers (for Email Notifications)

```javascript
const farmId = "zcrm_38729000000292133";

const query = `
  SELECT
    u.email,
    u.first_name,
    sf.notify_on_opening_change,
    sf.notify_on_hours_change
  FROM saved_farms sf
  JOIN users u ON sf.user_id = u.id
  WHERE sf.farm_id = ?
    AND sf.notify_on_opening_change = 1
`;

const result = await env.DB.prepare(query).bind(farmId).all();
const subscribers = result.results || [];

// Send email to each subscriber
for (const sub of subscribers) {
  await sendEmail({
    to: sub.email,
    subject: `Update from Quinn Farm`,
    // ...
  });
}
```

**Use Case**: Webhook detects `opening_date` changed → notify subscribers.

---

## Full-Text Search

### 9. FTS5 Full-Text Search

**Table**: `farms_fts` (virtual table using FTS5)

```javascript
const searchQuery = "pumpkin patch";

const query = `
  SELECT
    f.zoho_record_id as id,
    f.name,
    f.slug,
    f.description,
    f.city as city_name,
    f.state as state_province
  FROM farms_fts fts
  JOIN farms f ON fts.rowid = f.zoho_record_id
  WHERE farms_fts MATCH ?
  ORDER BY rank
  LIMIT 50
`;

const result = await env.DB.prepare(query)
  .bind(searchQuery)
  .all();

const searchResults = result.results || [];
```

**FTS5 Features**:
- **Phrase search**: `"christmas tree"` (exact phrase)
- **Prefix search**: `pump*` (matches pumpkin, pumps, etc.)
- **Boolean operators**: `pumpkin AND patch`, `apple OR orange`

**Performance**: FTS5 is extremely fast (< 10ms for 10,000 farms).

**Index Maintenance**: Triggers keep `farms_fts` in sync with `farms` table (see `schema.sql:311-326`).

---

## Performance Optimization

### 10. Using Indexes Effectively

**Current Indexes** (from `schema.sql`):

```sql
CREATE INDEX idx_farms_location ON farms(latitude, longitude);
CREATE INDEX idx_farms_city ON farms(city_id, featured);
CREATE INDEX idx_farms_verified ON farms(verified, featured);
CREATE INDEX idx_cities_state ON cities(state_province, tier);
CREATE INDEX idx_cities_slug ON cities(state_province, slug);
```

**Query Optimization Tips**:

1. **Use indexed columns in WHERE clause**:
   ```sql
   -- GOOD: Uses idx_farms_city
   WHERE city_id = ? AND featured = 1

   -- BAD: Requires full table scan
   WHERE city = ?
   ```

2. **Avoid functions on indexed columns**:
   ```sql
   -- BAD: Can't use index
   WHERE LOWER(name) = 'quinn farm'

   -- GOOD: Store lowercase version in separate column + index
   WHERE name_lower = 'quinn farm'
   ```

3. **Limit result sets early**:
   ```sql
   -- GOOD: Limits scan
   WHERE active = 1 AND state = ? LIMIT 50

   -- BAD: Scans entire table first
   SELECT * FROM farms WHERE active = 1 LIMIT 50
   ```

---

### 11. Prepared Statements (Always Use bind())

**NEVER concatenate user input into SQL**:
```javascript
// ❌ DANGEROUS - SQL injection risk
const badQuery = `SELECT * FROM farms WHERE name = '${userName}'`;

// ✅ SAFE - parameterized query
const goodQuery = await env.DB.prepare(
  "SELECT * FROM farms WHERE name = ?"
).bind(userName).all();
```

**Benefits**:
- **Security**: Prevents SQL injection
- **Performance**: D1 caches prepared statements
- **Type handling**: Automatic NULL handling, escaping

---

### 12. Batch Operations

**Insert Multiple Rows in One Transaction**:
```javascript
const farms = [
  { id: 'zcrm_1', name: 'Farm A', lat: 43.0, lng: -89.0 },
  { id: 'zcrm_2', name: 'Farm B', lat: 43.1, lng: -89.1 },
];

// Use batch() for atomic inserts
const statements = farms.map(farm =>
  env.DB.prepare(
    "INSERT INTO farms (zoho_record_id, name, latitude, longitude) VALUES (?, ?, ?, ?)"
  ).bind(farm.id, farm.name, farm.lat, farm.lng)
);

const results = await env.DB.batch(statements);
```

**Performance**: `batch()` is 10-100x faster than sequential inserts.

---

## Transaction Patterns

### 13. Atomic Operations (UPSERT Pattern)

**Insert or Update Farm Data**:
```javascript
const farmData = {
  id: 'zcrm_38729000000292133',
  name: 'Quinn Farm',
  city: 'Madison',
  state: 'Wisconsin',
  // ... other fields
};

// UPSERT: INSERT or UPDATE if exists
const query = `
  INSERT INTO farms (
    zoho_record_id, name, city, state, updated_at
  ) VALUES (?, ?, ?, ?, datetime('now'))
  ON CONFLICT(zoho_record_id) DO UPDATE SET
    name = excluded.name,
    city = excluded.city,
    state = excluded.state,
    updated_at = datetime('now')
`;

await env.DB.prepare(query)
  .bind(farmData.id, farmData.name, farmData.city, farmData.state)
  .run();
```

**Key**: `ON CONFLICT(zoho_record_id)` uses PRIMARY KEY constraint.

---

### 14. Conditional Updates (Change Detection)

**Only update if value changed**:
```javascript
const farmId = 'zcrm_123';
const newOpeningDate = '2025-09-15';

// Step 1: Get current value
const current = await env.DB.prepare(
  "SELECT opening_date FROM farms WHERE zoho_record_id = ?"
).bind(farmId).first();

const oldOpeningDate = current?.opening_date;

// Step 2: Update only if changed
if (oldOpeningDate !== newOpeningDate) {
  await env.DB.prepare(`
    UPDATE farms
    SET opening_date = ?, updated_at = datetime('now')
    WHERE zoho_record_id = ?
  `).bind(newOpeningDate, farmId).run();

  // Step 3: Trigger notifications
  await notifySubscribers(farmId, {
    old: oldOpeningDate,
    new: newOpeningDate
  });
}
```

**Use Case**: Zoho webhook only sends notifications if dates actually changed.

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting `.all()` or `.first()`

```javascript
// ❌ WRONG - returns D1PreparedStatement, not data
const farms = env.DB.prepare("SELECT * FROM farms");

// ✅ CORRECT
const result = await env.DB.prepare("SELECT * FROM farms").all();
const farms = result.results || [];
```

---

### ❌ Pitfall 2: Not Checking `active = 1`

```javascript
// ❌ BAD - includes deleted farms
SELECT * FROM farms WHERE state = 'Wisconsin'

// ✅ GOOD
SELECT * FROM farms WHERE active = 1 AND state = 'Wisconsin'
```

**Note**: Deleted farms have `active = 0`, not actually deleted from DB (soft delete).

---

### ❌ Pitfall 3: NULL Handling in Coordinates

```javascript
// ❌ BAD - crashes if latitude/longitude is NULL
const distance = calculateHaversineDistance(
  userLat, userLng,
  farm.latitude, farm.longitude
);

// ✅ GOOD - filter NULLs in SQL
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
```

---

### ❌ Pitfall 4: LIKE Performance on Large Datasets

```javascript
// ❌ SLOW - full table scan
WHERE categories LIKE '%Christmas Tree%'

// ✅ FASTER - use FTS5 for text search
WHERE farms_fts MATCH 'christmas tree'
```

**Rule**: Use `LIKE` for small result sets (< 1000 rows). Use FTS5 for large datasets.

---

### ❌ Pitfall 5: Forgetting to Handle Empty Results

```javascript
// ❌ CRASHES if no farm found
const farm = result.results[0];
const name = farm.name; // TypeError if results is empty

// ✅ SAFE
const farm = result.results?.[0];
if (!farm) {
  return new Response(JSON.stringify({ error: "Farm not found" }), {
    status: 404
  });
}
```

---

## Quick Reference: Common Queries

### Get Farm by Slug
```sql
SELECT * FROM farms WHERE slug = ? AND active = 1 LIMIT 1
```

### Get User by Clerk ID
```sql
SELECT id, email FROM users WHERE clerk_user_id = ? LIMIT 1
```

### Check if Farm is Saved by User
```sql
SELECT id FROM saved_farms WHERE user_id = ? AND farm_id = ? LIMIT 1
```

### Get Farms by State
```sql
SELECT * FROM farms
WHERE active = 1 AND state = ?
ORDER BY featured DESC, verified DESC, name ASC
LIMIT 50
```

### Get Farms by Category
```sql
SELECT * FROM farms
WHERE active = 1 AND (categories LIKE ? OR type LIKE ?)
LIMIT 50
```

### Delete Saved Farm
```sql
DELETE FROM saved_farms WHERE user_id = ? AND farm_id = ?
```

### Update Farm Status
```sql
UPDATE farms
SET active = ?, updated_at = datetime('now')
WHERE zoho_record_id = ?
```

---

## Related Documentation

- **Database Schema**: `schema.sql` - Complete table definitions with comments
- **API Reference**: `docs/DOC_API-Endpoints-Reference.md` - How queries are used in endpoints
- **Worker Code**: `src/index.js` - Real-world query examples
- **D1 Reference**: `Reference/d1/` - Cloudflare D1 documentation

---

## Performance Benchmarks (Estimated)

| Query Type | Rows | Avg Time | Notes |
|------------|------|----------|-------|
| Single farm by ID | 1 | < 5ms | Indexed PK lookup |
| List farms (no filters) | 588 | ~20ms | Full table scan |
| List farms (filtered by state) | ~50 | ~10ms | Uses index |
| Geospatial (50km radius) | ~100 | ~50ms | In-memory distance calc |
| FTS5 search | ~20 | < 10ms | FTS5 index very fast |
| Subscriber count (single farm) | 1 | < 5ms | Simple COUNT |
| Join (farms + subscribers) | 588 | ~30ms | Moderate complexity |

**Hardware**: Cloudflare Workers (V8 isolates, global edge network)
**Database Size**: ~1000 farms, ~10,000 saved_farms

---

**Last Updated**: October 9, 2025
**Maintainer**: Development Team
**Questions**: See `CLAUDE.md` for architecture overview
