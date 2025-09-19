"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin, ChevronRight, AlertCircle } from "lucide-react"

// Import the full locations and categories data
import locationsWithFarms from "../../data/locations-with-farms.json"
import categoriesData from "../../data/categories.json"

export default function SearchBox() {
  const [categoryQuery, setCategoryQuery] = useState("")
  const [locationQuery, setLocationQuery] = useState("")
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [searchError, setSearchError] = useState("")
  const router = useRouter()

  // Create category options from categories data
  const categoryOptions = categoriesData
    .filter(category => category.totalFarms > 0)
    .map(category => ({
      name: category.name,
      slug: category.slug,
      farmCount: category.totalFarms
    }))

  // Create location options from locations with farms
  const locationOptions = locationsWithFarms
    .filter(location => location.farmCount > 0)
    .map(location => ({
      displayName: location.full_location,
      searchName: `${location.name}, ${location.province}`,
      slug: location.location_slug,
      farmCount: location.farmCount
    }))

  const filteredCategories = categoryOptions
    .filter((category) => category.name.toLowerCase().includes(categoryQuery.toLowerCase()))
    .slice(0, 5)

  const filteredLocations = locationOptions
    .filter((location) => 
      location.displayName.toLowerCase().includes(locationQuery.toLowerCase()) ||
      location.searchName.toLowerCase().includes(locationQuery.toLowerCase()) ||
      location.slug.toLowerCase().includes(locationQuery.toLowerCase())
    )
    .slice(0, 8)

  const handleSearch = () => {
    setSearchError("")

    // If both category and location are provided, redirect to specific location page
    if (categoryQuery.trim() && locationQuery.trim()) {
      // Find matching category
      const matchingCategory = categoryOptions.find(category => 
        category.name.toLowerCase() === categoryQuery.toLowerCase() ||
        category.slug.toLowerCase() === categoryQuery.toLowerCase()
      )

      // Find matching location
      const exactLocationMatch = locationOptions.find(location => 
        location.displayName.toLowerCase() === locationQuery.toLowerCase() ||
        location.searchName.toLowerCase() === locationQuery.toLowerCase()
      )

      const partialLocationMatch = locationOptions.find(location =>
        location.displayName.toLowerCase().includes(locationQuery.toLowerCase()) ||
        location.searchName.toLowerCase().includes(locationQuery.toLowerCase())
      )

      const locationMatch = exactLocationMatch || partialLocationMatch

      if (matchingCategory && locationMatch) {
        router.push(`/${matchingCategory.slug}/near/${locationMatch.slug}`)
        return
      }
    }

    // If only category is provided, redirect to category page
    if (categoryQuery.trim() && !locationQuery.trim()) {
      const matchingCategory = categoryOptions.find(category => 
        category.name.toLowerCase() === categoryQuery.toLowerCase() ||
        category.slug.toLowerCase() === categoryQuery.toLowerCase()
      )

      if (matchingCategory) {
        router.push(`/${matchingCategory.slug}`)
        return
      }
    }

    // If only location is provided, show error (need category for specific pages)
    if (!categoryQuery.trim() && locationQuery.trim()) {
      setSearchError("Please select a farm type (e.g., Apple Orchards) to search for farms near that location.")
      return
    }

    // If neither is provided or no matches found
    if (!categoryQuery.trim() && !locationQuery.trim()) {
      setSearchError("Please enter what you're looking for and a location.")
    } else {
      setSearchError("Sorry, we couldn't find matching farms. Please try different search terms.")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleCategorySelect = (category: typeof categoryOptions[0]) => {
    setCategoryQuery(category.name)
    setShowCategorySuggestions(false)
    setSearchError("")
  }

  const handleLocationSelect = (location: typeof locationOptions[0]) => {
    setLocationQuery(location.searchName)
    setShowLocationSuggestions(false)
    setSearchError("")
  }

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryQuery(e.target.value)
    setSearchError("")
  }

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationQuery(e.target.value)
    setSearchError("")
  }

  return (
    <>
      {/* Mobile Search Form - Vertical Layout */}
      <div className="md:hidden max-w-md mx-auto space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            placeholder="What are you looking for? (e.g., apples, pumpkins)"
            className={`pl-10 h-12 text-base ${searchError ? 'border-red-500' : ''}`}
            value={categoryQuery}
            onChange={handleCategoryInputChange}
            onFocus={() => setShowCategorySuggestions(true)}
            onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
            onKeyPress={handleKeyPress}
          />
          {showCategorySuggestions && categoryQuery && filteredCategories.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-20 mt-1">
              {filteredCategories.map((category, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-3 hover:bg-muted transition-colors text-sm border-b border-border last:border-b-0"
                  onClick={() => handleCategorySelect(category)}
                >
                  <div className="font-medium">{category.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {category.farmCount} farm{category.farmCount !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            placeholder="Enter city, province..."
            className={`pl-10 h-12 text-base ${searchError ? 'border-red-500' : ''}`}
            value={locationQuery}
            onChange={handleLocationInputChange}
            onFocus={() => setShowLocationSuggestions(true)}
            onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
            onKeyPress={handleKeyPress}
          />
          {showLocationSuggestions && locationQuery && filteredLocations.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-20 mt-1 max-h-64 overflow-y-auto">
              {filteredLocations.map((location, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-3 hover:bg-muted transition-colors text-sm border-b border-border last:border-b-0"
                  onClick={() => handleLocationSelect(location)}
                >
                  <div className="font-medium">{location.searchName}</div>
                  <div className="text-xs text-muted-foreground">
                    {location.farmCount} farm{location.farmCount !== 1 ? 's' : ''} nearby
                  </div>
                </button>
              ))}
            </div>
          )}
          {showLocationSuggestions && locationQuery && filteredLocations.length === 0 && (
            <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-20 mt-1 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                No locations found with farms nearby
              </div>
            </div>
          )}
        </div>
        {searchError && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {searchError}
          </div>
        )}
        <Button
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base"
          onClick={handleSearch}
        >
          Search Farms
        </Button>
      </div>

      {/* Desktop Search Form - Horizontal Layout */}
      <div className="hidden md:block max-w-3xl mx-auto">
        <div className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder="e.g., apples, pumpkins, Christmas trees"
                className={`pl-10 h-12 text-base ${searchError ? 'border-red-500' : ''}`}
                value={categoryQuery}
                onChange={handleCategoryInputChange}
                onFocus={() => setShowCategorySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                onKeyPress={handleKeyPress}
              />
              {showCategorySuggestions && categoryQuery && filteredCategories.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-20 mt-1">
                  {filteredCategories.map((category, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-3 hover:bg-muted transition-colors text-sm border-b border-border last:border-b-0"
                      onClick={() => handleCategorySelect(category)}
                    >
                      <div className="font-medium">{category.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {category.farmCount} farm{category.farmCount !== 1 ? 's' : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 relative">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder="Enter city, province..."
                className={`pl-10 h-12 text-base ${searchError ? 'border-red-500' : ''}`}
                value={locationQuery}
                onChange={handleLocationInputChange}
                onFocus={() => setShowLocationSuggestions(true)}
                onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                onKeyPress={handleKeyPress}
              />
              {showLocationSuggestions && locationQuery && filteredLocations.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-20 mt-1 max-h-64 overflow-y-auto">
                  {filteredLocations.map((location, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-3 hover:bg-muted transition-colors text-sm border-b border-border last:border-b-0"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <div className="font-medium">{location.searchName}</div>
                      <div className="text-xs text-muted-foreground">
                        {location.farmCount} farm{location.farmCount !== 1 ? 's' : ''} nearby
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showLocationSuggestions && locationQuery && filteredLocations.length === 0 && (
                <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-20 mt-1 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    No locations found with farms nearby
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8"
              onClick={handleSearch}
            >
              Search Farms
            </Button>
          </div>
        </div>
        {searchError && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {searchError}
          </div>
        )}
      </div>
    </>
  )
}
