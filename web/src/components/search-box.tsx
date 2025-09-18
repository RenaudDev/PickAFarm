"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin, ChevronRight } from "lucide-react"

const farmCategories = [
  "Apple Picking",
  "Pumpkin Patches",
  "Berry Picking",
  "Corn Mazes",
  "Christmas Trees",
  "Strawberry Picking",
  "Blueberry Picking",
  "Peach Picking",
  "Cherry Picking",
  "Grape Picking",
  "Sunflower Fields",
  "Lavender Fields",
]

const locations = [
  "Hudson Valley, NY",
  "Lancaster County, PA",
  "Sonoma County, CA",
  "Napa Valley, CA",
  "Door County, WI",
  "Finger Lakes, NY",
  "Burlington, VT",
  "Asheville, NC",
  "Portland, OR",
  "Austin, TX",
]

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
      {/* Mobile Search Form */}
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

      {/* Desktop CTA Button */}
      <div className="hidden md:block">
        <Button
          size="lg"
          className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground"
          style={{ backgroundColor: "#16a34a" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
          onClick={handleFindFarmsClick}
        >
          Find Farms Near You
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </>
  )
}
