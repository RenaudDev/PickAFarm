# Edge-Side Rendering Implementation Guide

## Current State
- Deployment: Cloudflare Pages
- Framework: Next.js 15 (Static Export)
- API: Cloudflare Worker (separate)

## Option B: Enable Next.js Edge Runtime

### Step 1: Update next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Enable edge runtime
  experimental: {
    runtime: 'experimental-edge',
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false
  },
  experimental: {
    optimizePackageImports: ['@clerk/nextjs', 'lucide-react']
  }
}
```

### Step 2: Add Edge Config to pages
For pages that benefit from edge rendering, add:
```typescript
// app/page.tsx
export const runtime = 'edge';
export const preferredRegion = 'auto'; // Use closest edge location
```

### Step 3: Deploy
Cloudflare Pages automatically detects Next.js and deploys to Workers

## Option C: Custom Cloudflare Worker for HTML Caching

### Step 1: Create Worker Script
```javascript
// workers/html-cache.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;

    // Try to get from cache
    let response = await cache.match(cacheKey);

    if (!response) {
      // Fetch from origin (Cloudflare Pages)
      response = await fetch(request);

      // Cache HTML responses
      if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
        response = new Response(response.body, response);
        response.headers.set('Cache-Control', 'public, max-age=7200'); // 2 hours
        response.headers.set('CDN-Cache-Control', 'public, max-age=7200');

        // Store in edge cache
        await cache.put(cacheKey, response.clone());
      }
    } else {
      // Add header to show it's cached
      response = new Response(response.body, response);
      response.headers.set('X-Cache', 'HIT');
    }

    return response;
  }
};
```

### Step 2: Deploy Worker
```bash
# Create new worker in Cloudflare Dashboard
# Point custom domain route: pickafarm.com/* → Worker
```

## Recommendation

**START WITH OPTION A** (Page Rules) - it's instant and requires zero code changes!

If you need more control, move to Option C (custom Worker).

Option B is good but may require refactoring since you're currently using static export.

## Expected Results

### Before (Current)
- TTFB: ~400ms
- LCP: 13.4s
- Score: 51/100

### After (Option A)
- TTFB: ~50ms (cached at edge)
- LCP: 1-2s (HTML renders instantly)
- Score: 70-80/100 (estimated)

### After (Option C with optimizations)
- TTFB: ~30ms
- LCP: 0.8-1.5s
- Score: 80-90/100 (estimated)
