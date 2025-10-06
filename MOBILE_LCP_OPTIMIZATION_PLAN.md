# Mobile LCP Optimization Plan
**Target**: Improve Performance Score from 60 → 90+, LCP from 7.0s → <2.5s

## Current Status (Post-Initial Optimizations)

### ✅ Completed Optimizations
- **Mobile Static Map**: Implemented static PNG with modal (eliminates Google Maps load on mobile)
- **Image Sizing**: Optimized blog images to prefer 400px over 800px
- **Map Image**: Reduced from scale=2 to scale=1 (saves 45KB)

### 📊 Current Metrics
| Metric | Score | Status |
|--------|-------|--------|
| Performance | **60/100** | 🟡 Needs improvement |
| FCP | 1,958ms | 🟢 Good |
| **LCP** | **7,041ms** | 🔴 CRITICAL ISSUE |
| TBT | 401ms | 🟡 Fair |
| CLS | 0.00016 | 🟢 Excellent |
| Speed Index | 6,123ms | 🔴 Poor |
| TTI | 8,005ms | 🔴 Poor |

### 🚨 Main Bottleneck
**Render Blocking CSS**: `2919299191cfd454.css` blocking for **751ms**

The critical CSS inlining script didn't work because:
- Critters runs on `out/` directory after static export
- But Cloudflare Pages may not copy/execute the postbuild script correctly
- The CSS file is still being loaded as external blocking resource

---

## Phase 1: Fix Critical CSS Inlining (HIGH PRIORITY)
**Impact**: 751ms LCP improvement
**Effort**: Medium
**Status**: ❌ Not working as expected

### Problem Analysis
The `postbuild` script runs after `next build`, but:
1. Critters modifies HTML in `out/` directory
2. Cloudflare Pages deployment may not include postbuild modifications
3. The CSS hash changes on each build, making it hard to preload

### Solutions (Pick One)

#### Option A: Next.js Plugin Approach ⭐ RECOMMENDED
Use `next-critical` or custom plugin to inline CSS during build, not after.

**Implementation**:
```bash
npm install --save-dev next-critical
```

Update `next.config.js`:
```javascript
const withCritical = require('next-critical')

module.exports = withCritical({
  // Next.js config
  trailingSlash: true,
  // ... existing config
})
```

**Pros**: Runs during build, guaranteed to be deployed
**Cons**: Requires compatible Next.js plugin

#### Option B: Custom Webpack Plugin
Inject critical CSS inline during webpack compilation.

**Implementation**: Create `plugins/inline-critical-css-plugin.js`

**Pros**: Full control, runs during build
**Cons**: Complex webpack configuration

#### Option C: Manual Critical CSS Extraction ⚡ FASTEST
Extract critical CSS manually and inline it in root layout.

**Steps**:
1. Identify critical CSS (above-the-fold styles)
2. Extract to `app/critical.css`
3. Inline in `app/layout.tsx` using `<style>` tag
4. Load full CSS with `media="print" onload="this.media='all'"`

**Implementation**:
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Inline critical CSS */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />

        {/* Load full CSS asynchronously */}
        <link
          rel="stylesheet"
          href="/_next/static/css/[hash].css"
          media="print"
          onLoad="this.media='all'"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Pros**: Simple, guaranteed to work
**Cons**: Manual maintenance of critical CSS

---

## Phase 2: Image Format Optimization (MEDIUM PRIORITY)
**Impact**: 110ms LCP improvement
**Effort**: Low
**Status**: ⚠️ Partial

### Issue
Blog images still showing "Serve images in next-gen formats" warning.

### Solution
Already using AVIF/WebP with `<picture>` element, but need to:
1. Ensure all images have AVIF versions
2. Check if any JPG/PNG images are being used as fallback

**Action**: Audit `blog-images.json` to ensure all images have AVIF format.

---

## Phase 3: Reduce JavaScript Execution (MEDIUM PRIORITY)
**Impact**: Improve TBT and TTI
**Effort**: Medium
**Status**: ❌ Not started

### Current Issue
- TBT: 401ms (target: <200ms)
- TTI: 8,005ms (target: <5,000ms)

### Solutions

#### 3.1 Remove Unused Third-Party Scripts
**Target**: Google Analytics, Vercel Analytics

Move to edge/server-side analytics:
```javascript
// Remove from client:
import { Analytics } from '@vercel/analytics/react'

// Use server-side tracking instead
```

#### 3.2 Defer Non-Critical JavaScript
Defer Clerk, location detection until after initial paint:

```typescript
// Use requestIdleCallback
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Load Clerk
    // Load location detector
  })
}
```

#### 3.3 Code Splitting by Route
Split JavaScript by page:
- Homepage: Minimal JS (just map modal)
- Farm detail pages: Full interactivity
- Search pages: Search-specific code

**Implementation**: Use Next.js dynamic imports with `ssr: false`

---

## Phase 4: Preload LCP Image (LOW PRIORITY)
**Impact**: ~100-200ms LCP improvement
**Effort**: Low
**Status**: ❌ Not started

### Solution
Add preload for static map image in `<head>`:

```tsx
<link rel="preload" as="image" href="/us-map-static.png" fetchPriority="high" />
```

This ensures the LCP element (map image) loads immediately.

---

## Phase 5: Font Optimization (LOW PRIORITY)
**Impact**: ~50-100ms FCP/LCP
**Effort**: Low
**Status**: ⚠️ Needs investigation

### Check Current Font Loading
1. Are fonts being loaded from external CDN?
2. Are fonts using `font-display: swap`?
3. Can we subset fonts to reduce size?

### Solution
```css
@font-face {
  font-family: 'YourFont';
  font-display: swap; /* Ensure swap is set */
  src: url('/fonts/font.woff2') format('woff2');
}
```

Preload critical font:
```html
<link rel="preload" href="/fonts/font.woff2" as="font" type="font/woff2" crossorigin>
```

---

## Implementation Priority

### Sprint 1: Critical Path (751ms impact)
- [ ] **Fix Critical CSS Inlining** (Option C - Manual extraction)
  - Extract critical CSS from main stylesheet
  - Inline in layout.tsx
  - Async load full CSS
  - Test in production

**Expected Result**: Performance 60 → 75, LCP 7.0s → 5.5s

### Sprint 2: Quick Wins (110-200ms impact)
- [ ] **Preload LCP Image** (static map)
- [ ] **Image Format Audit** (ensure AVIF everywhere)

**Expected Result**: Performance 75 → 82, LCP 5.5s → 4.5s

### Sprint 3: JavaScript Optimization (TTI/TBT improvement)
- [ ] **Defer Third-Party Scripts** (analytics)
- [ ] **Lazy Load Non-Critical Features** (Clerk, location)
- [ ] **Code Split by Route**

**Expected Result**: Performance 82 → 88, LCP 4.5s → 3.5s

### Sprint 4: Font & Polish (50-100ms impact)
- [ ] **Font Optimization**
- [ ] **Font Preload**

**Expected Result**: Performance 88 → 90+, LCP 3.5s → <2.5s ✅

---

## Success Criteria

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| Performance Score | 60 | 90+ | 🔥 |
| LCP | 7,041ms | <2,500ms | 🔥 |
| TBT | 401ms | <200ms | 🟡 |
| FCP | 1,958ms | <1,800ms | 🟢 |
| CLS | 0.00016 | <0.1 | ✅ |

---

## Technical Notes

### Why Critical CSS Inlining Failed
The `postbuild` script with Critters runs **after** `next build` creates the `out/` directory. However:
1. The modifications happen locally in `out/`
2. Cloudflare Pages may deploy before postbuild completes
3. Or postbuild doesn't run in CI environment

**Solution**: Move critical CSS extraction into the build process itself, not after.

### Mobile Static Map Impact
The mobile static map reduced initial load significantly, but the LCP is still high because:
1. The CSS file blocks rendering
2. JavaScript hydration takes time
3. The map image isn't preloaded

Once CSS inlining is fixed, LCP should drop to ~3-4s immediately.

---

## Next Steps

1. **Implement Option C (Manual Critical CSS)** - Highest impact, lowest risk
2. **Test locally with production build**
3. **Deploy and measure**
4. **Iterate based on results**

Each sprint should show measurable improvement. Target: 90+ score within 4 sprints.
