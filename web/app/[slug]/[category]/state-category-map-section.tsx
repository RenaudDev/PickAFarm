"use client"

import { useMemo } from "react"
import { ProgressiveMapLayout } from "@/components/progressive-map-layout"
import type { UserLocation } from "@/lib/location-utils"

interface StateCategoryMapSectionProps {
  stateData: {
    state_name: string
    state_code: string
    center_latitude: number
    center_longitude: number
    zoom_level: number
  }
  categoryData: {
    name: string
    slug: string
  }
  farms: any[]
}

export default function StateCategoryMapSection({ 
  stateData, 
  categoryData, 
  farms 
}: StateCategoryMapSectionProps) {
  // Create center location from state data
  const stateCenter: UserLocation = useMemo(() => ({
    latitude: stateData.center_latitude,
    longitude: stateData.center_longitude,
    city: stateData.state_name,
    region: stateData.state_code,
    country: 'US',
    detectedAt: new Date().toISOString(),
    source: 'ip'
  }), [stateData])

  return (
    <ProgressiveMapLayout
      centerLocation={stateCenter}
      isLoadingLocation={false}
      locationError={null}
      pageTitle={`${farms.length} ${categoryData.name} in ${stateData.state_name}`}
      showFarmCount={false}
      showUserMarker={false}
      showCityMarker={true}
      showRadiusControl={false}
      showRadiusCircle={false}
      showDistances={false}
      filterByRadius={false}
      hideCategoryFilter={true}
      sortBy="featured"
      initialZoom={stateData.zoom_level}
      staticMapZoom={stateData.zoom_level}
      enableClustering={farms.length >= 50}
      enableVirtualScrolling={farms.length >= 50}
      preFilteredFarms={farms}
      staticMapWidth={1200}
      staticMapHeight={600}
      pagination={farms.length > 100 ? {
        enabled: true,
        totalPages: Math.ceil(farms.length / 50),
        currentPage: 1,
        farmsPerPage: 50
      } : undefined}
    />
  )
}
