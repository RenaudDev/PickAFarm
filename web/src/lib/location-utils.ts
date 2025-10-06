export interface UserLocation {
  city: string
  region: string // Province/State
  country: string
  latitude: number
  longitude: number
  detectedAt: string
  source?: 'ip' | 'browser' | 'saved' | 'default'
}

/**
 * Detect user's city-level location using IP geolocation
 * Uses ipapi.co free tier (no API key needed, 1000 requests/day)
 */
export async function detectUserLocation(): Promise<UserLocation | null> {
  try {
    const response = await fetch('https://ipapi.co/json/')
    
    if (!response.ok) {
      throw new Error('Failed to fetch location')
    }
    
    const data = await response.json()
    
    return {
      city: data.city || 'Unknown',
      region: data.region || data.region_code || '',
      country: data.country_name || data.country || '',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      detectedAt: new Date().toISOString(),
      source: 'ip'
    }
  } catch (error) {
    console.error('Error detecting location:', error)
    return null
  }
}

/**
 * Get stored user location from localStorage
 */
export function getStoredLocation(userId: string): UserLocation | null {
  try {
    const stored = localStorage.getItem(`user-location-${userId}`)
    if (stored) {
      return JSON.parse(stored)
    }
    return null
  } catch (error) {
    console.error('Error getting stored location:', error)
    return null
  }
}

/**
 * Store user location in localStorage
 */
export function storeUserLocation(userId: string, location: UserLocation): void {
  try {
    localStorage.setItem(`user-location-${userId}`, JSON.stringify(location))
  } catch (error) {
    console.error('Error storing location:', error)
  }
}

/**
 * Clear stored location
 */
export function clearStoredLocation(userId: string): void {
  try {
    localStorage.removeItem(`user-location-${userId}`)
  } catch (error) {
    console.error('Error clearing location:', error)
  }
}

/**
 * Check if location data is stale (older than 30 days)
 */
export function isLocationStale(location: UserLocation): boolean {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const detectedDate = new Date(location.detectedAt)
  return detectedDate < thirtyDaysAgo
}

/**
 * Get or detect user location
 * Returns stored location if fresh, otherwise detects new location
 */
export async function getUserLocation(userId: string): Promise<UserLocation | null> {
  // Try to get stored location first
  const stored = getStoredLocation(userId)
  
  // If stored and not stale, return it
  if (stored && !isLocationStale(stored)) {
    return stored
  }
  
  // Otherwise, detect new location
  const detected = await detectUserLocation()
  
  // Store the new location
  if (detected) {
    storeUserLocation(userId, detected)
  }
  
  return detected
}

/**
 * Reverse geocode coordinates to get city name
 * Uses OpenStreetMap Nominatim API (free, no API key needed)
 */
async function reverseGeocode(latitude: number, longitude: number): Promise<{ city: string; region: string; country: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'PickAFarm/1.0' // Required by Nominatim
        }
      }
    )

    if (!response.ok) {
      throw new Error('Reverse geocoding failed')
    }

    const data = await response.json()
    const address = data.address || {}

    // Try different city fields in order of preference
    const city = address.city || address.town || address.village || address.municipality || 'Unknown City'
    const region = address.state || address.province || address.region || ''
    const country = address.country || ''

    return { city, region, country }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return { city: 'Current Location', region: '', country: '' }
  }
}

/**
 * Get user's precise location from browser geolocation API
 * Requires user permission
 */
export async function getBrowserLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    // High accuracy options for GPS precision
    const options = {
      enableHighAccuracy: true,  // Use GPS on mobile devices
      timeout: 10000,            // Wait up to 10 seconds
      maximumAge: 0              // Don't use cached position, get fresh coords
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        console.log('📍 GPS coordinates detected:', { latitude, longitude })
        console.log(`📍 Accuracy: ${position.coords.accuracy}m`)

        // Reverse geocode to get city name
        const geocoded = await reverseGeocode(latitude, longitude)

        const location: UserLocation = {
          city: geocoded.city,
          region: geocoded.region,
          country: geocoded.country,
          latitude,
          longitude,
          detectedAt: new Date().toISOString(),
          source: 'browser'
        }

        console.log('📍 Location with city name:', location)
        resolve(location)
      },
      (error) => {
        console.error('Browser geolocation error:', error)

        let errorMessage = 'Unable to get your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.'
            break
        }

        reject(new Error(errorMessage))
      },
      options
    )
  })
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Format location for display
 */
export function formatLocation(location: UserLocation): string {
  return `${location.city}, ${location.region}`
}
