# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PickAFarm is a farm directory web application with notification features. The architecture consists of:
- **Web**: Next.js 15 static site (web/) - statically exported for Cloudflare Pages
- **API**: Cloudflare Worker (src/index.js) with D1 database
- **Data Source**: Zoho CRM integration for farm data
- **Monorepo**: npm workspaces with root package managing web workspace

## Development Commands

### Web (Next.js)
```bash
# From web/ directory:
npm run dev              # Start development server
npm run build            # Run prebuild scripts + build static site
npm run prebuild         # Fetch data from API and generate JSON files
npm run start            # Serve production build locally
npm run lint             # Run Next.js linter

# Individual data generation scripts:
npm run generate-data             # Fetch farms from API
npm run generate-search-data      # Generate search index
npm run generate-categories       # Generate category data
npm run generate-location-data    # Generate location/city data
npm run generate-state-data       # Generate state-level data
npm run generate-manifest         # Generate PWA manifest
npm run generate-sitemaps         # Generate XML sitemaps
```

### API (Cloudflare Worker)
```bash
# From root directory:
wrangler dev              # Local development
wrangler deploy           # Deploy to Cloudflare
wrangler d1 execute       # Run SQL against D1 database
```

### Root (Monorepo)
```bash
npm install              # Install all dependencies
npm run build            # Build web app (delegates to web/package.json)
```

## Architecture

### Static Data Generation (Build Time)
The web app uses a **static export strategy** to avoid runtime API calls:

1. **prebuild** scripts run before `next build`
2. Scripts in `web/scripts/` fetch data from the API:
   - `generate-farm-data.js` → `web/data/farms.json` and `web/data/farm-params.json`
   - `generate-search-data.js` → search index
   - `generate-categories.js` → category data
   - `generate-location-data.js` → city/location data
   - `generate-state-data.js` → state-level aggregations
   - `generate-manifest.js` → PWA manifest
   - `generate-sitemaps.js` → XML sitemaps
3. Pages import JSON directly: `import farmsData from "../../../data/farms.json"`
4. Next.js generates static HTML for all routes

**Important**: Changes to farm data require rebuilding the site. The data is NOT fetched at runtime.

### Next.js 15 Async Params
Next.js 15 requires async route params:
```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}
```

### API Routes (Cloudflare Worker)
The API (`src/index.js`) is a single Cloudflare Worker with multiple endpoints:

**Public Endpoints:**
- `GET /api/farms` - List farms (with filters: state, city, category, lat/lng/radius)
- `GET /api/farms/:id` - Get single farm by ID
- `POST /api/webhook/zoho/:token` - Zoho webhook for farm updates
- `POST /api/trigger-rebuild` - Trigger GitHub rebuild workflow

**Authenticated Endpoints** (require Clerk auth):
- `POST /api/saved-farms` - Save a farm for user
- `DELETE /api/saved-farms/:id` - Remove saved farm
- `GET /api/saved-farms` - Get user's saved farms
- `PUT /api/saved-farms/:id` - Update notification preferences

### Authentication
Uses **Clerk** for authentication:
- Middleware: `web/middleware.ts` - protects routes
- Public routes: farms, categories, locations, etc.
- Protected routes: `/dashboard`, `/profile`, `/saved-farms`, `/map` (when saving)
- API validates Clerk session tokens for authenticated endpoints

### Database (D1)
Schema defined in `schema.sql`:
- `farms` - Main farm data (synced from Zoho CRM)
- `saved_farms` - User's saved farms with notification preferences
- `cities` - Location data for URL structure
- `farm_categories` - Category taxonomy
- `operational_types` - Farm operational types (U-Pick, Pre-Cut, etc.)

Farm data fields include:
- Basic info: name, slug, description, categories, type
- Contact: phone, email, website, facebook, instagram
- Location: street, city, state, country, latitude, longitude
- Hours: monday_hours through sunday_hours
- Features: amenities, varieties, pet_friendly, payment_methods
- Metadata: verified, featured, active

### Zoho CRM Integration
Farm data originates from Zoho CRM:
1. Worker webhook endpoint receives updates: `POST /api/webhook/zoho/:token`
2. Worker fetches full record from Zoho API using OAuth
3. Data is upserted to D1 `farms` table
4. Rebuild is triggered via GitHub Actions workflow
5. Web app rebuilds with fresh data

### Data Flow
```
Zoho CRM → Webhook → Worker → D1 Database
                               ↓
                         Worker API (GET /api/farms)
                               ↓
                    Build Scripts (prebuild)
                               ↓
                    web/data/*.json files
                               ↓
                       Next.js Pages (import)
                               ↓
                      Static HTML (export)
```

## Key Conventions

### Route Structure
- Farm detail pages: `/farms/[id]/` (dynamic route)
- Category pages: `/[slug]/` (top-level catch-all)
- State pages: Generated from state data
- All routes use trailing slashes (`trailingSlash: true` in next.config.js)

### Import Paths
- **Avoid** `@/data/*` for generated JSON files
- **Use** relative paths: `import farmsData from "../../../data/farms.json"`
- UI components: `@/components/ui/*`
- Lib utilities: `@/lib/*`

### TypeScript
- Schema types: `web/lib/schema.ts`
- Next.js 15 async params pattern required
- Strict mode enabled

### Styling
- Tailwind CSS v4 with `@tailwindcss/postcss`
- UI components from shadcn/ui (Radix UI primitives)
- Images unoptimized (`next.config.js` sets `unoptimized: true`)

### Environment Variables
Web app (`web/.env.local`):
- `NEXT_PUBLIC_API_URL` - API endpoint
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLOUDFLARE_D1_TOKEN` - For build scripts
- `CLOUDFLARE_D1_URL` - For build scripts

Worker (`wrangler.toml` + secrets):
- `ZOHO_REFRESH_TOKEN`, `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`
- `RESEND_API_KEY` - For email notifications
- `GITHUB_TOKEN` - For triggering rebuilds
- D1 binding: `env.DB`

## Common Tasks

### Adding a New Farm Field
1. Update `schema.sql` with new column
2. Run D1 migration: `wrangler d1 migrations create pickafarm-db add_field_name`
3. Update Zoho fetch in `src/index.js` `upsertFarm()` function
4. Update API response in `handleFarms()` if needed
5. Rebuild to regenerate JSON files
6. Update TypeScript types in `web/lib/schema.ts`
7. Update UI components to display new field

### Testing Build Process
1. Ensure API is accessible
2. Run `cd web && npm run prebuild` to generate data files
3. Check `web/data/*.json` files are created
4. Run `npm run build` to test static export
5. Run `npm run start` to preview production build

### Debugging Zoho Webhook
1. Check webhook token matches: `farms.zoho_webhook_token` in D1
2. Verify Zoho credentials in Worker secrets
3. Check Worker logs: `wrangler tail`
4. Test endpoint: `POST /api/webhook/zoho/:token` with Zoho payload

### Modifying Search
Search data is pre-generated at build time:
1. Edit `web/scripts/generate-search-data.js`
2. Rebuild app to regenerate search index
3. Search UI likely in components or app routes
