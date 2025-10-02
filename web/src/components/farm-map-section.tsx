"use client"

import { useState, useEffect } from "react"
import { MapPageLayout } from "./map-page-layout"
import { getUserLocation, type UserLocation } from "@/lib/location-utils"

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

  return (
    <MapPageLayout 
      centerLocation={userLocation}
      isLoadingLocation={isLoadingLocation}
      locationError={locationError}
      showUserMarker={true}
      showCityMarker={false}
      pageTitle="All U-Pick Farms Near You"
    />
  )
}
