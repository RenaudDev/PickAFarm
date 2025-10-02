export interface UserLocation {
  city: string
  region: string // Province/State
  country: string
  latitude: number
  longitude: number
  detectedAt: string
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
      detectedAt: new Date().toISOString()
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
 * Format location for display
 */
export function formatLocation(location: UserLocation): string {
  return `${location.city}, ${location.region}`
}
