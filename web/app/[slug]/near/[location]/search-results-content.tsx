"use client"

import { useMemo } from "react"
import { MapPageLayout } from "@/components/map-page-layout"
import type { UserLocation } from "@/lib/location-utils"
import { CategoryIcon } from "@/lib/category-icons"
import { filterFarmsByCategory } from "@/lib/farm-utils"

// Import real location data
import locationsWithFarms from "../../../../data/locations-with-farms.json"
import categoriesData from "../../../../data/categories.json"

interface SearchResultsContentProps {
  params: {
    slug: string;
    location: string;
  };
}

export default function SearchResultsContent({ params }: SearchResultsContentProps) {
  const location = params.location || ""
  const category = params.slug || ""

  // Find the location data from locations-with-farms.json
  const locationData = locationsWithFarms.find(loc => loc.location_slug === location)
  const categoryData = categoriesData.find(cat => cat.slug === category)

  // If no location found, show error state
  if (!locationData) {
    return (
      <main className="flex-1 max-w-7xl my-12 mx-auto">
        <div className="text-center py-12">
          <CategoryIcon categoryName={category} className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">The location "{location}" could not be found.</p>
        </div>
      </main>
    )
  }

  // Filter farms by category
  const filteredFarms = filterFarmsByCategory(locationData.farms || [], category)

  // Create city center location from farms coordinates
  const cityLocation = useMemo((): UserLocation | null => {
    if (!filteredFarms || filteredFarms.length === 0) return null
    
    const validFarms = filteredFarms.filter(f => f.latitude && f.longitude)
    if (validFarms.length === 0) return null
    
    const avgLat = validFarms.reduce((sum, f) => sum + f.latitude, 0) / validFarms.length
    const avgLng = validFarms.reduce((sum, f) => sum + f.longitude, 0) / validFarms.length
    
    return {
      latitude: avgLat,
      longitude: avgLng,
      city: locationData.name,
      region: locationData.province,
      country: locationData.country,
      detectedAt: new Date().toISOString(),
      source: 'ip'
    }
  }, [filteredFarms, locationData])

  const pageTitle = categoryData 
    ? `${categoryData.name} Near ${locationData.full_location}`
    : `All ${locationData.name} U-Pick Farms Near You`

// Map farm fields to match MapPageLayout expected format with required fields
const mappedFarms = filteredFarms.map(farm => ({
  ...farm,
  city_name: farm.city,
  state_province: farm.province,
  latitude: farm.latitude ?? 0,  // Add default values for required fields
  longitude: farm.longitude ?? 0
}))

  return (
    <MapPageLayout
      centerLocation={cityLocation}
      isLoadingLocation={false}
      showUserMarker={false}
      showCityMarker={true}
      pageTitle={pageTitle}
      preFilteredFarms={mappedFarms}
    />
  )
}
