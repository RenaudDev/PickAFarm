'use client';

import { useState, useEffect, ReactNode } from 'react';
import { MobileStaticMap } from '@/components/mobile-static-map';
import { getUserLocation, calculateDistance } from '@/lib/location-utils';
import farmsData from '../../data/farms.json';

interface AdaptiveMapWrapperProps {
  children: ReactNode;
  preFilteredFarms?: any[];
}

// Global state for interactive map visibility (accessible across components)
let globalShowInteractiveMap = false;
const listeners: Set<() => void> = new Set();

function setGlobalShowInteractiveMap(value: boolean) {
  globalShowInteractiveMap = value;
  listeners.forEach((listener) => listener());
}

export function useInteractiveMap() {
  const [showInteractiveMap, setShowInteractiveMap] = useState(globalShowInteractiveMap);

  useEffect(() => {
    const listener = () => setShowInteractiveMap(globalShowInteractiveMap);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { showInteractiveMap };
}

export function AdaptiveMapWrapper({ children, preFilteredFarms }: AdaptiveMapWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [nearbyFarmCount, setNearbyFarmCount] = useState(0);
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    setIsClient(true);

    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate nearby farms based on user location
  useEffect(() => {
    if (!isClient || !isMobile) {
      setIsCalculating(false);
      return;
    }

    async function calculateNearbyFarms() {
      try {
        const location = await getUserLocation('');

        if (!location || !location.latitude || !location.longitude) {
          setNearbyFarmCount(0);
          setIsCalculating(false);
          return;
        }

        // Use same logic as MapPageLayout: filter by radius (100km default)
        const radius = 100;
        const sourceFarms = preFilteredFarms || farmsData;

        const nearbyFarms = sourceFarms.filter((farm: any) => {
          if (!farm.latitude || !farm.longitude) return false;
          if (!preFilteredFarms && farm.active !== 1) return false;

          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            farm.latitude,
            farm.longitude
          );

          return distance <= radius;
        });

        setNearbyFarmCount(nearbyFarms.length);
      } catch (error) {
        console.error('Failed to calculate nearby farms:', error);
        setNearbyFarmCount(0);
      } finally {
        setIsCalculating(false);
      }
    }

    calculateNearbyFarms();
  }, [isClient, isMobile, preFilteredFarms]);

  // Update global state when interactive map is shown
  useEffect(() => {
    if (showInteractiveMap && isMobile) {
      setGlobalShowInteractiveMap(true);
    }
    return () => {
      if (showInteractiveMap && isMobile) {
        setGlobalShowInteractiveMap(false);
      }
    };
  }, [showInteractiveMap, isMobile]);

  // On server or desktop, always show interactive map
  if (!isClient || !isMobile || showInteractiveMap) {
    return <>{children}</>;
  }

  // On mobile client, show static map with modal until user clicks
  return (
    <MobileStaticMap
      onLoadInteractiveMap={() => setShowInteractiveMap(true)}
      farmCount={nearbyFarmCount}
      isCalculating={isCalculating}
    />
  );
}
