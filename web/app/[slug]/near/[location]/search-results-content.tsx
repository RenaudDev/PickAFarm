"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, MapPin, Star, ArrowUpDown, Filter, Wheat } from "lucide-react"

interface SearchResultsContentProps {
  params: {
    slug: string
    location: string
  }
}

// Sample farm data - in a real app, this would come from an API
const allFarms = [
  {
    id: 1,
    name: "Sunny Acres Apple Orchard",
    category: "Apple Picking",
    location: "Burlington, ON",
    distance: "12 km",
    rating: 4.8,
    reviews: 124,
    description:
      "Family-owned orchard with over 15 varieties of apples. Perfect for families with children's activities and fresh cider.",
  },
  {
    id: 2,
    name: "Pumpkin Patch Paradise",
    category: "Pumpkin Patch",
    location: "Mississauga, ON",
    distance: "8 km",
    rating: 4.6,
    reviews: 89,
    description: "Sprawling pumpkin patch with hayrides, corn maze, and pick-your-own pumpkins of all sizes.",
  },
  {
    id: 3,
    name: "Berry Bliss Farm",
    category: "Berry Picking",
    location: "Oakville, ON",
    distance: "15 km",
    rating: 4.9,
    reviews: 156,
    description: "Organic strawberry and blueberry farm. Seasonal picking with farm-fresh berry products available.",
  },
]

export default function SearchResultsContent({ params }: SearchResultsContentProps) {
  const [filteredFarms, setFilteredFarms] = useState(allFarms)
  const [sortBy, setSortBy] = useState("distance")

  const category = params.slug || ""
  const location = params.location || ""

  useEffect(() => {
    let filtered = allFarms

    // Filter by category if specified (map slug to actual category names)
    if (category) {
      // Map URL slugs to farm category names
      const categoryMap: Record<string, string[]> = {
        'apple-orchards': ['Apple Picking', 'Apple Orchard'],
        'pumpkin-patches': ['Pumpkin Patch'],
        'berry-farms': ['Berry Picking', 'Berry Farm'],
        'christmas-tree-farms': ['Christmas Trees']
      }
      
      const matchingCategories = categoryMap[category] || []
      
      if (matchingCategories.length > 0) {
        filtered = filtered.filter((farm) => 
          matchingCategories.some(cat => 
            farm.category.toLowerCase().includes(cat.toLowerCase())
          )
        )
      }
    }

    // Sort results
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
        case "reviews":
          return b.reviews - a.reviews
        case "distance":
        default:
          return Number.parseInt(a.distance) - Number.parseInt(b.distance)
      }
    })

    setFilteredFarms(filtered)
  }, [category, sortBy])

  const getPageTitle = () => {
    const categoryDisplay = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    const locationDisplay = location.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    
    if (category && location) {
      return `${categoryDisplay} Near ${locationDisplay}`
    } else if (category) {
      return `${categoryDisplay} Farms`
    } else if (location) {
      return `Pick-Your-Own Farms Near ${locationDisplay}`
    }
    return "Farm Search Results"
  }

  return (
    <main className="flex-1 max-w-7xl my-12 mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">{getPageTitle()}</h1>
          
          <Button className="mt-4 md:mt-0 bg-primary hover:bg-primary/90 text-primary-foreground mt-8">
          <Bell className="w-4 h-4 mr-2" />
          Get Notified
        </Button>
        </div>
         
      </div>
        
      <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-card rounded-lg shadow-sm border">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters:</span>
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">Distance</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="reviews">Most Reviews</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredFarms.map((farm) => (
          <Card
            key={farm.id}
            className="hover:shadow-lg transition-shadow border-l-4 border-l-primary flex flex-col h-full"
          >
            <CardHeader className="pb-4">
              <Badge variant="secondary" className="text-xs w-fit mb-3">
                {farm.category}
              </Badge>

              <div className="flex items-start justify-between mb-3">
                <div>
                  <CardTitle className="text-lg leading-tight">{farm.name}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {farm.location} • {farm.distance}
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center ml-3">
                  <Wheat className="h-6 w-6 text-primary" />
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-medium">{farm.rating}</span>
                </div>
                <div className="text-muted-foreground">{farm.reviews} reviews</div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 flex-1 flex flex-col">
              <CardDescription className="mb-6 text-base leading-relaxed flex-1">
                {farm.description}
              </CardDescription>
              <div className="flex gap-2 mt-auto">
                <Button variant="outline" className="flex-1 bg-primary text-primary-foreground">
                  View Details
                </Button>
                <Button size="sm" variant="ghost" className="px-3">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFarms.length === 0 && (
        <div className="text-center py-12">
          <Wheat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No farms found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria or browse all farms.</p>
        </div>
      )}
    </main>
  )
}
