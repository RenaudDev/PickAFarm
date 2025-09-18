"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Sprout, MapPin, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const categories = [
  "Dairy Farms",
  "Vegetable Farms",
  "Fruit Orchards",
  "Livestock Farms",
  "Organic Farms",
  "Grain Farms",
  "Herb Gardens",
  "Flower Farms",
  "Christmas Tree Farms",
  "Pumpkin Patches",
]

const cities = [
  "San Francisco, CA",
  "Portland, OR",
  "Austin, TX",
  "Nashville, TN",
  "Denver, CO",
  "Burlington, VT",
  "Asheville, NC",
  "Madison, WI",
  "Boulder, CO",
  "Ithaca, NY",
]

function FarmNavbar() {
  const [categoryValue, setCategoryValue] = useState("")
  const [cityValue, setCityValue] = useState("")
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const categoryRef = useRef<HTMLDivElement>(null)
  const cityRef = useRef<HTMLDivElement>(null)

  const filteredCategories = categories.filter(
    (category) => category.toLowerCase().includes(categoryValue.toLowerCase()) && categoryValue !== "",
  )

  const filteredCities = cities.filter(
    (city) => city.toLowerCase().includes(cityValue.toLowerCase()) && cityValue !== "",
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategorySuggestions(false)
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setShowCitySuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hidden md:flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Sprout className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Pick A Farm</span>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <div className="flex items-center space-x-2 bg-card rounded-lg p-2 border border-border">
              <div ref={categoryRef} className="relative flex-1">
                <Input
                  placeholder="Category (e.g., Dairy Farms)"
                  value={categoryValue}
                  onChange={(e) => {
                    setCategoryValue(e.target.value)
                    setShowCategorySuggestions(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowCategorySuggestions(categoryValue.length > 0)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {showCategorySuggestions && filteredCategories.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto z-50">
                    {filteredCategories.map((category) => (
                      <div
                        key={category}
                        className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                        onClick={() => {
                          setCategoryValue(category)
                          setShowCategorySuggestions(false)
                        }}
                      >
                        {category}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-border" />

              <div ref={cityRef} className="relative flex-1">
                <Input
                  placeholder="City (e.g., San Francisco, CA)"
                  value={cityValue}
                  onChange={(e) => {
                    setCityValue(e.target.value)
                    setShowCitySuggestions(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowCitySuggestions(cityValue.length > 0)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {showCitySuggestions && filteredCities.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto z-50">
                    {filteredCities.map((city) => (
                      <div
                        key={city}
                        className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                        onClick={() => {
                          setCityValue(city)
                          setShowCitySuggestions(false)
                        }}
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex items-center space-x-6">
              <a href="#" className="text-foreground hover:text-accent font-medium transition-colors">
                Home
              </a>
              <a href="#" className="text-foreground hover:text-accent font-medium transition-colors">
                About
              </a>
              <a href="#" className="text-foreground hover:text-accent font-medium transition-colors">
                Contact
              </a>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              List Your Farm
            </Button>
          </div>
        </div>

        <div className="md:hidden">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Sprout className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Pick A Farm</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {isMobileMenuOpen && (
            <div className="pb-4 space-y-4 bg-background rounded-b-lg border-t border-border">
              <div className="space-y-2">
                <a href="#" className="block px-4 py-2 text-foreground hover:bg-muted rounded-md font-medium">
                  Home
                </a>
                <a href="#" className="block px-4 py-2 text-foreground hover:bg-muted rounded-md font-medium">
                  About
                </a>
                <a href="#" className="block px-4 py-2 text-foreground hover:bg-muted rounded-md font-medium">
                  Contact
                </a>
                <a href="#" className="block px-4 py-2 text-primary hover:bg-muted rounded-md font-semibold">
                  List Your Farm
                </a>
              </div>

              <div className="px-4 space-y-3">
                <div ref={categoryRef} className="relative">
                  <div className="flex items-center bg-card rounded-lg border border-border">
                    <Search className="h-4 w-4 text-muted-foreground ml-3" />
                    <Input
                      placeholder="Search type of farm..."
                      value={categoryValue}
                      onChange={(e) => {
                        setCategoryValue(e.target.value)
                        setShowCategorySuggestions(e.target.value.length > 0)
                      }}
                      onFocus={() => {
                        setIsMobileSearchFocused(true)
                        setShowCategorySuggestions(categoryValue.length > 0)
                      }}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-2"
                    />
                  </div>
                  {showCategorySuggestions && filteredCategories.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto z-50">
                      {filteredCategories.map((category) => (
                        <div
                          key={category}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                          onClick={() => {
                            setCategoryValue(category)
                            setShowCategorySuggestions(false)
                          }}
                        >
                          {category}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div ref={cityRef} className="relative">
                  <div className="flex items-center bg-card rounded-lg border border-border">
                    <MapPin className="h-4 w-4 text-muted-foreground ml-3" />
                    <Input
                      placeholder="Enter city or location..."
                      value={cityValue}
                      onChange={(e) => {
                        setCityValue(e.target.value)
                        setShowCitySuggestions(e.target.value.length > 0)
                      }}
                      onFocus={() => {
                        setIsMobileSearchFocused(true)
                        setShowCitySuggestions(cityValue.length > 0)
                      }}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-2"
                    />
                  </div>
                  {showCitySuggestions && filteredCities.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto z-50">
                      {filteredCities.map((city) => (
                        <div
                          key={city}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                          onClick={() => {
                            setCityValue(city)
                            setShowCitySuggestions(false)
                          }}
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export { FarmNavbar }
export default FarmNavbar
