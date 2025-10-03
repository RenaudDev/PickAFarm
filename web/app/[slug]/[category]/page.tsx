import React, { Suspense } from "react"
import { notFound } from 'next/navigation'
import { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin } from "lucide-react"

import FarmNavbar from "@/components/farm-navbar"
import FarmFooter from "@/components/farm-footer"
import StateCategoryMapSection from "./state-category-map-section"
import { sortFarms } from "@/lib/farm-utils"

// Import data
import statesData from "../../../data/states-with-farms.json"
import categoriesData from "../../../data/category-content.json"
import locationsData from "../../../data/locations-with-farms.json"

// Import utilities
import {
  getStateCategoryFarms,
  getStateCategoryCount
} from "@/lib/category-state-utils"

interface StateCategoryPageProps {
  params: Promise<{
    slug: string  // This is the state slug
    category: string
  }>
}

// Disable static generation - render on-demand for Cloudflare Pages limits
// This route will use dynamic rendering instead of pre-generating all combinations
export const runtime = 'edge' // Required for Cloudflare Pages
export const dynamic = 'force-dynamic'
export const dynamicParams = true

// Generate metadata for SEO
export async function generateMetadata({ params }: StateCategoryPageProps): Promise<Metadata> {
  const { slug, category } = await params
  
  // slug is the state, category is the category
  const stateData = statesData.find(s => s.state_slug === slug)
  const categoryData = Object.values(categoriesData).find((c: any) => c.slug === category)
  
  if (!stateData || !categoryData) {
    return {
      title: 'Page Not Found | Pick A Farm',
      description: 'The requested page could not be found.'
    }
  }
  
  const farms = getStateCategoryFarms(stateData, categoryData)
  const farmCount = farms.length
  
  const title = `${categoryData.name} in ${stateData.state_name} | ${farmCount} Farms`
  const description = `Discover ${farmCount} ${categoryData.name.toLowerCase()} across ${stateData.state_name}. Find locations, hours, reviews, and directions to the best pick-your-own farms.`
  const keywords = `${stateData.state_name.toLowerCase()} ${categoryData.name.toLowerCase()}, ${categoryData.name.toLowerCase()} in ${stateData.state_name.toLowerCase()}, ${stateData.state_code.toLowerCase()} ${categoryData.name.toLowerCase()}, pick your own ${stateData.state_name.toLowerCase()}`

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: `${categoryData.name} in ${stateData.state_name} | PickAFarm`,
      description,
      type: 'website',
      url: `https://pickafarm.com/${slug}/${category}`
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    },
    alternates: {
      canonical: `https://pickafarm.com/${slug}/${category}`
    }
  }
}

export default async function StateCategoryPage({ params }: StateCategoryPageProps) {
  const { slug, category } = await params

  // slug is the state, category is the category
  const stateData = statesData.find(s => s.state_slug === slug)
  const categoryData = Object.values(categoriesData).find((c: any) => c.slug === category)

  if (!stateData || !categoryData) {
    notFound()
  }

  const farms = getStateCategoryFarms(stateData, categoryData)

  if (farms.length === 0) {
    notFound()
  }

  // Sort farms by featured status and rating
  const sortedFarms = sortFarms(farms)

  // Get cities with farms in this state+category
  const getCategoryVariations = (categoryName: string): string[] => {
    const variations = [categoryName]
    if (categoryName.includes('Christmas Tree')) {
      variations.push('Christmas Tree', 'Christmas Trees', 'Christmas Tree Farms')
    }
    if (categoryName.includes('Apple')) {
      variations.push('Apple', 'Apple Orchard', 'Apple Picking', 'Apple Orchards')
    }
    if (categoryName.includes('Pumpkin')) {
      variations.push('Pumpkin', 'Pumpkin Patch', 'Pumpkin Patches')
    }
    if (categoryName.includes('Berry')) {
      variations.push('Berry', 'Berry Farm', 'Berry Picking', 'Berry Farms')
    }
    return variations
  }

  const matchingCategories = getCategoryVariations(categoryData.name)

  // Filter locations in this state that have farms in this category
  const citiesWithFarms = locationsData
    .filter((location: any) => location.province === stateData.state_name)
    .map((location: any) => {
      const categoryFarmCount = location.farms?.filter((farm: any) => {
        const farmCategories = typeof farm.categories === 'string'
          ? farm.categories.split(',').map((c: string) => c.trim())
          : []
        return matchingCategories.some(catName =>
          farmCategories.some(farmCat =>
            farmCat.toLowerCase().includes(catName.toLowerCase())
          )
        )
      }).length || 0

      return {
        name: location.name,
        slug: location.location_slug,
        farmCount: categoryFarmCount
      }
    })
    .filter((city: any) => city.farmCount > 0)
    .sort((a: any, b: any) => b.farmCount - a.farmCount)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FarmNavbar />
      <Suspense fallback={<div>Loading {categoryData.name} in {stateData.state_name}...</div>}>
        <StateCategoryMapSection
          stateData={stateData}
          categoryData={categoryData}
          farms={sortedFarms}
        />
      </Suspense>

      {/* Cities with farms section */}
      {citiesWithFarms.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4 text-foreground">
              Popular Cities for {categoryData.name} in {stateData.state_name}
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Explore {categoryData.name.toLowerCase()} in these cities across {stateData.state_name}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {citiesWithFarms.map((city: any, index: number) => (
                <Link
                  key={index}
                  href={`/${category}/near/${city.slug}`}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="pt-6 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{city.name}</h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{city.farmCount} {city.farmCount === 1 ? 'farm' : 'farms'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-6 text-foreground">
            About {categoryData.name} in {stateData.state_name}
          </h2>
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {stateData.state_name} offers {farms.length} {categoryData.name.toLowerCase()} where families can enjoy authentic pick-your-own experiences. Whether you're looking for a weekend activity or planning a special outing, these farms provide fresh, locally-grown produce and memorable agritourism adventures.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Use the interactive map above to find {categoryData.name.toLowerCase()} near you, check ratings and reviews, get directions, and plan your visit. Save your favorite farms to receive updates on seasonal availability and special events.
            </p>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `${categoryData.name} in ${stateData.state_name}`,
            "description": `Discover ${farms.length} ${categoryData.name.toLowerCase()} across ${stateData.state_name}`,
            "url": `https://pickafarm.com/${slug}/${category}`
          })
        }}
      />
      <FarmFooter />
    </div>
  )
}
