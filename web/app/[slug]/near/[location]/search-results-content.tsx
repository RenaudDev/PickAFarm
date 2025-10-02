"use client"

import { useState, useEffect } from "react"
import { CategoryIcon, CategoryIconList } from "@/lib/category-icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, MapPin, Star, ArrowUpDown, Filter } from "lucide-react"
import GoogleMaps from "@/components/google-maps"
import type { FarmData } from "@/lib/schema"
import { SaveFarmButton } from "@/components/save-farm-button"

interface LocationData {
  name: string;
  slug: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  province: string;
  country: string;
  location_slug: string;
  full_location: string;
  farms: FarmData[];
  farmCount: number;
}

interface SearchResultsContentProps {
  params: {
    slug: string;
    location: string;
  };
  initialFarms: FarmData[];
  locationData: LocationData | undefined;
}

export default function SearchResultsContent({ params, initialFarms, locationData }: SearchResultsContentProps) {
  const [sortBy, setSortBy] = useState("featured");
  const [sortedFarms, setSortedFarms] = useState(initialFarms);

  const category = params.slug || "";

  useEffect(() => {
    const newSortedFarms = [...initialFarms].sort((a, b) => {
      switch (sortBy) {
        case "distance":
          return (a.distance_km || 0) - (b.distance_km || 0);
        case "name":
          return a.name.localeCompare(b.name);
        case "featured":
        default:
          const featuredDiff = ((b.featured || 0) ? 1 : 0) - ((a.featured || 0) ? 1 : 0);
          if (featuredDiff !== 0) return featuredDiff;
          return (a.distance_km || 0) - (b.distance_km || 0);
      }
    });
    setSortedFarms(newSortedFarms);
  }, [sortBy, initialFarms]);

  if (!locationData) {
    return (
      <main className="flex-1 max-w-7xl my-12 mx-auto">
        <div className="text-center py-12">
          <CategoryIcon categoryName={category} className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Location not found</h3>
          <p className="text-muted-foreground">The location "{params.location}" could not be found.</p>
        </div>
      </main>
    )
  }

  // Prepare data for GoogleMaps component (expects featured as boolean and required coordinates)
  type MapFarm = {
    id: string;
    name: string;
    slug: string;
    url: string;
    latitude: number;
    longitude: number;
    city: string;
    province: string;
    country: string;
    categories: string;
    featured?: boolean;
    distance_km: number;
  };

  type MapLocationData = Omit<LocationData, 'farms'> & { farms: MapFarm[] };

  const mapLocationData: MapLocationData = {
    ...locationData,
    farms: locationData.farms.map((farm) => ({
      id: farm.id,
      name: farm.name,
      slug: farm.slug,
      url: farm.url,
      latitude: farm.latitude ?? 0,
      longitude: farm.longitude ?? 0,
      city: farm.city,
      province: farm.province,
      country: farm.country || 'Canada',
      categories: farm.categories || '',
      featured: !!(farm.featured && farm.featured > 0),
      distance_km: farm.distance_km ?? 0,
    })),
  };

  const getPageTitle = () => {
    const categoryDisplay = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const locationDisplay = locationData.full_location;
    
    if (category && params.location) {
      return `${categoryDisplay} Near ${locationDisplay}`;
    } else if (params.location) {
      return `Pick-Your-Own Farms Near ${locationDisplay}`;
    }
    return "Farm Search Results";
  }

  return (
    <main className="container max-w-7xl my-12 mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 px-4 sm:px-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{getPageTitle()}</h1>
          <p className="text-muted-foreground mb-4">
            {sortedFarms.length} farm{sortedFarms.length !== 1 ? "s" : ""} found nearby.
          </p>
        </div>
      </div>

      {/* Google Maps Section */}
      <div className="mb-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold mb-4">
          {category ? `${category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ` : 'Farms '}
          Near {locationData.name}
        </h2>
        <GoogleMaps
          locationData={mapLocationData}
          categoryFilter={category}
          radius={100}
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
          // Handle both JSON array and plain string formats for categories
          let farmCategories: string[] = []
          try {
            // Try to parse as JSON first
            farmCategories = JSON.parse(farm.categories || '[]')
            // If it's a string, wrap it in an array
            if (typeof farmCategories === 'string') {
              farmCategories = [farmCategories]
            }
          } catch (error) {
            // If JSON parsing fails, treat as plain string
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
                    {(farm.featured && farm.featured > 0) ? (
                      <Badge variant="default" className="text-xs bg-yellow-500 text-white mr-2">
                        Featured
                      </Badge>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <CategoryIconList 
                        categories={farmCategories} 
                        className="h-4 w-4 text-primary" 
                        maxIcons={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight mb-2">{farm.name}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <Bell className="h-3 w-3 mr-1" />
                      {farm.city}, {farm.province} • {farm.distance_km || 0}km away
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

      {sortedFarms.length === 0 && (
        <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
          <CategoryIcon categoryName={category} className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
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
