import React, { Suspense } from "react"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import FarmNavbar from "@/components/farm-navbar"
import FarmFooter from "@/components/farm-footer"
import SearchResultsContent from "./search-results-content"
import { generateLocationMetadata } from "@/lib/seo-metadata"
import { generateCollectionPageSchema } from "@/lib/schema"
import { filterFarmsByCategory, sortFarms } from "@/lib/farm-utils"
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

  const categoryData = categoriesData.find(cat => cat.slug === slug)
  const locationData = locationsWithFarms.find(loc => loc.location_slug === location)

  if (!categoryData || !locationData) {
    return notFound()
  }

  // Filter farms by category using shared utility
  const filteredFarms = filterFarmsByCategory(locationData.farms, slug)
  const farmCount = filteredFarms.length

  const metadata = generateLocationMetadata(categoryData.name, locationData.full_location, farmCount)

  return {
    ...metadata,
    other: {
      ...metadata.other,
    },
  }
}

// Generate static params for category + location combinations
// Only generate for viable categories (>= 10 farms) with actual farms in location
export async function generateStaticParams() {
  try {
    const MINIMUM_FARMS_FOR_CATEGORY = 10
    const MINIMUM_FARMS_FOR_LOCATION = 1
    
    // Get categories that have sufficient farms (from categories.json)
    const viableCategories = categoriesData.filter(cat => cat.totalFarms >= MINIMUM_FARMS_FOR_CATEGORY)
    
    console.log(`📊 Viable categories: ${viableCategories.map(c => `${c.name} (${c.totalFarms})`).join(', ')}`)
    
    // Generate combinations only where farms exist
    const params = []
    
    for (const category of viableCategories) {
      for (const location of locationsWithFarms) {
        // Filter farms by category for this location
        const farmsInLocation = filterFarmsByCategory(location.farms, category.slug)
        
        // Only generate if this category+location has farms
        if (farmsInLocation.length >= MINIMUM_FARMS_FOR_LOCATION) {
          params.push({
            slug: category.slug,
            location: location.location_slug
          })
        }
      }
    }
    
    console.log(`📋 Generated ${params.length} category+location pages (filtered by viability)`)
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

  // Find location and category data
  const locationData = locationsWithFarms.find(loc => loc.location_slug === resolvedParams.location)
  const categoryData = categoriesData.find(cat => cat.slug === resolvedParams.slug)

  // Handle missing data
  if (!locationData) {
    return notFound()
  }

  // Filter and sort farms using shared utilities (handles type conversion internally)
  const filteredFarms = filterFarmsByCategory(locationData.farms, resolvedParams.slug)
  const sortedFarms = sortFarms(filteredFarms)

  // Create compatible locationData for the component with all required properties
  const compatibleLocationData = {
    ...locationData,
    farms: filteredFarms, // Use the converted farms
    farmCount: filteredFarms.length // Add the missing farmCount property
  }

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
                  {locationData.name}, {locationData.province}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
      <Suspense fallback={<div>Loading search results...</div>}>
        <SearchResultsContent params={resolvedParams} />
      </Suspense>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateCollectionPageSchema(
            sortedFarms,
            categoryData,
            locationData
          )),
        }}
      />
      <FarmFooter />
    </div>
  )
}
