"use client"

import { MapPageLayout } from "./map-page-layout"
import type { UserLocation } from "@/lib/location-utils"

interface StateMapSectionProps {
  stateData: {
    state_name: string
    state_code: string
    center_latitude: number
    center_longitude: number
    zoom_level: number
    total_farms: number
    needs_pagination?: boolean
    total_pages?: number
    farms_per_page?: number
    farms: any[]
  }
}

export function StateMapSection({ stateData }: StateMapSectionProps) {
  // Create center location from state data
  const stateCenter: UserLocation = {
    latitude: stateData.center_latitude,
    longitude: stateData.center_longitude,
    city: stateData.state_name,
    region: stateData.state_code,
    country: 'US', // Will be determined from state data
    detectedAt: new Date().toISOString()
  }

  return (
    <MapPageLayout
      centerLocation={stateCenter}
      isLoadingLocation={false}
      locationError={null}
      pageTitle={`U-Pick Farms in ${stateData.state_name}`}
      showUserMarker={false}
      showCityMarker={true}
      showRadiusControl={false}
      showRadiusCircle={false}
      showDistances={false}
      filterByRadius={false}
      sortBy="featured"
      initialZoom={stateData.zoom_level}
      enableClustering={stateData.total_farms >= 50}
      enableVirtualScrolling={stateData.total_farms >= 50}
      preFilteredFarms={stateData.farms}
      pagination={stateData.needs_pagination ? {
        enabled: true,
        currentPage: 1, // TODO: Add URL param support for pagination
        totalPages: stateData.total_pages || 1,
        farmsPerPage: stateData.farms_per_page || 50
      } : undefined}
    />
  )
}
