# Task List: Comprehensive SEO Audit & Optimization

Generated from: `0002-prd-comprehensive-seo-audit.md`

## Relevant Files

### Existing SEO Infrastructure
- `web/src/lib/seo-metadata.ts` - Current SEO metadata generation functions (needs audit & enhancement)
- `web/src/lib/farm-schema.ts` - Farm LocalBusiness structured data (needs audit for completeness)
- `web/src/lib/breadcrumb-schema.ts` - Breadcrumb structured data generators (needs validation)
- `web/app/layout.tsx` - Root layout with meta tags, resource hints (needs audit)
- `web/scripts/generate-sitemaps.js` - Sitemap generation script (needs validation)
- `web/public/robots.txt` - Robots configuration (needs audit)
- `web/next.config.js` - Next.js configuration affecting SEO (trailing slashes, etc.)

### Page Templates to Audit
- `web/app/page.tsx` - Homepage
- `web/app/farms/[id]/page.tsx` - Farm detail pages
- `web/app/[slug]/page.tsx` - Category/State pages (disambiguation logic)
- `web/app/[slug]/[category]/page.tsx` - State + Category pages
- `web/app/[slug]/near/[location]/page.tsx` - Category + Location pages
- `web/app/farms-near/[cities]/page.tsx` - Location pages
- `web/app/about/page.tsx` - About page
- `web/app/contact/page.tsx` - Contact page
- `web/app/blog/page.tsx` - Blog index
- `web/app/blog/[posts]/page.tsx` - Blog post pages
- `web/app/varieties/[variety]/page.tsx` - Variety pages

### New Files to Create
- `web/src/lib/organization-schema.ts` - Organization & WebSite schema for homepage
- `web/src/lib/item-list-schema.ts` - ItemList/CollectionPage schema for map results
- `web/src/lib/faq-schema.ts` - FAQPage schema generator
- `web/src/lib/seo-audit-utils.ts` - SEO validation & audit helper functions
- `tasks/seo-audit-checklist.md` - Prioritized audit findings checklist (deliverable)
- `tasks/seo-audit-report.md` - Detailed audit report with recommendations

### Component Files
- `web/components/seo/structured-data.tsx` - Reusable structured data component (new)
- `web/components/seo/meta-tags.tsx` - Reusable meta tags component (new)
- `web/components/farm-map-section.tsx` - Map component (add ItemList schema)
- `web/components/faq-section.tsx` - FAQ component (add FAQPage schema)

### Test Files
- `web/src/lib/seo-metadata.test.ts` - Unit tests for metadata generation
- `web/src/lib/farm-schema.test.ts` - Validate farm schema output
- `web/src/lib/organization-schema.test.ts` - Validate organization schema
- `web/scripts/validate-sitemaps.js` - Sitemap validation script

### Notes
- Tests can be run with `npm test` or `npx jest [path/to/test]`
- Schema validation should use Schema.org validator API
- Use Ubersuggest API (if available) or manual audits for scoring
- Priority order: Critical → High → Medium → Low

---

## Tasks

- [ ] **1.0 Setup & Baseline Audit Infrastructure**
- [ ] **2.0 Phase 1: On-Page SEO Audit & Fixes (Critical Priority)**
- [ ] **3.0 Phase 2: Technical SEO Audit & Fixes (High Priority)**
- [ ] **4.0 Phase 3: Mobile SEO & Accessibility Audit (High Priority)**
- [ ] **5.0 Phase 4: Content SEO & Advanced Optimizations (Medium Priority)**

---

I have generated the high-level tasks based on the PRD. These 5 parent tasks align with the audit phases and priority levels outlined in the PRD.

**Ready to generate the sub-tasks?** Respond with **'Go'** to proceed.
