# OG Image & Metadata Audit

## Current Status

### ✅ Pages WITH Proper Metadata & OG Images

1. **Homepage** (`/`)
   - Uses: `generateHomepageMetadata()` from `seo-metadata.ts`
   - Image: `/images/og-pickafarm.webp` (default)
   - Status: ✅ Complete

2. **Farm Detail Pages** (`/farms/[id]/`)
   - Uses: `generateFarmMetadata(farm)` from `seo-metadata.ts`
   - Image: `farm.background_url || farm.logo_url || default`
   - Status: ✅ Complete (just fixed)

3. **About Page** (`/about/`)
   - Has metadata export
   - Status: ⚠️ Need to verify OG image

### ⚠️ Pages WITH Metadata BUT Missing/Incomplete OG Images

4. **State Pages** (`/[slug]/` when state)
   - Has custom metadata
   - Image: ❌ Missing - uses no explicit image
   - Fix needed: Add default or state-specific image

5. **Category Pages** (`/[slug]/` when category)
   - Has custom metadata
   - Image: ❌ Missing - uses no explicit image
   - Fix needed: Add category-specific or default image

6. **State + Category Pages** (`/[state]/[category]/`)
   - Has metadata
   - Image: ❌ Need to verify
   - Fix needed: Should use category image

7. **Location Pages** (`/farms-near/[location]/`)
   - Has metadata
   - Image: ❌ Need to verify
   - Fix needed: Add location-specific or default image

8. **Category + Location Pages** (`/[slug]/near/[location]/`)
   - Has metadata
   - Image: ❌ Need to verify
   - Fix needed: Add hybrid image

9. **Variety Pages** (`/varieties/[variety]/`)
   - Has metadata
   - Image: ❌ Need to verify
   - Fix needed: Add variety-specific image

10. **Blog Post Pages** (`/blog/[posts]/`)
    - Has metadata
    - Image: ⚠️ Should use WordPress featured image
    - Fix needed: Extract and use featured image

### ❌ Pages MISSING Metadata Entirely

11. **Blog Index Page** (`/blog/`)
    - Status: ❌ No metadata export
    - Fix needed: Add complete metadata with image

12. **Contact Page** (`/contact/`)
    - Uses `StaticPageLayout` (no metadata)
    - Fix needed: Add metadata export

13. **Privacy Page** (`/privacy/`)
    - Uses `StaticPageLayout` (no metadata)
    - Fix needed: Add metadata export

14. **Cookies Page** (`/cookies/`)
    - Uses `StaticPageLayout` (no metadata)
    - Fix needed: Add metadata export

### 🔒 Authenticated Pages (No SEO Needed - noindex)

15. **Dashboard** (`/dashboard/`)
16. **Profile** (`/profile/`)
17. **Saved Farms** (`/saved-farms/`)

## Image Requirements

### Optimal OG Image Specs
- **Dimensions**: 1200x630px (1.91:1 aspect ratio)
- **Format**: WebP for modern browsers, fallback to PNG/JPG
- **Size**: < 1MB (ideally < 300KB)
- **Content**: High contrast text, logo, key visual

### Current Default Image
- File: `/public/og-pickafarm.webp`
- Size: 61KB ✅
- Dimensions: ❓ Need to verify (should be 1200x630)

## Recommended Actions

### Priority 1: Fix Missing Images on Existing Metadata
1. Add OG images to state pages
2. Add OG images to category pages
3. Add OG images to location pages
4. Verify blog post images are pulling from WordPress

### Priority 2: Add Metadata to Static Pages
1. Blog index page
2. Contact page
3. Privacy/Cookies pages

### Priority 3: Create Category-Specific Images
1. Christmas tree farms image
2. Apple orchards image
3. Pumpkin patches image
4. Berry farms image
5. Other category images

### Priority 4: Verify Image Dimensions
1. Check current default OG image is 1200x630
2. Ensure all generated images meet specs
