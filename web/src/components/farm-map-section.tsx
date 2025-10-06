"use client"

import { useState, useEffect } from "react"
import { ProgressiveMapLayout } from "./progressive-map-layout"
import { getUserLocation, type UserLocation } from "@/lib/location-utils"
import farmsData from "../../data/farms.json"

export function FarmMapSection() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)

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

  // Get active farms for static map
  const activeFarms = farmsData
    .filter((f: any) => f.active === 1 && f.latitude && f.longitude)
    .slice(0, 100) // Limit for performance

  return (
    <ProgressiveMapLayout
      centerLocation={userLocation}
      isLoadingLocation={isLoadingLocation}
      locationError={locationError}
      showUserMarker={true}
      showCityMarker={false}
      pageTitle="All U-Pick Farms Near You"
      preFilteredFarms={activeFarms as any}
      staticMapZoom={6}
      staticMapWidth={1200}
      staticMapHeight={600}
    />
  )
}
