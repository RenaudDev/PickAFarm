"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Loader2, Search } from "lucide-react"
import { calculateDistance, type UserLocation } from "@/lib/location-utils"
import { getCategoryEmoji } from "@/lib/category-utils"

interface Farm {
  id: string
  name: string
  slug: string
  city_name: string
  state_province: string
  latitude: number
  longitude: number
  categories: string
  distance?: number
  featured?: number | boolean
  verified?: number | boolean
  reviews?: number
  rating?: number
}

interface FarmMapProps {
  farms: Farm[]
  centerLocation?: UserLocation | null // Location to center the map on (city or user location)
  showUserMarker?: boolean // Whether to show the user location marker
  initialRadius?: number
  showRadiusControl?: boolean
  onFarmSelect?: (farmId: string) => void
  className?: string
}

declare global {
  interface Window {
    google: any
  }
}

export function FarmMap({
  farms,
  centerLocation,
  showUserMarker = false,
  initialRadius = 100,
  showRadiusControl = false,
  onFarmSelect,
  className = "w-full h-[500px]"
}: FarmMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const radiusCircleRef = useRef<any>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [radius, setRadius] = useState(initialRadius)
  const [showSearchThisArea, setShowSearchThisArea] = useState(false)
  const [mapCenter, setMapCenter] = useState<UserLocation | null>(centerLocation || null)

  // Calculate distances and filter by radius
  const farmsWithDistance = useMemo(() => {
    if (!mapCenter) return farms

    return farms
      .map(farm => ({
        ...farm,
        distance: Math.round(calculateDistance(
          mapCenter.latitude,
          mapCenter.longitude,
          farm.latitude,
          farm.longitude
        ) * 10) / 10
      }))
      .filter(farm => farm.distance <= radius)
      .sort((a, b) => {
        if (a.featured === 1 && b.featured !== 1) return -1
        if (b.featured === 1 && a.featured !== 1) return 1
        return (a.distance || 0) - (b.distance || 0)
      })
  }, [farms, mapCenter, radius])

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if already loaded
    if (window.google && window.google.maps) {
      setIsMapLoaded(true)
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsMapLoaded(true))
      return
    }

    // Load the script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    script.async = true
    script.defer = true
    script.onload = () => setIsMapLoaded(true)
    script.onerror = () => console.error('Failed to load Google Maps')
    document.head.appendChild(script)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || googleMapRef.current) return

    // Get center point - use mapCenter, first farm, or default to Canada center
    let centerLat = 45.4215
    let centerLng = -75.6972
    
    if (mapCenter) {
      centerLat = mapCenter.latitude
      centerLng = mapCenter.longitude
    } else if (farmsWithDistance.length > 0 && farmsWithDistance[0].latitude) {
      centerLat = farmsWithDistance[0].latitude
      centerLng = farmsWithDistance[0].longitude
    }

    console.log('🗺️ Initializing map at:', centerLat, centerLng)

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: centerLat, lng: centerLng },
      zoom: mapCenter ? 9 : 5, // Zoom in if we have user location, zoom out if showing all farms
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      draggable: true,
      zoomControl: true,
      scrollwheel: true,
      gestureHandling: 'greedy',
    })

    // Listen for map center changes
    googleMapRef.current.addListener('dragend', () => {
      const newCenter = googleMapRef.current.getCenter()
      if (newCenter) {
        setShowSearchThisArea(true)
      }
    })

    // Add user location marker if requested
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
  }, [isMapLoaded, mapCenter, farmsWithDistance, showUserMarker])

  // Update radius circle
  useEffect(() => {
    if (!googleMapRef.current || !mapCenter || !window.google || !showRadiusControl) return

    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null)
    }

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
  }, [mapCenter, radius, isMapLoaded, showRadiusControl])

  // Update markers
  useEffect(() => {
    if (!googleMapRef.current || !window.google || !isMapLoaded) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current.clear()

    // Add new markers
    farmsWithDistance.forEach((farm) => {
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
        ? farm.categories.split(',').slice(0, 2).map(cat => getCategoryEmoji(cat.trim())).join(' ')
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
            ${farm.distance ? `<div style="color: #666; font-size: 13px; margin-bottom: 4px;">
              📍 ${farm.distance}km away
            </div>` : ''}
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
        if (onFarmSelect) onFarmSelect(farm.id)
      })
      
      marker.set('infoWindow', infoWindow)
      window.google.maps.event.addListener(googleMapRef.current, 'closeAllInfoWindows', () => {
        infoWindow.close()
      })

      markersRef.current.set(farm.id, marker)
    })
  }, [farmsWithDistance, isMapLoaded, onFarmSelect])

  const searchThisArea = () => {
    if (!googleMapRef.current) return
    
    const center = googleMapRef.current.getCenter()
    if (center) {
      setMapCenter({
        latitude: center.lat(),
        longitude: center.lng(),
        city: 'Map Center',
        region: '',
        country: '',
        detectedAt: new Date().toISOString(),
        source: 'browser'
      })
      setShowSearchThisArea(false)
    }
  }

  if (!isMapLoaded) {
    return (
      <div className={className}>
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
      
      {showSearchThisArea && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Button onClick={searchThisArea} className="shadow-lg">
            <Search className="h-4 w-4 mr-2" />
            Search This Area
          </Button>
        </div>
      )}

      {showRadiusControl && mapCenter && (
        <div className="absolute top-4 right-4 z-10 bg-white p-4 rounded-lg shadow-lg max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Search Radius</h3>
            <Badge variant="outline">{radius}km</Badge>
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
    </div>
  )
}
