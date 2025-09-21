import React from "react"
import Link from "next/link"
import { Metadata } from "next"

import { FarmNavbar } from "@/components/farm-navbar"
import { FarmFooter } from "@/components/farm-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users } from "lucide-react"
import SearchBoxWrapper from "@/components/search-box-wrapper"
import farmsData from "../data/farms.json"
import categoriesData from "../data/categories.json"
import { CategoryIcon } from "@/lib/category-icons"
import { generateHomepageMetadata } from "@/lib/seo-metadata"

// Function to get top categories from generated categories data
function getTopCategories() {
  // Filter categories that have farms and sort by farm count
  return categoriesData
    .filter(category => category.totalFarms > 0)
    .sort((a, b) => b.totalFarms - a.totalFarms)
    .slice(0, 4) // Top 4 categories
}

// Generate metadata for SEO
export function generateMetadata(): Metadata {
  return generateHomepageMetadata()
}

export default function Home() {
  const topCategories = getTopCategories()

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
              Find fresh, local produce and family-friendly u-pick farm experiences near you. From apple orchards to pumpkin
              patches, discover the best farms in your area.
            </p>
            <SearchBoxWrapper />
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Popular Farm Experiences</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topCategories.map((category, index) => {
                return (
                  <Link key={index} href={`/${category.slug}`}>
                    <Card className="text-center hover:shadow-md transition-shadow cursor-pointer group h-full">
                      <CardContent className="pt-6">
                        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <CategoryIcon categoryName={category.name} className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {category.totalFarms} {category.totalFarms === 1 ? 'farm' : 'farms'}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-primary">
          <div className="max-w-4xl mx-auto text-center">
            <Users className="h-16 w-16 mx-auto mb-6 text-primary-foreground opacity-90" />
            <h2 className="text-3xl font-bold mb-4 text-balance text-primary-foreground">
            Get More Families to Your Farm
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto text-pretty text-primary-foreground">
            Join thousands of pick-your-own farms across Canada reaching customers actively searching for agritourism experiences. List your farm and connect with families ready to pick, explore, and spend.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                List Your Farm
              </Button>
              
            </div>
          </div>
        </section>
      </main>
      <FarmFooter />
    </div>
  )
}
