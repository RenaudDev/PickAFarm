"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, MapPin, Star, ArrowUpDown, Filter, Wheat } from "lucide-react"
import GoogleMaps from "@/components/google-maps"

// Import real location data
import locationsWithFarms from "../../../../data/locations-with-farms.json"

interface SearchResultsContentProps {
  params: {
    slug: string
    location: string
  }
}

export default function SearchResultsContent({ params }: SearchResultsContentProps) {
  const [sortBy, setSortBy] = useState("distance")

  const category = params.slug || ""
  const location = params.location || ""

  // Find the location data from locations-with-farms.json
  const locationData = locationsWithFarms.find(loc => loc.location_slug === location)

  // If no location found, show error state
  if (!locationData) {
    return (
      <main className="flex-1 max-w-7xl my-12 mx-auto">
        <div className="text-center py-12">
          <Wheat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Location not found</h3>
          <p className="text-muted-foreground">The location "{location}" could not be found.</p>
        </div>
      </main>
    )
  }

  // Filter farms by category if specified
  const filteredFarms = category 
    ? locationData.farms.filter(farm => {
        const farmCategories = JSON.parse(farm.categories || '[]')
        const categoryMap: Record<string, string[]> = {
          'apple-orchards': ['Apple Orchard', 'Apple Picking'],
          'pumpkin-patches': ['Pumpkin Patch'],
          'berry-farms': ['Berry Farm', 'Berry Picking'],
          'christmas-tree-farms': ['Christmas Trees']
        }
        const matchingCategories = categoryMap[category] || []
        return matchingCategories.some(catName => 
          farmCategories.some((farmCat: string) => 
            farmCat.toLowerCase().includes(catName.toLowerCase())
          )
        )
      })
    : locationData.farms

  // Sort farms
  const sortedFarms = [...filteredFarms].sort((a, b) => {
    switch (sortBy) {
      case "distance":
        return a.distance_km - b.distance_km
      case "name":
        return a.name.localeCompare(b.name)
      case "featured":
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      default:
        return a.distance_km - b.distance_km
    }
  })

  const getPageTitle = () => {
    const categoryDisplay = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    const locationDisplay = locationData.full_location
    
    if (category && location) {
      return `${categoryDisplay} Near ${locationDisplay}`
    } else if (location) {
      return `Pick-Your-Own Farms Near ${locationDisplay}`
    }
    return "Farm Search Results"
  }

  return (
    <main className="container max-w-7xl my-12 mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 px-4 sm:px-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{getPageTitle()}</h1>
          <p className="text-muted-foreground mb-4">
            {sortedFarms.length} farm{sortedFarms.length !== 1 ? "s" : ""} found within 100km
          </p>
          
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Bell className="w-4 h-4 mr-2" />
            Get Notified
          </Button>
        </div>
      </div>

      {/* Google Maps Section */}
      <div className="mb-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold mb-4">
          {category ? `${category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ` : 'Farms '}
          Near {locationData.name}
        </h2>
        <GoogleMaps
          locationData={locationData}
          categoryFilter={category}
          radius={75}
          className="w-full h-96"
        />
      </div>
        
      <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-card rounded-lg shadow-sm border mx-4 sm:mx-6 lg:mx-8">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Sort by:</span>
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">Distance</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="featured">Featured First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 sm:px-6 lg:px-8">
        {sortedFarms.map((farm) => {
          const farmCategories = JSON.parse(farm.categories || '[]')
          
          return (
            <Card
              key={farm.id}
              className="hover:shadow-lg transition-shadow border-l-4 border-l-primary flex flex-col h-full"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex flex-wrap gap-1">
                    {farmCategories.slice(0, 2).map((cat: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                    {farm.featured && (
                      <Badge variant="default" className="text-xs bg-yellow-500 text-white">
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight mb-2">{farm.name}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      {farm.city}, {farm.province} • {farm.distance_km}km away
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center ml-3">
                    <Wheat className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 flex-1 flex flex-col">
                <div className="flex gap-2 mt-auto">
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => window.location.href = farm.url}
                  >
                    View Details
                  </Button>
                  <Button size="sm" variant="ghost" className="px-3">
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {sortedFarms.length === 0 && (
        <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
          <Wheat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No farms found</h3>
          <p className="text-muted-foreground">
            {category 
              ? `No ${category.replace(/-/g, ' ')} farms found near ${locationData.name}.`
              : `No farms found near ${locationData.name}.`
            }
          </p>
        </div>
      )}
    </main>
  )
}
