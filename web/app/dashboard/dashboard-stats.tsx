'use client';

/**
 * Dashboard Stats Client Component Island
 * Story 2.2.3: Dashboard Page Fixes
 *
 * Extracted from main dashboard page to handle client-side features:
 * - API calls for saved farms count (requires auth token)
 * - localStorage access for user location
 * - Loading states and error handling
 */

import { useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { getStoredLocation, formatLocation, type UserLocation } from '@/lib/location-utils';
import { MapPin } from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';

interface DashboardStatsProps {
  userId: string;
}

export function DashboardStats({ userId }: DashboardStatsProps) {
  const { getToken } = useAuth();
  const [savedFarmsCount, setSavedFarmsCount] = useState(0);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Fix hydration by only rendering client-side content after mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!userId) {
        setIsLoadingFarms(false);
        return;
      }

      // Get user's location from localStorage
      const location = getStoredLocation(userId);
      setUserLocation(location);

      // Fetch saved farms count from API with timeout
      try {
        const token = await getToken();

        // Add 10 second timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${API_URL}/api/farms/saved`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setSavedFarmsCount(data.count || 0);
        } else {
          console.error('API error:', response.status, response.statusText);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('API request timed out after 10 seconds');
        } else {
          console.error('Error fetching saved farms:', error);
        }
        // Set count to 0 on error so user still sees the page
        setSavedFarmsCount(0);
      } finally {
        setIsLoadingFarms(false);
      }
    }

    if (isHydrated) {
      fetchDashboardData();
    }
  }, [userId, getToken, isHydrated]);

  // Show loading skeleton during initial hydration to prevent flashing
  if (!isHydrated) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* User Location Badge */}
      {userLocation && (
        <div className="flex items-center gap-1.5 text-sm text-primary bg-primary/10 px-3 py-1 rounded-full w-fit">
          <MapPin className="w-4 h-4" />
          <span className="font-medium">{formatLocation(userLocation)}</span>
        </div>
      )}

      {/* Saved Farms Count Card */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">Your Subscriptions</h3>
          {isLoadingFarms ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {savedFarmsCount === 0
                  ? "You haven't subscribed to any farms yet"
                  : `You are subscribed to ${savedFarmsCount} farm${savedFarmsCount !== 1 ? 's' : ''}`}
              </p>
              {savedFarmsCount > 0 && (
                <a
                  href="/saved-farms"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  View your subscriptions →
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
