# PRD: Farm Custom Logo & Background Images

## Introduction/Overview

This feature enables farms to upload custom logo and background images through Zoho CRM, which will be automatically processed, optimized to WebP format (max 200KB), stored in Cloudflare R2 bucket, and displayed on their farm detail pages. The logo will overlay the background image in a Facebook-style profile layout, creating a professional branded appearance for each farm listing.

**Problem it solves:** Currently all farm pages use a generic background image. Farm owners want to showcase their unique branding to increase trust, recognition, and engagement with potential visitors.

**Goal:** Allow farms to customize their profile appearance with their own logo and background images, automatically optimized for web performance.

## Goals

1. Enable farm owners to upload logo and background images via Zoho CRM fields
2. Automatically process and optimize images to WebP format (≤200KB) without manual intervention
3. Store optimized images in Cloudflare R2 bucket with efficient URL structure
4. Display custom branding on farm detail pages with Facebook-style profile layout (logo overlaying background)
5. Ensure zero downtime during image updates (dynamic edge rendering)
6. Maintain fallback to generic images for farms without custom branding
7. Provide error notifications to admin if image processing fails

## User Stories

### Farm Owner
- **As a farm owner**, I want to upload my farm's logo and background image in Zoho CRM so that my listing stands out with professional branding
- **As a farm owner**, I want my images to load quickly on the website so that visitors have a good first impression
- **As a farm owner**, I want my branding to update immediately after I save changes in Zoho CRM so that I can see results quickly

### Website Visitor
- **As a website visitor**, I want to see the farm's actual branding so that I can recognize and trust the business
- **As a website visitor**, I want images to load fast so that I don't have to wait
- **As a website visitor**, I want to see a consistent professional layout across all farm pages

### System Administrator
- **As an admin**, I want to be notified when image processing fails so I can debug the process
- **As an admin**, I want images to be automatically optimized so that I don't have to manually process them
- **As an admin**, I want optimized SEO which include speed, schema markup, og image, and alt tags for the images(logo and cover)

## Functional Requirements

### 1. Zoho CRM Integration

**1.1** The existing Zoho webhook endpoint (`/api/webhook/zoho/:token`) MUST be extended to handle Logo and Background image field updates.

**1.2** When a farm record is updated in Zoho CRM with new Logo or Background URLs, the webhook MUST trigger immediately.

**1.3** The webhook handler MUST extract the image URLs from the Zoho payload fields (field names: TBD based on actual Zoho CRM field configuration).

**1.4** The system MUST NOT modify or write back to Zoho CRM - the original image URLs remain in Zoho as the source of truth.

### 2. Image Processing & Optimization

**2.1** The Cloudflare Worker MUST download the original image from the Zoho-provided URL.

**2.2** The system MUST convert all images to WebP format regardless of original format (JPEG, PNG, etc.).

**2.3** The system MUST optimize images to be under 200KB file size.

**2.4** If optimization cannot achieve 200KB, the system MUST reduce quality progressively until the target is met.

**2.5** The system MUST preserve aspect ratio during optimization.

**2.6** Recommended image dimensions:
- Logo: 150x150px (square/rectangular, displayed at this size)
- Background: 1200x400px (wide cover image)

**2.7** If image processing fails, the system MUST send an error notification email to `hello@pickafarm.com` with farm name and error details.

### 3. R2 Bucket Storage

**3.1** Optimized images MUST be uploaded to Cloudflare R2 bucket with the following structure:
```
/farms/{farm_id}/logo.webp
/farms/{farm_id}/background.webp
```

**3.2** The R2 bucket MUST be configured with public read access for these paths.

**3.3** The R2 bucket MUST have a custom domain configured (e.g., `cdn.pickafarm.com` or `r2.pickafarm.com`).

**3.4** Old images MUST be overwritten when new images are uploaded (no versioning required).

### 4. Database Schema Changes

**4.1** Add the following columns to the D1 `farms` table:

```sql
ALTER TABLE farms ADD COLUMN logo_url TEXT;
ALTER TABLE farms ADD COLUMN background_url TEXT;
ALTER TABLE farms ADD COLUMN logo_updated_at DATETIME;
ALTER TABLE farms ADD COLUMN background_updated_at DATETIME;
```

**4.2** The `logo_url` and `background_url` fields MUST store the full public R2 URL (e.g., `https://cdn.pickafarm.com/farms/{farm_id}/logo.webp`).

**4.3** The `*_updated_at` fields MUST be set to the current timestamp when images are processed.

**4.4** The Worker API endpoint (`GET /api/farms` and `GET /api/farms/:id`) MUST include these new fields in responses.

### 5. Frontend UI/UX Display

**5.1** The farm detail page (`/farms/[id]/page.tsx`) MUST display custom branding in a Facebook-style profile layout:
- Background image as full-width cover (current position, lines 351-361)
- Logo overlaying bottom-left corner of background
- Logo dimensions: 150x150px with rounded corners (border-radius: 8px)
- Logo border: 4px white border for separation from background
- Logo shadow: subtle drop shadow for depth

**5.2** The layout MUST be responsive:
- Desktop: Logo bottom-left with 24px margin from edges
- Mobile: Logo bottom-left with 16px margin from edges, scaled to 120x120px

**5.3** Fallback images MUST be used when custom images are not available:
- Default background: Current `/images/farms/background.webp`
- Default logo: Generic farm icon or first letter of farm name in colored circle

**5.4** Images MUST use Next.js `<Image>` component with:
- `loading="eager"` for background (above fold)
- `priority={true}` for background
- Appropriate `width` and `height` props
- `alt` text: `"{farm_name} logo"` and `"{farm_name} background"`

**5.5** The existing placeholder background (line 353) MUST be replaced with the dynamic background from database.

### 6. Error Handling & Resilience

**6.1** If image download from Zoho URL fails:
- Log error with farm ID and URL
- Send email notification to `hello@pickafarm.com`
- Keep existing image in database (do not overwrite)
- Return 200 OK to Zoho webhook (acknowledge receipt)

**6.2** If WebP conversion fails:
- Log error with farm ID and image type
- Send email notification
- Keep existing image
- Return 200 OK to webhook

**6.3** If R2 upload fails:
- Log error with farm ID
- Send email notification
- Keep existing image URL in database
- Return 200 OK to webhook

**6.4** If database update fails:
- Log error
- Do not overwrite R2 files (keep old and new)
- Send email notification
- Return 500 error to webhook for retry

**6.5** The frontend MUST gracefully handle missing images:
- Use fallback images
- No broken image icons
- No layout shift (reserve space for images)

### 7. Performance Requirements

**7.1** Image processing MUST complete within 10 seconds to avoid Cloudflare Worker timeout.

**7.2** If processing takes longer, the worker MUST:
- Process images asynchronously using Durable Objects or Queue
- Send completion notification email

**7.3** The farm detail page MUST NOT rebuild when images update (use dynamic edge rendering with `dynamic = 'force-dynamic'`).

**7.4** Images MUST be served with appropriate cache headers:
- `Cache-Control: public, max-age=31536000, immutable`
- Use cache busting via timestamp query parameter if needed

**7.5** Preload critical images in page `<head>`:
```html
<link rel="preload" as="image" href="{background_url}" />
```

### 8. Email Notifications

**8.1** Error notification emails MUST include:
- Subject: `[PickAFarm] Image Processing Error - {farm_name}`
- Farm name and ID
- Image type (logo or background)
- Error message
- Original image URL from Zoho
- Timestamp

**8.2** Emails MUST be sent using Resend API (existing integration).

**8.3** Email template MUST be plain text, clear, and actionable.

### 9. Migration & Backwards Compatibility

**9.1** All existing farms MUST continue to work with fallback images.

**9.2** No manual migration required - images will populate as farms update their records.

**9.3** The schema migration MUST be non-breaking (nullable columns).

**9.4** The frontend MUST handle both old (no custom images) and new (custom images) farm records.

## Non-Goals (Out of Scope)

1. **Image upload directly from website** - Farm owners upload via Zoho CRM only, not through a PickAFarm web interface
2. **Image moderation/approval** - All farm images are processed automatically without manual approval
3. **Multiple images per farm** - Only one logo and one background per farm
4. **Image cropping/editing tools** - Farm owners must prepare images before uploading to Zoho
5. **Image versioning/history** - Only the latest image is stored, no history
6. **Analytics on image engagement** - No tracking of image view/click metrics in this phase
7. **Bulk image migration tool** - No tool to migrate existing images from other sources
8. **Farm owner self-service portal** - Updates only through Zoho CRM (future: farm owner dashboard)

## Design Considerations

### UI Layout Specification

```
┌─────────────────────────────────────────────┐
│                                             │
│         Background Image (1200x400)         │
│                                             │
│                                             │
│    ┌─────────┐                              │
│    │  Logo   │                              │ 
│────│ 150x150 │──────────────────────────────│
│    └─────────┘                              │
|     Farm Info                               │
└─────────────────────────────────────────────┘
```

**CSS Implementation:**
- Position: Relative container for background
- Position: Absolute for logo (bottom: 24px, left: 24px)
- Z-index: Logo above background but below interactive elements
- Border-radius: 8px for logo
- Box-shadow: `0 2px 8px rgba(0,0,0,0.1)` for logo

### Component Structure

```
<div className="relative">
  {/* Background */}
  <Image src={farm.background_url || '/images/farms/background.webp'} ... />

  {/* Logo overlay */}
  <div className="absolute bottom-6 left-6">
    <Image src={farm.logo_url || generateFallbackLogo(farm.name)} ... />
  </div>
</div>
```

## Technical Considerations

### 1. Image Processing Library

**Recommendation:** Use Sharp library (already available in Node.js/Cloudflare Workers via `sharp-wasm` or native Sharp)

- Sharp is fast, memory-efficient, and supports WebP output
- Can resize, optimize, and convert in one pass
- Works in Cloudflare Workers environment

### 2. R2 Bucket Configuration

**Setup Required:**
1. Create R2 bucket: `pickafarm-assets`
2. Configure public access for `/farms/**` paths
3. Set up custom domain: `cdn.pickafarm.com`
4. Configure CORS for image requests from pickafarm.com

**Wrangler Configuration:**
```toml
[[r2_buckets]]
binding = "ASSETS_BUCKET"
bucket_name = "pickafarm-assets"
```

### 3. Database Migration

**Migration File:** `migrations/0004_add_farm_images.sql`
```sql
-- Add image columns to farms table
ALTER TABLE farms ADD COLUMN logo_url TEXT;
ALTER TABLE farms ADD COLUMN background_url TEXT;
ALTER TABLE farms ADD COLUMN logo_updated_at DATETIME;
ALTER TABLE farms ADD COLUMN background_updated_at DATETIME;

-- Create index for faster lookups
CREATE INDEX idx_farms_logo_updated ON farms(logo_updated_at);
CREATE INDEX idx_farms_background_updated ON farms(background_updated_at);
```

**Run migration:**
```bash
wrangler d1 migrations apply pickafarm-db
```

### 4. Worker Architecture

**New Functions to Create:**

1. `src/lib/image-processor.js`:
   - `downloadImage(url)` - Fetch from Zoho URL
   - `optimizeImage(buffer, type)` - Convert to WebP, resize, compress
   - `uploadToR2(bucket, path, buffer)` - Upload to R2
   - `generatePublicUrl(farmId, imageType)` - Construct CDN URL

2. `src/lib/email-notifications.js`:
   - `sendImageErrorEmail(farmId, farmName, imageType, error)` - Send error notification

3. Update `src/index.js`:
   - Extend `handleZohoWebhook()` to detect Logo/Background field changes
   - Call image processing pipeline
   - Update D1 with new URLs

### 5. Frontend Changes

**Files to Modify:**
1. `web/app/farms/[id]/page.tsx` - Update UI layout (lines 351-361)
2. `web/lib/schema.ts` - Add logo_url, background_url to FarmData type
3. `web/components/farm-profile-header.tsx` - New component for profile layout (optional refactor)

### 6. Dependencies

**New Dependencies:**
- Worker: `sharp-wasm` (or native Sharp if available in CF Workers)
- Worker: None (Resend already integrated)

**Existing Dependencies:**
- Zoho webhook integration (already exists)
- R2 binding (needs to be added to wrangler.toml)
- D1 database (already exists)
- Resend email API (already integrated)

### 7. Environment Variables

**Worker Secrets (wrangler.toml or secrets):**
```toml
# Existing
RESEND_API_KEY = "..."

# New R2 binding
[[r2_buckets]]
binding = "ASSETS_BUCKET"
bucket_name = "pickafarm-assets"

# CDN domain (environment variable)
CDN_DOMAIN = "cdn.pickafarm.com"
```

### 8. Testing Strategy

**Unit Tests:**
- Image download and validation
- WebP conversion and size optimization
- R2 upload success/failure scenarios
- URL generation

**Integration Tests:**
- End-to-end webhook → processing → storage → display
- Error handling and email notifications
- Fallback image display

**Manual Testing:**
1. Update farm record in Zoho with logo URL
2. Verify webhook received and processed
3. Check R2 bucket for optimized image
4. Verify D1 database updated with URL
5. Load farm detail page and verify display
6. Test with missing images (fallback)
7. Test with oversized images (compression)

## Success Metrics

### Primary Success Criteria

1. **Functional Correctness**
   - ✅ Logo and background images upload successfully from Zoho CRM
   - ✅ Images are converted to WebP and optimized to ≤200KB
   - ✅ Images are stored in R2 and URLs saved to D1
   - ✅ Images display correctly on farm detail pages with proper layout
   - ✅ Fallback images work for farms without custom branding
   - ✅ Error notifications are sent when processing fails

2. **Performance**
   - Image processing completes in <10 seconds
   - Page load time with custom images ≤ current load time (no regression)
   - WebP images load faster than original formats

3. **Reliability**
   - Zero broken images on production
   - 100% webhook acknowledgment (no Zoho retries due to timeout)
   - Error notification rate <5% of total image uploads

### Future Metrics (Post-Launch)

- % of farms with custom branding (target: 30% within 3 months)
- Increase in farm page engagement (time on page, scroll depth)
- Increase in contact/directions click-through rate
- Reduction in bounce rate on farm pages with custom branding

## Open Questions

### Technical Questions

1. **Image Processing Location**: Should we use Cloudflare Workers built-in image processing, or deploy Sharp in the Worker? (Recommendation: Try CF Workers Image Resizing API first - simpler, then fallback to Sharp if needed)

2. **CDN Domain**: What domain should we use for R2 public URLs?
   - Option A: `cdn.pickafarm.com`
   - Option B: `assets.pickafarm.com`
   - Option C: Use R2's default public URL

3. **Zoho Field Names**: What are the exact field names in Zoho CRM for Logo and Background images? (Need to confirm with Zoho CRM admin)

4. **Rate Limiting**: Should we rate-limit image processing to avoid abuse? (Recommendation: Start without, add if needed)

5. **Cache Invalidation**: If a farm updates their logo/background multiple times, do we need cache busting? (Recommendation: Use timestamp query param or R2 object metadata for versioning)

### Product Questions

6. **Logo Shape**: Should logos be circular (like profile photos) or rectangular? (Answer: Rectangular per requirements, but worth confirming with design)

7. **Image Validation**: Should we validate image content (e.g., no inappropriate images)? (Out of scope for v1, but consider for future)

8. **Farm Owner Communication**: Should we notify farm owners when their images are processed successfully? (Out of scope for v1 - only error notifications to admin)

---

## Implementation Checklist

### Phase 1: Backend (Cloudflare Worker + R2)
- [ ] Create R2 bucket and configure public access
- [ ] Add R2 binding to wrangler.toml
- [ ] Implement image download function
- [ ] Implement WebP optimization (Sharp or CF Image Resizing)
- [ ] Implement R2 upload function
- [ ] Extend Zoho webhook handler to detect Logo/Background fields
- [ ] Update D1 schema (migration)
- [ ] Update Worker API to return logo_url and background_url
- [ ] Implement error notification emails
- [ ] Test end-to-end workflow

### Phase 2: Frontend (Next.js)
- [ ] Update FarmData TypeScript interface
- [ ] Modify farm detail page layout for profile-style display
- [ ] Implement fallback logo generator (optional)
- [ ] Add image preloading for performance
- [ ] Test responsive layout (desktop + mobile)
- [ ] Test with missing images (fallback display)
- [ ] Test with actual custom images

### Phase 3: Testing & Deployment
- [ ] Manual testing in staging environment
- [ ] Update CLAUDE.md with new architecture documentation
- [ ] Deploy Worker changes
- [ ] Run D1 migration
- [ ] Monitor error logs for first 24 hours
- [ ] Document troubleshooting steps for common errors

---

**Document Version:** 1.0
**Created:** 2025-10-07
**Author:** Product Team (via Claude Code)
**Status:** Draft - Ready for Review
