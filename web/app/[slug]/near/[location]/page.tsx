import React, { Suspense } from "react"
import FarmNavbar from "@/components/farm-navbar"
import FarmFooter from "@/components/farm-footer"
import SearchResultsContent from "./search-results-content"

// Import data for static generation using correct relative paths
import categoriesData from "../../../../data/categories.json"
import locationsWithFarms from "../../../../data/locations-with-farms.json"

// Generate static params for all category + location combinations
export async function generateStaticParams() {
  try {
    // Get categories that have farms (from categories.json)
    const categoriesWithFarms = categoriesData.filter(cat => cat.totalFarms > 0)
    
    // If no categories have farms, use the first category to prevent build failure
    const categoriesToUse = categoriesWithFarms.length > 0 ? categoriesWithFarms : [categoriesData[0]]
    
    // If locationsWithFarms is empty, provide fallback locations
    const locationsToUse = locationsWithFarms.length > 0 ? locationsWithFarms : [
      {
        location_slug: 'london-ontario-canada'
      },
      {
        location_slug: 'norfolk-county-ontario-canada'
      }
    ]
    
    // Generate all combinations using location_slug
    const params = []
    
    for (const category of categoriesToUse) {
      for (const location of locationsToUse) {
        params.push({
          slug: category.slug,
          location: location.location_slug
        })
      }
    }
    
    console.log(`📋 Generated ${params.length} static params for category/location combinations`)
    return params
  } catch (error) {
    console.error('Error generating static params:', error)
    // Fallback: return at least one param to prevent build failure
    return [
      {
        slug: 'christmas-tree-farms',
        location: 'london-ontario-canada'
      }
    ]
  }
}

export default async function SearchResults({ params }: { params: Promise<{ slug: string; location: string }> }) {
  const resolvedParams = await params
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FarmNavbar />
      <Suspense fallback={<div>Loading search results....</div>}>
        <SearchResultsContent params={resolvedParams} />
      </Suspense>
      <FarmFooter />
    </div>
  )
}
