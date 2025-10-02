"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { useUser } from "@clerk/nextjs"
import { FarmNavbar } from "@/components/farm-navbar"
import { useState, useEffect } from "react"
import { getStoredLocation, formatLocation, type UserLocation } from "@/lib/location-utils"
import { MapPin } from "lucide-react"

export default function DashboardPage() {
  const { user } = useUser()
  const [savedFarmsCount, setSavedFarmsCount] = useState(0)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`saved-farms-${user.id}`)
      if (saved) {
        const farms = JSON.parse(saved)
        setSavedFarmsCount(farms.length)
      }
      
      // Get user's location
      const location = getStoredLocation(user.id)
      setUserLocation(location)
    }
  }, [user?.id])

  return (
    <ProtectedRoute>
      <FarmNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Welcome back, {user?.firstName || "there"}!
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-muted-foreground">
                This is your personal dashboard
              </p>
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
                Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Saved Farms</h3>
              <p className="text-sm text-muted-foreground">
                {savedFarmsCount === 0 
                  ? "You haven't saved any farms yet" 
                  : `You have ${savedFarmsCount} saved farm${savedFarmsCount !== 1 ? 's' : ''}`
                }
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Your Reviews</h3>
              <p className="text-sm text-muted-foreground">
                You haven't written any reviews yet
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
