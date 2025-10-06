"use client"

import { useMemo } from "react"
import { MapPageLayout } from "@/components/map-page-layout"
import type { UserLocation } from "@/lib/location-utils"

// Import real location data
import locationsWithFarms from "../../../data/locations-with-farms.json"

interface SearchResultsContentProps {
  params: {
    cities: string
  }
}



export default function SearchResultsContent({ params }: SearchResultsContentProps) {
  const cities = params.cities || ""

  // Find the location data from locations-with-farms.json
  const locationData = locationsWithFarms.find(loc => loc.location_slug === cities)

  // If no location found, show error state
  if (!locationData) {
    return (
      <main className="flex-1 max-w-7xl my-12 mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">The location "{cities}" could not be found.</p>
        </div>
      </main>
    )
  }

  // Get all farms for this location
  const allFarms = locationData.farms || []

  // Create city center location from farms coordinates
  const cityLocation = useMemo((): UserLocation | null => {
    if (!allFarms || allFarms.length === 0) return null
    
    const validFarms = allFarms.filter(f => f.latitude && f.longitude)
    if (validFarms.length === 0) return null
    
    const avgLat = validFarms.reduce((sum, f) => sum + f.latitude, 0) / validFarms.length
    const avgLng = validFarms.reduce((sum, f) => sum + f.longitude, 0) / validFarms.length
    
    return {
      latitude: avgLat,
      longitude: avgLng,
      city: locationData.name,
      region: locationData.province,
      country: 'Canada',
      detectedAt: new Date().toISOString(),
      source: 'ip'
    }
  }, [allFarms, locationData])

  // Filter active farms to get the correct count and map fields
  const activeFarms = useMemo(() => {
    return allFarms
      .filter(f => f.latitude && f.longitude)
      .map(farm => ({
        ...farm,
        city_name: farm.city,
        state_province: farm.province
      }))
  }, [allFarms])

  return (
    <MapPageLayout
      centerLocation={cityLocation}
      isLoadingLocation={false}
      showUserMarker={false}
      showCityMarker={true}
      pageTitle={`${activeFarms.length} U-Pick Farms in ${locationData.full_location}`}
      showFarmCount={false}
      preFilteredFarms={activeFarms as any}
      filterByRadius={false}
      showRadiusControl={false}
      showRadiusCircle={true}
    />
  )
}
