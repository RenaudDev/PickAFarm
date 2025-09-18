import React from "react"
import Link from "next/link"

import { FarmNavbar } from "@/components/farm-navbar"
import { FarmFooter } from "@/components/farm-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Wheat, Apple, TreePine, Grape } from "lucide-react"
import SearchBoxWrapper from "@/components/search-box-wrapper"
import farmsData from "../data/farms.json"

// Function to get category counts from farm data
function getCategoryStats() {
  const categoryCount: Record<string, number> = {}
  
  farmsData.forEach(farm => {
    try {
      const categories = JSON.parse(farm.categories)
      if (Array.isArray(categories)) {
        categories.forEach(category => {
          categoryCount[category] = (categoryCount[category] || 0) + 1
        })
      }
    } catch {
      // Handle non-JSON categories (fallback)
      if (farm.categories) {
        const categories = farm.categories.split(',').map(cat => cat.trim())
        categories.forEach(category => {
          categoryCount[category] = (categoryCount[category] || 0) + 1
        })
      }
    }
  })
  
  // Convert to array and sort by count
  return Object.entries(categoryCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4) // Top 4 categories
}

// Icon mapping for categories
const getCategoryIcon = (categoryName: string) => {
  const iconMap: Record<string, any> = {
    'Apple Orchard': Apple,
    'Berry Farm': Grape,
    'Christmas Trees': TreePine,
    'Pumpkin Patch': Wheat,
    'Corn Maze': Wheat,
    'U-Pick': Apple,
    'Cut Your Own': TreePine,
  }
  return iconMap[categoryName] || Wheat
}

export default function Home() {
  const topCategories = getCategoryStats()

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
            <SearchBoxWrapper />
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Popular Farm Experiences</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {topCategories.map((category, index) => {
                const IconComponent = getCategoryIcon(category.name)
                return (
                  <Card key={index} className="text-center hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="pt-6">
                      <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.count} {category.count === 1 ? 'farm' : 'farms'}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
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
