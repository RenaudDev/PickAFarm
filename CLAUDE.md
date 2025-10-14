# CLAUDE.md

This file provides guidance to Claude Code when working with this **brownfield** codebase using the **BMAD Method**.

---

## BMAD Method: Agent-First Development

**You are working in a BMAD-configured brownfield project.** This means:

1. **Use specialized agents** for different tasks (planning, architecture, development)
2. **Follow brownfield workflows** when adding features or making changes
3. **Reference existing documentation** in `.agent/Docs/` and `.bmad-core/`
4. **Keep context lean** by loading only what's needed for the current task

### Quick Agent Reference

```bash
/architect     # System architecture, design decisions, technical planning
/pm            # Product management, PRDs, epics, stories
/dev           # Story implementation, coding tasks
/qa            # Code review, testing, quality assurance
/sm            # Scrum master, story drafting, sprint planning
/po            # Product owner, validation, document sharding
```

**For complete BMAD workflows**, see:
- **[Brownfield Development Guide](.bmad-core/working-in-the-brownfield.md)** - How to add features to existing codebases
- **[User Guide](.bmad-core/user-guide.md)** - Complete BMAD Method overview
- **[Development Workflow](.bmad-core/enhanced-ide-development-workflow.md)** - Story implementation process

---

## Project Overview

**PickAFarm** is a farm directory web application with notification features.

### Tech Stack
- **Frontend**: Next.js 15 (static export) → Cloudflare Pages
- **Backend**: Cloudflare Worker with D1 database
- **Auth**: Clerk
- **Data Source**: Zoho CRM integration
- **Monorepo**: npm workspaces

### Architecture
- **Build-time data generation** - Static JSON files, no runtime API calls
- **Cloudflare edge deployment** - Worker API + R2 storage + D1 database
- **Static export strategy** - All pages pre-rendered during build

**For detailed architecture**, see [.agent/Docs/DOC_Application_Architecture.md](.agent/Docs/DOC_Application_Architecture.md)

---

## Quick Start

```bash
# Frontend development
cd web && npm run dev              # localhost:3000

# Backend development (from root)
wrangler dev                       # localhost:8787

# Full production build
cd web && npm run prebuild         # Fetch data from APIs
cd web && npm run build            # Build static site
```

---

## Development Commands

### Web (Next.js)
```bash
# From web/ directory:
npm run dev              # Start dev server
npm run build            # Build static site (includes prebuild)
npm run prebuild         # Generate all data files
npm run start            # Preview production build
```

**Individual data generation scripts:**
- `npm run generate-data` - Fetch farms from API
- `npm run generate-search-data` - Generate search index
- `npm run generate-categories` - Generate category data
- `npm run generate-location-data` - Generate location/city data
- `npm run generate-state-data` - Generate state-level data
- `npm run generate-sitemaps` - Generate XML sitemaps

### API (Cloudflare Worker)
```bash
# From root directory:
wrangler dev              # Local development
wrangler deploy           # Deploy to Cloudflare
wrangler d1 execute       # Run SQL against D1
```

---

## Key Conventions

### Code Patterns
- **Next.js 15 async params**: `const { id } = await params;`
- **Import paths**: Use relative imports for JSON data (`../../../data/farms.json`), not `@/data/*`
- **TypeScript**: Strict mode enabled, types in `web/lib/schema.ts`
- **Styling**: Tailwind CSS v4, shadcn/ui components

### Route Structure
- `/farms/[id]/` - Farm detail pages
- `/[slug]/` - Category or state pages
- `/[slug]/near/[location]/` - Category + location
- `/farms-near/[location]/` - Location pages
- All routes use **trailing slashes** (`trailingSlash: true`)

### Data Generation Dependencies
**Run in this order:**
1. `generate-farm-data.js` (creates `farms.json`)
2. `generate-location-data.js` (requires `farms.json` + `locations.json`)
3. `generate-state-data.js` (requires `farms.json` + `locations.json`)

---

## BMAD Brownfield Workflow

When adding features or making changes to this codebase:

### Option A: Full Feature Addition (Recommended)

1. **Document relevant systems** (if not already documented)
   ```bash
   /architect
   *document-project
   ```

2. **Create brownfield PRD**
   ```bash
   /pm
   *create-brownfield-prd
   ```

3. **Design integration architecture**
   ```bash
   /architect
   *create-brownfield-architecture
   ```

4. **Validate and shard documents**
   ```bash
   /po
   *execute-checklist-po
   # Then shard PRD and architecture
   ```

5. **Implement stories**
   ```bash
   /sm  # Draft next story
   /dev # Implement story
   /qa  # Review (optional)
   ```

### Option B: Quick Enhancement (For Focused Changes)

```bash
/pm
*create-brownfield-epic    # For isolated features
# OR
*create-brownfield-story   # For bug fixes or tiny features
```

**See complete workflow**: [.bmad-core/working-in-the-brownfield.md](.bmad-core/working-in-the-brownfield.md)

---

## Documentation Structure

### BMAD Method Documentation
- `.bmad-core/working-in-the-brownfield.md` - Brownfield development guide
- `.bmad-core/user-guide.md` - Complete BMAD Method overview
- `.bmad-core/enhanced-ide-development-workflow.md` - Development workflow
- `.bmad-core/agents/*.md` - Agent definitions
- `.bmad-core/tasks/*.md` - Reusable task workflows
- `.bmad-core/data/technical-preferences.md` - Project preferences

### Project Documentation
- `.agent/Docs/` - Comprehensive technical documentation
- `.agent/Tasks/` - PRDs, epics, and stories
- `.agent/SOP/` - Standard operating procedures
- `schema.sql` - Complete database schema
- `wrangler.toml` - Worker configuration

### Key Documentation Files
- [DOC_Application_Architecture.md](.agent/Docs/DOC_Application_Architecture.md) - System architecture
- [DOC_Cloudflare-Worker-Api.md](.agent/Docs/DOC_Cloudflare-Worker-Api.md) - API endpoints
- [DOC_Database-Schema-Migrations.md](.agent/Docs/DOC_Database-Schema-Migrations.md) - Database schema
- [DOC_Frontend-Components-UI.md](.agent/Docs/DOC_Frontend-Components-UI.md) - React components
- [DOC_Performance-Optimization.md](.agent/Docs/DOC_Performance-Optimization.md) - Performance strategy

---

## API Endpoints

### Public Endpoints
- `GET /api/farms` - List farms (filters: state, city, category, lat/lng/radius)
- `GET /api/farms/:id` - Get single farm
- `POST /api/webhook/zoho/:token` - Zoho webhook for farm updates
- `POST /api/trigger-rebuild` - Trigger GitHub rebuild

### Authenticated Endpoints (Clerk)
- `POST /api/saved-farms` - Save farm for user
- `GET /api/saved-farms` - Get user's saved farms
- `DELETE /api/saved-farms/:id` - Remove saved farm
- `PUT /api/saved-farms/:id` - Update notification preferences

**For complete API documentation**, see [DOC_Cloudflare-Worker-Api.md](.agent/Docs/DOC_Cloudflare-Worker-Api.md)

---

## Common Tasks

### Adding a New Feature
1. Use `/architect` to run `*document-project` if needed
2. Use `/pm` to create brownfield PRD
3. Use `/architect` to design integration
4. Use `/po` to validate and shard documents
5. Use `/sm` and `/dev` to implement stories

**See**: [implement-prd-tasks.md](.agent/SOP/implement-prd-tasks.md)

### Adding a New Farm Field
1. Update `schema.sql`
2. Run migration: `wrangler d1 migrations create pickafarm-db add_field_name`
3. Update Zoho fetch in `src/index.js` `upsertFarm()`
4. Update API response in `handleFarms()` if needed
5. Rebuild to regenerate JSON files: `cd web && npm run prebuild`
6. Update TypeScript types in `web/lib/schema.ts`
7. Update UI components to display new field

### Testing Build Process
1. Ensure API is accessible
2. Run `cd web && npm run prebuild` to generate data files
3. Check `web/data/*.json` files are created
4. Run `npm run build` to test static export
5. Run `npm run start` to preview production build

### Testing Preview Deployments
1. Create test branch: `test/preview-deployment`
2. Make code changes and push to GitHub
3. Create pull request against `main-clean`
4. Wait for Cloudflare Pages to build preview (5-10 minutes)
5. Check PR comment for preview URL
6. Access preview URL and verify changes
7. Push additional commits to test auto-update
8. Close/merge PR to verify cleanup

---

## Environment Variables

### Web App (`web/.env.local`)
```bash
NEXT_PUBLIC_API_URL=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLOUDFLARE_D1_TOKEN=...              # For build scripts
CLOUDFLARE_D1_URL=...                # For build scripts
```

### Worker (Cloudflare Secrets)
```bash
wrangler secret put ZOHO_REFRESH_TOKEN
wrangler secret put ZOHO_CLIENT_ID
wrangler secret put ZOHO_CLIENT_SECRET
wrangler secret put CLERK_SECRET_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put GITHUB_TOKEN
```

---

## Database (D1)

**Schema**: Defined in `schema.sql` (20+ tables)

Key tables:
- `farms` - Main farm data (synced from Zoho CRM)
- `saved_farms` - User saved farms with notification preferences
- `cities` - Location data for URL structure
- `farm_categories` - Category taxonomy

**See complete schema**: [DOC_Database-Schema-Migrations.md](.agent/Docs/DOC_Database-Schema-Migrations.md)

---

## CI/CD & Preview Deployments

### GitHub Actions Workflows
- **`.github/workflows/ci.yml`** - CI pipeline (lint, test, build verification)
- **`.github/workflows/preview-comment.yml`** - Posts preview URLs to PR comments
- **`.github/workflows/cleanup-preview.yml`** - Cleanup notifications when PR closes
- **`.github/workflows/rebuild-farms.yml`** - Scheduled rebuild workflow

### Preview Deployment Flow
1. Developer creates PR → GitHub Actions CI runs
2. CI passes → Cloudflare Pages builds preview automatically
3. Preview comment workflow posts URL to PR
4. Preview URL: `https://<branch-name>.pickafarm.pages.dev`
5. New commits → Preview auto-updates
6. PR closed/merged → Preview deleted automatically (30-day retention)

### Preview Environment Characteristics
- **Data**: Uses production D1 database (read-only)
- **Webhooks**: Disabled (no production side effects)
- **Emails**: Disabled (no Resend API key)
- **Rebuilds**: Cannot trigger (no GitHub token)
- **URL Format**: `<branch-name>.pickafarm.pages.dev` or `<hash>.pickafarm.pages.dev`

**Configuration Guide**: `docs/CLOUDFLARE_PAGES_PREVIEW_SETUP.md`

---

## Performance Considerations

- **LCP optimization**: Hero images preloaded, AVIF/WebP formats
- **Lazy Google Maps**: Mobile users see SVG preview, API loads on click
- **IntersectionObserver**: Below-fold maps load on scroll
- **Location caching**: 30-day localStorage cache
- **Static generation**: All routes pre-rendered at build time

**Current metrics:**
- Desktop: 83/100 (LCP 2.57s)
- Mobile: 64/100 (LCP 7.59s on simulated 3G)

**See**: [DOC_Performance-Optimization.md](.agent/Docs/DOC_Performance-Optimization.md)

---

## BMAD Method Best Practices

### When to Use Each Agent

- **`/architect`** - System design, technology decisions, integration planning
- **`/pm`** - Requirements gathering, PRD creation, epic/story definition
- **`/dev`** - Story implementation, coding, testing
- **`/qa`** - Code review, refactoring, quality validation
- **`/sm`** - Story drafting, sprint planning, task management
- **`/po`** - Document validation, sharding, alignment checks

### Context Management

1. **Keep it lean** - Only load files relevant to current task
2. **Use agent commands** - Don't implement directly, use agent workflows
3. **Reference docs** - Point to `.agent/Docs/` instead of explaining
4. **Commit frequently** - After each story completion

### Brownfield Guidelines

1. **Document first** - Run `*document-project` to capture current state
2. **Respect patterns** - Follow existing conventions and architecture
3. **Plan integration** - Use brownfield templates that consider compatibility
4. **Test thoroughly** - Focus on integration points and regression
5. **Communicate changes** - Update relevant documentation

---

## See Also

- **[BMAD Brownfield Guide](.bmad-core/working-in-the-brownfield.md)** - Complete brownfield workflow
- **[BMAD User Guide](.bmad-core/user-guide.md)** - Full BMAD Method documentation
- **[.agent/Docs/](.agent/Docs/)** - Technical documentation index
- **[.agent/Tasks/](.agent/Tasks/)** - PRDs, epics, stories
- **[.agent/SOP/](.agent/SOP/)** - Standard operating procedures
- `schema.sql` - Database schema
- `wrangler.toml` - Worker configuration
- `web/next.config.js` - Next.js configuration

---

**Remember:** This is a brownfield BMAD project. Use agents for all major tasks, keep context lean, and follow the workflows defined in `.bmad-core/`.
