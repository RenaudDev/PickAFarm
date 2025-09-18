"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin, ChevronRight } from "lucide-react"
import { farmCategories, locations } from "@/data/search-data"

export default function SearchBox() {
  const [categoryQuery, setCategoryQuery] = useState("")
  const [locationQuery, setLocationQuery] = useState("")
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const router = useRouter()

  const filteredCategories = farmCategories
    .filter((category) => category.toLowerCase().includes(categoryQuery.toLowerCase()))
    .slice(0, 5)

  const filteredLocations = locations
    .filter((location) => location.toLowerCase().includes(locationQuery.toLowerCase()))
    .slice(0, 5)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (categoryQuery) params.set("category", categoryQuery)
    if (locationQuery) params.set("location", locationQuery)
    router.push(`/search?${params.toString()}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleFindFarmsClick = () => {
    router.push("/results")
  }

  return (
    <>
      {/* Mobile Search Form - Vertical Layout */}
      <div className="md:hidden max-w-md mx-auto space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            placeholder="What are you looking for? (e.g., apples, pumpkins)"
            className="pl-10 h-12 text-base"
            value={categoryQuery}
            onChange={(e) => setCategoryQuery(e.target.value)}
            onFocus={() => setShowCategorySuggestions(true)}
            onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
            onKeyPress={handleKeyPress}
          />
          {showCategorySuggestions && categoryQuery && filteredCategories.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-20 mt-1">
              {filteredCategories.map((category, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm"
                  onClick={() => {
                    setCategoryQuery(category)
                    setShowCategorySuggestions(false)
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            placeholder="Enter city or zip code"
            className="pl-10 h-12 text-base"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            onFocus={() => setShowLocationSuggestions(true)}
            onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
            onKeyPress={handleKeyPress}
          />
          {showLocationSuggestions && locationQuery && filteredLocations.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-20 mt-1">
              {filteredLocations.map((location, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm"
                  onClick={() => {
                    setLocationQuery(location)
                    setShowLocationSuggestions(false)
                  }}
                >
                  {location}
                </button>
              ))}
            </div>
          )}
        </div>
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
                className="pl-10 h-12 text-base"
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
                onFocus={() => setShowCategorySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                onKeyPress={handleKeyPress}
              />
              {showCategorySuggestions && categoryQuery && filteredCategories.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-20 mt-1">
                  {filteredCategories.map((category, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm"
                      onClick={() => {
                        setCategoryQuery(category)
                        setShowCategorySuggestions(false)
                      }}
                    >
                      {category}
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
                placeholder="Enter city or zip code"
                className="pl-10 h-12 text-base"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onFocus={() => setShowLocationSuggestions(true)}
                onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                onKeyPress={handleKeyPress}
              />
              {showLocationSuggestions && locationQuery && filteredLocations.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-20 mt-1">
                  {filteredLocations.map((location, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm"
                      onClick={() => {
                        setLocationQuery(location)
                        setShowLocationSuggestions(false)
                      }}
                    >
                      {location}
                    </button>
                  ))}
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
      </div>
    </>
  )
}
