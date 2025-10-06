"use client"

import { useState, useEffect, ReactNode, createContext, useContext } from 'react'
import { MobileStaticMap } from '@/components/mobile-static-map'
import { getUserLocation, calculateDistance } from '@/lib/location-utils'
import farmsData from '../../data/farms.json'

interface AdaptiveMapWrapperProps {
  children: ReactNode
  preFilteredFarms?: any[]
}

// Create context to share interactive map state
const InteractiveMapContext = createContext({ showInteractiveMap: false })

export function useInteractiveMap() {
  return useContext(InteractiveMapContext)
}

export function AdaptiveMapWrapper({ children, preFilteredFarms }: AdaptiveMapWrapperProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [showInteractiveMap, setShowInteractiveMap] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [nearbyFarmCount, setNearbyFarmCount] = useState(0)
  const [isCalculating, setIsCalculating] = useState(true)

  useEffect(() => {
    setIsClient(true)

    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calculate nearby farms based on user location
  useEffect(() => {
    if (!isClient || !isMobile) {
      setIsCalculating(false)
      return
    }

    async function calculateNearbyFarms() {
      try {
        const location = await getUserLocation("")

        if (!location || !location.latitude || !location.longitude) {
          setNearbyFarmCount(0)
          setIsCalculating(false)
          return
        }

        // Use same logic as MapPageLayout: filter by radius (100km default)
        const radius = 100
        const sourceFarms = preFilteredFarms || farmsData

        const nearbyFarms = sourceFarms.filter((farm: any) => {
          if (!farm.latitude || !farm.longitude) return false
          if (!preFilteredFarms && farm.active !== 1) return false

          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            farm.latitude,
            farm.longitude
          )

          return distance <= radius
        })

        setNearbyFarmCount(nearbyFarms.length)
      } catch (error) {
        console.error('Failed to calculate nearby farms:', error)
        setNearbyFarmCount(0)
      } finally {
        setIsCalculating(false)
      }
    }

    calculateNearbyFarms()
  }, [isClient, isMobile, preFilteredFarms])

  // On server or desktop, always show interactive map
  if (!isClient || !isMobile || showInteractiveMap) {
    return (
      <InteractiveMapContext.Provider value={{ showInteractiveMap: showInteractiveMap && isMobile }}>
        {children}
      </InteractiveMapContext.Provider>
    )
  }

  // On mobile client, show static map with modal until user clicks
  return (
    <InteractiveMapContext.Provider value={{ showInteractiveMap: false }}>
      <MobileStaticMap
        onLoadInteractiveMap={() => setShowInteractiveMap(true)}
        farmCount={nearbyFarmCount}
        isCalculating={isCalculating}
      />
    </InteractiveMapContext.Provider>
  )
}
