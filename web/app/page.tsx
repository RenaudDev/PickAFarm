"use client"

import React from "react"

import { FarmNavbar } from "@/components/farm-navbar"
import { FarmFooter } from "@/components/farm-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Star, MapPin, Users, Wheat, Apple, ChevronRight, Search } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"


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

export default function Home() {
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FarmNavbar />
      <main className="flex-1">
        <section className="relative bg-gradient-to-r from-primary/10 to-secondary/10 py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
              Discover Local U-Pick Farms
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
              Find fresh, local produce and family-friendly farm experiences near you. From apple orchards to pumpkin
              patches, discover the best farms in your area.
            </p>
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
            <div className="hidden md:block">
              <Button
                size="lg"
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                style={{ backgroundColor: "#16a34a" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
                onClick={() => router.push("/results")}
              >
                Find Farms Near You
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-background">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Featured Pick-Your-Own Farms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Static Farm Card 1 */}
              <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary flex flex-col h-full">
                <CardHeader className="pb-4">
                  <Badge variant="secondary" className="text-xs w-fit mb-3">
                    Apple Orchard
                  </Badge>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <CardTitle className="text-lg leading-tight">Sunny Acres Orchard</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>Markham, ON</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Family-owned orchard offering apple picking and seasonal activities.
                  </p>
                </CardHeader>
                <CardFooter className="mt-auto">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/farm/1">View Details</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Static Farm Card 2 */}
              <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary flex flex-col h-full">
                <CardHeader className="pb-4">
                  <Badge variant="secondary" className="text-xs w-fit mb-3">
                    Berry Farm
                  </Badge>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <CardTitle className="text-lg leading-tight">Berry Best Farms</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>Vaughan, ON</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Pick your own strawberries, blueberries, and raspberries in season.
                  </p>
                </CardHeader>
                <CardFooter className="mt-auto">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/farm/2">View Details</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Static Farm Card 3 */}
              <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary flex flex-col h-full">
                <CardHeader className="pb-4">
                  <Badge variant="secondary" className="text-xs w-fit mb-3">
                    Pumpkin Patch
                  </Badge>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <CardTitle className="text-lg leading-tight">Harvest Moon Farm</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>Newmarket, ON</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Family fun with pumpkin picking, corn mazes, and fall activities.
                  </p>
                </CardHeader>
                <CardFooter className="mt-auto">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/farm/3">View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Popular Farm Experiences</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { name: "Apple Picking", icon: Apple, count: "45 orchards" },
                { name: "Pumpkin Patches", icon: Wheat, count: "32 farms" },
                { name: "Berry Picking", icon: Apple, count: "28 farms" },
                { name: "Corn Mazes", icon: Wheat, count: "19 farms" },
              ].map((category, index) => (
                <Card key={index} className="text-center hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      {React.createElement(category.icon, { className: "h-8 w-8 text-primary" })}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-primary">
          <div className="max-w-4xl mx-auto text-center">
            <Users className="h-16 w-16 mx-auto mb-6 text-primary-foreground opacity-90" />
            <h2 className="text-3xl font-bold mb-4 text-balance text-primary-foreground">
              Join the Pick-Your-Own Farm Community!
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto text-pretty text-primary-foreground">
              Whether you're a farm owner offering pick-your-own experiences or a family seeking fresh, seasonal
              adventures, Pick A Farm connects you with local agricultural fun.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                List Your Pick-Your-Own Farm
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-3 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Find Farm Experiences
              </Button>
            </div>
          </div>
        </section>
      </main>
      <FarmFooter />
    </div>
  )
}
