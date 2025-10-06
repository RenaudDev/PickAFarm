"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Bell, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getUserLocation, calculateDistance } from "@/lib/location-utils"
import { SubscribeButton } from "@/components/subscribe-button"
import Link from "next/link"
import farmsData from "../../data/farms.json"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://pickafarm-api.94623956quebecinc.workers.dev"

// Emoji mapping for farm categories (matching map-page-layout.tsx)
const getCategoryEmoji = (category: string): string => {
  const lowerCategory = category.toLowerCase()
  if (lowerCategory.includes('christmas') || lowerCategory.includes('tree')) return '🎄'
  if (lowerCategory.includes('apple')) return '🍎'
  if (lowerCategory.includes('berry')) return '🫐'
  if (lowerCategory.includes('pumpkin')) return '🎃'
  if (lowerCategory.includes('corn')) return '🌽'
  if (lowerCategory.includes('maple') || lowerCategory.includes('sugar')) return '🍁'
  if (lowerCategory.includes('vegetable') || lowerCategory.includes('veggie')) return '🥕'
  if (lowerCategory.includes('flower')) return '🌻'
  if (lowerCategory.includes('vineyard') || lowerCategory.includes('wine')) return '🍇'
  if (lowerCategory.includes('zoo') || lowerCategory.includes('petting')) return '🐐'
  return '🌾'
}

interface Farm {
  id: string
  name: string
  slug: string
  city_name: string
  state_province: string
  latitude: number
  longitude: number
  categories?: string
  featured?: number
  verified?: number
  reviews?: number
  rating?: number
  active: number
  distance?: number
  phone?: string
  website?: string
}

interface FarmStats {
  [key: string]: number
}

export function NearbyFarmsList() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [farmStats, setFarmStats] = useState<FarmStats>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFarm, setSelectedFarm] = useState<string | null>(null)

  useEffect(() => {
    async function loadNearbyFarms() {
      try {
        setIsLoading(true)

        // Get user location
        const location = await getUserLocation("")

        if (!location || !location.latitude || !location.longitude) {
          // Fallback: show featured farms if location detection fails
          const featuredFarms = (farmsData as any[])
            .filter((f: any) => f.active === 1)
            .sort((a: any, b: any) => (b.featured || 0) - (a.featured || 0))
            .slice(0, 12)

          setFarms(featuredFarms as Farm[])
          setError("Unable to detect your location. Showing featured farms.")

          // Fetch subscriber counts for featured farms
          if (featuredFarms.length > 0) {
            try {
              const farmIds = featuredFarms.map((f: any) =>
                f.id.startsWith('zcrm_') ? f.id : `zcrm_${f.id}`
              ).join(',')
              const statsResponse = await fetch(`${API_URL}/api/farms/stats?ids=${farmIds}`)
              if (statsResponse.ok) {
                const data = await statsResponse.json()
                const statsMap: Record<string, number> = {}
                data.stats.forEach((stat: any) => {
                  statsMap[stat.farm_id] = stat.subscriber_count
                })
                setFarmStats(statsMap)
              }
            } catch (err) {
              console.error('Failed to fetch farm stats:', err)
            }
          }
        } else {
          // Calculate distances, filter within 100km radius, and sort by proximity
          const activeFarms = (farmsData as any[])
            .filter((f: any) => f.active === 1 && f.latitude && f.longitude)
            .map((farm: any) => ({
              ...farm,
              distance: Math.round(calculateDistance(
                location.latitude,
                location.longitude,
                parseFloat(farm.latitude),
                parseFloat(farm.longitude)
              ) * 10) / 10
            }))
            .filter((farm: any) => farm.distance <= 100) // Within 100km radius
            .sort((a: any, b: any) => {
              // Featured first
              if (a.featured === 1 && b.featured !== 1) return -1
              if (b.featured === 1 && a.featured !== 1) return 1
              // Then by distance
              return a.distance - b.distance
            })

          setFarms(activeFarms as Farm[])

          // Fetch subscriber counts for the farms we loaded
          if (activeFarms.length > 0) {
            try {
              const farmsToFetch = activeFarms.slice(0, 100) // Limit to 100 for API
              const farmIds = farmsToFetch.map((f: any) =>
                f.id.startsWith('zcrm_') ? f.id : `zcrm_${f.id}`
              ).join(',')
              const statsResponse = await fetch(`${API_URL}/api/farms/stats?ids=${farmIds}`)
              if (statsResponse.ok) {
                const data = await statsResponse.json()
                const statsMap: Record<string, number> = {}
                data.stats.forEach((stat: any) => {
                  statsMap[stat.farm_id] = stat.subscriber_count
                })
                setFarmStats(statsMap)
              }
            } catch (err) {
              console.error('Failed to fetch farm stats:', err)
            }
          }
        }
      } catch (err) {
        console.error('Error loading nearby farms:', err)
        setError("Failed to load farms")

        // Fallback: show featured farms
        const featuredFarms = (farmsData as any[])
          .filter((f: any) => f.active === 1)
          .sort((a: any, b: any) => (b.featured || 0) - (a.featured || 0))
          .slice(0, 12)

        setFarms(featuredFarms as Farm[])

        // Try to fetch subscriber counts for fallback farms
        if (featuredFarms.length > 0) {
          try {
            const farmIds = featuredFarms.map((f: any) =>
              f.id.startsWith('zcrm_') ? f.id : `zcrm_${f.id}`
            ).join(',')
            const statsResponse = await fetch(`${API_URL}/api/farms/stats?ids=${farmIds}`)
            if (statsResponse.ok) {
              const data = await statsResponse.json()
              const statsMap: Record<string, number> = {}
              data.stats.forEach((stat: any) => {
                statsMap[stat.farm_id] = stat.subscriber_count
              })
              setFarmStats(statsMap)
            }
          } catch (statsErr) {
            console.error('Failed to fetch farm stats in error handler:', statsErr)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadNearbyFarms()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Finding farms near you...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {farms.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No farms found within 100km of your location.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {farms.map((farm) => (
              <Card
                key={farm.id}
                id={`farm-${farm.id}`}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedFarm === farm.id && "ring-2 ring-primary",
                  farm.featured === 1 && "border-2 border-yellow-400 bg-yellow-50/30"
                )}
                onClick={() => setSelectedFarm(farm.id)}
              >
                <CardHeader className="pb-1 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {farm.categories && (
                        <div className="flex items-center gap-1 mb-1 flex-wrap">
                          {farm.categories.split(',').slice(0, 4).map((cat, idx) => (
                            <span
                              key={idx}
                              className="text-lg"
                              title={cat.trim()}
                            >
                              {getCategoryEmoji(cat.trim())}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <CardTitle className="text-xs leading-tight">{farm.name}</CardTitle>
                        {(farm.verified === 1 || farm.featured === 1) && (
                          <div className="flex gap-1">
                            {farm.verified === 1 && (
                              <span className="text-xs" title="Verified">✓</span>
                            )}
                            {farm.featured === 1 && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 text-yellow-600 border-yellow-600">
                                Featured
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {farm.distance ? `${farm.distance % 1 === 0 ? Math.round(farm.distance) : farm.distance}km away` : `${farm.city_name}, ${farm.state_province}`}
                      </div>

                      {/* Stats: Subscriber count and Reviews */}
                      <div className="space-y-1">
                        {/* Subscriber count */}
                        <div className="flex items-center gap-1 text-xs">
                          <Bell className="h-3 w-3 text-primary" />
                          <span className="font-medium text-foreground">
                            {farmStats[farm.id.startsWith('zcrm_') ? farm.id : `zcrm_${farm.id}`] || 0}
                          </span>
                          <span className="text-muted-foreground">
                            {(farmStats[farm.id.startsWith('zcrm_') ? farm.id : `zcrm_${farm.id}`] || 0) === 1 ? 'subscriber' : 'subscribers'}
                          </span>
                        </div>

                        {/* Review rating */}
                        <div className="flex items-center gap-1 text-xs">
                          {farm.reviews && farm.reviews > 0 ? (
                            <>
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="font-medium text-foreground">{farm.rating?.toFixed(1) || '5.0'}</span>
                              <span className="text-muted-foreground">
                                ({farm.reviews} {farm.reviews === 1 ? 'review' : 'reviews'})
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground italic">No reviews yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <SubscribeButton
                        farmId={farm.id.startsWith('zcrm_') ? farm.id : `zcrm_${farm.id}`}
                        farmName={farm.name}
                        farmSlug={farm.slug}
                        city={farm.city_name}
                        state={farm.state_province}
                        phone={farm.phone}
                        website={farm.website}
                        variant="icon"
                        size="sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 p-2.5">
                  <Link
                    href={`/farms/${farm.slug}/`}
                    className="w-full block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      className="w-full text-xs bg-primary hover:bg-primary/90 text-white transition-all hover:shadow-md"
                    >
                      <span>View Details</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Showing {farms.length} farm{farms.length !== 1 ? 's' : ''} within 100km • Use map above to explore more
            </p>
          </div>
        </>
      )}
    </div>
  )
}
