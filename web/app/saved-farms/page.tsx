"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { useUser } from "@clerk/nextjs"
import { FarmNavbar } from "@/components/farm-navbar"
import { useState, useEffect } from "react"
import { Heart, MapPin, Phone, Globe, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SavedFarm {
  id: string
  name: string
  city: string
  state: string
  phone?: string
  website?: string
  savedAt: string
}

export default function SavedFarmsPage() {
  const { user } = useUser()
  const [savedFarms, setSavedFarms] = useState<SavedFarm[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load saved farms from localStorage
    if (user?.id) {
      const saved = localStorage.getItem(`saved-farms-${user.id}`)
      if (saved) {
        setSavedFarms(JSON.parse(saved))
      }
      setIsLoading(false)
    }
  }, [user?.id])

  const removeFarm = (farmId: string) => {
    const updated = savedFarms.filter(farm => farm.id !== farmId)
    setSavedFarms(updated)
    if (user?.id) {
      localStorage.setItem(`saved-farms-${user.id}`, JSON.stringify(updated))
    }
  }

  return (
    <ProtectedRoute>
      <FarmNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
                <Heart className="w-10 h-10 text-red-500 fill-red-500" />
                Saved Farms
              </h1>
              <p className="text-muted-foreground mt-2">
                Your favorite farms in one place
              </p>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading your saved farms...</p>
            </div>
          ) : savedFarms.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-lg">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No saved farms yet</h3>
              <p className="text-muted-foreground mb-6">
                Start exploring and save your favorite farms to visit later
              </p>
              <Button asChild>
                <a href="/">Browse Farms</a>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {savedFarms.map((farm) => (
                <div 
                  key={farm.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-foreground">
                      {farm.name}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFarm(farm.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{farm.city}, {farm.state}</span>
                    </div>

                    {farm.phone && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                        <a href={`tel:${farm.phone}`} className="hover:text-primary">
                          {farm.phone}
                        </a>
                      </div>
                    )}

                    {farm.website && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
                        <a 
                          href={farm.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-primary truncate"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}

                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Saved {new Date(farm.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button className="w-full mt-4" asChild>
                    <a href={`/farms/${farm.id}`}>View Details</a>
                  </Button>
                </div>
              ))}
            </div>
          )}

          {savedFarms.length > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              You have {savedFarms.length} saved {savedFarms.length === 1 ? 'farm' : 'farms'}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
