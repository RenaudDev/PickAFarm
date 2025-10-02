# Homepage Redesign - Map-First Experience

**Goal:** Create a highly engaging map-first experience that allows users to instantly discover farms near them, filter by type, and save farms for updates - driving immediate user engagement and conversion.

## 📊 Current Status: **95% COMPLETE** 🎉

### ✅ What's Been Implemented:
- Full-screen interactive map with Google Maps integration
- IP-based geolocation + precise GPS location
- Real farm data with distance calculations and WordPress review aggregation
- Map markers (user location, city center, farm pins with featured/regular states)
- Responsive sidebar (desktop) / scrollable list (mobile)
- Search radius slider (10-200km) with visual circle visualization
- Category filters with multi-select badges
- User authentication (Clerk) with save farm functionality
- User location storage in database with API endpoint
- Mobile-optimized controls with bottom sheet and floating action button
- City-specific pages with city-centered maps and increased zoom
- FAQ section with FAQPage Schema.org markup
- **NEW:** Organization schema with LocalBusiness for all visible farms (dynamic)
- H1 page titles optimized for search engines
- Category emojis above farm titles
- Review counts and ratings from WordPress

### 🔄 Remaining Tasks (Optional Enhancements):
1. ~~Add FAQ section with schema markup~~ ✅ DONE
2. Add blog article previews below map (optional)
3. Implement analytics tracking (GA4/Mixpanel)
4. Performance optimizations (lazy loading, code splitting)
5. A/B testing setup for conversion optimization

## 🎯 Core Value Proposition

**Primary:** Users land on a full-screen interactive map showing farms near their location
**Secondary:** Instant ability to save farms → prompt for sign-up → email notifications on farm updates
**Tertiary:** SEO-rich content below the map to drive organic traffic

---

## 📋 Feature Breakdown

### Phase 1: Core Map Experience (MVP) ✅ COMPLETED
- [x] **Existing:** Google Maps component (`google-maps.tsx`)
- [x] **IP Geolocation:** Auto-center map on user's approximate location using IP
  - Using `ipapi.co` API for IP-based geolocation
  - Implemented in `location-utils.ts`
- [x] **Fetch Real Farms:** Load farms from static `farms.json` and D1 database
  - Filter by radius (default: 100km, adjustable 10-200km)
  - Sort by distance from user
  - Distance calculation using Haversine formula
- [x] **Map Markers:** Display farm pins with:
  - Default pin: Green (#2d5016)
  - Featured farm pin: Gold (#eab308)
  - User location: Blue marker
  - City center: Green marker (larger)
- [x] **Sidebar (Desktop) / Bottom Sheet (Mobile):**
  - List of farms sorted by distance
  - Farm cards showing: name, distance, category, rating, emoji icons, save button
  - Responsive: sidebar on desktop (25% width), scrollable on mobile

### Phase 2: User Interaction ✅ COMPLETED
- [x] **Precise Location Button:**
  - "Use My Exact Location" button with browser geolocation
  - High-accuracy GPS positioning (enableHighAccuracy: true)
  - Re-center map and refresh farm list
  - Saves location to database if user is signed in
  - Error handling for permission denied
- [x] **Search Radius Slider:**
  - Slider component (10km - 200km)
  - Live update of map markers and farm list
  - Display count with radius badge
  - Radius circle visualization on map
- [x] **Category Filters:**
  - Multi-select badge chips for all farm categories
  - Categories extracted from farm data
  - Filter both map markers and sidebar list
  - "All Types" option to clear filters
- [x] **Farm Card Interaction:**
  - Click card → pan/zoom map to marker + scroll to card
  - "Save" button → SaveFarmButton component (requires auth)
  - "View Details" → Navigate to farm page (`/farms/[slug]`)
  - Selected farm highlighting with ring

### Phase 3: Authentication & Save Flow ✅ COMPLETED
- [x] **Existing:** Clerk authentication integration
- [x] **Existing:** Save farm API endpoints (`/api/farms/save`, `/api/users/sync`)
- [x] **Save Button Flow:**
  - SaveFarmButton component integrated in farm cards
  - Clerk sign-in modal shown if not logged in
  - Saves to D1 database via API
  - Heart icon toggles saved state
- [x] **User Location Storage:**
  - NEW: `/api/users/update-location` endpoint
  - Saves precise GPS coordinates to users table
  - Database migration created (004_add_user_location.sql)
  - Stores latitude, longitude, city, region, timestamp

### Phase 4: SEO & Content ✅ COMPLETED
- [x] **H1 Page Titles:**
  - Homepage: "All U-Pick Farms Near You"
  - City pages: "All [City] U-Pick Farms Near You"
  - Semantic H1 with maintained styling
- [x] **Content Section Below Map:**
  - Homepage has "Popular Farm Experiences" section
  - Top 4 categories displayed with farm counts
  - "Get More Families to Your Farm" CTA section
- [x] **Schema.org Markup:**
  - City page schema implemented (generateCityPageSchema)
  - Homepage metadata (generateHomepageMetadata)
  - FAQPage schema with 8 SEO-optimized Q&As
  - **NEW:** Organization schema with LocalBusiness members for all visible farms
  - Dynamic schema based on filtered farms (up to 50 farms)
  - Includes: name, address, geo coordinates, ratings, reviews, contact info
- [x] **FAQ Section:**
  - 8 comprehensive questions covering common user queries
  - Topics: finding farms, types, reservations, saving farms, verification
  - Schema.org FAQPage structured data for rich snippets

### Phase 5: Performance & Polish ✅ MOSTLY COMPLETED
- [x] **Loading States:**
  - Spinner loader for map with "Finding farms near you..." message
  - Loading indicators in farm list
  - Location detection loading states
- [x] **Error Handling:**
  - Location error messages displayed
  - "No farms found" message with suggestion
  - Try-catch blocks for API calls
- [x] **Mobile Optimizations:**
  - Touch-friendly controls with floating action button
  - Bottom sheet filter panel (slide up animation)
  - Collapsible filter panel on mobile
  - Responsive layout (map top, list bottom on mobile)
- [ ] **TODO: Analytics Events:**
  - Track: location granted, radius changed, category filtered, farm saved, farm viewed
  - Integration with analytics platform needed

---

## 🏗️ Technical Implementation Plan

### Step 1: Setup & Infrastructure (Day 1)
1. **Create new homepage layout**
   - New file: `/app/page-new.tsx` (test before replacing main)
   - Import existing `google-maps.tsx` component
   - Setup responsive container structure

2. **IP Geolocation Service**
   - Create utility: `/src/lib/geolocation-utils.ts`
   - Function: `getIPLocation()` → returns {lat, lng, city, region}
   - Implement caching (store in session)

3. **Farm API Integration**
   - Enhance `/api/farms` endpoint to accept lat/lng params
   - Add distance calculation in SQL query
   - Return farms within radius with distance field

### Step 2: Core Map Implementation (Days 2-3)
1. **Update Map Component**
   - Modify `google-maps.tsx` to accept:
     - `farms[]` array with lat/lng
     - `savedFarmIds[]` for styling saved pins
     - `onMarkerClick` callback
     - `center` position
   - Implement custom markers with conditional styling

2. **Build Sidebar Component**
   - New file: `/src/components/farm-sidebar.tsx`
   - Farm card component with:
     - Distance badge
     - Category badge
     - Save button (integrated with existing `SaveFarmButton`)
     - Quick view details
   - Desktop: Fixed sidebar (20% width)
   - Mobile: Bottom sheet (draggable)

3. **Connect Data Flow**
   - Load user location (IP geolocation)
   - Fetch farms from API
   - Calculate distances client-side for real-time updates
   - Implement filtering logic

### Step 3: Filters & Interaction (Days 4-5)
1. **Search Radius Control**
   - Slider component with km display
   - Update URL params on change
   - Debounce API calls (500ms)

2. **Category Filters**
   - Fetch categories from database
   - Multi-select chip UI
   - Filter farms array client-side

3. **Map-List Sync**
   - Click farm card → pan/zoom map to marker
   - Click marker → scroll to farm card + highlight
   - Maintain selected state

### Step 4: Authentication & Saving (Day 6)
1. **Integrate Clerk Auth**
   - Wrap save button with auth check
   - Show sign-in modal if not authenticated
   - Use existing `/api/farms/save` endpoint

2. **Real-time Updates**
   - Update pin color after save
   - Show saved count in navbar
   - Sync with `/api/farms/saved` on mount

3. **User Location Preferences**
   - Store last search location in database
   - Offer "Use saved location" on return visit

### Step 5: SEO Content & Schema (Day 7)
1. **Content Sections**
   - Marketing copy below map
   - Featured categories grid
   - Popular locations (link to `/farms-near/[city]`)
   - Blog article cards

2. **Structured Data**
   - Generate LocalBusiness schema for visible farms
   - Add FAQPage schema
   - Implement breadcrumbs

3. **Performance Optimization**
   - Lazy load content below fold
   - Optimize map bundle size
   - Image optimization for farm photos

### Step 6: Testing & Launch (Days 8-9)
1. **Testing Checklist**
   - [ ] Mobile responsiveness (iOS Safari, Android Chrome)
   - [ ] Location permission flow
   - [ ] Save farm → sign in → complete save flow
   - [ ] Filter combinations
   - [ ] Map performance with 100+ markers
   - [ ] SEO crawlability (ensure content visible without JS)

2. **A/B Testing Setup**
   - Metrics: Time on site, farms viewed, sign-ups, saves
   - Test: Map-first vs. traditional homepage

3. **Gradual Rollout**
   - Deploy to `/beta` first
   - Internal team testing
   - 10% traffic → 50% → 100%

---

## 🎨 Design Specifications

### Layout
- **Desktop:** 80% map (left) | 20% sidebar (right)
- **Mobile:** Full-screen map with bottom sheet (swipeable)
- **Map Height:** 80vh on mobile, 100vh on desktop

### Components
- Use existing UI components from `/components/ui/`
- Maintain current design system (colors, typography, spacing)
- Icons: Lucide React (MapPin, Heart, Navigation, Filter, etc.)

### Colors
- Default farm pin: `text-primary` (#2d5016 green)
- Saved farm pin: `text-red-500`
- Featured farm pin: `text-yellow-500`
- Map controls: White with shadow

---

## 📊 Success Metrics

### Primary KPIs
- **Engagement:** Average time on homepage (target: 2+ minutes)
- **Conversion:** Sign-up rate after save farm click (target: 30%)
- **Retention:** Return visitor rate (target: 40% within 7 days)

### Secondary KPIs
- Farms viewed per session (target: 5+)
- Farms saved per user (target: 2+)
- Mobile vs. Desktop engagement
- Location permission grant rate

---

## 🚀 Launch Checklist

- [ ] All Phase 1-3 features complete
- [ ] Mobile testing complete
- [ ] SEO content published
- [ ] Schema.org markup validated
- [ ] Performance score >90 (Lighthouse)
- [ ] Analytics events tracking
- [ ] Error monitoring setup (Sentry/LogRocket)
- [ ] Backup of old homepage
- [ ] Rollback plan documented

---

## Important Notes

1. **Leverage Existing Infrastructure:**
   - ✅ Google Maps component (`google-maps.tsx`)
   - ✅ Save farm button (`save-farm-button.tsx`)
   - ✅ Clerk authentication
   - ✅ Cloudflare Worker API (`pickafarm-api`)
   - ✅ D1 database with farms table

2. **SEO Critical:**
   - Map must not be the only content (bad for SEO)
   - Add rich content below map with H1, H2, keywords
   - Ensure farm data is crawlable (server-side rendering)

3. **Performance:**
   - Lazy load map (dynamic import)
   - Cluster markers for large datasets
   - Debounce filter/radius changes

## Map function template - To be modified for our usecase
```
"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { FarmNavbar } from "@/components/farm-navbar"
import { FarmFooter } from "@/components/farm-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { MapPin, Star, Loader2, Navigation, Bookmark, BookmarkCheck, Settings2, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const MapComponent = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

const mockFarms = [
  {
    id: 1,
    name: "Sunny Acres Apple Orchard",
    location: "Hudson Valley, NY",
    description: "Pick your own apples, enjoy hayrides, and taste fresh cider.",
    rating: 4.9,
    reviews: 127,
    category: "Apple Picking",
    lat: 41.7,
    lng: -74.0,
    verified: true,
    featured: true,
  },
  {
    id: 2,
    name: "Pumpkin Patch Paradise",
    location: "Lancaster County, PA",
    description: "Choose your perfect pumpkin and navigate corn mazes.",
    rating: 4.8,
    reviews: 89,
    category: "Pumpkin Patch",
    lat: 40.0,
    lng: -76.3,
    verified: true,
    featured: false,
  },
  {
    id: 3,
    name: "Berry Bliss Farm",
    location: "Sonoma County, CA",
    description: "Pick fresh strawberries, blueberries, and raspberries.",
    rating: 4.7,
    reviews: 156,
    category: "Berry Picking",
    lat: 38.5,
    lng: -122.8,
    verified: false,
    featured: true,
  },
  {
    id: 4,
    name: "Christmas Tree Haven",
    location: "Vermont",
    description: "Cut your own Christmas tree in a winter wonderland.",
    rating: 4.9,
    reviews: 203,
    category: "Christmas Trees",
    lat: 44.0,
    lng: -72.7,
    verified: true,
    featured: true,
  },
  {
    id: 5,
    name: "Strawberry Fields Forever",
    location: "New Jersey",
    description: "U-pick strawberries in season with family activities.",
    rating: 4.6,
    reviews: 94,
    category: "Strawberry Picking",
    lat: 40.2,
    lng: -74.7,
    verified: false,
    featured: false,
  },
]

const farmCategories = [
  "All Types",
  "Apple Picking",
  "Pumpkin Patch",
  "Berry Picking",
  "Christmas Trees",
  "Strawberry Picking",
  "Corn Mazes",
  "Sunflower Fields",
]

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function Home() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [radius, setRadius] = useState(75)
  const [selectedCategory, setSelectedCategory] = useState("All Types")
  const [savedFarms, setSavedFarms] = useState<Set<number>>(new Set())
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [locationMethod, setLocationMethod] = useState<"ip" | "precise">("ip")
  const [showControls, setShowControls] = useState(false)
  const [selectedFarm, setSelectedFarm] = useState<number | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    setTimeout(() => {
      setUserLocation({ lat: 40.7128, lng: -74.006 })
      setIsLoadingLocation(false)
    }, 1000)
  }, [])

  const getPreciseLocation = () => {
    setIsLoadingLocation(true)
    setLocationError(null)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationMethod("precise")
          setIsLoadingLocation(false)
        },
        (error) => {
          console.error("[v0] Geolocation error:", error)
          let errorMessage = "Unable to get precise location"
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Location access denied. Please enable location permissions."
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "Location information unavailable."
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "Location request timed out."
          }
          setLocationError(errorMessage)
          setIsLoadingLocation(false)
        },
      )
    } else {
      setLocationError("Geolocation is not supported by your browser")
      setIsLoadingLocation(false)
    }
  }

  const filteredFarms = useMemo(() => {
    if (!userLocation) return []

    return mockFarms
      .map((farm) => ({
        ...farm,
        distance: calculateDistance(userLocation.lat, userLocation.lng, farm.lat, farm.lng),
      }))
      .filter((farm) => {
        const withinRadius = farm.distance <= radius
        const matchesCategory = selectedCategory === "All Types" || farm.category === selectedCategory
        return withinRadius && matchesCategory
      })
      .sort((a, b) => a.distance - b.distance)
  }, [userLocation, radius, selectedCategory])

  const toggleSaveFarm = (farmId: number) => {
    setSavedFarms((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(farmId)) {
        newSet.delete(farmId)
      } else {
        newSet.add(farmId)
      }
      return newSet
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FarmNavbar />
      <main className="flex-1 flex flex-col">
        <section className="flex-1 flex flex-col lg:flex-row relative">
          <div className="w-full lg:w-4/5 h-[80vh] lg:h-screen relative">
            {isLoadingLocation ? (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading your location...</p>
                </div>
              </div>
            ) : (
              <MapComponent
                center={userLocation || { lat: 40.7128, lng: -74.006 }}
                farms={filteredFarms}
                radius={radius}
                onFarmClick={(farmId) => setSelectedFarm(farmId)}
                selectedFarm={selectedFarm}
                savedFarms={savedFarms}
                onToggleSave={toggleSaveFarm}
              />
            )}

            <div className="lg:hidden">
              <div className="absolute top-4 left-4 right-4 z-10">
                <Button
                  size="sm"
                  variant={locationMethod === "precise" ? "default" : "secondary"}
                  onClick={getPreciseLocation}
                  disabled={isLoadingLocation}
                  className="w-full shadow-lg backdrop-blur-sm"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {locationMethod === "precise" ? "Using Precise Location" : "Get Precise Location"}
                </Button>
                {locationError && (
                  <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{locationError}</p>
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 right-4 z-[70]">
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full shadow-xl"
                  onClick={() => setShowControls(!showControls)}
                >
                  {showControls ? <X className="h-6 w-6" /> : <Settings2 className="h-6 w-6" />}
                </Button>
              </div>

              <div className="absolute bottom-4 left-4 z-[50]">
                <Badge variant="secondary" className="shadow-lg text-sm px-3 py-1">
                  {filteredFarms.length} farms
                </Badge>
              </div>

              {showControls && (
                <>
                  <div className="absolute inset-0 bg-black/20 z-[55]" onClick={() => setShowControls(false)} />
                  <div className="absolute inset-x-0 bottom-0 z-[60] animate-in slide-in-from-bottom-5">
                    <Card className="rounded-t-2xl rounded-b-none shadow-2xl border-t-2">
                      <CardHeader className="pb-3 pt-4 px-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold">Search Settings</h2>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setShowControls(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 pt-0 space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Search Radius</h3>
                            <Badge variant="outline">{radius}km</Badge>
                          </div>
                          <Slider
                            value={[radius]}
                            onValueChange={(value) => setRadius(value[0])}
                            min={10}
                            max={200}
                            step={5}
                            className="mb-2"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Farm Type</h3>
                            <span className="text-sm text-muted-foreground">{filteredFarms.length} found</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {farmCategories.map((category) => {
                              const isSelected = selectedCategory === category
                              return (
                                <button
                                  key={category}
                                  onClick={() => {
                                    setSelectedCategory(category)
                                    setShowControls(false)
                                  }}
                                  className={cn(
                                    "px-4 py-3 rounded-lg text-sm font-medium transition-all",
                                    "border-2 text-left touch-manipulation",
                                    "active:scale-95",
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                      : "bg-background border-border hover:border-primary/50",
                                  )}
                                >
                                  {category}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="w-full lg:w-1/5 bg-background border-t lg:border-t-0 lg:border-l overflow-y-auto h-[20vh] lg:h-screen">
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
              <div className="hidden lg:block space-y-4">
                <div>
                  <Button
                    size="sm"
                    variant={locationMethod === "precise" ? "default" : "secondary"}
                    onClick={getPreciseLocation}
                    disabled={isLoadingLocation}
                    className="w-full"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    {locationMethod === "precise" ? "Using Precise Location" : "Get Precise Location"}
                  </Button>
                  {locationError && (
                    <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-xs text-destructive">{locationError}</p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Search Radius</h3>
                    <Badge variant="outline" className="text-xs">
                      {radius}km
                    </Badge>
                  </div>
                  <Slider value={[radius]} onValueChange={(value) => setRadius(value[0])} min={10} max={200} step={5} />
                </div>
              </div>

              <div className="hidden lg:block">
                <h3 className="font-semibold text-sm mb-3">Filter</h3>
                <div className="flex flex-wrap gap-2">
                  {farmCategories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">Near You ({filteredFarms.length})</h3>
                <div className="space-y-3">
                  {filteredFarms.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No farms found. Try increasing the radius.
                    </p>
                  ) : (
                    filteredFarms.map((farm) => (
                      <Card
                        key={farm.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          selectedFarm === farm.id && "ring-2 ring-primary",
                        )}
                        onClick={() => setSelectedFarm(farm.id)}
                      >
                        <CardHeader className="pb-2 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-1 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                  {farm.category}
                                </Badge>
                                {farm.verified && (
                                  <Badge variant="outline" className="text-xs">
                                    ✓
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-sm leading-tight mb-1">{farm.name}</CardTitle>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                {farm.distance.toFixed(1)}km
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSaveFarm(farm.id)
                              }}
                            >
                              {savedFarms.has(farm.id) ? (
                                <BookmarkCheck className="h-3 w-3 text-primary" />
                              ) : (
                                <Bookmark className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs">
                              <div className="flex items-center">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                <span className="font-medium">{farm.rating}</span>
                              </div>
                              <span className="text-muted-foreground">({farm.reviews})</span>
                            </div>
                            <Button size="sm" variant="outline" className="h-6 text-xs px-2 bg-transparent" asChild>
                              <a href={`/farm/${farm.id}`}>View</a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <FarmFooter />
    </div>
  )
}
```
 
