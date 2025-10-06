import React from "react"
import { notFound } from "next/navigation"
import dynamicImport from "next/dynamic"
import FarmNavbar from "@/components/farm-navbar"
import FarmFooter from "@/components/farm-footer"
import { MapSkeleton } from "@/components/map-skeleton"
import { generateLocationMetadata } from "@/lib/seo-metadata"

// Lazy load search results with map - no ssr option in server component
const SearchResultsContent = dynamicImport(() => import("./search-results-content"), {
  loading: () => <MapSkeleton />
})
import { generateCityPageSchema } from "@/lib/schema"
import { sortFarms } from "@/lib/farm-utils"
import { generateLocationBreadcrumbSchema } from "@/lib/breadcrumb-schema"
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
import statesWithFarms from "../../../data/states-with-farms.json"
import Link from "next/link"

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

  // Find state data for breadcrumb
  const stateData = statesWithFarms.find(s =>
    s.state_name.toLowerCase() === locationData.province.toLowerCase()
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FarmNavbar />

      {/* Breadcrumbs */}
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
              {stateData && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/${stateData.state_slug}`} className="hover:text-primary transition-colors">
                      {stateData.state_name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">{locationData.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <SearchResultsContent params={resolvedParams} />

      {/* City Page Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateCityPageSchema(
            sortedFarms,
            locationData
          )),
        }}
      />

      {/* Breadcrumb Schema */}
      {stateData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateLocationBreadcrumbSchema(
              stateData.state_name,
              stateData.state_slug,
              locationData.name,
              locationData.location_slug
            )),
          }}
        />
      )}

      <FarmFooter />
    </div>
  )
}