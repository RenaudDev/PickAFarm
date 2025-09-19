# PickAFarm.com — Farm Directory with Notifications

A fast, static-exported Next.js app backed by a Cloudflare Worker API and D1. The web app prefetches farm data at build time for instant page loads and reliability.

## Live Resources
- Web: https://f721ea96.pickafarm.pages.dev
- API: https://pickafarm-api.94623956quebecinc.workers.dev
- Repo: https://github.com/RenaudDev/PickAFarm

## Quick Start (Local)
```bash
# At repo root
npm install

# Dev (web)
npm run dev

# Build (runs prebuild to fetch JSON -> static export)
npm run build

# Start (serve production build locally)
npm run start
```

## Build-time Data Prefetch (Web)
- Script: `web/scripts/generate-farm-data.js` (runs automatically via `prebuild`)
- Fetches: `GET /api/farms`
- Produces:
  - `web/data/farms.json` (array of farms)
  - `web/data/farm-params.json` (array of `{ id: string }`)
- Pages import JSON directly (no runtime API calls), e.g. `web/app/farm/[id]/page.tsx`.

## Tech Highlights
- Next.js 15 static export (`web/next.config.js` sets `output: 'export'`)
- Tailwind CSS v4, TypeScript v5
- Cloudflare Workers API + D1 database
- Monorepo with npm workspaces (root `package.json` -> workspace `web`)

## Notes
- Next.js 15 uses async route params: `({ params }: { params: Promise<{ id: string }> })`.
- Keep imports of generated JSON relative: `../../../data/*.json` (avoid `@/data`).
- Wrangler warning about `wrangler.toml` during Pages builds is informational unless using `[pages]` settings.

## More Details
For the full architecture, schema, API docs, deployment and troubleshooting, see:

- `TECHNICAL_DOCUMENTATION.md`