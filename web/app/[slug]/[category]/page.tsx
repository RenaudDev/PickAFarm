import React, { Suspense } from "react"
import { notFound } from 'next/navigation'
import { Metadata } from "next"

import FarmNavbar from "@/components/farm-navbar"
import FarmFooter from "@/components/farm-footer"
import StateCategoryMapSection from "./state-category-map-section"
import { sortFarms } from "@/lib/farm-utils"

// Import data
import statesData from "../../../data/states-with-farms.json"
import categoriesData from "../../../data/category-content.json"

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
