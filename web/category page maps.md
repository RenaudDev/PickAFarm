# Category Pages Implementation Plan

**Goal:** Add interactive maps to category pages (e.g., `/christmas-tree-farms`) showing ONLY farms from that specific category, similar to homepage but category-filtered.

---

## 📊 Current State Analysis

### What Category Pages Have Now:
- ✅ Hero section with search box
- ✅ Top 6 cities with farm counts
- ✅ Featured farms grid (if any)
- ✅ About section
- ✅ FAQ section
- ❌ **NO map visualization**

### Current Data Available:
```typescript
enrichedCategory = {
  name: "Christmas Tree Farms",
  slug: "christmas-tree-farms",
  totalFarms: 156,
  topCities: [...],
  featuredFarms: [...],
  intro: "...",
  faqs: [...]
}
```

### Category Filtering Logic (Already Working):
```typescript
// From CategoryPage component
const matchingCategories = getCategoryVariations(category.name)
// Returns: ['Christmas Tree Farms', 'Christmas Tree', 'Christmas Trees', ...]

// Farms are filtered by:
farmCategories.some(catName => 
  farmCategories.some(farmCat => 
    farmCat.toLowerCase().includes(catName.toLowerCase())
  )
)
```

---

## 🎯 Desired State

### User Experience:
1. User visits `/christmas-tree-farms`
2. Browser requests user's location permission
3. **NEW:** Map shows at top centered on USER'S LOCATION (like homepage)
4. Map displays ONLY Christmas tree farms within radius (no other categories)
5. **H1 Title: "All Christmas Tree Farms Near You"** (location-based)
6. Farms sorted by distance from user
7. User can adjust radius to find farms nearby
8. **NO category filter dropdown** (already filtered)
9. Clicking farm on map shows details
10. Rest of page content remains below map

┌─────────────────────────────────────────────┐
│         Navbar & Breadcrumbs                │
├─────────────────────────────────────────────┤
│                                             │
│ ## 🎯 Key Decisions Made:

| Feature | Category Pages | State Pages | Homepage |
|---------|---------------|-------------|----------|
| **Show Map** | ✅ NEW | ✅ | ✅ |
| **Center Location** | 📍 **USER** | 📍 State center | 📍 **USER** |
| **Radius Filter** | ✅ Keep | ❌ Hide | ✅ |
| **Category Filter** | ❌ Hide | ❌ Hide | ✅ |
| **Show Distances** | ✅ From **USER** | ❌ | ✅ From **USER** |
| **Sort By** | 📏 Distance from **USER** | ⭐ Featured/Rating | 📏 Distance from **USER** |
| **Pre-filtered** | ✅ By category | ✅ By state | ❌ All farms |
| **H1 Title** | "All X **Near You**" | "U-Pick Farms in Ontario" | "All Farms **Near You**" |

### 📍 Location-Based Emphasis:
- **Category Pages** = **USER-CENTRIC** (like homepage)
  - Centers on where YOU are
  - Shows Christmas trees near YOU
  - Sorts by distance from YOU
  
- **State Pages** = **REGION-CENTRIC**
  - Centers on state/province
  - Shows all farms in that region
  - No location permission needed                  │
│                                             │
├─────────────────────────────────────────────┤
│   Hero Section (existing)                   │
│   - Title, intro, search                    │
├─────────────────────────────────────────────┤
│   Top Cities Grid (existing)                │
├─────────────────────────────────────────────┤
│   Featured Farms (existing)                 │
├─────────────────────────────────────────────┤
│   About & FAQs (existing)                   │
└─────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation Plan

### Phase 0: Pre-Implementation Validation ✅

**Goal:** Ensure we have all data and understand current structure

#### Step 0.1: Data Validation
- [x] Confirm farms have `categories` field (string)
- [x] Confirm category matching logic works
- [x] Count farms per category
- [x] Verify all categories have farms

#### Step 0.2: Component Analysis
```bash
# Files to analyze:
✓ /app/[slug]/page.tsx (CategoryPage component)
✓ /components/map-page-layout.tsx (Map component)
✓ /components/category-page-client.tsx (Search box)
✓ /data/farms.json (Farm data)
✓ /data/categories.json (Category metadata)
```

#### Step 0.3: Props Compatibility Check
- [x] MapPageLayout accepts `preFilteredFarms` ✅ (added for state pages)
- [x] MapPageLayout accepts `hideCategoryFilter` ✅ (added for state pages)
- [x] MapPageLayout works with user location ✅ (default behavior)
- [x] MapPageLayout handles distances ✅ (default behavior)

#### Step 0.4: Location-Based Behavior Confirmed
- [x] Map centers on **USER location**, not category center ✅
- [x] Farms sorted by distance from **USER** ✅
- [x] Radius circle shows around **USER** ✅
- [x] Title includes "Near You" ✅
- [x] Falls back gracefully if location denied ✅

**Status:** ✅ All prerequisites met from state pages implementation

---

### Phase 1: Filter Farms by Category

**Goal:** Create reusable function to get category-specific farms

#### Step 1.1: Create Category Filter Utility
**File:** `/src/lib/category-utils.ts` (new file)

```typescript
import farmsData from '../../data/farms.json'

export interface CategoryFarm {
  id: string
  name: string
  slug: string
  city_name: string
  state_province: string
  latitude: number
  longitude: number
  categories: string
  // ... all other farm fields
}

/**
 * Get all farms that match a specific category
 */
export function getFarmsForCategory(categoryName: string): CategoryFarm[] {
  const variations = getCategoryVariations(categoryName)
  
  return farmsData
    .filter(farm => farm.active === 1)
    .filter(farm => {
      if (!farm.categories) return false
      
      const farmCategories = farm.categories
        .split(',')
        .map(c => c.trim().toLowerCase())
      
      return variations.some(variation => 
        farmCategories.some(farmCat => 
          farmCat.includes(variation.toLowerCase())
        )
      )
    })
}

/**
 * Get category name variations for flexible matching
 */
function getCategoryVariations(categoryName: string): string[] {
  const variations = [categoryName]
  
  if (categoryName.includes('Christmas Tree')) {
    variations.push('Christmas Tree', 'Christmas Trees', 'Christmas Tree Farms')
  }
  if (categoryName.includes('Apple')) {
    variations.push('Apple', 'Apple Orchard', 'Apple Picking', 'Apple Orchards')
  }
  if (categoryName.includes('Pumpkin')) {
    variations.push('Pumpkin', 'Pumpkin Patch', 'Pumpkin Patches')
  }
  if (categoryName.includes('Berry')) {
    variations.push('Berry', 'Berry Farm', 'Berry Picking', 'Berry Farms')
  }
  // Add more as needed
  
  return variations
}
```

#### Step 1.2: Test Category Filtering
```javascript
// Test script: scripts/validate-category-farms.js
const { getFarmsForCategory } = require('../src/lib/category-utils')

console.log('🧪 Testing category farm filtering...\n')

const testCategories = [
  'Christmas Tree Farms',
  'Apple Orchards', 
  'Pumpkin Patches',
  'Berry Farms'
]

testCategories.forEach(category => {
  const farms = getFarmsForCategory(category)
  console.log(`${category}: ${farms.length} farms`)
  
  if (farms.length > 0) {
    console.log(`  Sample: ${farms[0].name} (${farms[0].categories})`)
  }
})
```

**Validation Criteria:**
- ✅ Christmas Tree Farms should return ~100+ farms
- ✅ No duplicate farms
- ✅ All returned farms actually have matching category
- ✅ Featured/verified flags preserved

---

### Phase 2: Create Category Map Section Component

**Goal:** Reusable component for category page maps

#### Step 2.1: Create CategoryMapSection Component
**File:** `/src/components/category-map-section.tsx` (new file)

```typescript
"use client"

import { useState, useEffect } from "react"
import { MapPageLayout } from "./map-page-layout"
import { getUserLocation, type UserLocation } from "@/lib/location-utils"
import { getFarmsForCategory } from "@/lib/category-utils"

interface CategoryMapSectionProps {
  categoryName: string
  categorySlug: string
}

export function CategoryMapSection({ 
  categoryName, 
  categorySlug 
}: CategoryMapSectionProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  
  // Get farms for this category
  const categoryFarms = getFarmsForCategory(categoryName)
  
  // Detect user location on mount
  useEffect(() => {
    async function loadLocation() {
      try {
        const location = await getUserLocation("")
        if (location && location.latitude && location.longitude) {
          setUserLocation(location)
        } else {
          setLocationError("Unable to detect your location")
        }
      } catch (error) {
        console.error('Failed to load location:', error)
        setLocationError("Unable to detect your location")
      } finally {
        setIsLoadingLocation(false)
      }
    }
    loadLocation()
  }, [])

  return (
    <MapPageLayout
      centerLocation={userLocation} // CENTER ON USER, not category
      isLoadingLocation={isLoadingLocation}
      locationError={locationError}
      pageTitle={`All ${categoryName} Near You`} // "All X Near You"
      showUserMarker={true} // Show user's location marker
      showCityMarker={false}
      showRadiusControl={true} // Keep radius slider
      showRadiusCircle={true} // Show radius circle around user
      showDistances={true} // Show "5km away" etc
      filterByRadius={true} // Filter by distance from user
      sortBy="distance" // Sort by distance from user
      hideCategoryFilter={true} // KEY: Hide category filter (already filtered)
      initialZoom={undefined} // Use default zoom based on user location
      preFilteredFarms={categoryFarms as any} // Pass category-filtered farms
    />
  )
}
```

#### Step 2.2: Update CategoryPage to Include Map
**File:** `/app/[slug]/page.tsx`

```typescript
// Add import
import { CategoryMapSection } from "@/components/category-map-section"

// In CategoryPage component, add map BEFORE hero section:
function CategoryPage({ category, slug }: { category: any; slug: string }) {
  // ... existing code ...
  
  return (
    <div className="min-h-screen bg-background">
      <FarmNavbar />
      <div className="bg-muted/20 border-b">
        {/* Breadcrumbs */}
      </div>
      
      {/* NEW: Category Map Section */}
      <CategoryMapSection 
        categoryName={enrichedCategory.name}
        categorySlug={slug}
      />
      
      {/* Existing: Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16 px-4">
        {/* ... existing hero content ... */}
      </section>
      
      {/* ... rest of existing content ... */}
    </div>
  )
}
```

---

### Phase 3: MapPageLayout Enhancements (Already Done! ✅)

**Status:** Already completed during state pages implementation

**Existing Props Used:**
- ✅ `preFilteredFarms` - Pass category-specific farms
- ✅ `hideCategoryFilter` - Hide category dropdown
- ✅ `showRadiusControl` - Keep radius slider
- ✅ `showDistances` - Show "Xkm away"
- ✅ `filterByRadius` - Keep radius filtering
- ✅ `sortBy` - Sort by distance

**No Changes Needed!** 🎉

---

### Phase 4: Styling & UX Polish

#### Step 4.1: Adjust Hero Section Spacing
```typescript
// Since map is now above hero, adjust spacing:
<section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12 px-4">
  {/* Reduced py-16 to py-12 to avoid too much spacing */}
```

#### Step 4.2: Optional: Add Map Toggle
```typescript
// Allow users to hide/show map if they prefer list view
const [showMap, setShowMap] = useState(true)

{showMap && <CategoryMapSection ... />}

<Button onClick={() => setShowMap(!showMap)}>
  {showMap ? 'Hide Map' : 'Show Map'}
</Button>
```

---

## 🧪 Testing Strategy

### Test Cases for Christmas Tree Farms Page

#### Test 1: Farm Count Accuracy
```
Given: User visits /christmas-tree-farms
When: Map loads
Then: 
  - Map shows ONLY Christmas tree farms
  - Count matches data/categories.json count
  - No apple orchards or pumpkin patches visible
```

#### Test 2: Category Filter Hidden
```
Given: User opens map filters panel
Then: 
  - Radius slider IS visible ✅
  - Category dropdown is HIDDEN ✅
  - "Re-center on me" button visible (if applicable)
```

#### Test 3: User Location Detection
```
Given: User grants location permission
When: Map loads
Then:
  - Map centers on user location
  - Shows user marker
  - Shows radius circle
  - Farms sorted by distance
```

#### Test 4: Radius Filtering
```
Given: User changes radius from 100km to 50km
Then:
  - Map updates to show fewer farms
  - Only farms within 50km visible
  - Farm list updates accordingly
```

#### Test 5: No Breaking Changes
```
Test ALL category pages:
  ✓ /christmas-tree-farms
  ✓ /apple-orchards
  ✓ /pumpkin-patches
  ✓ /berry-farms
  ✓ /corn-mazes
  ✓ ... (all categories)

Verify:
  - Map shows
  - Correct farms only
  - Hero section still visible
  - Cities grid still visible
  - Featured farms still visible
  - FAQs still visible
```

#### Test 6: Mobile Responsiveness
```
Given: User on mobile device
Then:
  - Map is full width
  - Controls are touch-friendly
  - Map doesn't block content
  - Scrolling works smoothly
```

#### Test 7: Performance
```
Measure:
  - Time to load map: < 2 seconds
  - Time to filter farms: < 100ms
  - Smooth marker rendering (no lag)
  - Memory usage acceptable
```

---

## ⚠️ Risk Assessment & Mitigation

### Risk 1: Breaking Existing Category Pages
**Severity:** HIGH  
**Likelihood:** MEDIUM

**Mitigation:**
- ✅ All new components are additive (no deletions)
- ✅ Use feature flag for gradual rollout
- ✅ Test all category pages individually
- ✅ Add `showMap` prop to disable if needed

**Rollback Plan:**
```typescript
// In CategoryPage component:
const ENABLE_CATEGORY_MAPS = process.env.NEXT_PUBLIC_ENABLE_CATEGORY_MAPS === 'true'

{ENABLE_CATEGORY_MAPS && <CategoryMapSection ... />}
```

### Risk 2: Incorrect Farm Filtering
**Severity:** HIGH  
**Likelihood:** LOW

**Mitigation:**
- ✅ Reuse existing category matching logic
- ✅ Add validation script
- ✅ Manual spot checks
- ✅ Log farm counts during build

**Detection:**
```javascript
// In build script, add validation:
categories.forEach(cat => {
  const farms = getFarmsForCategory(cat.name)
  if (farms.length !== cat.totalFarms) {
    console.warn(`⚠️  Mismatch for ${cat.name}: Expected ${cat.totalFarms}, got ${farms.length}`)
  }
})
```

### Risk 3: Performance Degradation
**Severity:** MEDIUM  
**Likelihood:** LOW

**Mitigation:**
- ✅ Client-side filtering (fast)
- ✅ Prefiltered farms passed to map (no runtime filtering)
- ✅ Use existing map optimization (clustering for large datasets)
- ✅ Lazy load map component

**Monitoring:**
```javascript
// Add performance tracking:
const startTime = performance.now()
const categoryFarms = getFarmsForCategory(categoryName)
const duration = performance.now() - startTime
console.log(`Category filtering took ${duration}ms`)
```

### Risk 4: Category Name Variations Not Matched
**Severity:** MEDIUM  
**Likelihood:** MEDIUM

**Example Issue:**
- Farm has `categories: "Christmas Trees"` (no "Farm" word)
- Filter looks for "Christmas Tree Farms"
- Farm not matched ❌

**Mitigation:**
- ✅ Use flexible substring matching
- ✅ Add comprehensive variations list
- ✅ Log unmatched categories during build
- ✅ Manual review of variations

### Risk 5: User Location Permission Denied
**Severity:** LOW  
**Likelihood:** HIGH

**Mitigation:**
- ✅ Already handled in getUserLocation()
- ✅ Falls back to default location
- ✅ Shows error message
- ✅ User can still browse all farms

---

## 📋 Implementation Checklist

### Phase 0: Pre-Implementation ✅
- [ ] Read and understand current category page code
- [ ] Verify MapPageLayout props compatibility
- [ ] Check farm data structure
- [ ] Validate category matching logic

### Phase 1: Category Filtering
- [ ] Create `/src/lib/category-utils.ts`
- [ ] Implement `getFarmsForCategory()`
- [ ] Implement `getCategoryVariations()`
- [ ] Create validation script
- [ ] Run validation for all categories
- [ ] Fix any category matching issues

### Phase 2: Map Component
- [ ] Create `/src/components/category-map-section.tsx`
- [ ] Add user location detection
- [ ] Pass filtered farms to MapPageLayout
- [ ] Test component in isolation

### Phase 3: Integrate with Category Page
- [ ] Update `/app/[slug]/page.tsx`
- [ ] Import CategoryMapSection
- [ ] Add map above hero section
- [ ] Test on one category (christmas-tree-farms)
- [ ] Verify no breaking changes

### Phase 4: Testing & Polish
- [ ] Test all 7 test cases
- [ ] Test on mobile devices
- [ ] Adjust spacing/styling
- [ ] Performance testing
- [ ] Cross-browser testing

### Phase 5: Rollout
- [ ] Deploy to staging
- [ ] QA testing on staging
- [ ] Monitor performance metrics
- [ ] Deploy to production
- [ ] Monitor error logs

---

## 🎯 Success Criteria

### Must Have:
- ✅ Map shows on ALL category pages
- ✅ Map shows ONLY farms from that category
- ✅ Category filter dropdown is hidden
- ✅ Radius controls work
- ✅ Distance calculations work
- ✅ No existing functionality broken
- ✅ Mobile responsive

### Nice to Have:
- ⭐ Map toggle (show/hide)
- ⭐ Remember user's last radius preference
- ⭐ Smooth animations
- ⭐ Loading skeleton for map

### Performance Targets:
- Map load time: < 2 seconds
- Farm filtering: < 100ms
- Page render: < 3 seconds
- Lighthouse score: > 90

---

## 🚀 Estimated Timeline

- **Phase 0:** 30 minutes (analysis)
- **Phase 1:** 1 hour (category filtering utility)
- **Phase 2:** 1 hour (map component)
- **Phase 3:** 30 minutes (integration)
- **Phase 4:** 1 hour (testing & polish)
- **Phase 5:** 30 minutes (deployment)

**Total:** ~4.5 hours

---

## 📊 Expected Impact

### User Benefits:
- 🗺️ Visual map for easier farm discovery
- 📍 Distance-based search
- 🎯 Focused results (category-specific)
- 📱 Better mobile experience

### Business Benefits:
- 📈 Increased engagement (map interaction)
- 🔍 Better SEO (more time on page)
- ✅ Feature parity with homepage
- 🎄 Especially valuable for Christmas tree season

### SEO Benefits:
- ⏱️ Increased time on page
- 📊 Lower bounce rate
- 🔗 More internal navigation
- ✨ Enhanced user signals

---

## 🔄 Backward Compatibility Guarantee

### What Stays the Same:
- ✅ All existing category page content
- ✅ Hero section unchanged
- ✅ Cities grid unchanged
- ✅ Featured farms unchanged
- ✅ FAQs unchanged
- ✅ URLs unchanged
- ✅ SEO metadata unchanged
- ✅ Breadcrumbs unchanged

### What's Added:
- ➕ Interactive map at top
- ➕ Visual farm locations
- ➕ Distance-based sorting

### What's NEVER Removed:
- ❌ No content deletion
- ❌ No URL changes
- ❌ No metadata changes
- ❌ No breaking changes

**Migration Path:** ZERO migration needed! All additive changes.

---

## 🎉 Summary

**What We're Building:**
Add interactive maps to category pages (like homepage) showing only category-specific farms, with radius controls but no category filter dropdown.

**Why It's Safe:**
- Reuses existing MapPageLayout (battle-tested)
- All changes are additive (no deletions)
- Feature flag for gradual rollout
- Comprehensive testing strategy

**Why It's Valuable:**
- Better user experience
- Visual farm discovery
- Consistent with homepage
- Especially valuable for Christmas season

**Ready to implement!** 🚀
