import React, { Suspense } from "react"
import FarmNavbar from "@/components/farm-navbar"
import FarmFooter from "@/components/farm-footer"
import SearchResultsContent from "./search-results-content"

// Import data for static generation using correct relative paths
import categoriesData from "../../../../data/categories.json"
import locationsWithFarms from "../../../../data/locations-with-farms.json"

// Generate static params for all category + location combinations
export async function generateStaticParams() {
  // Get categories that have farms (from categories.json)
  const categoriesWithFarms = categoriesData.filter(cat => cat.totalFarms > 0)
  
  // Generate all combinations using location_slug from locations-with-farms.json
  const params = []
  
  for (const category of categoriesWithFarms) {
    for (const location of locationsWithFarms) {
      params.push({
        slug: category.slug,
        location: location.location_slug
      })
    }
  }
  
  console.log(`📋 Generated ${params.length} static params for category/location combinations`)
  return params
}

export default async function SearchResults({ params }: { params: Promise<{ slug: string; location: string }> }) {
  const resolvedParams = await params
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FarmNavbar />
      <Suspense fallback={<div>Loading search results...</div>}>
        <SearchResultsContent params={resolvedParams} />
      </Suspense>
      <FarmFooter />
    </div>
  )
}
