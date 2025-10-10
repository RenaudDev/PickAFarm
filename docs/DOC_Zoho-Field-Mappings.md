# Zoho CRM Field Mappings

**Document Version**: 1.0
**Last Updated**: October 9, 2025
**Zoho Module**: Accounts (Farms)
**Data Center**: Canada (`.ca`)

---

## Table of Contents

1. [Overview](#overview)
2. [Complete Field Mapping Table](#complete-field-mapping-table)
3. [Field Type Transformations](#field-type-transformations)
4. [Special Cases & Quirks](#special-cases--quirks)
5. [Image Field Handling](#image-field-handling)
6. [Validation Rules](#validation-rules)

---

## Overview

This document provides the **exact mapping** between Zoho CRM Account fields and PickAFarm D1 database columns. All field names are **case-sensitive** in the Zoho API.

### Sync Process

**Source of Truth**: Zoho CRM
**Sync Method**: Webhook-driven (near real-time)
**Sync Function**: `upsertFarm()` in `src/index.js:254`

**Workflow**:
1. Farmer updates farm via Zoho form
2. Zoho Workflow Rule triggers webhook (`POST /api/zoho-webhook`)
3. Worker fetches complete record from Zoho API
4. `upsertFarm()` transforms and inserts/updates D1 database
5. Site rebuild triggered to regenerate static JSON files

---

## Complete Field Mapping Table

| Zoho CRM Field | D1 Column | Type | Transformation | Notes |
|----------------|-----------|------|----------------|-------|
| **Basic Information** |
| `Account_Name` | `name` | TEXT | None | Farm name (required) |
| `Slug` | `slug` | TEXT | `slugify(Account_Name)` | Auto-generated from name if empty |
| `Website` | `website` | TEXT | None | Full URL (e.g., `https://farm.com`) |
| `Phone` | `phone` | TEXT | None | Any format accepted |
| `Email` | `email` | TEXT | None | Farm contact email |
| `Description` | `description` | TEXT | None | Long-form farm description |
| **Address Fields** |
| `Billing_Street` | `street` | TEXT | None | Street address |
| `Billing_City` | `city` | TEXT | None | City name (not city_id reference) |
| `Billing_Code` | `postal_code` | TEXT | None | ZIP/postal code |
| `Billing_State` | `state` | TEXT | None | State/province name |
| `Billing_Country` | `country` | TEXT | None | Country name (USA, Canada) |
| **Geolocation** |
| `latitude` | `latitude` | REAL | `Number()` | Decimal degrees (e.g., 43.0731) |
| `longitude` | `longitude` | REAL | `Number()` | Decimal degrees (e.g., -89.4012) |
| `PlaceID` | `place_id` | TEXT | None | Google Maps Place ID |
| **Social Media** |
| `Google_My_Business` | `location_link` | TEXT | None | Google Maps link |
| `Facebook` | `facebook` | TEXT | None | Facebook page URL |
| `Instagram` | `instagram` | TEXT | None | Instagram profile URL |
| **Farm Categories & Types** |
| `Type_of_Farm` | `categories` | TEXT | `toCSV()` | Multi-select → CSV (see below) |
| `Services_Type` | `type` | TEXT | `toCSV()` | Operational type (U-Pick, Pre-Cut) |
| `Amenities` | `amenities` | TEXT | `toCSV()` | Facilities offered |
| `Varieties` | `varieties` | TEXT | `toCSV()` | Crop/tree varieties |
| `Payment_Methods` | `payment_methods` | TEXT | `toCSV()` | Accepted payment types |
| **Pricing** |
| `Price_Range` | `price_range` | TEXT | None | Free-text (e.g., "$5 - $25") |
| **Season & Hours** |
| `Open_Date` | `opening_date` | TEXT | `String()` | ISO date: `YYYY-MM-DD` |
| `Close_Day` | `closing_date` | TEXT | `String()` | ISO date: `YYYY-MM-DD` |
| `Monday` | `monday_hours` | TEXT | `String()` | Free-text (e.g., "9am - 5pm") |
| `Tuesday` | `tuesday_hours` | TEXT | `String()` | Free-text |
| `Wednesday` | `wednesday_hours` | TEXT | `String()` | Free-text |
| `Thursday` | `thursday_hours` | TEXT | `String()` | Free-text |
| `Friday` | `friday_hours` | TEXT | `String()` | Free-text |
| `Saturday` | `saturday_hours` | TEXT | `String()` | Free-text |
| `Sunday` | `sunday_hours` | TEXT | `String()` | Free-text |
| **Boolean Fields** |
| `Pet_Friendly` | `pet_friendly` | INTEGER | Tri-state (see below) | `"TRUE"` → 1, `"FALSE"` → 0, null → null |
| `Featured` | `featured` | INTEGER | Boolean → int | `true` → 1, `false` → 0 |
| `Verified` | `verified` | INTEGER | Boolean → int | `true` → 1, `false` → 0 |
| **Image Fields** |
| `Logo1` | `logo_url` | TEXT | Image pipeline | See Image Handling section |
| `Cover` | `background_url` | TEXT | Image pipeline | See Image Handling section |
| **Metadata (Auto-Generated)** |
| N/A | `zoho_record_id` | TEXT (PK) | `zcrm_${id}` | Primary key (e.g., `zcrm_38729000000292133`) |
| N/A | `zoho_last_sync` | TEXT | `new Date().toISOString()` | Last sync timestamp |
| N/A | `updated_at` | TEXT | `new Date().toISOString()` | Last update timestamp |
| N/A | `logo_updated_at` | TEXT | Image processor | When logo was last updated |
| N/A | `background_updated_at` | TEXT | Image processor | When background was last updated |
| N/A | `active` | INTEGER | Default: 1 | 0 = soft deleted |

---

## Field Type Transformations

### 1. Multi-Select to CSV (`toCSV()` Function)

**Zoho Field Type**: Multi-select picklist
**D1 Storage**: TEXT (comma-separated values)

**Function** (`src/index.js:212`):
```javascript
function toCSV(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
```

**Examples**:

| Zoho API Response | D1 Stored Value |
|-------------------|-----------------|
| `["Christmas Trees", "Pumpkins"]` | `"Christmas Trees, Pumpkins"` |
| `["U-Pick", "Pre-Cut"]` | `"U-Pick, Pre-Cut"` |
| `"Cash"` | `"Cash"` |
| `null` | `null` |

**Affected Fields**:
- `Type_of_Farm` → `categories`
- `Services_Type` → `type`
- `Amenities` → `amenities`
- `Varieties` → `varieties`
- `Payment_Methods` → `payment_methods`

---

### 2. Pet-Friendly Tri-State

**Zoho Field Type**: Picklist with 3 values
**Zoho Values**: `"TRUE"` (string), `"FALSE"` (string), or `null`
**D1 Storage**: INTEGER (nullable)

**Transformation Logic** (`src/index.js:284`):
```javascript
const petFriendly = rec.Pet_Friendly === "TRUE" ? 1 :
                    (rec.Pet_Friendly === "FALSE" ? 0 : null);
```

**Mapping Table**:

| Zoho Value | D1 Value | Display to User |
|------------|----------|-----------------|
| `"TRUE"` | `1` | "Pet-friendly" |
| `"FALSE"` | `0` | "No pets allowed" |
| `null` or empty | `null` | "Pet policy unknown" |

**Why This Matters**: Allows farms to explicitly state "no pets" vs. "didn't specify".

---

### 3. Boolean Checkboxes

**Zoho Field Type**: Checkbox (boolean)
**Zoho Values**: `true` or `false`
**D1 Storage**: INTEGER (1 or 0)

**Transformation** (`src/index.js:287-288`):
```javascript
const featured = rec.Featured === true ? 1 : 0;
const verified = rec.Verified === true ? 1 : 0;
```

**Affected Fields**:
- `Featured` → `featured` (premium placement)
- `Verified` → `verified` (admin-approved farm)

---

### 4. Coordinates (Lat/Lng)

**Zoho Field Type**: Decimal or text
**D1 Storage**: REAL (nullable)

**Transformation** (`src/index.js:331-332`):
```javascript
let lat = rec.latitude !== "" && rec.latitude != null ? Number(rec.latitude) : null;
let lng = rec.longitude !== "" && rec.longitude != null ? Number(rec.longitude) : null;
```

**Validation**:
- Empty string (`""`) → `null`
- Valid number → Parsed as float
- Missing/null → `null`

**Fallback**: If coordinates missing, geocoding service can be integrated (currently logged as warning).

---

### 5. Date Fields

**Zoho Field Type**: Date
**Zoho Format**: `YYYY-MM-DD` (ISO 8601)
**D1 Storage**: TEXT (preserves ISO format)

**Transformation**:
```javascript
const openingDate = rec.Open_Date ? String(rec.Open_Date) : null;
const closingDate = rec.Close_Day ? String(rec.Close_Day) : null;
```

**Affected Fields**:
- `Open_Date` → `opening_date`
- `Close_Day` → `closing_date`

**Important**: These fields trigger email notifications when changed.

---

### 6. Operating Hours (Free-Text)

**Zoho Field Type**: Text (single line)
**D1 Storage**: TEXT

**Format**: No validation, farmers can enter any text
**Common Formats**:
- `"9am - 5pm"`
- `"Closed"`
- `"10:00 AM - 6:00 PM"`
- `"By appointment"`

**Affected Fields**:
- `Monday` → `monday_hours`
- `Tuesday` → `tuesday_hours`
- ... (one per day of week)

**Note**: No structured time parsing. Display as-is to users.

---

### 7. Slug Generation

**Zoho Field**: `Slug` (optional)
**D1 Column**: `slug` (required, unique)

**Logic**:
1. If Zoho `Slug` field has value → use it
2. Otherwise → auto-generate from `Account_Name`

**Slugify Function** (`src/index.js:227`):
```javascript
function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "")       // Remove leading/trailing hyphens
    .slice(0, 120);                // Limit to 120 chars
}
```

**Examples**:
- `"Quinn's Christmas Tree Farm"` → `"quinn-s-christmas-tree-farm"`
- `"Happy Pumpkin Patch & Corn Maze"` → `"happy-pumpkin-patch-corn-maze"`

**Uniqueness**: Ensured by database UNIQUE constraint. If duplicate, upsert will fail.

---

## Special Cases & Quirks

### ⚠️ Quirk 1: Pet_Friendly is a STRING, not Boolean

```javascript
// ❌ WRONG
if (rec.Pet_Friendly) { ... }  // Always truthy if set to "FALSE"

// ✅ CORRECT
if (rec.Pet_Friendly === "TRUE") { ... }
```

---

### ⚠️ Quirk 2: Empty Strings vs. Null

Zoho sometimes returns `""` (empty string) instead of `null`.

**Safe Pattern**:
```javascript
const value = rec.Field !== "" && rec.Field != null ? rec.Field : null;
```

---

### ⚠️ Quirk 3: Zoho ID Format

**Zoho API returns**: Numeric string (e.g., `"38729000000292133"`)
**D1 stores as**: `zcrm_` prefixed (e.g., `"zcrm_38729000000292133"`)

**Normalization** (`src/index.js:830-832`):
```javascript
const rawId = String(zohoId);
const apiId = rawId.replace(/^zcrm_/, "");  // Strip prefix for API calls
const d1Id = rawId.startsWith("zcrm_") ? rawId : `zcrm_${rawId}`;  // Add prefix for D1
```

---

### ⚠️ Quirk 4: Multi-Select Can Be String or Array

Zoho API inconsistently returns multi-select fields:
- Sometimes: `["Option 1", "Option 2"]` (array)
- Sometimes: `"Option 1, Option 2"` (string)

**Safe Handling** (`toCSV()` function):
```javascript
if (Array.isArray(v)) return v.join(", ");  // Convert array to CSV
if (typeof v === 'object') return JSON.stringify(v);  // Fallback for objects
return String(v);  // Already a string, keep as-is
```

---

## Image Field Handling

### Logo and Background Images

**Zoho Fields**: `Logo1`, `Cover`
**Zoho Type**: File Upload
**D1 Columns**: `logo_url`, `background_url`

**Pipeline** (`src/index.js:883-920`):

1. **Fetch Zoho Attachments API**
   - `GET /crm/v3/Accounts/{id}/Attachments`
   - Returns file metadata with download URLs

2. **Extract File URLs**
   - `Logo1` field structure:
     ```json
     [
       {
         "file_Id": "123abc",
         "attachment_Id": "456def"
       }
     ]
     ```
   - Construct download URL:
     ```
     https://www.zohoapis.ca/crm/v3/Accounts/{account_id}/Attachments/{attachment_id}
     ```

3. **Download from Zoho**
   - Fetch image binary data from Zoho CDN

4. **Upload to R2**
   - Store in Cloudflare R2 bucket: `pickafarm-assets`
   - Key format: `logos/{zoho_record_id}.jpg`
   - CDN URL: `https://cdn.pickafarm.com/logos/{zoho_record_id}.jpg`

5. **Update D1**
   - Set `logo_url` = R2 CDN URL
   - Set `logo_updated_at` = current timestamp

**File Location**: `src/lib/image-processor.js`

**Fallback**: If `Logo1`/`Cover` fields empty, check Attachments API for files named "logo" or "cover".

---

## Validation Rules

### Required Fields (Enforced in Zoho)

| Field | Constraint | Error if Missing |
|-------|------------|------------------|
| `Account_Name` | Required | `"Account name is required"` |
| `Billing_City` | Required | Form won't submit |
| `Billing_State` | Required | Form won't submit |

### Recommended but Optional

| Field | Why Important | Impact if Missing |
|-------|---------------|-------------------|
| `latitude`, `longitude` | Geospatial search | Farm won't show in radius searches |
| `Open_Date`, `Close_Day` | Season tracking | No notifications sent |
| `categories` (Type_of_Farm) | Filtering | Farm won't appear in category searches |

### URL Validation (Recommended)

**Fields**: `Website`, `Facebook`, `Instagram`

**Best Practice** (not enforced):
- Full URLs with protocol: `https://farm.com` (not `farm.com`)
- Social media: Full profile URLs (not usernames)

---

## Testing Zoho Integration

### Test Farm Record

**Zoho Account ID**: `38729000000292133` (Quinn Farm)

**Test Endpoint**:
```bash
GET /api/test-zoho-fetch?id=38729000000292133
```

**Response**: Full Zoho record with all field mappings displayed.

---

## Common Issues & Solutions

### Issue 1: Farm Not Appearing on Site

**Cause**: `active = 0` (soft deleted) or missing coordinates

**Check**:
```sql
SELECT zoho_record_id, name, active, latitude, longitude
FROM farms
WHERE name LIKE '%Farm Name%';
```

**Fix**:
- Set `active = 1` in Zoho (or re-sync farm)
- Add latitude/longitude to Zoho CRM

---

### Issue 2: Categories Not Filtering Correctly

**Cause**: CSV matching issue (spaces, capitalization)

**Check**:
```sql
SELECT name, categories FROM farms WHERE zoho_record_id = 'zcrm_123';
```

**Expected**: `"Christmas Trees, Pumpkins"` (exact spelling, spaces after commas)

**Fix**: Standardize category names in Zoho picklist.

---

### Issue 3: Images Not Displaying

**Cause**: Image processing pipeline failed

**Check**:
```sql
SELECT name, logo_url, background_url, logo_updated_at
FROM farms
WHERE zoho_record_id = 'zcrm_123';
```

**Expected**: CDN URLs like `https://cdn.pickafarm.com/logos/zcrm_123.jpg`

**Fix**:
1. Check Zoho `Logo1`/`Cover` fields populated
2. Check R2 bucket (`pickafarm-assets`) for files
3. Re-trigger webhook to reprocess images

---

## Related Documentation

- **API Reference**: `docs/DOC_API-Endpoints-Reference.md` - `/api/zoho-webhook` endpoint
- **Database Schema**: `schema.sql` - `farms` table structure
- **Worker Code**: `src/index.js` - `upsertFarm()` function (line 254)
- **Image Processor**: `src/lib/image-processor.js` - Image pipeline implementation

---

**Last Updated**: October 9, 2025
**Maintainer**: Development Team
**Questions**: See `CLAUDE.md` for architecture overview
