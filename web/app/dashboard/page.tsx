'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { useAuth, useUser } from '@clerk/nextjs';
import { FarmNavbar } from '@/components/farm-navbar';
import { useState, useEffect } from 'react';
import { getStoredLocation, formatLocation, type UserLocation } from '@/lib/location-utils';
import { MapPin } from 'lucide-react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';

export default function DashboardPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [savedFarmsCount, setSavedFarmsCount] = useState(0);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user?.id) {
        setIsLoadingFarms(false);
        return;
      }

      // Get user's location
      const location = getStoredLocation(user.id);
      setUserLocation(location);

      // Fetch saved farms count from API
      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/farms/saved`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSavedFarmsCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching saved farms:', error);
      } finally {
        setIsLoadingFarms(false);
      }
    }

    fetchDashboardData();
  }, [user?.id, getToken]);

  return (
    <ProtectedRoute>
      <FarmNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Welcome back, {user?.firstName || 'there'}!
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-muted-foreground">This is your personal dashboard</p>
              {userLocation && (
                <div className="flex items-center gap-1.5 text-sm text-primary bg-primary/10 px-3 py-1 rounded-full">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{formatLocation(userLocation)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Your Profile</h3>
              <p className="text-sm text-muted-foreground">
                Email: {user?.primaryEmailAddress?.emailAddress}
              </p>
              <p className="text-sm text-muted-foreground">
                Member since:{' '}
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>

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

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Your Reviews</h3>
              <p className="text-sm text-muted-foreground">You haven't written any reviews yet</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
