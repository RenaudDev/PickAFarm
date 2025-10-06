// Utility functions for Google Static Maps API
// Can be used both server-side and client-side

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

export interface StaticMapOptions {
  center: { lat: number; lng: number }
  farms: Farm[]
  zoom: number
  width?: number
  height?: number
  showCityMarker?: boolean
}

/**
 * Build Google Static Maps API URL
 * Works in both server and client environments
 */
export function buildStaticMapUrl({
  center,
  farms,
  zoom,
  width = 1200,
  height = 600,
  showCityMarker = false,
}: StaticMapOptions): string {
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

  // Center marker - green for city marker, blue for user location
  if (showCityMarker) {
    url += `&markers=color:green|size:mid|${center.lat},${center.lng}`
  } else {
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

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Filter farms by radius from a center point
 */
export function filterFarmsByRadius(
  farms: Farm[],
  center: { lat: number; lng: number },
  radiusKm: number
): Farm[] {
  return farms.filter(farm => {
    if (!farm.latitude || !farm.longitude) return false
    const distance = calculateDistance(center.lat, center.lng, farm.latitude, farm.longitude)
    return distance <= radiusKm
  })
}
