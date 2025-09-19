"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

interface Farm {
  id: string
  name: string
  slug: string
  url: string
  latitude: number
  longitude: number
  city: string
  province: string
  country: string
  categories: string
  featured?: boolean
  distance_km: number
}

interface LocationData {
  name: string
  slug: string
  coordinates: {
    latitude: number
    longitude: number
  }
  province: string
  country: string
  location_slug: string
  full_location: string
  farms: Farm[]
  farmCount: number
}

interface GoogleMapsProps {
  locationData: LocationData
  categoryFilter?: string
  radius?: number // radius in km
  zoom?: number
  className?: string
}

declare global {
  interface Window {
    google: any
  }
}

export default function GoogleMaps({ 
  locationData, 
  categoryFilter,
  radius = 100, 
  zoom = 10, 
  className = "w-full h-96" 
}: GoogleMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [map, setMap] = useState<any>(null)
  const markersRef = useRef<any[]>([])
  const circleRef = useRef<any>(null)

  // Memoize filtered farms to prevent unnecessary recalculations
  const filteredFarms = useMemo(() => {
    if (!categoryFilter) return locationData.farms

    return locationData.farms.filter(farm => {
      const farmCategories = JSON.parse(farm.categories || '[]')
      const categoryMap: Record<string, string[]> = {
        'apple-orchards': ['Apple Orchard', 'Apple Picking'],
        'pumpkin-patches': ['Pumpkin Patch'],
        'berry-farms': ['Berry Farm', 'Berry Picking'],
        'christmas-tree-farms': ['Christmas Trees']
      }
      const matchingCategories = categoryMap[categoryFilter] || []
      return matchingCategories.some(catName => 
        farmCategories.some((farmCat: string) => 
          farmCat.toLowerCase().includes(catName.toLowerCase())
        )
      )
    })
  }, [locationData.farms, categoryFilter])

  // Memoize center coordinates
  const center = useMemo(() => ({
    lat: locationData.coordinates.latitude,
    lng: locationData.coordinates.longitude
  }), [locationData.coordinates.latitude, locationData.coordinates.longitude])

  // Load Google Maps script
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap()
      return
    }

    // Load Google Maps script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCjA7seTNfSd-MypolPjrg6Q6648TSCvTE'}&libraries=geometry`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      setIsLoaded(true)
      initializeMap()
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup script if component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, []) // Empty dependency array - only run once

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: "poi.business",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        },
        {
          featureType: "poi.park",
          elementType: "labels.text",
          stylers: [{ visibility: "on" }]
        }
      ],
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true
    })

    setMap(mapInstance)
  }, [center, zoom])

  const clearMapElements = useCallback(() => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
    
    // Clear existing circle
    if (circleRef.current) {
      circleRef.current.setMap(null)
      circleRef.current = null
    }
  }, [])

  const updateMapContent = useCallback(() => {
    if (!map || !window.google) return

    // Clear existing elements
    clearMapElements()

    // Add radius circle
    const newCircle = new window.google.maps.Circle({
      strokeColor: '#22c55e',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#22c55e',
      fillOpacity: 0.1,
      map,
      center,
      radius: radius * 1000 // Convert km to meters
    })
    circleRef.current = newCircle

    // Add center marker for the location
    const centerMarker = new window.google.maps.Marker({
      position: center,
      map,
      title: `${locationData.name}, ${locationData.province}`,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="12" r="4" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16)
      }
    })
    markersRef.current.push(centerMarker)

    // Add center info window
    const centerInfoWindow = new window.google.maps.InfoWindow({
      content: `
        <div class="p-3">
          <h3 class="font-bold text-base mb-1">${locationData.full_location}</h3>
          <p class="text-sm text-gray-600 mb-2">Search Center</p>
          <p class="text-xs text-gray-500">${filteredFarms.length} farm${filteredFarms.length !== 1 ? 's' : ''} within ${radius}km</p>
        </div>
      `
    })

    centerMarker.addListener('click', () => {
      centerInfoWindow.open(map, centerMarker)
    })

    // Add farm markers
    filteredFarms.forEach((farm) => {
      const farmCategories = JSON.parse(farm.categories || '[]')
      
      // Choose marker color based on farm type
      const getMarkerColor = (categories: string[]) => {
        if (categories.some(cat => cat.toLowerCase().includes('apple'))) return '#ef4444' // Red for apples
        if (categories.some(cat => cat.toLowerCase().includes('pumpkin'))) return '#f97316' // Orange for pumpkins
        if (categories.some(cat => cat.toLowerCase().includes('berry'))) return '#8b5cf6' // Purple for berries
        if (categories.some(cat => cat.toLowerCase().includes('christmas'))) return '#059669' // Green for Christmas trees
        return '#22c55e' // Default green
      }

      const markerColor = getMarkerColor(farmCategories)
      
      const marker = new window.google.maps.Marker({
        position: { lat: farm.latitude, lng: farm.longitude },
        map,
        title: farm.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${markerColor}" stroke="#ffffff" stroke-width="1.5"/>
              <circle cx="12" cy="9" r="3" fill="#ffffff"/>
              ${farm.featured ? '<circle cx="18" cy="6" r="3" fill="#fbbf24" stroke="#ffffff" stroke-width="1"/>' : ''}
            </svg>
          `),
          scaledSize: new window.google.maps.Size(36, 36),
          anchor: new window.google.maps.Point(18, 36)
        }
      })

      markersRef.current.push(marker)

      // Add info window for farm
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-3 max-w-xs">
            <div class="flex items-start justify-between mb-2">
              <h3 class="font-bold text-base leading-tight pr-2">${farm.name}</h3>
              ${farm.featured ? '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Featured</span>' : ''}
            </div>
            <p class="text-sm text-gray-600 mb-2">${farm.city}, ${farm.province}</p>
            <p class="text-xs text-gray-500 mb-2">${farmCategories.join(', ')}</p>
            <div class="flex items-center justify-between">
              <span class="text-xs text-blue-600 font-medium">${farm.distance_km}km away</span>
              <a href="${farm.url}" class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">View Details</a>
            </div>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })
    })

    // Fit map to show all markers and circle
    if (filteredFarms.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      
      // Include center point
      bounds.extend(center)
      
      // Include all farm locations
      filteredFarms.forEach(farm => {
        bounds.extend({ lat: farm.latitude, lng: farm.longitude })
      })

      // Extend bounds to include circle radius
      const circleBounds = newCircle.getBounds()
      if (circleBounds) {
        bounds.union(circleBounds)
      }

      map.fitBounds(bounds)
      
      // Set reasonable zoom limits
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        const currentZoom = map.getZoom()
        if (currentZoom > 13) map.setZoom(13)
        if (currentZoom < 8) map.setZoom(8)
        window.google.maps.event.removeListener(listener)
      })
    } else {
      // No farms, just center on location
      map.setCenter(center)
      map.setZoom(10)
    }
  }, [map, center, radius, filteredFarms, locationData.name, locationData.province, locationData.full_location, clearMapElements])

  // Update map content when dependencies change
  useEffect(() => {
    if (map && isLoaded) {
      updateMapContent()
    }
  }, [map, isLoaded, updateMapContent])

  // Initialize map when loaded
  useEffect(() => {
    if (isLoaded) {
      initializeMap()
    }
  }, [isLoaded, initializeMap])

  return (
    <div className={`${className} rounded-lg overflow-hidden border shadow-sm bg-white`}>
      <div ref={mapRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
