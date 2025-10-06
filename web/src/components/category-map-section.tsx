"use client"

import { useState, useEffect } from "react"
import { ProgressiveMapLayout } from "./progressive-map-layout"
import { getUserLocation, type UserLocation } from "@/lib/location-utils"
import { getFarmsForCategory } from "@/lib/category-utils"

interface CategoryMapSectionProps {
  categoryName: string
  categorySlug: string
}

export function CategoryMapSection({
  categoryName,
  categorySlug
}: CategoryMapSectionProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Get farms for this category (client-side filtering)
  const categoryFarms = getFarmsForCategory(categoryName)

  // Detect user location on mount
  useEffect(() => {
    async function loadLocation() {
      try {
        const location = await getUserLocation("")
        if (location && location.latitude && location.longitude) {
          setUserLocation(location)
        } else {
          setLocationError("Unable to detect your location")
        }
      } catch (error) {
        console.error('Failed to load location:', error)
        setLocationError("Unable to detect your location")
      } finally {
        setIsLoadingLocation(false)
      }
    }
    loadLocation()
  }, [])

  return (
    <ProgressiveMapLayout
      centerLocation={userLocation} // CENTER ON USER'S LOCATION
      isLoadingLocation={isLoadingLocation}
      locationError={locationError}
      pageTitle={`All ${categoryName} Near You`} // "All Christmas Tree Farms Near You"
      showUserMarker={true} // Show user's location pin
      showCityMarker={false}
      showRadiusControl={true} // Keep radius slider (default 100km)
      showRadiusCircle={true} // Show radius circle around user
      showDistances={true} // Show "5km away" etc
      filterByRadius={true} // Filter by distance from user
      sortBy="distance" // Sort by distance from user (closest first)
      hideCategoryFilter={true} // KEY: Hide category dropdown (already filtered)
      initialZoom={undefined} // Use default zoom based on user location
      staticMapZoom={9}
      preFilteredFarms={categoryFarms as any} // Pass category-filtered farms
      staticMapWidth={1200}
      staticMapHeight={600}
    />
  )
}
