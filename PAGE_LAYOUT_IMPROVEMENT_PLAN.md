# Page Layout Improvement Plan - State & State+Category Pages

## Current Issues

### State Pages (`/pennsylvania/`)
1. **Layout flow**: Map → Title/Subtitle → Cities → Categories → About
2. **Problems**:
   - Title appears AFTER the map but MapPageLayout already has farm list sidebar
   - Creates awkward vertical flow: map with sidebar, then title, then more content
   - The title should be integrated into the page flow, not floating between sections
   - Map takes full width but then content narrows - inconsistent width

### State+Category Pages (`/pennsylvania/christmas-tree-farms/`)
1. **Layout flow**: Map → Title/Subtitle → Cities
2. **Problems**:
   - Same issue: title appears after map with sidebar already visible
   - The `headerContent` prop renders content OUTSIDE the map container
   - Creates visual disconnect between map and content sections
   - Cities section is the only content, feels empty

## Root Cause Analysis

The `MapPageLayout` component is designed to be a full-page map experience with:
- Left side: Map (3/4 width on desktop)
- Right side: Farm list sidebar (1/4 width on desktop)

The `headerContent` prop renders content AFTER this entire map+sidebar container, which creates:
- A full-width section after a 3/4 width map
- Visual disconnect between map and content
- No clear page hierarchy

## Proposed Solution

### Option 1: Remove headerContent, Add Content Sections Properly (RECOMMENDED)

**For State Pages (`/pennsylvania/`)**:
```
Structure:
1. Navbar
2. Hero Section (full width, above map)
   - H1: "U-Pick Farms in Pennsylvania"
   - Subtitle: "Discover X farms..."
3. Map + Sidebar (MapPageLayout without headerContent)
4. Popular Cities Section
5. Farm Types/Categories Section
6. About Section
7. Footer
```

**For State+Category Pages (`/pennsylvania/christmas-tree-farms/`)**:
```
Structure:
1. Navbar
2. Hero Section (full width, above map)
   - H1: "Christmas Tree Farms in Pennsylvania"
   - Subtitle: "Discover X farms..."
3. Map + Sidebar (MapPageLayout without headerContent)
4. Popular Cities Section
5. About Section (specific to category+state)
6. Footer
```

### Option 2: Integrate Title Into Map Section

Add a title overlay or header INSIDE the MapPageLayout component:
- Add a banner/header above the map but inside the same container
- Keep visual consistency
- More complex implementation

### Option 3: Full-Width Map, Content Below

Change MapPageLayout to:
- Make map truly full-width (no sidebar)
- Move farm list below map
- Add content sections naturally in flow

## Recommended Changes

### Immediate Fixes (Option 1)

1. **State Pages** - `web/app/[slug]/page.tsx`
   - Move H2 section ABOVE StateMapSection
   - Change H2 to H1 (only H1 on page)
   - Keep existing sections below map (cities, categories, about)

2. **State+Category Pages** - `web/app/[slug]/[category]/page.tsx`
   - Remove `headerContent` prop from MapPageLayout
   - Add hero section ABOVE StateCategoryMapSection with H1
   - Keep cities section below map
   - Add "About {category} in {state}" section with SEO content

3. **MapPageLayout** - Clean up
   - Remove `headerContent` prop (no longer needed)
   - Keep focused as map+sidebar component only

### Content Structure for State+Category Pages

Add comprehensive content sections:
```
1. Hero (above map)
   - H1: "{Category} in {State}"
   - Subtitle with farm count

2. Map + Sidebar
   - Interactive map with farms
   - Scrollable farm list

3. Popular Cities
   - Grid of clickable city cards

4. About {Category} in {State}
   - SEO-rich paragraph about the category in this state
   - Why visit, what to expect, seasonal info

5. Tips & Information (optional)
   - Best time to visit
   - What to bring
   - Family-friendly activities
```

## Implementation Steps

1. **Fix State Pages H1 hierarchy**
   - Move hero section above map
   - Change H2 → H1
   - Ensure proper semantic structure

2. **Fix State+Category Pages layout**
   - Remove headerContent prop usage
   - Add hero section above map with H1
   - Add "About" section below cities for SEO

3. **Remove headerContent prop**
   - Clean up MapPageLayout interface
   - Remove prop from component signature
   - Remove rendering logic

4. **Test responsiveness**
   - Mobile: ensure hero → map → content flows well
   - Desktop: ensure sections have proper spacing
   - Verify no layout shifts

## SEO Considerations

- Each page should have exactly ONE H1 at the top
- H1 should be visible above the fold (before map)
- Content sections provide internal linking opportunities
- About sections provide keyword-rich content for crawlers

## Visual Consistency

- All sections should have consistent max-width containers
- Alternating background colors (white/muted) for visual separation
- Consistent padding (py-16 for sections, py-12 for hero)
- Center-aligned headings with left-aligned body text where appropriate
