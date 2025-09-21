import React, { Suspense } from "react"
import FarmNavbar from "@/components/farm-navbar"
import FarmFooter from "@/components/farm-footer"
import SearchResultsContent from "./search-results-content"
import { generateLocationMetadata } from "@/lib/seo-metadata"
import { Metadata } from "next"

// Import data for static generation using correct relative paths
import locationsWithFarms from "../../../data/locations-with-farms.json"

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ cities: string }> }): Promise<Metadata> {
  const { cities } = await params
  
  // Find the location data
  const locationData = locationsWithFarms.find(loc => loc.location_slug === cities)
  const locationName = locationData?.full_location || cities.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  // Get farm count for this location (all farms)
  const farmCount = locationData?.farms?.length || 0
  
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
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FarmNavbar />
      <Suspense fallback={<div>Loading farms near you...</div>}>
        <SearchResultsContent params={resolvedParams} />
      </Suspense>
      <FarmFooter />
    </div>
  )
}