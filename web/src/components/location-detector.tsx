'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserLocation, formatLocation, type UserLocation } from '@/lib/location-utils';

/**
 * Component that detects and stores user location on sign-in
 * Runs silently in the background
 */
export function LocationDetector() {
  const { user, isLoaded } = useUser();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    async function detectLocation() {
      if (!isLoaded || !user?.id || isDetecting) return;

      setIsDetecting(true);

      try {
        const userLocation = await getUserLocation(user.id);
        if (userLocation) {
          setLocation(userLocation);
          console.log('📍 User location detected:', formatLocation(userLocation));
        }
      } catch (error) {
        console.error('Failed to detect location:', error);
      } finally {
        setIsDetecting(false);
      }
    }

    detectLocation();
  }, [user?.id, isLoaded, isDetecting]);

  // This component doesn't render anything
  return null;
}
