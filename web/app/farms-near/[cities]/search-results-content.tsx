"use client"

import { useState, useEffect } from "react"
import { CategoryIcon, CategoryIconList } from "@/lib/category-icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, MapPin, Star, ArrowUpDown, Filter, ChevronRight, TreePine } from "lucide-react"
import GoogleMaps from "@/components/google-maps"
import Link from "next/link"
import farmsData from "../../../data/farms.json"
import { getVarietySlug } from "@/lib/variety-mapper"
import { SaveFarmButton } from "@/components/save-farm-button"


// Import real location data
import locationsWithFarms from "../../../data/locations-with-farms.json"
import categoriesData from "../../../data/categories.json"

interface SearchResultsContentProps {
  params: {
    cities: string
  }
}



export default function SearchResultsContent({ params }: SearchResultsContentProps) {
  const [sortBy, setSortBy] = useState("distance")

  const cities = params.cities || ""

  // Find the location data from locations-with-farms.json
  const locationData = locationsWithFarms.find(loc => loc.location_slug === cities)

  // If no location found, show error state
  if (!locationData) {
    return (
      <main className="flex-1 max-w-7xl my-12 mx-auto">
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Location not found</h3>
          <p className="text-muted-foreground">The location "{cities}" could not be found.</p>
        </div>
      </main>
    )
  }

  // Get all farms for this location (no category filtering)
  const allFarms = locationData.farms || []

  // Get unique categories from farms in this location
  const locationCategories = Array.from(new Set(
    allFarms.flatMap(farm => {
      // Handle both JSON array and plain string formats for categories
      let farmCategories: string[] = []
      try {
        farmCategories = JSON.parse(farm.categories || '[]')
        if (typeof farmCategories === 'string') {
          farmCategories = [farmCategories]
        }
      } catch (error) {
        farmCategories = farm.categories ? [farm.categories] : []
      }
      return farmCategories
    })
  )).filter(Boolean)

  // Create category links for this location
  const categoryLinks = categoriesData
    .filter(category => {
      // Check if this category has farms in this location
      return allFarms.some(farm => {
        let farmCategories: string[] = []
        try {
          farmCategories = JSON.parse(farm.categories || '[]')
          if (typeof farmCategories === 'string') {
            farmCategories = [farmCategories]
          }
        } catch (error) {
          farmCategories = farm.categories ? [farm.categories] : []
        }

        const categoryMap: Record<string, string[]> = {
          'apple-orchards': ['Apple Orchard', 'Apple Picking'],
          'pumpkin-patches': ['Pumpkin Patch'],
          'berry-farms': ['Berry Farm', 'Berry Picking'],
          'christmas-tree-farms': ['Christmas Trees', 'Christmas Tree']
        }
        const matchingCategories = categoryMap[category.slug] || [category.name]
        return matchingCategories.some(catName =>
          farmCategories.some((farmCat: string) =>
            farmCat.toLowerCase().includes(catName.toLowerCase())
          )
        )
      })
    })
    .map(category => ({
      ...category,
      url: `/${category.slug}/near/${cities}`,
      farmCount: allFarms.filter(farm => {
        let farmCategories: string[] = []
        try {
          farmCategories = JSON.parse(farm.categories || '[]')
          if (typeof farmCategories === 'string') {
            farmCategories = [farmCategories]
          }
        } catch (error) {
          farmCategories = farm.categories ? [farm.categories] : []
        }

        const categoryMap: Record<string, string[]> = {
          'apple-orchards': ['Apple Orchard', 'Apple Picking'],
          'pumpkin-patches': ['Pumpkin Patch'],
          'berry-farms': ['Berry Farm', 'Berry Picking'],
          'christmas-tree-farms': ['Christmas Trees', 'Christmas Tree']
        }
        const matchingCategories = categoryMap[category.slug] || [category.name]
        return matchingCategories.some(catName =>
          farmCategories.some((farmCat: string) =>
            farmCat.toLowerCase().includes(catName.toLowerCase())
          )
        )
      }).length
    }))

  // Sort farms
  const sortedFarms = [...allFarms].sort((a, b) => {
    switch (sortBy) {
      case "distance":
        return a.distance_km - b.distance_km
      case "name":
        return a.name.localeCompare(b.name)
      case "featured":
        // First sort by featured status (featured first)
        const featuredDiff = (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
        if (featuredDiff !== 0) return featuredDiff
        // Then sort by distance within each group
        return a.distance_km - b.distance_km
      default:
        // Default: featured first, then by distance
        const defaultFeaturedDiff = (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
        if (defaultFeaturedDiff !== 0) return defaultFeaturedDiff
        return a.distance_km - b.distance_km
    }
  })

  return (
    <main className="container max-w-7xl my-12 mx-auto">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 px-4 sm:px-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            All Farms Near {locationData.full_location}
          </h1>
          <p className="text-muted-foreground mb-4">
            {sortedFarms.length} farm{sortedFarms.length !== 1 ? "s" : ""} found within 100km
          </p>
        </div>
      </div>

      {/* 2. MAP */}
      <div className="mb-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold mb-4">
          Farms Near {locationData.name}
        </h2>
        <GoogleMaps
          locationData={locationData}
          categoryFilter={null} // Show all farms
          radius={100}
          className="w-full h-96"
        />
      </div>

      {/* 3. CATEGORY LINKS */}
      {categoryLinks.length > 0 && (
        <div className="mb-8 px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryLinks.map((category) => (
              <Link key={category.slug} href={category.url}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary/50 hover:border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CategoryIcon categoryName={category.name} className="w-8 h-8 text-primary" />
                        <div>
                          <h3 className="font-semibold text-sm">{category.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {category.farmCount} farm{category.farmCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 4. FARM LIST WITH FILTERS */}
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
          // Handle both JSON array and plain string formats for categories
          let farmCategories: string[] = []
          try {
            farmCategories = JSON.parse(farm.categories || '[]')
            if (typeof farmCategories === 'string') {
              farmCategories = [farmCategories]
            }
          } catch (error) {
            farmCategories = farm.categories ? [farm.categories] : []
          }
          
          return (
            <Card
              key={farm.id}
              className="hover:shadow-lg transition-shadow border-l-4 border-l-primary flex flex-col h-full"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <CategoryIconList 
                        categories={farmCategories} 
                        className="h-4 w-4 text-primary" 
                        maxIcons={3}
                      />
                    </div>
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
                      <Bell className="h-3 w-3 mr-1" />
                      {farm.city}, {farm.province} • {farm.distance_km}km away
                    </div>
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
                  <SaveFarmButton
                    farmId={farm.id}
                    farmName={farm.name}
                    city={farm.city}
                    state={farm.province}
                    phone={(farm as any).phone}
                    website={(farm as any).website}
                    variant="icon"
                    size="sm"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
            </div>

{/* Browse by Variety */}
{(() => {
  // Calculate varieties inline
  const varietyMap = new Map<string, number>()
  locationData.farms.forEach((farm: any) => {
    const fullFarm = farmsData.find((f: any) => f.id === farm.id)
    if (fullFarm?.varieties) {
      fullFarm.varieties.split(',').forEach((v: string) => {
        const variety = v.trim()
        varietyMap.set(variety, (varietyMap.get(variety) || 0) + 1)
      })
    }
  })
  const varieties = Array.from(varietyMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  if (varieties.length === 0) return null

  return (
    <div className="my-8 px-4 sm:px-6 lg:px-8">
      <h2 className="text-xl font-semibold mb-4">Varieties Available in {locationData.name}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {varieties.map((variety) => {
          const varietySlug = getVarietySlug(variety.name)
          if (!varietySlug) return null
          
          return (
            <Link key={variety.name} href={`/varieties/${varietySlug}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary/50 hover:border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TreePine className="w-8 h-8 text-primary" />
                      <div>
                        <h3 className="font-semibold text-sm">{variety.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {variety.count} farm{variety.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
})()}

{sortedFarms.length === 0 && (
  <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
    <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No farms found</h3>
          <p className="text-muted-foreground">
            No farms found near {locationData.name}.
          </p>
        </div>
      )}
    </main>
  )
}
