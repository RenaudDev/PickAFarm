# PickAFarm Technical Documentation

**Last Updated:** 2025-09-17  
- **Status:** Phase 2 In Progress — Farm detail pages complete, static prefetch enabled  
- **Version:** 1.1.0

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Key Technical Decisions](#key-technical-decisions)
3. [Database Schema](#database-schema)
4. [API Documentation](#api-documentation)
5. [Deployment Information](#deployment-information)
6. [Development Workflow](#development-workflow)
7. [Configuration Files](#configuration-files)
8. [Testing & Verification](#testing--verification)

---

## 🏗️ Architecture Overview

### **Tech Stack - DEPLOYED**

| Component | Technology | URL/Resource |
|-----------|------------|--------------|
| **Database** | Cloudflare D1 (SQLite) | `pickafarm-db` (175c8757-6538-4bb7-ba4a-a7e4590e6478) |
| **API** | Cloudflare Workers | `https://pickafarm-api.94623956quebecinc.workers.dev` |
| **Web App** | Next.js 15 (Static Export) + TypeScript + Tailwind v4 | `https://f721ea96.pickafarm.pages.dev` |
| **Repository** | GitHub | `https://github.com/RenaudDev/PickAFarm` |
| **Styling** | Tailwind CSS v4 | PostCSS configured |
| **TypeScript** | v5 | Enabled across all components |

### **Data Flow Architecture**

```
Zoho CRM (Future) → Webhook → Cloudflare Workers → D1 Database → API Responses → Web/Mobile Apps
```

**Current Implementation:**
```
D1 Database ← Cloudflare Worker API ← Next.js Web App (static export)
```

### Build-time Static Data Generation (New)
- Location: `web/scripts/generate-farm-data.js`
- Runs automatically before build via `prebuild` script
- Fetches from: `GET /api/farms`
- Writes JSON artifacts consumed at build time:
  - `web/data/farms.json` (array of farms)
  - `web/data/farm-params.json` (array of `{ id: string }` for `generateStaticParams`)
- Pages import these JSON files directly (no runtime API calls):
  - Example imports in `web/app/farm/[id]/page.tsx`:
    - `import farmParams from "../../../data/farm-params.json"`
    - `import farmsData from "../../../data/farms.json"`

Notes:
- Next.js 15 requires async params signature: `({ params }: { params: Promise<{ id: string }> })`.
- We map only minimal fields required for the page (id, name, description, street, city_name, state_province, phone, website). Missing fields (e.g., `email`) fall back to mock defaults.

---

## 🎯 Key Technical Decisions

### **Decision 1: Primary Key Strategy**
- **Choice:** `zoho_record_id` as primary key for farms table
- **Rationale:** Immutable identity from Zoho CRM, enables direct webhook processing
- **Impact:** Simplified CRM integration, no ID mapping required
- **Date:** 2025-09-17

### **Decision 2: Database Schema Design**
- **Choice:** 1:1 mapping between Zoho CRM fields and database columns
- **Rationale:** Eliminates data transformation, simplifies webhook processing
- **Impact:** 49-column farms table with direct CSV field mapping
- **Date:** 2025-09-17

### **Decision 3: API Architecture**
- **Choice:** Single Cloudflare Worker serving multiple endpoints
- **Rationale:** Edge computing, automatic scaling, cost efficiency
- **Impact:** Sub-500ms global response times, CORS-enabled
- **Date:** 2025-09-17

### **Decision 4: Static Site Generation**
- **Choice:** Next.js with static export to Cloudflare Pages
- **Rationale:** Fast loading, CDN distribution, ISR capability for future
- **Impact:** Global edge deployment, automatic GitHub integration
- **Date:** 2025-09-17

### **Decision 5: Development Workflow**
- **Choice:** GitHub-based deployments with Wrangler CLI
- **Rationale:** Version control integration, automated deployments
- **Impact:** Push-to-deploy for web, manual deploy for API/DB
- **Date:** 2025-09-17

---

## 🗄️ Database Schema

### **Database Information**
- **Type:** Cloudflare D1 (SQLite at the edge)
- **Database ID:** `175c8757-6538-4bb7-ba4a-a7e4590e6478`
- **Database Name:** `pickafarm-db`
- **Size:** 0.27 MB (as of 2025-09-17)

### **Farms Table (49 columns)**

**Primary Key:** `zoho_record_id TEXT PRIMARY KEY`

#### **Zoho CRM Direct Mappings:**
| Column | Type | Zoho CSV Field | Notes |
|--------|------|----------------|-------|
| `name` | TEXT NOT NULL | Business Name | Farm display name |
| `website` | TEXT | website | Farm website URL |
| `location_link` | TEXT | location_link | Google Maps link |
| `facebook` | TEXT | facebook | Facebook page URL |
| `instagram` | TEXT | instagram | Instagram handle |
| `categories` | TEXT | Categories | JSON/comma-separated |
| `established_in` | INTEGER | Established in | Year established |
| `opening_date` | TEXT | Opening Date | Seasonal opening |
| `closing_date` | TEXT | Closing Date | Seasonal closing |
| `type` | TEXT | Type | U-Pick, Pre-Cut, etc. |
| `amenities` | TEXT | amenities | JSON/comma-separated |
| `varieties` | TEXT | Varieties | JSON/comma-separated |
| `pet_friendly` | BOOLEAN | Pet Friendly | Default: 0 |
| `price_range` | TEXT | Price Range | Full text: "$39 - $349" |
| `payment_methods` | TEXT | Payment Methods | JSON/comma-separated |

#### **Operating Hours (7 columns):**
| Column | Type | Zoho CSV Field |
|--------|------|----------------|
| `sunday_hours` | TEXT | Sunday (hours) |
| `monday_hours` | TEXT | Monday (hours) |
| `tuesday_hours` | TEXT | Tuesday (hours) |
| `wednesday_hours` | TEXT | Wednesday (hours) |
| `thursday_hours` | TEXT | Thursday (hours) |
| `friday_hours` | TEXT | Friday (hours) |
| `saturday_hours` | TEXT | Saturday (hours) |

#### **Location & Contact (11 columns):**
| Column | Type | Zoho CSV Field | Notes |
|--------|------|----------------|-------|
| `description` | TEXT | description | Rich text description |
| `street` | TEXT | street | Street address |
| `city` | TEXT | city | City name (for Zoho mapping) |
| `postal_code` | TEXT | postal_code | Postal/ZIP code |
| `state` | TEXT | state | State/Province |
| `country` | TEXT | country | Country name |
| `latitude` | REAL | latitude | GPS coordinates |
| `longitude` | REAL | longitude | GPS coordinates |
| `place_id` | TEXT | place_id | Google Maps Place ID |
| `phone` | TEXT | phone | Contact phone |
| `email` | TEXT | email | Contact email |

#### **Internal Website Fields (15 columns):**
| Column | Type | Purpose | Default |
|--------|------|---------|---------|
| `slug` | TEXT UNIQUE | URL-friendly identifier | - |
| `city_id` | TEXT | Reference to cities table | - |
| `price_range_min` | DECIMAL(6,2) | Parsed from price_range | - |
| `price_range_max` | DECIMAL(6,2) | Parsed from price_range | - |
| `zoho_last_sync` | TEXT | Last CRM sync timestamp | - |
| `zoho_webhook_token` | TEXT | Webhook verification | - |
| `farmer_update_token` | TEXT | Secure update token | - |
| `farmer_token_expires` | TEXT | Token expiration | - |
| `last_farmer_update` | TEXT | Last farmer update | - |
| `farmer_update_frequency` | INTEGER | Update reminder days | 7 |
| `verified` | BOOLEAN | Admin verified | 0 |
| `featured` | BOOLEAN | Featured listing | 0 |
| `active` | BOOLEAN | Publicly visible | 1 |
| `created_at` | TEXT | Record creation | CURRENT_TIMESTAMP |
| `updated_at` | TEXT | Last modification | CURRENT_TIMESTAMP |

### **Cities Table (12 columns)**

**Primary Key:** `id TEXT PRIMARY KEY`

| Column | Type | Purpose | Default |
|--------|------|---------|---------|
| `id` | TEXT | Unique identifier | - |
| `name` | TEXT NOT NULL | City name | - |
| `slug` | TEXT NOT NULL | URL-friendly name | - |
| `state_province` | TEXT NOT NULL | State/Province | - |
| `country` | TEXT NOT NULL | Country | 'USA' |
| `latitude` | REAL | GPS coordinates | - |
| `longitude` | REAL | GPS coordinates | - |
| `population` | INTEGER | City population | - |
| `tier` | INTEGER | City tier (1-3) | - |
| `has_dedicated_page` | BOOLEAN | Has city page | 0 |
| `nearest_major_city_id` | TEXT | Reference to major city | - |
| `created_at` | TEXT | Record creation | CURRENT_TIMESTAMP |

---

## 🔌 API Documentation

### **Base URL**
```
https://pickafarm-api.94623956quebecinc.workers.dev
```

### **Authentication**
- **Type:** None (public API)
- **CORS:** Enabled for all origins
- **Rate Limiting:** Cloudflare default limits

### **Endpoints**

#### **GET /api/farms** - List Farms
```http
GET /api/farms?state={state}&city={city}&limit={limit}
```

Response (shape):
```json
{
  "farms": [
    {
      "id": "zoho-001-johnsons-orchard",
      "name": "Johnson's Apple Orchard",
      "slug": "johnsons-apple-orchard",
      "street": "1234 Orchard Lane",
      "phone": "+1 (416) 555-0123",
      "website": "https://johnsonsorchard.com",
      "latitude": 43.7315,
      "longitude": -79.2845,
      "description": "...",
      "pet_friendly": 1,
      "price_range_min": 15,
      "price_range_max": 45,
      "verified": 1,
      "featured": 1,
      "active": 1,
      "city_name": "Toronto",
      "city_slug": "Toronto",
      "state_province": "Ontario"
    }
  ],
  "count": 4,
  "filters": { "state": null, "city": null, "category": null, "limit": 50 }
}
```

Implementation note:
- The web prebuild script expects the response wrapper `{ farms: [...] }` and extracts `data.farms`.

---

## 🚀 Deployment Information

### **Live Resources**

| Resource | URL | Status |
|----------|-----|--------|
| **API** | https://pickafarm-api.94623956quebecinc.workers.dev | ✅ Live |
| **Web App** | https://f721ea96.pickafarm.pages.dev | ✅ Live |
| **Repository** | https://github.com/RenaudDev/PickAFarm | ✅ Active |

### **Cloudflare Resources**

#### **D1 Database**
- Name: `pickafarm-db`
- ID: `175c8757-6538-4bb7-ba4a-a7e4590e6478`

#### **Workers**
- Name: `pickafarm-api`
- Runtime: V8 JavaScript

#### **Pages**
- Framework: Next.js static export (`web/next.config.js` sets `output: 'export'`)
- Prebuild: `web/scripts/generate-farm-data.js` via `web/package.json` `prebuild`

Wrangler note:
- `wrangler.toml` configures the Worker (API). Cloudflare Pages does not use `wrangler.toml` unless `pages_build_output_dir` is present. The warning in build logs is expected and can be ignored.

---

## 🔧 Development Workflow

### Monorepo commands (root `package.json` uses workspaces)
- Run web dev server: `npm run dev`
- Build web (prebuild runs automatically): `npm run build`
- Start production locally: `npm run start`

### Web-only commands (`/web`)
- Dev: `npm run dev`
- Prebuild only (fetch JSON): `npm run generate-data`
- Build: `npm run build`

### API/DB
- Deploy API: `wrangler deploy`
- Query DB: `wrangler d1 execute pickafarm-db --remote --command="SELECT COUNT(*) FROM farms"`

---

## 🧪 Testing & Verification

### Web verification checklist
- Ensure `web/data/farms.json` and `web/data/farm-params.json` are generated during build
- Verify `app/farm/[id]/page.tsx` imports JSON via relative paths (not `@/` alias)
- Confirm farm pages render without runtime API calls

### API tests
- `curl "https://pickafarm-api.94623956quebecinc.workers.dev/api/farms"`
- `curl "https://pickafarm-api.94623956quebecinc.workers.dev/api/cities"`

---

## 🛠️ Troubleshooting (Common)
- **Wrangler warning on Pages builds**: Safe to ignore unless using `pages_build_output_dir`.
- **Module not found for JSON imports**: Use relative imports to `web/data/*.json` from page files.
- **Next.js 15 params type error**: Use `({ params }: { params: Promise<{ id: string }> })` and `const { id } = await params`.
- **TypeScript errors for missing fields**: Only map fields that exist in `farms.json`; use mock defaults for non-existent fields.
- **Slow homepage**: Prefer build-time JSON over runtime API calls; if needed, set `next: { revalidate }` on fetches.

---

**Document Maintained By:** Development Team  
**Last Technical Review:** 2025-09-17
