import React, { Suspense } from "react"
import FarmNavbar from "@/components/farm-navbar"
import FarmFooter from "@/components/farm-footer"
import SearchResultsContent from "./search-results-content"
import { generateLocationMetadata } from "@/lib/seo-metadata"
import { Metadata } from "next"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"
// Import data for static generation using correct relative paths
import categoriesData from "../../../../data/categories.json"
import locationsWithFarms from "../../../../data/locations-with-farms.json"

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string; location: string }> }): Promise<Metadata> {
  const { slug, location } = await params
  
  // Find the category data
  const categoryData = categoriesData.find(cat => cat.slug === slug)
  const categoryName = categoryData?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  // Find the location data
  const locationData = locationsWithFarms.find(loc => loc.location_slug === location)
  const locationName = locationData?.full_location || location.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  // Get farm count for this category/location combination
  const farmCount = locationData?.farms?.filter(farm => {
    if (!slug) return true
    
    // Handle both JSON array and plain string formats for categories
    let farmCategories: string[] = []
    try {
      farmCategories = JSON.parse(farm.categories || '[]')
      if (typeof farmCategories === 'string') {
        farmCategories = [farmCategories]
      }
    } catch (error) {
      farmCategories = farm.categories ? [farm.categories] : []
    }
    
    const categoryMap: Record<string, string[]> = {
      'apple-orchards': ['Apple Orchard', 'Apple Picking'],
      'pumpkin-patches': ['Pumpkin Patch'],
      'berry-farms': ['Berry Farm', 'Berry Picking'],
      'christmas-tree-farms': ['Christmas Trees', 'Christmas Tree']
    }
    const matchingCategories = categoryMap[slug] || []
    return matchingCategories.some(catName => 
      farmCategories.some((farmCat: string) => 
        farmCat.toLowerCase().includes(catName.toLowerCase())
      )
    )
  }).length || 0
  
  return generateLocationMetadata(categoryName, locationName, farmCount)
}

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
  
  // Find the category and location data for breadcrumbs
  const categoryData = categoriesData.find(cat => cat.slug === resolvedParams.slug)
  const locationData = locationsWithFarms.find(loc => loc.location_slug === resolvedParams.location)
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FarmNavbar />
      <div className="bg-muted/20 border-b">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${resolvedParams.slug}`} className="hover:text-primary transition-colors">
                  {categoryData?.name || resolvedParams.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">
                  {locationData?.name || resolvedParams.location.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}, {locationData?.province || 'ON'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
      <Suspense fallback={<div>Loading search results....</div>}>
        <SearchResultsContent params={resolvedParams} />
      </Suspense>
      <FarmFooter />
    </div>
  )
}
