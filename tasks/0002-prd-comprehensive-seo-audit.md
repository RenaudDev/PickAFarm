# PRD: Comprehensive SEO Audit & Optimization

## Introduction/Overview

This document outlines a comprehensive SEO audit for PickAFarm, a farm directory web application. The goal is to achieve 100% SEO scores across all aspects of the platform (excluding PageSpeed/Performance metrics) to maximize organic search visibility and discoverability for farm listings. The audit will cover technical SEO, on-page optimization, structured data, content quality, mobile SEO, accessibility, and local SEO aspects across all public-facing pages.

## Goals

1. **Achieve 100% Ubersuggest SEO Score** across all audited page templates
2. **Pass all Schema.org validation** with zero errors or warnings
3. **Eliminate all SEO-related issues** in Google Search Console (indexing, crawlability, structured data)
4. **Optimize content for search intent** with proper keyword usage, readability, and structure
5. **Ensure complete mobile SEO compliance** for all page types
6. **Meet accessibility standards** that impact SEO (semantic HTML, ARIA labels, screen readers)
7. **Maximize local SEO signals** for farm discovery by location

## User Stories

1. **As a farm owner**, I want my farm listing to rank highly in Google search results so that more customers can discover my business organically.

2. **As a website visitor**, I want to find the site easily through Google search when looking for farms near me, so I can discover local farm options quickly.

3. **As a search engine crawler**, I need properly structured data, clear site architecture, and valid markup so I can accurately index and rank the website's content.

4. **As a Google Search user**, I want to see rich snippets with farm details (ratings, location, hours) in search results, so I can make informed decisions before visiting the site.

5. **As a mobile user**, I need a fully SEO-optimized mobile experience so farm listings appear in mobile search results when I search on my phone.

6. **As a content manager**, I want clear SEO guidelines for each page type so I can maintain optimal search performance over time.

## Functional Requirements

### Phase 1: On-Page SEO Audit (Priority: Rank 1)

1. **Meta Tags Audit**
   - 1.1. Verify every page has unique, descriptive `<title>` tags (50-60 characters optimal)
   - 1.2. Ensure all pages have unique meta descriptions (150-160 characters)
   - 1.3. Validate Open Graph tags (og:title, og:description, og:image, og:url) on all pages
   - 1.4. Validate Twitter Card tags (twitter:card, twitter:title, twitter:description, twitter:image)
   - 1.5. Check for proper canonical tags on all pages (especially location/category variations)
   - 1.6. Verify meta robots tags are correctly configured (noindex for appropriate pages only)

2. **Structured Data Audit**
   - 2.1. Validate existing farm schema (LocalBusiness/Place) on farm detail pages using Schema.org validator
   - 2.2. Add/validate BreadcrumbList schema on all pages with breadcrumb navigation
   - 2.3. Implement/validate Organization schema on homepage
   - 2.4. Implement/validate WebSite schema with SearchAction on homepage
   - 2.5. Validate FAQPage schema if FAQ sections exist
   - 2.6. **Implement ItemList/CollectionPage schema** for map results pages showing list of farms
   - 2.7. Ensure all structured data passes Google Rich Results Test and Schema.org validator
   - 2.8. Add Review/Rating schema if farm reviews are available

3. **Heading Structure Audit**
   - 3.1. Verify single H1 tag per page with primary keyword
   - 3.2. Ensure logical heading hierarchy (H1 → H2 → H3) without skipping levels
   - 3.3. Validate headings contain relevant keywords without over-optimization

4. **Content Optimization Audit**
   - 4.1. Analyze keyword usage and density on all page types
   - 4.2. Evaluate content length adequacy (minimum thresholds for different page types)
   - 4.3. Assess content readability scores (Flesch Reading Ease, Grade Level)
   - 4.4. Identify thin content pages requiring expansion
   - 4.5. Check for keyword cannibalization across similar pages

### Phase 2: Technical SEO Audit (Priority: Rank 2)

5. **Crawlability & Indexability**
   - 5.1. Audit robots.txt file for proper allow/disallow directives
   - 5.2. Verify XML sitemaps are generated, valid, and submitted to Google Search Console
   - 5.3. Check sitemap includes all public pages and excludes authenticated pages
   - 5.4. Validate all internal links are functioning (no 404s, 500s, or redirect chains)
   - 5.5. Ensure no orphaned pages (pages without internal links pointing to them)
   - 5.6. Verify proper use of nofollow/noindex where appropriate

6. **URL Structure & Redirects**
   - 6.1. Validate clean, descriptive URLs following RESTful patterns
   - 6.2. Ensure trailing slash consistency across all routes
   - 6.3. Check for redirect chains (should be max 1 redirect)
   - 6.4. Verify 301 redirects for any URL changes or removed pages
   - 6.5. Ensure HTTPS is enforced site-wide

7. **HTML Validation**
   - 7.1. Run W3C HTML validator on all page templates
   - 7.2. Fix any critical HTML errors that impact SEO
   - 7.3. Validate proper DOCTYPE declarations

### Phase 3: Mobile SEO Audit (Priority: Rank 3)

8. **Mobile-Friendliness**
   - 8.1. Run Google Mobile-Friendly Test on all page types
   - 8.2. Verify responsive design works correctly across viewport sizes
   - 8.3. Check tap target sizes meet minimum standards (48x48px)
   - 8.4. Ensure no horizontal scrolling on mobile devices
   - 8.5. Validate viewport meta tag is properly configured
   - 8.6. Test mobile UX for farm discovery flow (search → results → detail page)

### Phase 4: Accessibility SEO Audit (Priority: Rank 4)

9. **Semantic HTML & ARIA**
   - 9.1. Audit semantic HTML5 elements (header, nav, main, article, section, footer)
   - 9.2. Validate ARIA labels on interactive elements (buttons, links, forms)
   - 9.3. Ensure all images have descriptive alt text
   - 9.4. Check color contrast ratios meet WCAG AA standards
   - 9.5. Verify keyboard navigation works for all interactive elements
   - 9.6. Test with screen readers (NVDA, JAWS, or VoiceOver)
   - 9.7. Ensure skip navigation links exist for main content

### Phase 5: Content SEO Audit (Priority: Rank 5)

10. **Internal Linking Strategy**
    - 10.1. Audit internal link structure for optimal link equity distribution
    - 10.2. Ensure proper anchor text usage (descriptive, keyword-rich when natural)
    - 10.3. Identify opportunities for contextual internal links
    - 10.4. Verify breadcrumb navigation exists and is functional

11. **Content Quality & Keyword Optimization**
    - 11.1. Perform keyword research for primary page types (homepage, categories, locations)
    - 11.2. Optimize page content for target keywords without keyword stuffing
    - 11.3. Ensure primary keywords appear in title, H1, first 100 words, and URL
    - 11.4. Add LSI (Latent Semantic Indexing) keywords naturally throughout content
    - 11.5. Evaluate content uniqueness (no duplicate content issues)

### Phase 6: Off-Page/Link SEO Analysis (Priority: Rank 6)

12. **Backlink Profile Analysis**
    - 12.1. Audit existing backlinks using Ubersuggest or similar tool
    - 12.2. Identify toxic or spammy backlinks for disavowal
    - 12.3. Document high-authority linking opportunities for outreach
    - 12.4. Analyze competitor backlink profiles for insights

### Phase 7: Local SEO Audit (Priority: Rank 7)

13. **Farm Location Optimization**
    - 13.1. Verify farm address schema markup includes complete NAP (Name, Address, Phone)
    - 13.2. Ensure location pages target geo-specific keywords (e.g., "farms near Albany NY")
    - 13.3. Validate city/state name consistency across all pages
    - 13.4. Optimize for "near me" search queries with location detection
    - 13.5. Document Google Business Profile integration opportunities for farms
    - 13.6. Audit geo-targeted meta descriptions and titles

### Phase 8: Page-Specific Audits

14. **Homepage Audit** (/)
    - 14.1. Optimize for primary branded keyword "PickAFarm"
    - 14.2. Ensure clear value proposition in first 100 words
    - 14.3. Validate Organization and WebSite schema
    - 14.4. Check prominent internal links to key category/location pages

15. **Farm Detail Pages Audit** (/farms/[id]/)
    - 15.1. Validate LocalBusiness/Place schema with complete farm data
    - 15.2. Ensure unique meta descriptions per farm
    - 15.3. Optimize farm names in title tags with location modifier
    - 15.4. Verify image alt tags describe farm photos
    - 15.5. Check for adequate content length (farm description)

16. **Category Pages Audit** (/[slug]/)
    - 16.1. Optimize titles for category keywords (e.g., "Christmas Tree Farms")
    - 16.2. Ensure unique, descriptive content for each category
    - 16.3. Validate BreadcrumbList schema
    - 16.4. Add FAQ schema if applicable
    - 16.5. Check internal links to state and location pages

17. **State Pages Audit** (/[state]/)
    - 17.1. Optimize for geo-targeted keywords (e.g., "Farms in Wisconsin")
    - 17.2. Ensure unique content per state with local context
    - 17.3. Validate city links and farm counts are accurate
    - 17.4. Add state-specific structured data if applicable

18. **Location Pages Audit** (/farms-near/[location]/)
    - 18.1. Optimize for "farms near [city]" keywords
    - 18.2. Ensure location slug format is SEO-friendly
    - 18.3. Validate geo-coordinates in structured data
    - 18.4. Check radius-based farm filtering is reflected in content

19. **Combined Pages Audit** (/[slug]/near/[location]/, /[state]/[category]/)
    - 19.1. Optimize for long-tail keywords (e.g., "apple orchards near Albany NY")
    - 19.2. Ensure canonical tags prevent duplicate content issues
    - 19.3. Validate combined schema (category + location context)
    - 19.4. Check breadcrumb navigation reflects page hierarchy

20. **Map Results Pages Audit**
    - 20.1. **Implement ItemList or CollectionPage schema** for farm listings in map views
    - 20.2. Ensure each farm in list has proper structured data
    - 20.3. Validate pagination schema if results are paginated
    - 20.4. Optimize meta tags for map search intent

21. **Static Pages Audit** (About, Contact, Blog)
    - 21.1. Ensure unique, keyword-optimized content
    - 21.2. Validate contact page has proper schema (ContactPage)
    - 21.3. Check blog posts have proper Article schema if applicable

## Non-Goals (Out of Scope)

1. **PageSpeed Optimization** - Performance metrics (LCP, FID, CLS) and Core Web Vitals improvements are excluded
2. **JavaScript Bundle Size Reduction** - Code splitting and optimization for load speed
3. **Image Optimization for Speed** - Compression, lazy loading, or format optimization for performance
4. **Server Response Time Optimization** - CDN configuration, caching strategies
5. **Authenticated Page SEO** - Dashboard, Profile, and Saved Farms pages (should be noindexed)
6. **Paid Search/SEM Strategy** - Google Ads, PPC campaigns
7. **Social Media Marketing** - Social media content strategy beyond Open Graph tags
8. **Email Marketing SEO** - Newsletter optimization or email campaigns
9. **Video SEO** - If videos exist, optimization is out of scope for this phase
10. **International SEO** - Hreflang tags, multi-language support (currently US/Canada only)

## Design Considerations

- **Ubersuggest Dashboard**: Use Ubersuggest.com site audit tool as primary SEO scoring reference
- **Schema.org Validator**: All structured data must pass validation at https://validator.schema.org/
- **Google Search Console**: Reference GSC data for indexing status and existing issues (though none currently known)
- **Audit Documentation**: Create spreadsheet or markdown checklist for tracking issues by page type and priority

## Technical Considerations

1. **Static Site Architecture**: PickAFarm uses Next.js 15 static export; ensure all SEO optimizations work with pre-rendered HTML
2. **Build-Time Data Generation**: SEO-critical data (sitemaps, structured data) must be generated during `npm run prebuild`
3. **Trailing Slash Convention**: All routes must maintain trailing slash consistency per `next.config.js`
4. **Structured Data Integration**: Existing farm schema generation in `web/lib/farm-schema.ts` should be audited and extended
5. **Sitemap Generation**: Current sitemap generation in `web/scripts/generate-sitemaps.js` should be validated
6. **Canonical URL Management**: Ensure canonical tags handle location/category permutations correctly
7. **Meta Tag Components**: Likely using Next.js `<Head>` or `metadata` API; audit consistency across page templates
8. **Image Alt Tags**: Farm images (logo, background) should have descriptive alt attributes
9. **Robots.txt**: Validate `public/robots.txt` configuration for optimal crawling

## Success Metrics

1. **Ubersuggest SEO Score**: Achieve 100/100 on all audited page types
2. **Schema Validation**: Zero errors/warnings on Schema.org validator for all structured data types
3. **Google Search Console**: Zero indexing errors, zero coverage issues, zero structured data errors
4. **Organic Traffic Growth**: Track 30-day, 90-day organic traffic increase post-implementation (baseline vs. post-fix)
5. **Search Rankings**: Monitor keyword ranking improvements for target terms (e.g., "farms near me", "apple orchards Wisconsin")
6. **Rich Results Eligibility**: Increase in pages eligible for rich snippets in Google Search
7. **Mobile Usability**: Zero mobile usability issues in Google Search Console
8. **Accessibility Score**: WAVE or axe DevTools report shows zero critical accessibility errors

## Open Questions

1. **Current Structured Data**: Does the existing `farm-schema.ts` implementation include all recommended LocalBusiness properties (priceRange, openingHours, acceptsReservations, etc.)?
2. **Duplicate Content Strategy**: Are there existing canonical tags on combined pages (e.g., `/apple-orchards/near/albany-ny-us/` vs `/new-york/apple-orchards/`)?
3. **URL Parameters**: Are there any query parameters (e.g., `?category=apples`) that need canonical handling?
4. **Farm Content Length**: Do farm detail pages have sufficient descriptive content, or is most content limited to structured data fields?
5. **Blog/Content Marketing**: Is there an active blog section? If so, what's the content volume and quality?
6. **Historical SEO Data**: Are there Google Analytics or Search Console historical reports showing traffic trends?
7. **Competitor Analysis**: Have any competitor farm directory sites been analyzed for SEO best practices?
8. **Farm Owner Submissions**: Can farm owners edit their own listings? If so, are there SEO guidelines for them?
9. **Review/Rating System**: Is there a plan to add user reviews? This would significantly impact structured data and rich snippets.
10. **Geographic Coverage**: Are there specific regions/states that are prioritized for SEO optimization?

## Implementation Timeline

### Critical Priority (Weeks 1-2)
- Complete on-page SEO audit (meta tags, structured data, headings)
- Fix Schema.org validation errors
- Implement ItemList/CollectionPage schema for map results
- Optimize homepage and top 10 farm detail pages

### High Priority (Weeks 3-4)
- Complete technical SEO audit (crawlability, sitemaps, robots.txt)
- Audit and fix all page template types (categories, states, locations)
- Mobile SEO audit and fixes
- Content optimization for primary landing pages

### Medium Priority (Months 2-3)
- Accessibility audit and fixes
- Content SEO improvements (internal linking, keyword optimization)
- Local SEO enhancements
- Backlink profile analysis

### Low Priority (Ongoing)
- Continuous monitoring of Google Search Console
- Quarterly SEO audits to maintain 100% scores
- Off-page SEO and link building outreach
- Regular content updates for keyword targeting

## Deliverable Format

**Prioritized SEO Audit Checklist** structured as follows:

### Critical Priority Items
- Issue description
- Page(s) affected
- SEO impact (high/medium/low)
- Recommended fix
- Status (pending/in progress/completed)

### Medium Priority Items
- (Same structure as above)

### Low Priority Items
- (Same structure as above)

**Example Entry:**
```
Priority: Critical
Issue: Missing ItemList schema on map results pages
Pages Affected: All /map/* routes, filtered category/location pages with farm lists
SEO Impact: High - Missing rich results opportunity for farm listings
Recommended Fix: Implement ItemList schema in map-page-layout.tsx with farm data
Status: Pending
```

---

**Next Steps:**
1. Review and approve this PRD
2. Begin Phase 1 audit using Ubersuggest and Schema.org validator
3. Document findings in prioritized checklist format
4. Schedule implementation sprints based on priority tiers
