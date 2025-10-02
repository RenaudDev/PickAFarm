"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { FarmNavbar } from "@/components/farm-navbar"
import { FarmFooter } from "@/components/farm-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { 
  MapPin, 
  Star, 
  Loader2, 
  Navigation, 
  Settings2, 
  X, 
  AlertCircle,
  Heart,
  Filter,
  Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  getUserLocation, 
  getBrowserLocation, 
  formatLocation, 
  calculateDistance,
  storeUserLocation,
  type UserLocation 
} from "@/lib/location-utils"
import { SaveFarmButton } from "@/components/save-farm-button"
import { useAuth } from "@clerk/nextjs"
import { CategoryIconList } from "@/lib/category-icons"
import farmsData from "../../data/farms.json"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://pickafarm-api.94623956quebecinc.workers.dev"
const USE_STATIC_DATA = true // Toggle: true = farms.json, false = API

// Emoji mapping for farm categories
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
  return '🌾' // Default farm emoji
}

interface Farm {
  id: string
  name: string
  slug: string
  city_name: string
  state_province: string
  latitude: number
  longitude: number
  categories: string
  distance?: number
  featured?: number | boolean
  verified?: number | boolean
  phone?: string
  website?: string
  reviews?: number
  rating?: number
}

// Will be populated from actual farm data
const getUniqueCategories = (farms: Farm[]): string[] => {
  const categoriesSet = new Set<string>()
  farms.forEach(farm => {
    if (farm.categories) {
      // Handle both comma-separated strings and single categories
      const cats = farm.categories.split(',').map(c => c.trim()).filter(c => c)
      cats.forEach(cat => {
        if (cat) categoriesSet.add(cat)
      })
    }
  })
  const sorted = Array.from(categoriesSet).sort()
  console.log('📋 Available categories:', sorted)
  return ["All Types", ...sorted]
}

declare global {
  interface Window {
    google: any
  }
}

export default function MapHomePage() {
  const { isSignedIn, userId } = useAuth()
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const radiusCircleRef = useRef<any>(null)
  
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [farms, setFarms] = useState<Farm[]>([])
  const [savedFarmIds, setSavedFarmIds] = useState<Set<string>>(new Set())
  const [radius, setRadius] = useState(100) // Default search radius
  const [selectedCategory, setSelectedCategory] = useState("All Types")
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [isLoadingFarms, setIsLoadingFarms] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [locationMethod, setLocationMethod] = useState<"ip" | "browser">("ip")
  const [showControls, setShowControls] = useState(false)
  const [selectedFarm, setSelectedFarm] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showSearchThisArea, setShowSearchThisArea] = useState(false)

  // Load user location on mount
  useEffect(() => {
    async function loadLocation() {
      console.log('🚀 Starting location detection...')
      try {
        const location = await getUserLocation("")
        console.log('📍 Location received:', location)
        
        if (location && location.latitude && location.longitude) {
          console.log(`✅ Valid location: ${location.latitude}, ${location.longitude}`)
          setUserLocation(location)
          setLocationMethod("ip")
        } else {
          console.error('❌ Invalid location data:', location)
          setLocationError("Location data is invalid")
        }
      } catch (error) {
        console.error("❌ Failed to load location:", error)
        setLocationError("Unable to detect your location")
      } finally {
        setIsLoadingLocation(false)
        console.log('✅ Location loading completed')
      }
    }

    loadLocation()
  }, [])

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === 'undefined' || window.google) {
      setIsMapLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`
    script.async = true
    script.defer = true
    script.onload = () => setIsMapLoaded(true)
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  // Initialize map when loaded and location is ready
  useEffect(() => {
    if (!isMapLoaded || !userLocation || !mapRef.current || googleMapRef.current) return

    console.log('🗺️ Initializing map at:', userLocation.latitude, userLocation.longitude)

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: userLocation.latitude, lng: userLocation.longitude },
      zoom: 9,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      draggable: true,
      zoomControl: true,
      scrollwheel: true,
      gestureHandling: 'greedy', // Allows dragging without Ctrl key
    })
    
    // Listen for map center changes when user drags
    googleMapRef.current.addListener('dragend', () => {
      const center = googleMapRef.current.getCenter()
      if (center) {
        console.log('🗺️ Map center moved to:', center.lat(), center.lng())
        setShowSearchThisArea(true)
      }
    })

    // Add user location marker
    new window.google.maps.Marker({
      position: { lat: userLocation.latitude, lng: userLocation.longitude },
      map: googleMapRef.current,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        scale: 10,
      },
    })

    console.log('✅ Map initialized successfully')
  }, [isMapLoaded, userLocation])

  // Update radius circle when radius or location changes
  useEffect(() => {
    if (!googleMapRef.current || !userLocation || !window.google) return

    // Remove old circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null)
    }

    // Add new radius circle
    radiusCircleRef.current = new window.google.maps.Circle({
      map: googleMapRef.current,
      center: { lat: userLocation.latitude, lng: userLocation.longitude },
      radius: radius * 1000, // Convert km to meters
      fillColor: '#2d5016',
      fillOpacity: 0.1,
      strokeColor: '#2d5016',
      strokeOpacity: 0.3,
      strokeWeight: 2,
    })

    // Zoom map to fit the circle
    const bounds = radiusCircleRef.current.getBounds()
    if (bounds) {
      googleMapRef.current.fitBounds(bounds)
    }

    console.log(`🎯 Radius circle updated: ${radius}km, map zoomed to fit`)
  }, [userLocation, radius, isMapLoaded])

  // Get available categories from farms
  const availableCategories = useMemo(() => {
    return getUniqueCategories(farms)
  }, [farms])

  // Filter farms by category (must be before useEffect that uses it)
  const filteredFarms = useMemo(() => {
    console.log(`🔍 Filtering: ${farms.length} farms, category: "${selectedCategory}"`)
    
    let filtered = farms
    
    if (selectedCategory !== "All Types") {
      filtered = farms.filter(farm => {
        const categories = farm.categories?.toLowerCase() || ''
        return categories.toLowerCase().includes(selectedCategory.toLowerCase())
      })
    }
    
    // Sort: Featured farms first, then by distance
    const sorted = filtered.sort((a, b) => {
      // Featured farms always come first
      if (a.featured === 1 && b.featured !== 1) return -1
      if (b.featured === 1 && a.featured !== 1) return 1
      
      // Then sort by distance
      return (a.distance || 0) - (b.distance || 0)
    })
    
    console.log(`✅ Filtered to ${sorted.length} farms for category "${selectedCategory}"`)
    return sorted
  }, [farms, selectedCategory])

  // Fetch farms when location or radius changes
  useEffect(() => {
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      console.log('⏳ Waiting for valid location...', userLocation)
      return
    }

    async function fetchFarms() {
      setIsLoadingFarms(true)
      console.log(`🔍 Fetching farms near ${userLocation.latitude}, ${userLocation.longitude} within ${radius}km`)
      
      // Use static farms.json temporarily
      if (USE_STATIC_DATA) {
        console.log('📊 Using static farms.json data')
        console.log(`📊 Total farms in JSON: ${farmsData.length}`)
        
        // Check for Quinn Farm specifically
        const quinnFarm = farmsData.find(f => f.name.toLowerCase().includes('quinn'))
        if (quinnFarm) {
          const quinnDistance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            quinnFarm.latitude,
            quinnFarm.longitude
          )
          console.log(`🔍 Quinn Farm found:`, {
            name: quinnFarm.name,
            lat: quinnFarm.latitude,
            lng: quinnFarm.longitude,
            distance: quinnDistance,
            active: quinnFarm.active,
            withinRadius: quinnDistance <= radius
          })
        } else {
          console.log('❌ Quinn Farm NOT found in farms.json')
        }
        
        const farmsWithDistance = farmsData
          .filter(f => f.active === 1 && f.latitude && f.longitude)
          .map(farm => ({
            ...farm,
            id: farm.id.replace('zcrm_', ''),
            distance: Math.round(calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              farm.latitude,
              farm.longitude
            ) * 10) / 10 // Round to 1 decimal
          }))
          .filter(farm => farm.distance <= radius)
          .sort((a, b) => a.distance - b.distance)
        
        console.log(`✅ Found ${farmsWithDistance.length} farms within ${radius}km`)
        console.log('First 5 farms:', farmsWithDistance.slice(0, 5).map(f => `${f.name} (${f.distance}km)`))
        
        setFarms(farmsWithDistance as any)
        setIsLoadingFarms(false)
        return
      }
      
      try {
        const url = `${API_URL}/api/farms?lat=${userLocation.latitude}&lng=${userLocation.longitude}&radius=${radius}&limit=200`
        console.log('📡 Full API URL:', url)
        
        const response = await fetch(url)
        console.log('📡 Response status:', response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ API error response:', errorText)
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        console.log('📦 Full API response:', data)
        console.log('📦 Response farms:', data.farms)
        console.log('📦 Response filters:', data.filters)
        console.log(`✅ Found ${data.farms?.length || 0} farms within ${radius}km`)
        
        // Log each farm with distance
        data.farms?.forEach((farm: Farm) => {
          console.log(`  📍 ${farm.name}: ${farm.distance}km - ${farm.city_name}`)
        })
        
        // If no farms found nearby, fetch all farms and calculate distances client-side
        if (!data.farms || data.farms.length === 0) {
          console.warn(`⚠️ No farms found within ${radius}km. Loading all farms...`)
          const fallbackUrl = `${API_URL}/api/farms?limit=200`
          const fallbackResponse = await fetch(fallbackUrl)
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            console.log(`📊 Total farms in database: ${fallbackData.farms?.length || 0}`)
            
            // Debug: Search for Montreal-area farms
            const montrealFarms = fallbackData.farms.filter((f: Farm) => 
              f.city_name?.toLowerCase().includes('montreal') ||
              f.city_name?.toLowerCase().includes('vaudreuil') ||
              f.city_name?.toLowerCase().includes('rigaud') ||
              f.name?.toLowerCase().includes('quinn') ||
              f.name?.toLowerCase().includes('sapins') ||
              f.name?.toLowerCase().includes('hadley') ||
              f.name?.toLowerCase().includes('clovis')
            )
            console.log('🔍 Montreal-area farms:', montrealFarms.map((f: Farm) => ({
              name: f.name,
              lat: f.latitude,
              lng: f.longitude,
              city: f.city_name,
              hasCoordinates: !!(f.latitude && f.longitude)
            })))
            console.log(`❗ ${montrealFarms.filter(f => !f.latitude || !f.longitude).length} farms missing coordinates`)
            
            // Calculate distances for all farms
            const farmsWithDistance = fallbackData.farms.map((farm: Farm) => ({
              ...farm,
              distance: farm.latitude && farm.longitude
                ? Math.round(calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    farm.latitude,
                    farm.longitude
                  ) * 10) / 10
                : 99999
            })).sort((a: any, b: any) => a.distance - b.distance)
            
            console.log(`📍 Closest farm: ${farmsWithDistance[0]?.name} at ${farmsWithDistance[0]?.distance}km`)
            console.log(`📊 Total farms with valid coordinates: ${farmsWithDistance.filter((f: any) => f.distance < 99999).length}`)
            
            setFarms(farmsWithDistance)
            return
          }
        }
        
        // Debug first farm's data
        if (data.farms && data.farms.length > 0) {
          console.log('🏷️ First farm:', {
            name: data.farms[0].name,
            categories: data.farms[0].categories,
            lat: data.farms[0].latitude,
            lng: data.farms[0].longitude,
            distance: data.farms[0].distance
          })
        }
        
        setFarms(data.farms || [])
      } catch (error) {
        console.error("❌ Failed to fetch farms:", error)
      } finally {
        setIsLoadingFarms(false)
      }
    }

    fetchFarms()
  }, [userLocation, radius])

  // Update markers when farms change
  useEffect(() => {
    console.log(`🔄 Markers useEffect triggered:`, {
      hasMap: !!googleMapRef.current,
      hasGoogle: !!window.google,
      filteredFarmsCount: filteredFarms.length,
      savedFarmsCount: savedFarmIds.size,
      isMapLoaded
    })
    
    if (!googleMapRef.current || !window.google || !isMapLoaded) {
      console.log('⏳ Waiting for map to be ready...', {
        hasMap: !!googleMapRef.current,
        hasGoogle: !!window.google,
        isMapLoaded
      })
      return
    }

    console.log(`📍 Updating ${filteredFarms.length} farm markers`)

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current.clear()

    if (filteredFarms.length === 0) {
      console.log('⚠️ No farms to display on map')
      return
    }

    // Add new markers
    filteredFarms.forEach((farm, index) => {
      if (!farm.latitude || !farm.longitude) {
        console.warn(`⚠️ Skipping ${farm.name} - missing coordinates`)
        return
      }

      const isSaved = savedFarmIds.has(farm.id)
      const isFeatured = farm.featured === 1
      
      // Custom marker colors
      let pinColor = '#2d5016' // Default green
      if (isSaved) {
        pinColor = '#ef4444' // Red for saved
      } else if (isFeatured) {
        pinColor = '#eab308' // Gold for featured
      }

      try {
        const marker = new window.google.maps.Marker({
          position: { lat: parseFloat(farm.latitude as any), lng: parseFloat(farm.longitude as any) },
          map: googleMapRef.current,
          title: farm.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: pinColor,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8,
          },
        })

        // Create info window with farm details
        const categoryEmojis = farm.categories 
          ? farm.categories.split(',').slice(0, 2).map(cat => getCategoryEmoji(cat.trim())).join(' ')
          : '🌾'
        
        const reviewsHtml = farm.reviews && farm.reviews > 0
          ? `<div style="color: #666; font-size: 12px; margin-bottom: 8px;">
               ⭐ ${farm.rating || '5.0'} (${farm.reviews} reviews)
             </div>`
          : `<div style="color: #999; font-size: 12px; margin-bottom: 8px; font-style: italic;">
               No reviews yet
             </div>`
        
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px;">
                ${categoryEmojis} ${farm.name}
              </div>
              <div style="color: #666; font-size: 13px; margin-bottom: 4px;">
                📍 ${farm.distance}km away
              </div>
              ${reviewsHtml}
              <div style="color: #666; font-size: 12px; margin-bottom: 8px;">
                ${farm.city_name}, ${farm.state_province}
              </div>
              <a 
                href="/farms/${farm.slug}" 
                style="display: inline-block; padding: 6px 12px; background: #2d5016; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;"
              >
                View Details
              </a>
            </div>
          `
        })

        marker.addListener('click', () => {
          // Close all other info windows
          window.google.maps.event.trigger(googleMapRef.current, 'closeAllInfoWindows')
          
          // Open this info window
          infoWindow.open(googleMapRef.current, marker)
          
          // Also select the farm card
          setSelectedFarm(farm.id)
          const element = document.getElementById(`farm-${farm.id}`)
          element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        })
        
        // Store info window reference to close it later
        marker.set('infoWindow', infoWindow)
        
        // Listen for close all event
        window.google.maps.event.addListener(googleMapRef.current, 'closeAllInfoWindows', () => {
          infoWindow.close()
        })

        markersRef.current.set(farm.id, marker)

        if (index === 0) {
          console.log(`✅ First marker added at ${farm.latitude}, ${farm.longitude}`)
        }
      } catch (error) {
        console.error(`❌ Error adding marker for ${farm.name}:`, error)
      }
    })

    console.log(`✅ All ${filteredFarms.length} markers added to map`)
  }, [filteredFarms, savedFarmIds, isMapLoaded])

  // Pan to selected farm
  useEffect(() => {
    if (!selectedFarm || !googleMapRef.current) return

    const farm = farms.find(f => f.id === selectedFarm)
    if (!farm) return

    googleMapRef.current.panTo({ lat: farm.latitude, lng: farm.longitude })
    googleMapRef.current.setZoom(13)
  }, [selectedFarm, farms])

  const getPreciseLocation = async () => {
    setIsLoadingLocation(true)
    setLocationError(null)
    setShowControls(false) // Close mobile filters panel
    
    try {
      const location = await getBrowserLocation()
      console.log('📍 Precise location obtained:', location)
      console.log('📍 Coordinates:', location.latitude, location.longitude)
      
      setUserLocation(location)
      setLocationMethod("browser")
      // Save to localStorage with user ID if signed in
      storeUserLocation(userId || "", location)
      
      // Save to database if user is signed in
      if (isSignedIn && userId) {
        try {
          const token = await (window as any).Clerk?.session?.getToken()
          if (token) {
            const response = await fetch(`${API_URL}/api/users/update-location`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                latitude: location.latitude,
                longitude: location.longitude,
                city: location.city,
                region: location.region
              })
            })
            
            if (response.ok) {
              console.log('✅ User location saved to database')
            } else {
              console.error('❌ Failed to save location to database:', await response.text())
            }
          }
        } catch (dbError) {
          console.error('❌ Error saving location to database:', dbError)
          // Don't show error to user - this is a background operation
        }
      }
      
      // Recenter map immediately to EXACT location
      if (googleMapRef.current && location.latitude && location.longitude) {
        const exactPosition = { lat: location.latitude, lng: location.longitude }
        googleMapRef.current.setCenter(exactPosition)
        googleMapRef.current.setZoom(12) // Closer zoom to see your exact area
        console.log('🗺️ Map recentered to EXACT location:', exactPosition)
      }
    } catch (error: any) {
      setLocationError(error.message)
      console.error('❌ Precise location error:', error)
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const searchThisArea = () => {
    if (!googleMapRef.current) return
    
    const center = googleMapRef.current.getCenter()
    if (center) {
      const newLocation: UserLocation = {
        ...userLocation!,
        latitude: center.lat(),
        longitude: center.lng(),
        city: 'Map Center',
      }
      setUserLocation(newLocation)
      setShowSearchThisArea(false)
      console.log('🔍 Searching this area:', center.lat(), center.lng())
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FarmNavbar />
      
      <main className="flex-1 flex flex-col lg:flex-row relative">
        {/* Map Section */}
        <div className="w-full lg:w-3/4 h-[70vh] lg:h-screen relative">
          {isLoadingLocation ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Finding farms near you...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Google Maps Container */}
              <div ref={mapRef} className="w-full h-full" />
              
              {/* Search This Area Button */}
              {showSearchThisArea && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <Button 
                    onClick={searchThisArea}
                    className="shadow-lg"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search This Area
                  </Button>
                </div>
              )}

              {/* Mobile Controls */}
              <div className="lg:hidden">
                <div className="absolute bottom-4 right-4 z-[70]">
                  <Button
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-xl"
                    onClick={() => setShowControls(!showControls)}
                  >
                    {showControls ? <X className="h-6 w-6" /> : <Settings2 className="h-6 w-6" />}
                  </Button>
                </div>

                {showControls && (
                  <>
                    <div className="absolute inset-0 bg-black/20 z-[55]" onClick={() => setShowControls(false)} />
                    <div className="absolute inset-x-0 bottom-0 z-[60] animate-in slide-in-from-bottom-5">
                      <Card className="rounded-t-2xl rounded-b-none shadow-2xl border-t-2">
                        <CardHeader className="pb-3 pt-4 px-6">
                          <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Filters</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowControls(false)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-6">
                          {/* Search Radius */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-sm">Search Radius</h3>
                              <Badge variant="outline">{radius}km</Badge>
                            </div>
                            <Slider
                              value={[radius]}
                              onValueChange={(value) => setRadius(value[0])}
                              min={10}
                              max={200}
                              step={5}
                              className="mb-2"
                            />
                          </div>

                          {/* Category Filter */}
                          <div>
                            <h3 className="font-semibold text-sm mb-3">Farm Type</h3>
                            <select
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className="w-full px-3 py-2 border rounded-md text-sm"
                            >
                              <option value="All Types">All Types</option>
                              {availableCategories.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Location Button */}
                          {locationMethod === "ip" && (
                            <div>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={getPreciseLocation}
                                disabled={isLoadingLocation}
                                className="w-full"
                              >
                                <Navigation className="h-4 w-4 mr-2" />
                                Use My Exact Location
                              </Button>
                              {locationError && (
                                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                  <p className="text-xs text-destructive">{locationError}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-1/4 bg-white border-l overflow-y-auto h-auto lg:h-screen">
          <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
            {/* Desktop Location Control */}
            <div className="hidden lg:block space-y-4">
              {locationMethod === "ip" && (
                <div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={getPreciseLocation}
                    disabled={isLoadingLocation}
                    className="w-full"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Use My Exact Location
                  </Button>
                  {locationError && (
                    <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-xs text-destructive">{locationError}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Search Radius</h3>
                  <Badge variant="outline" className="text-xs">
                    {radius}km
                  </Badge>
                </div>
                <Slider 
                  value={[radius]} 
                  onValueChange={(value) => setRadius(value[0])} 
                  min={10} 
                  max={200} 
                  step={5} 
                />
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">Farm Type</h3>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer text-xs transition-colors",
                        selectedCategory === category 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : "hover:bg-primary/10"
                      )}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Farm List */}
            <div>
              <h3 className="font-semibold text-sm mb-3">
                Near You ({isLoadingFarms ? "..." : filteredFarms.length})
              </h3>
              {userLocation && (
                <p className="text-xs text-muted-foreground mb-2">
                  📍 {userLocation.city || 'Your location'} • {radius}km radius
                </p>
              )}
              <div className="space-y-3">
                {isLoadingFarms ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : farms.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No farms found. Try increasing the radius.
                  </p>
                ) : (
                  filteredFarms.map((farm) => (
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
                            {/* Category emojis - above title */}
                            {farm.categories && (
                              <div className="flex items-center gap-1 mb-1">
                                {farm.categories.split(',').slice(0, 2).map((cat, idx) => (
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
                            {/* Farm title with badges */}
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <CardTitle className="text-xs leading-tight">{farm.name}</CardTitle>
                              {/* Verified and Featured badges */}
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
                            {/* Reviews */}
                            <div className="flex items-center gap-1 text-xs">
                              {farm.reviews && farm.reviews > 0 ? (
                                <>
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{farm.rating || '5.0'}</span>
                                  <span className="text-muted-foreground">({farm.reviews} reviews)</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground italic">No reviews yet</span>
                              )}
                            </div>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <SaveFarmButton
                              farmId={farm.id}
                              farmName={farm.name}
                              city={farm.city_name}
                              state={farm.state_province}
                              variant="icon"
                              size="sm"
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 p-2.5">
                        <a 
                          href={`/farms/${farm.slug}`} 
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button 
                            size="sm" 
                            className="w-full text-xs bg-primary hover:bg-primary/90 text-white"
                          >
                            View Details
                          </Button>
                        </a>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <FarmFooter />
    </div>
  )
}
