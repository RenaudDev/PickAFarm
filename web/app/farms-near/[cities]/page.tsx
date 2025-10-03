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

// Make this route dynamic (too generic for SEO - category+location pages are better)
export const runtime = 'edge' // Required for Cloudflare Pages
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 3600 // Cache for 1 hour

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

// Generic city pages are fully dynamic - no static generation

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