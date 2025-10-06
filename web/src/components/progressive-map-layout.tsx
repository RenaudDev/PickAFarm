"use client"

import { useState, useEffect, useRef } from "react"
import { MapPageLayout } from "./map-page-layout"
import type { UserLocation } from "@/lib/location-utils"

interface Farm {
  id: string
  name: string
  slug: string
  latitude: number
  longitude: number
  categories?: string
  featured?: number | boolean
  city_name?: string
  state_province?: string
  verified?: number | boolean
  phone?: string
  website?: string
  reviews?: number
  rating?: number
  distance?: number
}

interface ProgressiveMapLayoutProps {
  // All the same props as MapPageLayout
  centerLocation: UserLocation | null
  isLoadingLocation: boolean
  locationError?: string | null
  showUserMarker?: boolean
  showCityMarker?: boolean
  pageTitle?: string
  showFarmCount?: boolean
  showRadiusControl?: boolean
  showRadiusCircle?: boolean
  filterByRadius?: boolean
  showDistances?: boolean
  sortBy?: "distance" | "featured" | "name" | "rating"
  hideCategoryFilter?: boolean
  initialZoom?: number
  enableClustering?: boolean
  maxVisibleMarkers?: number
  pagination?: any
  enableVirtualScrolling?: boolean
  lazyLoadMarkers?: boolean
  preFilteredFarms?: Farm[]
  // For static map generation
  staticMapZoom?: number
  staticMapWidth?: number
  staticMapHeight?: number
}

export function ProgressiveMapLayout(props: ProgressiveMapLayoutProps) {
  const [isInteractive, setIsInteractive] = useState(false)
  const [staticMapUrl, setStaticMapUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    centerLocation,
    isLoadingLocation,
    preFilteredFarms,
    staticMapZoom = 9,
    staticMapWidth = 1200,
    staticMapHeight = 600,
    initialZoom,
    showCityMarker,
  } = props

  // Build static map URL when location is ready
  useEffect(() => {
    if (!centerLocation || isLoadingLocation) {
      return
    }

    // Use the same zoom as the interactive map will use
    let finalZoom = staticMapZoom
    if (initialZoom !== undefined) {
      finalZoom = initialZoom
    } else if (showCityMarker) {
      finalZoom = 11 // City pages use zoom 11
    }

    // Filter farms by radius (100km default) to match what MapPageLayout will show
    let farmsToShow = preFilteredFarms || []

    // Only filter by radius if filterByRadius is true (default behavior)
    if (props.filterByRadius !== false && centerLocation) {
      const radius = 100 // Default radius in km
      farmsToShow = farmsToShow.filter(farm => {
        if (!farm.latitude || !farm.longitude) return false

        // Calculate distance using Haversine formula
        const R = 6371 // Earth's radius in km
        const dLat = (farm.latitude - centerLocation.latitude) * Math.PI / 180
        const dLon = (farm.longitude - centerLocation.longitude) * Math.PI / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(centerLocation.latitude * Math.PI / 180) *
          Math.cos(farm.latitude * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c

        return distance <= radius
      })
    }

    const url = buildStaticMapUrl({
      center: {
        lat: centerLocation.latitude,
        lng: centerLocation.longitude,
      },
      farms: farmsToShow.slice(0, 20), // Limit to 20 to keep URL short
      zoom: finalZoom,
      width: staticMapWidth,
      height: staticMapHeight,
      showCityMarker: showCityMarker || false,
    })

    console.log('🗺️ Static map URL generated:', url)
    console.log('📍 Center:', centerLocation)
    console.log('🏪 Total farms:', preFilteredFarms?.length || 0)
    console.log('🏪 Farms in radius:', farmsToShow.length)
    setStaticMapUrl(url)
  }, [centerLocation, isLoadingLocation, preFilteredFarms, staticMapZoom, staticMapWidth, staticMapHeight, initialZoom, showCityMarker, props.filterByRadius])

  // Show loading state while location is being detected OR static map URL is being generated
  if (isLoadingLocation || !staticMapUrl) {
    return (
      <div className="w-full h-[70vh] lg:h-[80vh] flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  // If static map image fails to load, show interactive map immediately
  if (imageError) {
    return <MapPageLayout {...props} preFilteredFarms={props.preFilteredFarms as any} />
  }

  // If interactive mode enabled, show full interactive map
  if (isInteractive) {
    return <MapPageLayout {...props} preFilteredFarms={props.preFilteredFarms as any} />
  }

  // Show MapPageLayout with static map overlaid on top of the interactive map section
  return (
    <div className="relative">
      {/* Full MapPageLayout (with interactive map + sidebar) */}
      <MapPageLayout {...props} preFilteredFarms={props.preFilteredFarms as any} />

      {/* Static map overlay - covers ONLY the map section (left 3/4), not the sidebar */}
      {staticMapUrl && (
        <div
          className="absolute top-0 left-0 w-full lg:w-3/4 h-[70vh] lg:h-[80vh] cursor-pointer z-40 bg-white"
          onClick={() => setIsInteractive(true)}
        >
          <img
            src={staticMapUrl}
            alt="Map showing farm locations - click to interact"
            width={staticMapWidth}
            height={staticMapHeight}
            loading="eager"
            fetchPriority="high"
            onError={() => {
              console.error('❌ Static map failed to load')
              setImageError(true)
            }}
            className="w-full h-full object-cover"
          />

          {/* Tap to interact hint - animated */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-2xl animate-bounce">
              <p className="text-base font-bold flex items-center gap-2">
                <span className="text-2xl">👆</span>
                Tap to interact with map
              </p>
            </div>
          </div>

          {/* Subtle pulsing ring around the hint */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
          </div>
        </div>
      )}
    </div>
  )
}

// Build Google Static Maps API URL
function buildStaticMapUrl({
  center,
  farms,
  zoom,
  width,
  height,
  showCityMarker,
}: {
  center: { lat: number; lng: number }
  farms: Farm[]
  zoom: number
  width: number
  height: number
  showCityMarker: boolean
}): string {
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCjA7seTNfSd-MypolPjrg6Q6648TSCvTE'

  // Start with base URL
  let url = 'https://maps.googleapis.com/maps/api/staticmap?'

  // Map parameters
  url += `center=${center.lat},${center.lng}`
  url += `&zoom=${zoom}`
  // Static Maps API max size is 640x640, use scale=2 for retina
  url += `&size=${Math.min(width, 640)}x${Math.min(height, 640)}`
  url += `&scale=2`
  url += `&format=png`
  url += `&maptype=roadmap`

  // Styling to match interactive map
  url += `&style=feature:poi.business|element:labels|visibility:off`

  // Center marker - green for city marker (like map-page-layout.tsx:414-428)
  if (showCityMarker) {
    url += `&markers=color:green|size:mid|${center.lat},${center.lng}`
  } else {
    // Blue dot for user location
    url += `&markers=color:blue|size:mid|${center.lat},${center.lng}`
  }

  // Group farm markers by category for color coding
  const markerGroups: Record<string, string[]> = {
    red: [], // Apples
    orange: [], // Pumpkins
    purple: [], // Berries
    green: [], // Christmas trees / default
  }

  farms.forEach((farm) => {
    if (!farm.latitude || !farm.longitude) return

    const coords = `${farm.latitude},${farm.longitude}`
    const categories = farm.categories?.toLowerCase() || ''

    if (categories.includes('apple')) {
      markerGroups.red.push(coords)
    } else if (categories.includes('pumpkin')) {
      markerGroups.orange.push(coords)
    } else if (categories.includes('berry')) {
      markerGroups.purple.push(coords)
    } else {
      markerGroups.green.push(coords)
    }
  })

  // Add marker groups to URL (max ~50 per group)
  Object.entries(markerGroups).forEach(([color, coords]) => {
    if (coords.length > 0) {
      const markerCoords = coords.slice(0, 50).join('|')
      url += `&markers=color:${color}|size:small|${markerCoords}`
    }
  })

  url += `&key=${API_KEY}`

  return url
}
