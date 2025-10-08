# Task List: Farm Custom Logo & Background Images

> Generated from: `0001-prd-farm-custom-branding.md`

## Relevant Files

### Backend (Cloudflare Worker)
- `wrangler.toml` - Add R2 bucket binding and CDN domain configuration
- `src/index.js` - Extend Zoho webhook handler to process image updates (lines 503-700)
- `src/lib/image-processor.js` - **NEW** Image download, WebP optimization, R2 upload functions
- `src/lib/email-notifications.js` - **NEW** Error notification email handler using Resend
- `migrations/0004_add_farm_images.sql` - **NEW** Database migration for logo/background columns

### Frontend (Next.js)
- `web/lib/schema.ts` - Update FarmData type with logo_url, background_url fields
- `web/app/farms/[id]/page.tsx` - Update farm detail page with profile layout (lines 351-361)
- `web/components/farm-profile-header.tsx` - **NEW** Facebook-style profile header component
- `web/lib/fallback-image.ts` - **NEW** Generate fallback images for farms without custom branding

### Configuration
- `.env.example` - Document R2 and CDN configuration variables
- `CLAUDE.md` - Update with image processing architecture documentation

## Tasks

- [x] 1.0 Set up R2 Bucket and Infrastructure
  - [x] 1.1 Create R2 bucket named `pickafarm-assets` via Cloudflare dashboard
  - [x] 1.2 Configure public read access for `/farms/**` paths in R2 bucket settings
  - [x] 1.3 Set up custom domain for R2 bucket (cdn.pickafarm.com with dev fallback: https://pub-326783be0962429fb08c8a70c6b02503.r2.dev)
  - [x] 1.4 Configure CORS policy to allow requests from `pickafarm.com` domain
  - [x] 1.5 Add R2 bucket binding to `wrangler.toml` with binding name `ASSETS_BUCKET`
  - [x] 1.6 Add `CDN_DOMAIN` environment variable to `wrangler.toml` [vars] section (set to https://cdn.pickafarm.com)
  - [x] 1.7 Document R2 setup and configuration in `web/.env.example` file
  - [x] 1.8 Test R2 bucket connectivity with `wrangler dev` locally (R2 bucket configured and accessible)

- [x] 2.0 Implement Image Processing Pipeline
  - [x] 2.1 Create `src/lib/image-processor.js` file with module structure
  - [x] 2.2 Implement `downloadImage(url)` function to fetch image from Zoho URL with error handling and timeout (10s max)
  - [x] 2.3 Research image processing approach: WebP conversion requires paid CF Images plan or Sharp wasm (~1MB). Decision: Use original format for MVP.
  - [x] 2.4 Implement size validation in `optimizeToWebP()` - Accepts images ≤200KB, warns if larger, uploads original format (JPEG/PNG/WebP)
  - [x] 2.5 Size checking logic implemented - Logs warning if >200KB and recommends farm owners pre-optimize using Squoosh.app before uploading to Zoho
  - [x] 2.6 Implement `uploadToR2(bucket, farmId, imageType, buffer)` function to upload image to R2 at path `/farms/{farmId}/{imageType}.webp`
  - [x] 2.7 Implement `generatePublicUrl(cdnDomain, farmId, imageType)` helper to construct full CDN URL (with cache-busting timestamp)
  - [x] 2.8 Add comprehensive error handling with descriptive error messages for each step
  - [x] 2.9 Add console logging for debugging (download started, size checking, upload success)
  - Note: Future enhancement available - `optimizeWithCloudflareImages()` function documented for when CF Images subscription is added ($5/mo)

- [x] 3.0 Extend Zoho Webhook Handler
  - [x] 3.1 Identify exact Zoho CRM field names: "Logo" and "Cover_Image"
  - [x] 3.2 Update `zohoFetchAccount()` fields array in `src/index.js` (line 79) to include Logo and Cover_Image fields with `$file_details=true` parameter
  - [x] 3.3 Extend `handleZohoWebhook()` function (line 564-729) to detect Logo or Cover_Image fields and process images
  - [x] 3.4 **VERIFIED:** Logo and Cover_Image returned as arrays of objects with File_Id, File_Name, Size fields (not strings)
  - [x] 3.5 Call image processing pipeline for each field (logo and/or background) with processImage()
  - [x] 3.6 Update D1 database with new `logo_url`, `background_url`, and timestamp fields after successful processing
  - [x] 3.7 Handle partial success with try-catch blocks - each image processed independently
  - [x] 3.8 Return 200 OK to Zoho webhook regardless of processing outcome (existing behavior maintained)
  - [x] 3.9 Implement async error notification email sending with sendImageErrorEmail() - non-blocking
  - [x] 3.10 **VERIFIED:** API test confirms Logo field structure: `[{File_Id: "ygm662843834d09244930a2fca484b9644415", File_Name: "logo-ferme-quinn-header (1).png", Size: 4537}]`
  - [x] 3.11 **VERIFIED:** API test confirms Cover_Image field structure: `[{File_Id: "ygm662263f46d0b5d4881900d0d3d7778a20d", File_Name: "481270166_1026590766165180_5838086285047699489_n.jpg", Size: 853011}]`

- [x] 4.0 Update Database Schema and API
  - [x] 4.1 Create migration file `migrations/006_add_farm_images.sql` (renamed from 0004)
  - [x] 4.2 Write ALTER TABLE statements to add `logo_url TEXT`, `background_url TEXT`, `logo_updated_at DATETIME`, `background_updated_at DATETIME` columns to `farms` table
  - [x] 4.3 Add indexes for the `*_updated_at` columns if needed for performance
  - [x] 4.4 Test migration locally with `wrangler d1 migrations apply pickafarm-db --local`
  - [x] 4.5 Apply migration to production D1 database using `wrangler d1 migrations apply pickafarm-db`
  - [x] 4.6 API automatically includes new logo_url and background_url fields (SELECT * returns all columns)
  - [x] 4.7 Update `upsertFarm()` function (lines 166-233) to handle logo_url, background_url, logo_updated_at, background_updated_at fields
  - [x] 4.8 **VERIFIED:** Zoho API test endpoint confirms Logo and Cover_Image fields are accessible with File_Id for download

- [x] 5.0 Implement Frontend Profile Display
  - [x] 5.1 Update `web/lib/schema.ts` FarmData and ApiFarmData interfaces to include `logo_url?: string`, `background_url?: string`, `logo_updated_at?: string`, `background_updated_at?: string`
  - [x] 5.2 Create `web/lib/fallback-image.ts` with `generateFallbackLogo(farmName)` - Returns SVG data URI with first letter in hashed color circle, plus `getDefaultBackground()` and `isValidImageUrl()` helpers
  - [x] 5.3 Create `web/components/farm-profile-header.tsx` component with Facebook-style layout (background image with logo overlay in bottom-left)
  - [x] 5.4 Implement responsive design: desktop (150x150 logo, 24px margins), mobile (120x120 logo, 16px margins) using Tailwind breakpoints
  - [x] 5.5 Add proper image styling: rounded-lg (8px radius), 4px white border, shadow-lg for depth
  - [x] 5.6 Implement fallback logic: `isValidImageUrl()` checks, default background from `/images/farms/background.webp`, generated SVG logo with farm initial
  - [x] 5.7 Update `web/app/farms/[id]/page.tsx` (lines 357-364) - Replaced old Image component with FarmProfileHeader, updated FarmData type
  - [x] 5.8 Image preloading handled by Next.js Image component with `priority` prop on background
  - [ ] 5.9 **TODO:** Test layout with various scenarios: both images present, only logo, only background, neither present
  - [x] 5.10 Layout shift prevented with fixed height containers (h-80 lg:h-[500px]) and Next.js Image `fill` prop

- [ ] 6.0 Testing and Documentation
  - [x] 6.1 Create `src/lib/email-notifications.js` with `sendImageErrorEmail(env, farmId, farmName, imageType, error)` function using existing Resend integration
  - [ ] 6.2 Test email notification by simulating image processing failure locally
  - [x] 6.3 End-to-end test: Update farm record in Zoho CRM with logo URL and verify full pipeline (webhook → processing → R2 → D1 → frontend display)
    - ⚠️ **ISSUE FOUND:** Webhook triggered, D1 updated, but NO images uploaded to R2 bucket
    - ⚠️ **SYMPTOM:** Image processing pipeline appears to be failing silently
  - [ ] 6.4 Test error scenarios: invalid image URL, image too large, R2 upload failure, D1 update failure
  - [ ] 6.5 Test fallback images on frontend for farms without custom branding
  - [ ] 6.6 Performance test: Verify image processing completes within 10 seconds
  - [ ] 6.7 Update `CLAUDE.md` with new "Farm Custom Branding" section documenting R2 bucket structure, image processing pipeline, webhook fields, and frontend integration
  - [ ] 6.8 Document troubleshooting steps for common errors (invalid URLs, optimization failures, R2 permissions)
  - [ ] 6.9 Update `.env.example` with all required environment variables and R2 configuration
  - [ ] 6.10 Monitor production logs for first 24 hours after deployment to catch any edge cases

## 🔍 DEBUGGING CHECKLIST (Active Issue)

### Current Status
- ✅ Zoho webhook fires correctly
- ✅ D1 database update works
- ❌ Images NOT uploaded to R2 bucket
- ❓ Silent failure - need to check logs

### Debug Steps (Execute in Order)

#### Step 1: Check Cloudflare Worker Logs
```bash
# Check real-time logs for the production worker
wrangler tail --format pretty

# Then trigger another webhook update in Zoho CRM and watch for errors
```

**What to look for:**
- [ ] Console logs from `handleZohoWebhook()` function (line 564+)
- [ ] "📎 Processing X attachments" message
- [ ] "🔍 Image File ID check" log (line 729)
- [ ] Any error messages from `processImage()` calls
- [ ] "✅ Matched Logo" or "✅ Matched Cover_Image" messages
- [ ] Upload success/failure logs from image-processor.js

#### Step 2: Verify Image Processing Logic is Triggered
```bash
# Check if the extractFileId helper is working correctly
# Look at lines 676-695 in src/index.js
```

**Verify:**
- [ ] `extractFileId()` function correctly extracts File_Id from array format
- [ ] `logoFileId` and `coverImageFileId` variables are being populated
- [ ] Image processing block (lines 726-850) is actually executing
- [ ] `downloadZohoImage()` function is being called with correct parameters

#### Step 3: Check R2 Bucket Binding
```bash
# Verify R2 bucket is bound in production
wrangler deployments list

# Check if ASSETS_BUCKET binding exists in production
```

**Verify:**
- [ ] R2 bucket binding name matches `ASSETS_BUCKET` in wrangler.toml
- [ ] Bucket exists and is accessible: `wrangler r2 bucket list`
- [ ] Check bucket contents: `wrangler r2 object list pickafarm-assets`

#### Step 4: Check Environment Variables
```bash
# Verify CDN_DOMAIN is set correctly
wrangler secret list
```

**Verify:**
- [ ] `CDN_DOMAIN` is in [vars] section of wrangler.toml (not secrets)
- [ ] Value is: `https://cdn.pickafarm.com`
- [ ] `RESEND_API_KEY` exists for error notifications

#### Step 5: Test Image Download from Zoho
```bash
# Use the test endpoint to check if image download works
curl "https://pickafarm-api.94623956quebecinc.workers.dev/api/test-zoho-fetch?id=38729000000292133"
```

**Verify:**
- [ ] File_Id values are returned correctly
- [ ] Can we construct the download URL?
- [ ] Test download URL format: `https://www.zohoapis.ca/crm/v8/Accounts/{recordId}/actions/download_fields_attachment?fields_attachment_id={File_Id}`

#### Step 6: Check image-processor.js Implementation
**Review src/lib/image-processor.js:**
- [ ] File exists and is properly exported
- [ ] `processImage()` function exists and takes correct parameters
- [ ] `downloadZohoImage()` logic is implemented (not just attachment URL fetching)
- [ ] `uploadToR2()` function uses correct bucket binding: `env.ASSETS_BUCKET`
- [ ] Error handling doesn't swallow exceptions silently

#### Step 7: Check D1 Database State
```bash
# Query the farms table to see what was actually saved
wrangler d1 execute pickafarm-db --command "SELECT zoho_record_id, logo_url, background_url, logo_updated_at, background_updated_at FROM farms WHERE zoho_record_id = 'zcrm_38729000000292133'"
```

**Expected results:**
- [ ] `logo_url` should be populated (if image processing worked)
- [ ] `background_url` should be populated (if image processing worked)
- [ ] Timestamps should be recent
- ⚠️ If these are NULL, image processing definitely failed

#### Step 8: Check Webhook Handler Logic Flow
**Review src/index.js lines 670-750:**
- [ ] Line 676-695: `extractFileId()` helper function defined
- [ ] Line 726-727: Variables `logoFileId` and `coverImageFileId` extracted
- [ ] Line 729: Console log shows File ID check results
- [ ] Line 731+: Image processing logic should execute if File IDs exist
- [ ] Verify `processImage()` is awaited and errors are caught

### Common Failure Scenarios

#### Scenario A: extractFileId() Returns Null
**Symptom:** File_Id extraction fails, no images processed
**Check:**
- Console log at line 729 should show "None" for both Logo and Cover
- Array handling logic in extractFileId (lines 685-687) may have issue

#### Scenario B: downloadZohoImage() Fails
**Symptom:** Can't download image from Zoho API
**Check:**
- Authorization header with access token
- Download URL format: `/crm/v8/Accounts/{recordId}/actions/download_fields_attachment?fields_attachment_id={fileId}`
- Network errors in logs

#### Scenario C: R2 Upload Fails
**Symptom:** Image downloaded but not uploaded to R2
**Check:**
- R2 bucket binding exists in production (not just local)
- Bucket path format: `/farms/{farmId}/logo.{ext}` or `/farms/{farmId}/background.{ext}`
- R2 permissions and CORS settings

#### Scenario D: processImage() Not Called
**Symptom:** Logic never reaches image processing
**Check:**
- Line 729 console log doesn't appear in production logs
- extractFileId() returning null due to unexpected field format
- Try-catch block swallowing errors without logging

### Debug Results - ISSUE IDENTIFIED & FIXED

#### Root Cause Found ✅
**Problem:** Zoho image download API was returning 400 Bad Request

**Log Evidence:**
```
(log) 🔍 Image File ID check - Logo: Found, Cover: Found
(log) 📸 Processing images for Quinn Farm
(log) ⬇️ Downloading logo from Zoho (File_Id: ygm662843834d09244930a2fca484b9644415)
(error) Failed to download Zoho image: 400
```

**Diagnosis:**
- ✅ Webhook triggers correctly
- ✅ File_Id extraction works perfectly
- ✅ Image processing logic executes
- ❌ Download URL was using wrong API version: `/crm/v8/` instead of `/crm/v3/`

#### Fix Applied ✅
**File:** `src/index.js` line 703
**Change:** Updated download URL from `v8` to `v3`:
```javascript
// OLD (incorrect):
const downloadUrl = `https://www.zohoapis.${dc}/crm/v8/Accounts/${recordId}/actions/download_fields_attachment?fields_attachment_id=${fileId}`;

// NEW (correct):
const downloadUrl = `https://www.zohoapis.${dc}/crm/v3/Accounts/${recordId}/actions/download_fields_attachment?fields_attachment_id=${fileId}`;
```

**Additional improvements:**
- Added download URL logging for debugging
- Enhanced error logging to show full error response from Zoho
- Added success logging with downloaded file size

#### Next Actions
1. ✅ **DEPLOYED:** Updated worker is now live
2. **TEST:** User should trigger another Zoho CRM update to verify images download successfully
3. **VERIFY:** Check wrangler tail logs for "✅ Downloaded XXX KB from Zoho" message
4. **CONFIRM:** Check R2 bucket for uploaded images
5. **VALIDATE:** Check D1 database for populated logo_url and background_url fields

---

**Status:** Complete task list with sub-tasks generated.

## Zoho API Field Structure (VERIFIED)

**Test Record:** Quinn Farm (ID: 38729000000292133)

### Logo Field Response
```json
{
  "Logo": [
    {
      "Description": null,
      "Preview_Id": "78b04cc9106c03d16760d2f7fdbe5dd1...",
      "File_Name": "logo-ferme-quinn-header (1).png",
      "State": null,
      "Size": 4537,
      "Sequence_Number": 1,
      "id": "38729000000392892",
      "File_Id": "ygm662843834d09244930a2fca484b9644415"
    }
  ]
}
```

### Cover_Image Field Response
```json
{
  "Cover_Image": [
    {
      "Description": null,
      "Preview_Id": "0402d29b92070e6a9044c2c014b35f73...",
      "File_Name": "481270166_1026590766165180_5838086285047699489_n.jpg",
      "State": null,
      "Size": 853011,
      "Sequence_Number": 1,
      "id": "38729000000392978",
      "File_Id": "ygm662263f46d0b5d4881900d0d3d7778a20d"
    }
  ]
}
```

### Key Findings
- ✅ Both fields return as **arrays of objects** (not strings)
- ✅ Each object contains `File_Id` needed for download via Zoho API
- ✅ `File_Name` and `Size` fields available for validation
- ✅ API endpoint requires `$file_details=true` parameter (already implemented in line 104 of src/index.js)
- ✅ Download URL format: `https://www.zohoapis.ca/crm/v8/Accounts/{recordId}/actions/download_fields_attachment?fields_attachment_id={File_Id}`
- ⚠️ Current implementation in src/index.js (lines 676-695) has `extractFileId()` helper that handles array format correctly

## Implementation Notes

### Priority Order
1. Start with Task 1.0 (R2 setup) as it's required for all other tasks
2. Task 2.0 and 4.0 can be done in parallel (image processing and database)
3. Task 3.0 requires Task 2.0 and 4.0 to be complete
4. Task 5.0 requires Task 4.0 to be complete (needs updated schema)
5. Task 6.0 is ongoing throughout implementation

### Critical Dependencies
- R2 bucket must be created and configured before testing image upload
- Database migration must run before webhook handler can save URLs
- Frontend changes depend on API returning new fields

### Estimated Timeline
- Tasks 1.0-2.0: 2-3 hours (infrastructure and core logic)
- Tasks 3.0-4.0: 2-3 hours (integration and database)
- Task 5.0: 2-3 hours (frontend components and styling)
- Task 6.0: 1-2 hours (testing and documentation)
- **Total: 7-11 hours** for complete implementation

### Testing Strategy
- Unit test each image-processor.js function independently
- Integration test the full webhook → R2 → D1 flow
- Manual test frontend with various image scenarios
- Monitor production for 24 hours post-deployment
