import React, { Suspense } from "react"
import { notFound } from "next/navigation"
import FarmNavbar from "@/components/farm-navbar"
import FarmFooter from "@/components/farm-footer"
import SearchResultsContent from "./search-results-content"
import { generateLocationMetadata } from "@/lib/seo-metadata"
import { generateCityPageSchema } from "@/lib/schema"
import { sortFarms } from "@/lib/farm-utils"
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
import locationsWithFarms from "../../../data/locations-with-farms.json"

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ cities: string }> }): Promise<Metadata> {
  const { cities } = await params
  
  // Find the location data
  const locationData = locationsWithFarms.find(loc => loc.location_slug === cities)
  
  if (!locationData) {
    return notFound()
  }
  
  const locationName = locationData.full_location
  const farmCount = locationData.farms?.length || 0
  
  return generateLocationMetadata('All Farms Near', locationName, farmCount)
}

// Generate static params for all locations that have farms
export async function generateStaticParams() {
  try {
    // Only include locations that have farms
    const locationsToUse = locationsWithFarms.filter(location => 
      location.farms && location.farms.length > 0
    )
    
    // Generate params using location_slug mapped to cities parameter
    const params = locationsToUse.map(location => ({
      cities: location.location_slug
    }))
    
    console.log(`📋 Generated ${params.length} static params for farms-near cities pages`)
    return params
  } catch (error) {
    console.error('Error generating static params for farms-near:', error)
    // Fallback: return at least one param to prevent build failure
    return [
      {
        cities: 'ajax-on-ca'
      }
    ]
  }
}

export default async function FarmsNearCities({ params }: { params: Promise<{ cities: string }> }) {
  const resolvedParams = await params
  
  // Find the location data
  const locationData = locationsWithFarms.find(loc => loc.location_slug === resolvedParams.cities)
  
  // Handle missing data
  if (!locationData) {
    return notFound()
  }
  
  // Convert API farm data to component-compatible format and sort
  const convertedFarms = locationData.farms?.map(farm => ({
    ...farm,
    featured: farm.featured ? 1 : 0, // Convert boolean to number
  })) || []
  
  const sortedFarms = sortFarms(convertedFarms)

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
                <BreadcrumbPage className="font-medium">
                  {locationData.name}, {locationData.province}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
      <Suspense fallback={<div>Loading farms near you...</div>}>
        <SearchResultsContent params={resolvedParams} />
      </Suspense>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateCityPageSchema(
            sortedFarms,
            locationData
          )),
        }}
      />
      <FarmFooter />
    </div>
  )
}