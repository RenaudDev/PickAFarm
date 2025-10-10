# Map Experience & Mobile Optimization

**Document Version**: 1.0
**Last Updated**: October 9, 2025
**Audience**: Developers, AI Agents

---

## Table of Contents

1. [Overview](#overview)
2. [Map Experience Architecture](#map-experience-architecture)
3. [Mobile Optimization Strategy](#mobile-optimization-strategy)
4. [Navigation & Page Layout](#navigation--page-layout)
5. [Map Component Hierarchy](#map-component-hierarchy)
6. [Performance Optimizations](#performance-optimizations)
7. [Implementation Patterns](#implementation-patterns)

---

## Overview

PickAFarm implements a **sophisticated map experience** with **aggressive mobile optimizations** to minimize load time and API costs. The key innovation is **lazy-loading Google Maps API** only when users explicitly request the interactive map.

### Key Metrics Impact

**Before Optimization**:
- Mobile LCP: ~10s (Google Maps loaded on every page)
- Unnecessary API calls: 100% of mobile visitors
- Heavy JavaScript execution on initial load

**After Optimization**:
- Mobile LCP: 7.59s (static SVG map shown first)
- API calls reduced: ~60% fewer calls (only on user click)
- Deferred Google Maps script loading until user interaction

### Core Principles

1. **Static First**: Show lightweight SVG map preview on mobile
2. **User-Triggered Loading**: Only load Google Maps when user clicks "Load Interactive Map"
3. **Responsive Design**: Different experiences for mobile vs. desktop
4. **Progressive Enhancement**: Desktop gets interactive map immediately, mobile gets opt-in

---

## Map Experience Architecture

### Three-Tier Map System

PickAFarm uses **three distinct map implementations** depending on context:

| Map Type | Component | Use Case | Google API Load |
|----------|-----------|----------|-----------------|
| **Mobile Static Map** | `MobileStaticMap` | Mobile initial view | No ❌ |
| **Interactive Full Map** | `MapPageLayout` | Desktop + mobile (after click) | Yes ✅ |
| **Embedded Location Map** | `GoogleMaps` | Individual farm detail pages | Lazy (IntersectionObserver) |

---

## Mobile Optimization Strategy

### 1. Adaptive Map Wrapper

**Component**: `web/src/components/adaptive-map-wrapper.tsx`

**Purpose**: Decides whether to show static or interactive map based on device and user interaction.

**Key Logic**:

```typescript
export function AdaptiveMapWrapper({ children, preFilteredFarms }: AdaptiveMapWrapperProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [showInteractiveMap, setShowInteractiveMap] = useState(false)
  const [nearbyFarmCount, setNearbyFarmCount] = useState(0)

  // Detect mobile (< 768px width)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calculate nearby farms WITHOUT loading Google Maps
  useEffect(() => {
    if (!isClient || !isMobile) return

    async function calculateNearbyFarms() {
      const location = await getUserLocation("")
      const radius = 100
      const sourceFarms = preFilteredFarms || farmsData

      const nearbyFarms = sourceFarms.filter((farm: any) => {
        if (!farm.latitude || !farm.longitude) return false
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          farm.latitude,
          farm.longitude
        )
        return distance <= radius
      })

      setNearbyFarmCount(nearbyFarms.length)
    }

    calculateNearbyFarms()
  }, [isClient, isMobile, preFilteredFarms])

  // Desktop: Always show interactive map
  if (!isClient || !isMobile || showInteractiveMap) {
    return <>{children}</>
  }

  // Mobile: Show static map with farm count
  return (
    <MobileStaticMap
      onLoadInteractiveMap={() => setShowInteractiveMap(true)}
      farmCount={nearbyFarmCount}
      isCalculating={isCalculating}
    />
  )
}
```

**Key Features**:
- **No Google API calls** until `showInteractiveMap` is true
- **Haversine distance calculation** in JavaScript (no external API)
- **Farm count display** encourages user to click if farms are nearby
- **Global state sync** via `setGlobalShowInteractiveMap()` for multi-component coordination

---

### 2. Mobile Static Map

**Component**: `web/src/components/mobile-static-map.tsx`

**Purpose**: Lightweight SVG map placeholder shown to mobile users before Google Maps loads.

**Visual Design**:
- **SVG-based map** with roads, regions, and location pins (< 5KB)
- **Gradient background**: `from-slate-50 via-gray-50 to-stone-50`
- **Modal overlay** with farm count and "Load Interactive Map" button
- **Loading spinner** while calculating nearby farms

**Key Code**:

```typescript
export function MobileStaticMap({
  onLoadInteractiveMap,
  farmCount = 0,
  isCalculating = false
}: MobileStaticMapProps) {
  return (
    <div className="relative w-full h-[70vh] lg:h-[80vh] overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
      {/* SVG map with roads, regions, and pins */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800">
        {/* Map regions/land areas */}
        <g opacity="0.4" filter="url(#softBlur)">
          <path d="M 50 100 L 200 80 ..." fill="rgba(34, 197, 94, 0.15)" />
        </g>

        {/* Road network */}
        <g opacity="0.3" stroke="url(#roadGradient)" fill="none">
          <path d="M 50 200 Q 300 190, 500 200 T 950 200" strokeWidth="3" />
        </g>

        {/* Location pins/markers */}
        <g opacity="0.5">
          <circle cx="250" cy="200" r="8" fill="rgb(34, 197, 94)" />
        </g>
      </svg>

      {/* Modal Overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-2xl p-8">
          <h2 className="text-2xl font-bold">
            {isCalculating ? 'Finding Farms Near You...' : `${farmCount} Farms Near You`}
          </h2>
          <Button onClick={onLoadInteractiveMap} disabled={isCalculating}>
            {isCalculating ? 'Calculating...' : 'Load Interactive Map'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Performance Impact**:
- **~95% smaller** than loading Google Maps immediately
- **No external requests** (pure SVG + CSS)
- **Instant render** (no JavaScript bundle wait)

---

### 3. Lazy Google Maps Loading

**Component**: `web/src/components/google-maps.tsx`

**Purpose**: Individual farm detail pages show embedded map, but only load Google API when map scrolls into view.

**Intersection Observer Pattern**:

```typescript
// Step 1: Detect when map container is visible
useEffect(() => {
  if (!mapRef.current) return

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true) // Trigger Google Maps load
      }
    },
    {
      rootMargin: '200px', // Start loading 200px BEFORE visible
      threshold: 0.01
    }
  )

  observer.observe(mapRef.current)
  return () => observer.unobserve(mapRef.current)
}, [])

// Step 2: Load Google Maps script only when visible
useEffect(() => {
  if (!isVisible) return // KEY: Don't load until visible

  if (window.google && window.google.maps) {
    setIsLoaded(true)
    return
  }

  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
  if (existingScript) {
    // Script already loading, wait for it
    const checkLoaded = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true)
      } else {
        setTimeout(checkLoaded, 100)
      }
    }
    checkLoaded()
    return
  }

  // Load Google Maps script
  const script = document.createElement('script')
  script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&loading=async&libraries=marker`
  script.async = true
  script.defer = true
  script.onload = () => setIsLoaded(true)
  document.head.appendChild(script)
}, [isVisible]) // Only trigger when isVisible changes
```

**Key Features**:
- **200px pre-load margin**: Script starts loading before map is visible (smooth UX)
- **Race condition handling**: Checks if script already exists before adding duplicate
- **Shared script**: Multiple maps on same page share one Google API load
- **Fallback skeleton**: Shows loading spinner until `isLoaded` is true

---

## Navigation & Page Layout

### Static Page Layout

**Component**: `web/src/components/static-page-layout.tsx`

**Purpose**: Consistent layout for all static pages (About, Contact, Blog, etc.)

**Structure**:

```typescript
export default function StaticPageLayout({ children, title, description, lastUpdated }) {
  return (
    <div className="min-h-screen bg-background">
      <FarmNavbar /> {/* Sticky top navigation */}

      <main className="mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">{title}</h1>
          {description && <p className="text-xl text-muted-foreground">{description}</p>}
          {lastUpdated && <p className="text-sm text-muted-foreground mt-4">Last updated: {lastUpdated}</p>}
        </div>

        <div className="prose prose-lg max-w-none">{children}</div>
      </main>

      <FarmFooter />
    </div>
  )
}
```

**Used By**:
- `/about` - About page
- `/contact` - Contact page
- `/blog/[slug]` - Blog posts
- `/privacy` - Privacy policy
- `/terms` - Terms of service

---

### Farm Navbar

**Component**: `web/src/components/farm-navbar.tsx`

**Purpose**: Sticky top navigation with authentication, mobile menu, and branding.

**Key Features**:

1. **Responsive Design**:
   - Desktop: Horizontal menu with all links visible
   - Mobile: Hamburger menu with slide-down navigation

2. **Authentication Integration**:
   - Clerk `SignInButton` and `SignUpButton` for logged-out users
   - Clerk `UserButton` with dropdown for logged-in users

3. **Navigation Links**:
   - Home (`/`)
   - About (`/about`)
   - Contact (`/contact`)
   - List Your Farm (external Zoho form)
   - Dashboard (`/dashboard`) - Authenticated only
   - Subscriptions (`/saved-farms`) - Authenticated only

4. **Sticky Positioning**:
   - `sticky top-0 z-50` - Always visible at top of page
   - `border-b border-border` - Visual separation from content

**Mobile Menu Logic**:

```typescript
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

// Desktop (hidden on mobile)
<div className="hidden md:flex items-center justify-between h-24">
  <a href="/">
    <Image src="/images/navbarlogo1.webp" alt="Pick A Farm Logo" width={56} height={28} />
  </a>
  <div className="flex items-center space-x-6">
    <a href="/">Home</a>
    <a href="/about">About</a>
    {/* ... */}
  </div>
</div>

// Mobile (hidden on desktop)
<div className="md:hidden">
  <Button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
    {isMobileMenuOpen ? <X /> : <Menu />}
  </Button>

  {isMobileMenuOpen && (
    <div className="pb-4 space-y-4">
      <a href="/">Home</a>
      <a href="/about">About</a>
      {/* ... */}
    </div>
  )}
</div>
```

---

## Map Component Hierarchy

### Component Tree

```
AdaptiveMapWrapper (mobile/desktop detection)
  ├─ MobileStaticMap (mobile, before click)
  │   └─ SVG Map + Modal Overlay
  │
  └─ MapPageLayout (desktop OR mobile after click)
      ├─ GoogleMaps (lazy-loaded with IntersectionObserver)
      │   ├─ Google Maps JavaScript API
      │   ├─ Markers (farms, user location, city center)
      │   ├─ Radius Circle (conditional)
      │   └─ InfoWindows (farm details)
      │
      ├─ Sidebar (farm list)
      │   ├─ Radius Control Slider (conditional)
      │   ├─ Category Filter (conditional)
      │   └─ Farm Cards (with SubscribeButton)
      │
      └─ Mobile Controls Modal (mobile only)
          ├─ Settings FAB (bottom-left)
          └─ Slide-up Filter Panel
```

### Component Responsibilities

| Component | Responsibility | Props | State |
|-----------|----------------|-------|-------|
| **AdaptiveMapWrapper** | Mobile/desktop detection, static/interactive switch | `children`, `preFilteredFarms` | `isMobile`, `showInteractiveMap`, `nearbyFarmCount` |
| **MobileStaticMap** | SVG map placeholder with CTA button | `onLoadInteractiveMap`, `farmCount`, `isCalculating` | None (stateless) |
| **MapPageLayout** | Full interactive map + sidebar | `centerLocation`, `showRadiusControl`, `filterByRadius`, `sortBy`, etc. | `farms`, `radius`, `selectedCategory`, `selectedFarm` |
| **GoogleMaps** | Embedded map for farm detail pages | `locationData`, `categoryFilter`, `radius`, `zoom` | `isLoaded`, `map`, `markers` |

---

## Performance Optimizations

### 1. Google Maps API Call Reduction

**Problem**: Every mobile visitor loads Google Maps (~300KB JS), even if they don't interact with map.

**Solution**:
- **Mobile Static Map**: Show SVG preview, only load API on button click
- **Desktop**: Load immediately (users expect interactive map on desktop)
- **Farm Detail Pages**: Lazy load with IntersectionObserver (only when scrolled into view)

**Impact**:
- **~60% fewer API calls** (mobile users who don't click map)
- **Savings**: Google Maps API is free up to 28,500 loads/month, but faster load times improve SEO

---

### 2. Haversine Distance Calculation (Client-Side)

**Problem**: Calculating distance from user to farms requires API call or complex DB query.

**Solution**: Implement Haversine formula in JavaScript for client-side calculation.

**Location**: `web/src/lib/location-utils.ts`

```typescript
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
```

**Benefits**:
- **No API calls** needed for distance calculation
- **Pre-build optimization**: Distances calculated at build time for static JSON files
- **Runtime optimization**: Real-time distance calculation when user moves map

---

### 3. Farm Data Pre-Filtering

**Component**: Category and state map sections pre-filter farms at build time.

**Example**: `CategoryMapSection`

```typescript
export function CategoryMapSection({ categoryName, categorySlug }: CategoryMapSectionProps) {
  // Get farms for this category (client-side filtering from static JSON)
  const categoryFarms = getFarmsForCategory(categoryName)

  return (
    <MapPageLayout
      preFilteredFarms={categoryFarms as any} // Pass pre-filtered farms
      hideCategoryFilter={true} // Don't show category dropdown (already filtered)
      // ...
    />
  )
}
```

**Benefits**:
- **Smaller data payload**: Only load relevant farms for category/state pages
- **Faster filtering**: No runtime filtering needed in `MapPageLayout`
- **Better UX**: User sees only relevant farms immediately

---

### 4. Intersection Observer for Below-Fold Content

**Pattern**: Used throughout the app for lazy-loading images, maps, and heavy components.

**Example**: Google Maps in farm detail pages

```typescript
useEffect(() => {
  if (!mapRef.current) return

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true)
      }
    },
    {
      rootMargin: '200px', // Load 200px before visible
      threshold: 0.01
    }
  )

  observer.observe(mapRef.current)
  return () => observer.unobserve(mapRef.current)
}, [])
```

**Benefits**:
- **Deferred script loading**: Google Maps API only loads when needed
- **Reduced initial bundle**: No heavy dependencies on first paint
- **Better LCP**: Faster Largest Contentful Paint for above-fold content

---

### 5. Memoization of Filtered Farms

**Component**: `MapPageLayout` uses `useMemo` to avoid unnecessary recalculations.

```typescript
const filteredFarms = useMemo(() => {
  let filtered = farms

  if (selectedCategory !== "All Types") {
    filtered = farms.filter(farm => {
      const categories = farm.categories?.toLowerCase() || ''
      return categories.includes(selectedCategory.toLowerCase())
    })
  }

  const sorted = filtered.sort((a, b) => {
    if (a.featured === 1 && b.featured !== 1) return -1
    if (b.featured === 1 && a.featured !== 1) return 1
    return (a.distance || 0) - (b.distance || 0)
  })

  return sorted
}, [farms, selectedCategory])
```

**Benefits**:
- **Avoids redundant filtering**: Only recalculates when `farms` or `selectedCategory` changes
- **Smoother UI**: No lag when typing in filters or interacting with map
- **Memory efficiency**: React memoizes result until dependencies change

---

## Implementation Patterns

### Pattern 1: Conditional Map Features

**Use Case**: State pages don't need radius controls, category pages do.

**Implementation**:

```typescript
<MapPageLayout
  // State page (show all farms in state, no radius)
  showRadiusControl={false}
  showRadiusCircle={false}
  filterByRadius={false}
  showDistances={false}
  sortBy="featured" // Featured farms first

  // Category page (show farms within radius of user)
  showRadiusControl={true}
  showRadiusCircle={true}
  filterByRadius={true}
  showDistances={true}
  sortBy="distance" // Closest farms first
/>
```

**Result**: Same component, different behavior based on context.

---

### Pattern 2: Global State for Interactive Map

**Problem**: Multiple components need to know if interactive map is loaded (e.g., navbar, footer, sidebar).

**Solution**: Simple global state with listener pattern.

```typescript
// Global state (outside component)
let globalShowInteractiveMap = false
const listeners: Set<() => void> = new Set()

function setGlobalShowInteractiveMap(value: boolean) {
  globalShowInteractiveMap = value
  listeners.forEach(listener => listener())
}

// Custom hook for subscribing to state
export function useInteractiveMap() {
  const [showInteractiveMap, setShowInteractiveMap] = useState(globalShowInteractiveMap)

  useEffect(() => {
    const listener = () => setShowInteractiveMap(globalShowInteractiveMap)
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, [])

  return { showInteractiveMap }
}

// Usage in any component
const { showInteractiveMap } = useInteractiveMap()
```

**Benefits**:
- **No Context Provider**: Simpler than React Context for single boolean
- **Automatic sync**: All components update when interactive map loads
- **Cleanup**: Listeners removed on unmount

---

### Pattern 3: Mobile-First Controls

**Desktop**: Controls in sidebar (always visible)
**Mobile**: Floating action button (FAB) opens modal with controls

```typescript
{/* Mobile Controls */}
<div className="lg:hidden">
  {/* FAB - Bottom Left */}
  <div className="absolute bottom-4 left-4 z-40">
    <Button
      size="lg"
      className="h-14 w-14 rounded-full shadow-xl"
      onClick={() => setShowControls(!showControls)}
    >
      {showControls ? <X className="h-6 w-6" /> : <Settings2 className="h-6 w-6" />}
    </Button>
  </div>

  {/* Slide-up Modal */}
  {showControls && (
    <>
      <div className="absolute inset-0 bg-black/20 z-30" onClick={() => setShowControls(false)} />
      <div className="absolute inset-x-0 bottom-0 z-40 animate-in slide-in-from-bottom-5">
        <Card className="rounded-t-2xl rounded-b-none">
          <CardHeader>
            <h2>Filters</h2>
          </CardHeader>
          <CardContent>
            {/* Radius slider, category filter, etc. */}
          </CardContent>
        </Card>
      </div>
    </>
  )}
</div>

{/* Desktop Controls - Always Visible */}
<div className="hidden lg:block space-y-4">
  {/* Same controls, but in sidebar */}
</div>
```

**Benefits**:
- **Mobile UX**: Maximizes map space, controls accessible via FAB
- **Desktop UX**: Always-visible sidebar for power users
- **Shared Logic**: Same state management for both layouts

---

## Related Documentation

- **API Reference**: `docs/DOC_API-Endpoints-Reference.md` - `/api/farms` endpoint for radius searches
- **Database Patterns**: `docs/DOC_Database-Query-Patterns.md` - Geospatial queries
- **Performance**: `docs/DOC_Performance-Optimization.md` - Additional optimization strategies
- **Location Utils**: `web/src/lib/location-utils.ts` - Haversine distance, geolocation detection

---

## Common Issues & Solutions

### Issue 1: Google Maps Not Loading

**Cause**: Race condition when multiple maps on same page.

**Check**:
```typescript
// google-maps.tsx line 162
const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
if (existingScript) {
  // Wait for existing script instead of creating duplicate
}
```

**Fix**: Implemented in `google-maps.tsx` - checks for existing script before adding new one.

---

### Issue 2: Mobile Static Map Doesn't Show Farm Count

**Cause**: Location detection failed or user denied location permission.

**Check**:
```typescript
// adaptive-map-wrapper.tsx line 64
const location = await getUserLocation("")
if (!location || !location.latitude || !location.longitude) {
  setNearbyFarmCount(0) // Shows "0 Farms Near You"
}
```

**Fix**: Shows "0 Farms Near You" if location unavailable, with "Load Interactive Map" button still functional.

---

### Issue 3: Map Not Centering on User Location

**Cause**: `centerLocation` prop is null or has invalid coordinates.

**Check**:
```typescript
// map-page-layout.tsx line 342
let centerLat = 45.4215 // Default: Ottawa
let centerLng = -75.6972

if (mapCenter && mapCenter.latitude && mapCenter.longitude) {
  centerLat = mapCenter.latitude
  centerLng = mapCenter.longitude
}
```

**Fix**: Always provides fallback coordinates (Ottawa, Canada) if user location unavailable.

---

## Best Practices

### When to Use Each Map Component

| Scenario | Component | Rationale |
|----------|-----------|-----------|
| **Category page** (e.g., `/apple-orchards/`) | `CategoryMapSection` | Pre-filtered farms, user-centered, radius controls |
| **State page** (e.g., `/wisconsin/`) | `StateMapSection` | All farms in state, no radius filter, state-centered |
| **Location page** (e.g., `/farms-near/madison-wi-us/`) | `MapPageLayout` (direct) | City-centered, radius controls, all farm types |
| **Farm detail page** | `GoogleMaps` | Single farm location, lazy-loaded |
| **Map-only page** (e.g., `/map/`) | `MapPageLayout` (direct) | User-centered, all farms, full controls |

---

### Mobile Optimization Checklist

- ✅ Use `AdaptiveMapWrapper` for mobile pages with maps
- ✅ Show static SVG map on mobile by default
- ✅ Calculate farm count WITHOUT loading Google Maps
- ✅ Load Google Maps API only on user click
- ✅ Use IntersectionObserver for below-fold maps
- ✅ Minimize initial JavaScript bundle (defer heavy dependencies)
- ✅ Provide loading states (skeleton, spinner, farm count)
- ✅ Fallback to default location if geolocation fails

---

**Last Updated**: October 9, 2025
**Maintainer**: Development Team
**Questions**: See `CLAUDE.md` for architecture overview
