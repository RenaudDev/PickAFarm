# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PickAFarm is a farm directory web application with notification features. The architecture consists of:
- **Web**: Next.js 15 static site (web/) - statically exported for Cloudflare Pages
- **API**: Cloudflare Worker (src/index.js) with D1 database
- **Data Source**: Zoho CRM integration for farm data
- **Monorepo**: npm workspaces with root package managing web workspace

**📚 For detailed architecture, see** [.agent/Docs/DOC_Application_Architecture.md](.agent/Docs/DOC_Application_Architecture.md)

---

## Quick Start

```bash
# Frontend development
cd web && npm run dev              # Start Next.js dev server (localhost:3000)

# Backend development
wrangler dev                       # Start Worker locally (localhost:8787)

# Full production build
cd web && npm run prebuild         # Generate data from APIs
cd web && npm run build            # Build static site
```

---

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

---

## Architecture

### Static Data Generation (Build Time)
The web app uses a **static export strategy** to avoid runtime API calls:

1. **prebuild** scripts run before `next build`
2. Scripts in `web/scripts/` fetch data from the API
3. Pages import JSON directly: `import farmsData from "../../../data/farms.json"`
4. Next.js generates static HTML for all routes

**Important**: Changes to farm data require rebuilding the site. The data is NOT fetched at runtime.

**Data Dependencies:**
- `generate-farm-data.js` must run FIRST (creates `farms.json`)
- `generate-location-data.js` requires `farms.json` AND `locations.json`
- `generate-state-data.js` requires `farms.json` AND `locations.json`

### API Routes (Cloudflare Worker)

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

**📚 See** [.agent/Docs/DOC_Cloudflare-Worker-Api.md](.agent/Docs/DOC_Cloudflare-Worker-Api.md) for complete API documentation.

### Authentication

Uses **Clerk** for authentication. **See** [.agent/Docs/DOC_Authentication-User-Management.md](.agent/Docs/DOC_Authentication-User-Management.md) for complete details.

- Middleware: `web/middleware.ts` - protects routes
- Public routes: farms, categories, locations, etc.
- Protected routes: `/dashboard`, `/profile`, `/saved-farms`, `/map` (when saving)

### Database (D1)

Schema defined in `schema.sql` with 20+ tables including:
- `farms` - Main farm data (synced from Zoho CRM)
- `saved_farms` - User's saved farms with notification preferences
- `cities` - Location data for URL structure
- `farm_categories` - Category taxonomy

**📚 See** [.agent/Docs/DOC_Database-Schema-Migrations.md](.agent/Docs/DOC_Database-Schema-Migrations.md)

### Farm Custom Branding

Farms can have custom logos and background images. **See** [.agent/Docs/DOC_Farm-Custom-Branding.md](.agent/Docs/DOC_Farm-Custom-Branding.md) for complete pipeline details.

**Quick reference:**
- Storage: Cloudflare R2 bucket (`pickafarm-assets`)
- CDN: `https://cdn.pickafarm.com`
- Database fields: `logo_url`, `background_url`, `logo_updated_at`, `background_updated_at`

---

## Key Conventions

### Route Structure
- **Farm detail pages**: `/farms/[id]/`
- **Category pages**: `/[slug]/` (e.g., `/christmas-tree-farms/`)
- **State pages**: `/[slug]/` (e.g., `/wisconsin/`)
- **Category + Location**: `/[slug]/near/[location]/`
- **State + Category**: `/[state]/[category]/`
- **Location pages**: `/farms-near/[location]/`
- All routes use trailing slashes (`trailingSlash: true` in next.config.js)

### Next.js 15 Async Params
```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}
```

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

---

## Common Tasks

### Adding a New Farm Field
1. Update `schema.sql` with new column
2. Run D1 migration: `wrangler d1 migrations create pickafarm-db add_field_name`
3. Update Zoho fetch in `src/index.js` `upsertFarm()` function
4. Update API response in `handleFarms()` if needed
5. Rebuild to regenerate JSON files
6. Update TypeScript types in `web/lib/schema.ts`
7. Update UI components to display new field

**📚 See** [.agent/SOP/implement-prd-tasks.md](.agent/SOP/implement-prd-tasks.md) for complete workflow.

### Testing Build Process
1. Ensure API is accessible
2. Run `cd web && npm run prebuild` to generate data files
3. Check `web/data/*.json` files are created
4. Run `npm run build` to test static export
5. Run `npm run start` to preview production build

### Understanding State Page Cities

State pages (e.g., `/wisconsin/`) show cities with clickable links. Cities are from `locations.json` (major metro areas), NOT from farm addresses. Farms in small towns count toward the nearest major city within 100km radius.

**Example**: A farm in "Ballston Spa, NY" counts toward "Albany, NY" if within 100km.

### Location Slug Format
Location slugs follow the pattern: `{city}-{state-code}-{country-code}`
- Examples: `albany-ny-us`, `toronto-ontario-ca`, `madison-wi-us`

---

## Performance Optimization

**See** [.agent/Docs/DOC_Performance-Optimization.md](.agent/Docs/DOC_Performance-Optimization.md) for comprehensive performance strategy.

**Key metrics:**
- Desktop: 83/100 Performance, LCP 2.57s
- Mobile: 64/100 Performance, LCP 7.59s (simulated 3G)

**Quick wins implemented:**
- Preload LCP image in `app/layout.tsx`
- Dynamic imports for below-fold content
- Location detection caching (30 days localStorage)
- AVIF/WebP image formats with responsive srcset
- **Lazy Google Maps loading**: Mobile users see SVG map preview, Google Maps API only loads on user click
- **IntersectionObserver**: Below-fold maps load only when scrolled into view

**📚 See** [docs/DOC_Map-Experience-Mobile-Optimization.md](docs/DOC_Map-Experience-Mobile-Optimization.md) for complete map optimization strategy.

---

## Environment Variables

**Web app** (`web/.env.local`):
```bash
NEXT_PUBLIC_API_URL=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLOUDFLARE_D1_TOKEN=...              # For build scripts
CLOUDFLARE_D1_URL=...                # For build scripts
```

**Worker** (Cloudflare Secrets):
```bash
wrangler secret put ZOHO_REFRESH_TOKEN
wrangler secret put ZOHO_CLIENT_ID
wrangler secret put ZOHO_CLIENT_SECRET
wrangler secret put CLERK_SECRET_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put GITHUB_TOKEN
```

---

## Documentation Index

All comprehensive documentation is stored in `.agent/Docs/` to keep this file lean.

### Architecture & Setup
- [DOC_Application_Architecture.md](.agent/Docs/DOC_Application_Architecture.md) - Complete system architecture
- [DOC_Build-Scripts-Data-Generation.md](.agent/Docs/DOC_Build-Scripts-Data-Generation.md) - Build process details

### Backend & API
- [DOC_Cloudflare-Worker-Api.md](.agent/Docs/DOC_Cloudflare-Worker-Api.md) - Worker API implementation
- [DOC_Database-Schema-Migrations.md](.agent/Docs/DOC_Database-Schema-Migrations.md) - Database schema and migrations
- [DOC_Zoho-CRM-Integration.md](.agent/Docs/DOC_Zoho-CRM-Integration.md) - Zoho CRM integration
- [DOC_Farm-Custom-Branding.md](.agent/Docs/DOC_Farm-Custom-Branding.md) - Farm logo & background images

### Frontend & UI
- [DOC_Frontend-Components-UI.md](.agent/Docs/DOC_Frontend-Components-UI.md) - React component patterns
- [DOC_Google-Maps-Integration.md](.agent/Docs/DOC_Google-Maps-Integration.md) - Google Maps implementation
- [DOC_Authentication-User-Management.md](.agent/Docs/DOC_Authentication-User-Management.md) - Clerk authentication
- [DOC_Performance-Optimization.md](.agent/Docs/DOC_Performance-Optimization.md) - Performance strategy
- [DOC_Map-Experience-Mobile-Optimization.md](docs/DOC_Map-Experience-Mobile-Optimization.md) - Map UX & mobile optimization (lazy Google Maps loading)

### Processes
- [.agent/SOP/implement-prd-tasks.md](.agent/SOP/implement-prd-tasks.md) - How to implement PRD tasks
- [.agent/SOP/generate-task-list.md](.agent/SOP/generate-task-list.md) - Task list management
- [.agent/SOP/create-prd.md](.agent/SOP/create-prd.md) - Creating PRDs

### Reference
- [.agent/Reference/](.agent/Reference/) - Cloudflare documentation and external references
- [.agent/Tasks/](.agent/Tasks/) - PRDs and task lists

---

## See Also

- `.agent/README.md` - Navigation guide for all .agent/ documentation
- `docs/README.md` - **NEW: Agent-focused documentation index** (API, Database, Zoho, Maps, Environment)
- `schema.sql` - Complete database schema
- `wrangler.toml` - Worker configuration
- `web/next.config.js` - Next.js configuration
