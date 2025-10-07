"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  MapPin,
  Star,
  Bell,
  Loader2,
  Navigation,
  Settings2,
  X,
  AlertCircle,
  Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  getBrowserLocation, 
  calculateDistance,
  storeUserLocation,
  type UserLocation 
} from "@/lib/location-utils"
import { SubscribeButton } from "@/components/subscribe-button"
import { SubscriberBadge } from "@/components/subscriber-badge"
import { useAuth } from "@clerk/nextjs"
import { generateFarmsSchema } from "@/lib/farm-schema"
import farmsData from "../../data/farms.json"
import categoriesData from "../../data/categories.json"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://pickafarm-api.94623956quebecinc.workers.dev"

// Emoji mapping for farm categories
const getCategoryEmoji = (category: string): string => {
  const lowerCategory = category.toLowerCase()
  if (lowerCategory.includes('christmas') || lowerCategory.includes('tree')) return '🎄'
  if (lowerCategory.includes('apple')) return '🍎'
  if (lowerCategory.includes('berry')) return '🫐'
  if (lowerCategory.includes('pumpkin')) return '🎃'
  if (lowerCategory.includes('corn')) return '🌽'
  if (lowerCategory.includes('maple') || lowerCategory.includes('sugar')) return '🍁'
  if (lowerCategory.includes('vegetable') || lowerCategory.includes('veggie')) return '🥕'
  if (lowerCategory.includes('flower')) return '🌻'
  if (lowerCategory.includes('vineyard') || lowerCategory.includes('wine')) return '🍇'
  if (lowerCategory.includes('zoo') || lowerCategory.includes('petting')) return '🐐'
  return '🌾'
}

// Get category slug from category name
const getCategorySlug = (categoryName: string): string | null => {
  const trimmedCategory = categoryName.trim()
  
  // Try to find exact match first
  const exactMatch = categoriesData.find(cat => 
    cat.name.toLowerCase() === trimmedCategory.toLowerCase()
  )
  if (exactMatch) return exactMatch.slug
  
  // Try to find partial match
  const partialMatch = categoriesData.find(cat => 
    cat.name.toLowerCase().includes(trimmedCategory.toLowerCase()) ||
    trimmedCategory.toLowerCase().includes(cat.name.toLowerCase())
  )
  if (partialMatch) return partialMatch.slug
  
  // Default fallback based on common patterns
  if (trimmedCategory.toLowerCase().includes('christmas') || trimmedCategory.toLowerCase().includes('tree')) {
    return 'christmas-tree-farms'
  }
  if (trimmedCategory.toLowerCase().includes('apple')) {
    return 'apple-orchards'
  }
  if (trimmedCategory.toLowerCase().includes('pumpkin')) {
    return 'pumpkin-patches'
  }
  if (trimmedCategory.toLowerCase().includes('berry')) {
    return 'berry-farms'
  }
  
  return null
}

interface Farm {
  id: string
  name: string
  slug: string
  city_name: string
  state_province: string
  latitude: number
  longitude: number
  categories?: string
  distance?: number
  featured?: number | boolean
  verified?: number | boolean
  phone?: string
  website?: string
  reviews?: number
  rating?: number
}

const getUniqueCategories = (farms: Farm[]): string[] => {
  const categoriesSet = new Set<string>()
  farms.forEach(farm => {
    if (farm.categories) {
      const cats = farm.categories.split(',').map(c => c.trim()).filter(c => c)
      cats.forEach(cat => {
        if (cat) categoriesSet.add(cat)
      })
    }
  })
  const sorted = Array.from(categoriesSet).sort()
  return ["All Types", ...sorted]
}

declare global {
  interface Window {
    google: any
  }
}

interface PaginationConfig {
  enabled: boolean
  currentPage: number
  totalPages: number
  farmsPerPage: number
}

interface MapPageLayoutProps {
  // Location & Display
  centerLocation: UserLocation | null
  isLoadingLocation: boolean
  locationError?: string | null
  showUserMarker?: boolean
  showCityMarker?: boolean
  pageTitle?: string
  showFarmCount?: boolean

  // Radius Features (for state pages, set these to false)
  showRadiusControl?: boolean
  showRadiusCircle?: boolean
  filterByRadius?: boolean
  showDistances?: boolean

  // Sorting & Filtering
  sortBy?: "distance" | "featured" | "name" | "rating"
  hideCategoryFilter?: boolean

  // Map Behavior
  initialZoom?: number
  enableClustering?: boolean
  maxVisibleMarkers?: number

  // Pagination (for large state pages)
  pagination?: PaginationConfig

  // Performance
  enableVirtualScrolling?: boolean
  lazyLoadMarkers?: boolean

  // Pre-filtered farms (for state pages)
  preFilteredFarms?: Farm[]
}

export function MapPageLayout({
  centerLocation,
  isLoadingLocation,
  locationError,
  showUserMarker = false,
  showCityMarker = false,
  pageTitle = "All U-Pick Farms Near You",
  showFarmCount = true,
  // New props with backward-compatible defaults
  showRadiusControl = true,
  showRadiusCircle = true,
  filterByRadius = true,
  showDistances = true,
  sortBy = "distance",
  hideCategoryFilter = false,
  initialZoom,
  enableClustering = false,
  maxVisibleMarkers,
  pagination,
  enableVirtualScrolling = false,
  lazyLoadMarkers = false,
  preFilteredFarms
}: MapPageLayoutProps) {
  const { isSignedIn, userId } = useAuth()
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const radiusCircleRef = useRef<any>(null)
  
  const [farms, setFarms] = useState<Farm[]>([])
  const [savedFarmIds, setSavedFarmIds] = useState<Set<string>>(new Set())
  const [farmStats, setFarmStats] = useState<Record<string, number>>({})
  const [radius, setRadius] = useState(100)
  const [selectedCategory, setSelectedCategory] = useState("All Types")
  const [isLoadingFarms, setIsLoadingFarms] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [selectedFarm, setSelectedFarm] = useState<string | null>(null)
  const [showSearchThisArea, setShowSearchThisArea] = useState(false)
  const [mapCenter, setMapCenter] = useState<UserLocation | null>(centerLocation)

  // Update map center when prop changes
  useEffect(() => {
    setMapCenter(centerLocation)
  }, [centerLocation])

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.google && window.google.maps) {
      setIsMapLoaded(true)
      return
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsMapLoaded(true))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    script.async = true
    script.defer = true
    script.onload = () => setIsMapLoaded(true)
    script.onerror = () => console.error('Failed to load Google Maps')
    document.head.appendChild(script)
  }, [])

  // Fetch farms when location or radius changes
  useEffect(() => {
    if (!mapCenter || !mapCenter.latitude || !mapCenter.longitude) {
      return
    }

    async function fetchFarms() {
      setIsLoadingFarms(true)
      
      // Use preFilteredFarms if provided (for state pages), otherwise load all farms
      const sourceFarms = preFilteredFarms || farmsData
      
      let farmsWithDistance = sourceFarms
        .filter(f => {
          // For prefiltered farms, assume already filtered by active status
          if (preFilteredFarms) return f.latitude && f.longitude
          // For all farms from database, filter by active
          return (f as any).active === 1 && f.latitude && f.longitude
        })
        .map(farm => ({
          ...farm,
          id: farm.id.toString().replace('zcrm_', ''),
          distance: showDistances ? Math.round(calculateDistance(
            mapCenter.latitude,
            mapCenter.longitude,
            farm.latitude,
            farm.longitude
          ) * 10) / 10 : 0
        }))
      
      // Only filter by radius if filterByRadius is true (default behavior)
      if (filterByRadius) {
        farmsWithDistance = farmsWithDistance.filter(farm => farm.distance <= radius)
      }
      
      // Sort based on sortBy prop
      if (sortBy === "featured") {
        farmsWithDistance.sort((a, b) => {
          // Featured first
          if (a.featured === 1 && b.featured !== 1) return -1
          if (b.featured === 1 && a.featured !== 1) return 1
          // Then by rating
          return (b.rating || 0) - (a.rating || 0)
        })
      } else if (sortBy === "rating") {
        farmsWithDistance.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      } else if (sortBy === "name") {
        farmsWithDistance.sort((a, b) => a.name.localeCompare(b.name))
      } else {
        // Default: sort by distance
        farmsWithDistance.sort((a, b) => a.distance - b.distance)
      }
      
      setFarms(farmsWithDistance as any)
      setIsLoadingFarms(false)
    }

    fetchFarms()
  }, [mapCenter, radius, filterByRadius, sortBy, showDistances, preFilteredFarms])

  const availableCategories = useMemo(() => {
    return getUniqueCategories(farms)
  }, [farms])

  const filteredFarms = useMemo(() => {
    let filtered = farms
    
    if (selectedCategory !== "All Types") {
      filtered = farms.filter(farm => {
        const categories = farm.categories?.toLowerCase() || ''
        return categories.toLowerCase().includes(selectedCategory.toLowerCase())
      })
    }
    
    const sorted = filtered.sort((a, b) => {
      if (a.featured === 1 && b.featured !== 1) return -1
      if (b.featured === 1 && a.featured !== 1) return 1
      return (a.distance || 0) - (b.distance || 0)
    })
    
    return sorted
  }, [farms, selectedCategory])

  // Fetch subscriber counts for filtered farms
  useEffect(() => {
    async function fetchFarmStats() {
      if (filteredFarms.length === 0) {
        console.log('📊 No filtered farms to fetch stats for')
        return
      }

      // Get first 100 farms
      const farmsToFetch = filteredFarms.slice(0, 100)
      const farmIds = farmsToFetch
        .map(f => f.id.startsWith('zcrm_') ? f.id : `zcrm_${f.id}`)
        .join(',')

      console.log(`📊 Fetching stats for ${farmsToFetch.length} farms`)

      try {
        const response = await fetch(`${API_URL}/api/farms/stats?ids=${farmIds}`)
        if (response.ok) {
          const data = await response.json()
          console.log('📊 Stats received:', data)
          const statsMap: Record<string, number> = {}
          data.stats.forEach((stat: any) => {
            statsMap[stat.farm_id] = stat.subscriber_count
          })
          setFarmStats(statsMap)
          console.log('📊 Stats map updated:', statsMap)
        } else {
          console.error('Failed to fetch stats, status:', response.status)
        }
      } catch (error) {
        console.error('Failed to fetch farm stats:', error)
        // Non-critical error - map will still work without stats
      }
    }

    fetchFarmStats()
  }, [filteredFarms])

  // Initialize map
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || googleMapRef.current) return

    let centerLat = 45.4215
    let centerLng = -75.6972
    
    if (mapCenter) {
      centerLat = mapCenter.latitude
      centerLng = mapCenter.longitude
    } else if (filteredFarms.length > 0 && filteredFarms[0].latitude) {
      centerLat = filteredFarms[0].latitude
      centerLng = filteredFarms[0].longitude
    }

    // Zoom level: city pages get more zoom
    const zoomLevel = showCityMarker ? 11 : (mapCenter ? 9 : 5)

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: centerLat, lng: centerLng },
      zoom: zoomLevel,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      draggable: true,
      zoomControl: true,
      scrollwheel: true,
      gestureHandling: 'greedy',
    })

    googleMapRef.current.addListener('dragend', () => {
      const center = googleMapRef.current.getCenter()
      if (center) {
        setShowSearchThisArea(true)
      }
    })

    // Add user location marker (blue)
    if (mapCenter && showUserMarker) {
      new window.google.maps.Marker({
        position: { lat: mapCenter.latitude, lng: mapCenter.longitude },
        map: googleMapRef.current,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 10,
        },
      })
    }

    // Add city center marker (green)
    if (mapCenter && showCityMarker) {
      new window.google.maps.Marker({
        position: { lat: mapCenter.latitude, lng: mapCenter.longitude },
        map: googleMapRef.current,
        title: mapCenter.city || 'City Center',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#2d5016',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 12,
        },
      })
    }
  }, [isMapLoaded, mapCenter, filteredFarms, showUserMarker, showCityMarker])

  // Update radius circle (only if showRadiusCircle is true)
  useEffect(() => {
    if (!googleMapRef.current || !mapCenter || !window.google) return

    // Remove existing circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null)
      radiusCircleRef.current = null
    }

    // Only create circle if showRadiusCircle is true
    if (showRadiusCircle) {
      radiusCircleRef.current = new window.google.maps.Circle({
        map: googleMapRef.current,
        center: { lat: mapCenter.latitude, lng: mapCenter.longitude },
        radius: radius * 1000,
        fillColor: '#2d5016',
        fillOpacity: 0.1,
        strokeColor: '#2d5016',
        strokeOpacity: 0.3,
        strokeWeight: 2,
      })

      const bounds = radiusCircleRef.current.getBounds()
      if (bounds) {
        googleMapRef.current.fitBounds(bounds)
      }
    } else if (initialZoom) {
      // For state pages, set the zoom level without fitting to circle bounds
      googleMapRef.current.setZoom(initialZoom)
    }
  }, [mapCenter, radius, isMapLoaded, showRadiusCircle, initialZoom])

  // Update markers
  useEffect(() => {
    if (!googleMapRef.current || !window.google || !isMapLoaded) return

    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current.clear()

    filteredFarms.forEach((farm) => {
      if (!farm.latitude || !farm.longitude) return

      const isFeatured = farm.featured === 1
      const pinColor = isFeatured ? '#eab308' : '#2d5016'

      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(farm.latitude as any), lng: parseFloat(farm.longitude as any) },
        map: googleMapRef.current,
        title: farm.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: pinColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8,
        },
      })

      const categoryEmojis = farm.categories
        ? farm.categories.split(',').slice(0, 4).map(cat => getCategoryEmoji(cat.trim())).join(' ')
        : '🌾'
      
      const reviewsHtml = farm.reviews && farm.reviews > 0
        ? `<div style="color: #666; font-size: 12px; margin-bottom: 8px;">
             ⭐ ${farm.rating || '5.0'} (${farm.reviews} reviews)
           </div>`
        : `<div style="color: #999; font-size: 12px; margin-bottom: 8px; font-style: italic;">
             No reviews yet
           </div>`
      
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">
              ${categoryEmojis} ${farm.name}
            </div>
            ${showDistances && farm.distance ? `
              <div style="color: #666; font-size: 13px; margin-bottom: 4px;">
                📍 ${farm.distance}km away
              </div>
            ` : ''}
            ${reviewsHtml}
            <div style="color: #666; font-size: 12px; margin-bottom: 8px;">
              ${farm.city_name}, ${farm.state_province}
            </div>
            <a 
              href="/farms/${farm.slug}" 
              style="display: inline-block; padding: 6px 12px; background: #2d5016; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;"
            >
              View Details
            </a>
          </div>
        `
      })

      marker.addListener('click', () => {
        window.google.maps.event.trigger(googleMapRef.current, 'closeAllInfoWindows')
        infoWindow.open(googleMapRef.current, marker)
        setSelectedFarm(farm.id)
        const element = document.getElementById(`farm-${farm.id}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
      
      marker.set('infoWindow', infoWindow)
      window.google.maps.event.addListener(googleMapRef.current, 'closeAllInfoWindows', () => {
        infoWindow.close()
      })

      markersRef.current.set(farm.id, marker)
    })
  }, [filteredFarms, savedFarmIds, isMapLoaded])

  // Pan to selected farm
  useEffect(() => {
    if (!selectedFarm || !googleMapRef.current) return

    const farm = farms.find(f => f.id === selectedFarm)
    if (!farm) return

    googleMapRef.current.panTo({ lat: farm.latitude, lng: farm.longitude })
    googleMapRef.current.setZoom(13)
  }, [selectedFarm, farms])

  const getPreciseLocation = async () => {
    setShowControls(false)
    
    try {
      const location = await getBrowserLocation()
      setMapCenter(location)
      storeUserLocation(userId || "", location)
      
      if (googleMapRef.current && location.latitude && location.longitude) {
        const exactPosition = { lat: location.latitude, lng: location.longitude }
        googleMapRef.current.setCenter(exactPosition)
        googleMapRef.current.setZoom(12)
      }

      // Save to database if signed in
      if (isSignedIn && userId) {
        try {
          const token = await (window as any).Clerk?.session?.getToken()
          if (token) {
            await fetch(`${API_URL}/api/users/update-location`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                latitude: location.latitude,
                longitude: location.longitude,
                city: location.city,
                region: location.region
              })
            })
          }
        } catch (dbError) {
          console.error('Error saving location:', dbError)
        }
      }
    } catch (error: any) {
      console.error('Precise location error:', error)
    }
  }

  const searchThisArea = () => {
    if (!googleMapRef.current) return
    
    const center = googleMapRef.current.getCenter()
    if (center) {
      const newLocation: UserLocation = {
        ...mapCenter!,
        latitude: center.lat(),
        longitude: center.lng(),
        city: 'Map Center',
      }
      setMapCenter(newLocation)
      setShowSearchThisArea(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row relative">
      {/* Map Section - Left on desktop, top on mobile */}
      <div className="w-full lg:w-3/4 h-[70vh] lg:h-[80vh] relative">
        {isLoadingLocation ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Finding farms near you...</p>
            </div>
          </div>
        ) : (
          <>
            <div ref={mapRef} className="w-full h-full" />
            
            {showSearchThisArea && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                <Button onClick={searchThisArea} className="shadow-lg">
                  <Search className="h-4 w-4 mr-2" />
                  Search This Area
                </Button>
              </div>
            )}

            {/* Mobile Controls */}
            <div className="lg:hidden">
              <div className="absolute bottom-4 left-4 z-40">
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full shadow-xl"
                  onClick={() => setShowControls(!showControls)}
                >
                  {showControls ? <X className="h-6 w-6" /> : <Settings2 className="h-6 w-6" />}
                </Button>
              </div>

              {showControls && (
                <>
                  <div className="absolute inset-0 bg-black/20 z-30" onClick={() => setShowControls(false)} />
                  <div className="absolute inset-x-0 bottom-0 z-40 animate-in slide-in-from-bottom-5">
                    <Card className="rounded-t-2xl rounded-b-none shadow-2xl border-t-2">
                      <CardHeader className="pb-3 pt-4 px-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold">Filters</h2>
                          <Button variant="ghost" size="sm" onClick={() => setShowControls(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 pt-0 space-y-6">
                        {showRadiusControl && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-sm">Search Radius</h3>
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
                        )}

                        {!hideCategoryFilter && (
                          <div>
                            <h3 className="font-semibold text-sm mb-3">Farm Type</h3>
                            <select
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className="w-full px-3 py-2 border rounded-md text-sm"
                            >
                              {availableCategories.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {showUserMarker && (
                          <div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={getPreciseLocation}
                              className="w-full"
                            >
                              <Navigation className="h-4 w-4 mr-2" />
                              Use My Exact Location
                            </Button>
                            {locationError && (
                              <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                <p className="text-xs text-destructive">{locationError}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sidebar - Right on desktop, bottom on mobile */}
      <div className="w-full lg:w-1/4 bg-white border-l overflow-y-auto h-auto lg:h-[80vh]">
        <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
          {/* Desktop Location Control */}
          <div className="hidden lg:block space-y-4">
            {showUserMarker && (
              <div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={getPreciseLocation}
                  className="w-full"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Use My Exact Location
                </Button>
                {locationError && (
                  <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{locationError}</p>
                  </div>
                )}
              </div>
            )}

            {showRadiusControl && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Search Radius</h3>
                  <Badge variant="outline" className="text-xs">
                    {radius}km
                  </Badge>
                </div>
                <Slider
                  value={[radius]}
                  onValueChange={(value) => setRadius(value[0])}
                  min={10}
                  max={200}
                  step={5}
                />
              </div>
            )}

            {!hideCategoryFilter && (
              <div>
                <h3 className="font-semibold text-sm mb-3">Farm Type</h3>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer text-xs transition-colors",
                        selectedCategory === category
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "hover:bg-primary/10"
                      )}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Farm List */}
          <div>
            <h1 className="font-semibold text-sm mb-3">
              {pageTitle}
            </h1>
            {showFarmCount && (
              <p className="text-xs text-muted-foreground mb-2">
                {isLoadingFarms ? "Loading..." : `${filteredFarms.length} farm${filteredFarms.length !== 1 ? 's' : ''}`}
              </p>
            )}
            {mapCenter && (
              <p className="text-xs text-muted-foreground mb-2">
                📍 {mapCenter.city || 'Your location'} • {radius}km radius
              </p>
            )}
            <div className="space-y-3">
              {isLoadingFarms ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                </div>
              ) : farms.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No farms found. Try increasing the radius.
                </p>
              ) : (
                filteredFarms.map((farm) => (
                  <Card
                    key={farm.id}
                    id={`farm-${farm.id}`}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedFarm === farm.id && "ring-2 ring-primary",
                      farm.featured === 1 && "border-2 border-yellow-400 bg-yellow-50/30"
                    )}
                    onClick={() => setSelectedFarm(farm.id)}
                  >
                    <CardHeader className="pb-1 p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {farm.categories && (
                            <div className="flex items-center gap-1 mb-1 flex-wrap">
                              {farm.categories.split(',').slice(0, 4).map((cat, idx) => (
                                <span
                                  key={idx}
                                  className="text-lg"
                                  title={cat.trim()}
                                >
                                  {getCategoryEmoji(cat.trim())}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <CardTitle className="text-xs leading-tight">{farm.name}</CardTitle>
                            {(farm.verified === 1 || farm.featured === 1) && (
                              <div className="flex gap-1">
                                {farm.verified === 1 && (
                                  <span className="text-xs" title="Verified">✓</span>
                                )}
                                {farm.featured === 1 && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 text-yellow-600 border-yellow-600">
                                    Featured
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mb-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {farm.distance ? `${farm.distance % 1 === 0 ? Math.round(farm.distance) : farm.distance}km away` : `${farm.city_name}, ${farm.state_province}`}
                          </div>

                          {/* Stats: Subscriber count and Reviews */}
                          <div className="space-y-1">
                            {/* Subscriber count */}
                            <div className="flex items-center gap-1 text-xs">
                              <Bell className="h-3 w-3 text-primary" />
                              <span className="font-medium text-foreground">
                                {farmStats[farm.id.startsWith('zcrm_') ? farm.id : `zcrm_${farm.id}`] || 0}
                              </span>
                              <span className="text-muted-foreground">
                                {(farmStats[farm.id.startsWith('zcrm_') ? farm.id : `zcrm_${farm.id}`] || 0) === 1 ? 'subscriber' : 'subscribers'}
                              </span>
                            </div>

                            {/* Review rating */}
                            <div className="flex items-center gap-1 text-xs">
                              {farm.reviews && farm.reviews > 0 ? (
                                <>
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  <span className="font-medium text-foreground">{farm.rating?.toFixed(1) || '5.0'}</span>
                                  <span className="text-muted-foreground">
                                    ({farm.reviews} {farm.reviews === 1 ? 'review' : 'reviews'})
                                  </span>
                                </>
                              ) : (
                                <span className="text-muted-foreground italic">No reviews yet</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <SubscribeButton
                            farmId={farm.id.startsWith('zcrm_') ? farm.id : `zcrm_${farm.id}`}
                            farmName={farm.name}
                            farmSlug={farm.slug}
                            city={farm.city_name}
                            state={farm.state_province}
                            phone={farm.phone}
                            website={farm.website}
                            variant="icon"
                            size="sm"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 p-2.5">
                      <Link 
                        href={`/farms/${farm.slug}`} 
                        className="w-full block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button 
                          size="sm" 
                          className="w-full text-xs bg-primary hover:bg-primary/90 text-white transition-all hover:shadow-md"
                          asChild
                        >
                          <span>View Details</span>
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schema.org markup for farms */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateFarmsSchema(filteredFarms as any))
        }}
      />
    </div>
  )
}
