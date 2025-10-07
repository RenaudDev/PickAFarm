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
   - `generate-location-data.js` → `web/data/locations-with-farms.json` (reads from `locations.json`)
   - `generate-state-data.js` → `web/data/states-with-farms.json` (reads from `locations.json` + `farms.json`)
   - `generate-manifest.js` → PWA manifest
   - `generate-sitemaps.js` → XML sitemaps
3. Pages import JSON directly: `import farmsData from "../../../data/farms.json"`
4. Next.js generates static HTML for all routes

**Important**: Changes to farm data require rebuilding the site. The data is NOT fetched at runtime.

**Data Dependencies:**
- `generate-farm-data.js` must run FIRST (creates `farms.json`)
- `generate-location-data.js` requires `farms.json` AND `locations.json` (source of truth for cities)
- `generate-state-data.js` requires `farms.json` AND `locations.json`
- Order matters! The `prebuild` script runs them in the correct sequence.

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
- **Farm detail pages**: `/farms/[id]/` - Individual farm pages
- **Category pages**: `/[slug]/` - Top-level catch-all (e.g., `/christmas-tree-farms/`)
- **State pages**: `/[slug]/` - State overview pages (e.g., `/wisconsin/`, `/new-york/`)
- **Category + Location pages**: `/[slug]/near/[location]/` - Filtered by category and location
- **State + Category pages**: `/[state]/[category]/` - Farms in a state for a category
- **Location pages**: `/farms-near/[location]/` - All farms near a location
- All routes use trailing slashes (`trailingSlash: true` in next.config.js)

**Route Disambiguation in `app/[slug]/page.tsx`:**
The `[slug]` route handles both state pages AND category pages:
1. First checks if slug matches a state in `states-with-farms.json`
2. If state found, renders `StatePage` component
3. Otherwise checks if slug matches a category in `category-content.json`
4. If category found, renders `CategoryPage` component
5. If neither, shows 404

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

### Understanding State Page Cities
State pages (e.g., `/wisconsin/`) show cities with clickable links to location pages:

**How city data is generated** (`web/scripts/generate-state-data.js`):
1. Reads all location pages from `locations.json` for that state
2. Calculates farms within 100km radius of each location using Haversine distance
3. Only shows cities with `farm_count > 0`
4. Sorted by farm count descending, limited to top 20

**Important**: Cities shown are from `locations.json` (major metro areas), NOT from farm addresses. Farms in small towns are counted toward the nearest major city within 100km radius.

**Example**: A farm in "Ballston Spa, NY" counts toward "Albany, NY" if Albany is within 100km.

### Location Slug Format
Location slugs follow the pattern: `{city}-{state-code}-{country-code}`
- Examples: `albany-ny-us`, `toronto-ontario-ca`, `madison-wi-us`
- Generated in `locations.json` and used across the site
- State codes use 2-letter abbreviations (NY, WI, CA, ON, etc.)
- Country codes: `us` or `ca`

### TypeScript Interface Patterns
**Farm Interface Variations:**
Different components expect different Farm shapes:
- `map-page-layout.tsx` - expects `categories` as optional (for category-filtered pages)
- `farm-schema.ts` - uses for JSON-LD structured data generation
- Always check the interface definition in the component you're working with

**Common mistake**: Passing data with required fields missing or wrong types between components.

## Performance Optimization

### Mobile Performance Strategy
The site is optimized for mobile with specific attention to Core Web Vitals on slow 3G connections:

**Key Metrics (as of last Lighthouse audit):**
- Desktop: 83/100 Performance, LCP 2.57s
- Mobile: 64/100 Performance, LCP 7.59s simulated (1.42s observed)
- The mobile score is conservative for slow 3G connections; real users on 4G/5G see much better performance

### LCP Optimization
**Current LCP element**: First blog post image on homepage (`/blog-images/best-christmas-trees-800.avif`)

**Optimizations implemented:**
1. **Preload LCP image** in `app/layout.tsx`:
   ```tsx
   <link rel="preload" as="image" href="/blog-images/best-christmas-trees-800.avif"
         type="image/avif" fetchPriority="high" />
   ```

2. **Image optimization**:
   - AVIF format with WebP fallback in `<picture>` tags
   - Responsive srcset with 400px and 800px sizes
   - `fetchPriority="high"` on first image, `loading="lazy"` on others
   - Explicit width/height attributes to prevent CLS

3. **Blog images data structure** (`web/data/blog-images.json`):
   ```json
   {
     "1": {
       "slug": "best-christmas-trees",
       "avif": { "400": "...", "800": "..." },
       "webp": { "400": "...", "800": "..." },
       "alt": "...",
       "width": 800,
       "height": 450
     }
   }
   ```

### Location Detection & Caching
**Problem**: Duplicate ipapi.co API calls (1000ms+ each) from multiple components
**Solution**: Shared localStorage caching strategy

**Implementation** (`web/src/lib/location-utils.ts`):
- `getUserLocation(userId)` checks localStorage first before making API calls
- Location data cached for 30 days (`isLocationStale()` function)
- Anonymous users use `"guest"` as userId for shared cache
- Both `NearbyFarmsList` and `LocationDetector` use same cache key

**Components that detect location:**
- `NearbyFarmsList` - calls `getUserLocation("guest")` on homepage
- `LocationDetector` - calls `getUserLocation(user.id)` for authenticated users
- Both share cached data when user is anonymous, avoiding duplicate API calls

### JavaScript Bundle Optimization
**Current bottleneck**: Clerk.js loading on all pages

**Unused JavaScript** (730ms potential savings on mobile):
- Clerk UI components: 71% unused (71KB)
- Next.js framework: 38% unused (41KB)
- Application code: Various chunks with partial usage

**Note**: Clerk is essential for authentication and cannot be removed. Consider:
- Dynamic imports for Clerk on protected routes only (future optimization)
- Code splitting to reduce initial bundle size

### Render-Blocking Resources
- Single CSS bundle at 194ms on slow 3G: `_next/static/css/*.css`
- Critical CSS inlined in `app/layout.tsx` for instant first paint
- Resource hints for third-party domains (preconnect, dns-prefetch)

### Dynamic Imports for Below-Fold Content
**Pattern used** (`app/page.tsx`):
```typescript
const FAQSection = dynamic(() => import("@/components/faq-section"), {
  loading: () => <div className="h-96" />
})
const FarmMapSection = dynamic(() => import("@/components/farm-map-section"), {
  loading: () => <MapSkeletonStatic />
})
```

Components that are dynamically imported:
- `FAQSection` - Below the fold
- `FarmMapSection` - Interactive map (heavy Google Maps API)
- `AdaptiveMapWrapper` - Map container logic
- `LocationDetector` - Background location detection (in `DeferredComponents`)

### Z-Index Hierarchy
**Stacking order** (from lowest to highest):
- `z-30` - Mobile map filter backdrop
- `z-40` - Mobile map filter button & panel
- `z-50` - Navbar (sticky), Dialog/Modal overlays and content
- Higher z-indexes should not be used to prevent conflicts

**Key components:**
- `farm-navbar.tsx`: `z-50` (sticky navbar)
- `ui/dialog.tsx`: `z-50` (modal overlay and content)
- `map-page-layout.tsx`: Mobile filter uses `z-30` (backdrop), `z-40` (button/panel)

**Mobile map filter positioning**: `bottom-4 left-4` (not right, to avoid conflicts with other UI)

### Third-Party Services
**Impact on mobile performance:**
- ipapi.co: ~1000ms per call (cached after first load)
- Clerk: ~150ms per chunk, multiple chunks loaded
- Google Analytics: ~200ms (deferred)
- Cloudflare Insights: ~150ms (deferred)

**Optimization strategy:**
- Preconnect to Clerk and API domains in `app/layout.tsx`
- DNS prefetch for analytics domains
- Location API cached locally to avoid repeated calls

### Testing Performance
**Run Lighthouse audits:**
```bash
# Desktop
npx lighthouse https://pickafarm.com --preset=desktop --output=json --output-path=./web/lighthouse-desktop-latest.json

# Mobile (default settings)
npx lighthouse https://pickafarm.com --output=json --output-path=./web/lighthouse-mobile-latest.json
```

**View summary:**
```bash
cd web && node lighthouse-summary.js
```

**Key files:**
- `web/lighthouse-desktop-latest.json` - Desktop audit results
- `web/lighthouse-mobile-latest.json` - Mobile audit results
- `web/lighthouse-summary.js` - Script to extract and display key metrics

### Future Optimization Opportunities
1. **Defer Clerk loading**: Only load on protected routes or after user interaction
2. **Image CDN**: Consider using an image CDN for automatic format/size optimization
3. **Service Worker**: Implement for offline support and faster repeat visits
4. **Font optimization**: Currently using Geist font, could optimize loading strategy
5. **Reduce unused CSS**: Consider purging unused Tailwind classes more aggressively
