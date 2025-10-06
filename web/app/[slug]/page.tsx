import type React from "react"
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from "next"
import { Suspense } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { MapPin, Search, Wheat, Star, ChevronRight, Home, TreePine } from "lucide-react"
import FarmNavbar from "@/components/farm-navbar"
import FarmFooter from "@/components/farm-footer"
import CategoryPageClient from "@/components/category-page-client"
import { CategoryIcon } from "@/lib/category-icons"
import { generateCategoryMetadata } from "@/lib/seo-metadata"
import { getVarietiesByTag } from "@/lib/wordpress"
import Image from "next/image"

// Import categories data for static generation
import categoriesData from "../../data/category-content.json"
import locationsWithFarms from "../../data/locations-with-farms.json"
import preGeneratedCategories from "../../data/categories.json"
import statesData from "../../data/states-with-farms.json"
import { StateMapSection } from "@/components/state-map-section"
import { CategoryMapSection } from "@/components/category-map-section"
import { MapSkeleton } from "@/components/map-skeleton"
import { getStateName } from "@/lib/state-utils"

// Make state overview pages dynamic (category pages are more specific)
export const runtime = 'edge' // Required for Cloudflare Pages
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 3600 // Cache for 1 hour

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  
  // Check if this is a state page
  const stateData = statesData.find(s => s.state_slug === slug)
  if (stateData) {
    const title = `${stateData.total_farms} U-Pick Farms in ${stateData.state_name}`
    const description = `Discover ${stateData.total_farms} u-pick farms across ${stateData.state_name}. Find Christmas tree farms, pumpkin patches, apple orchards, berry farms, and more. Interactive map with reviews and directions.`
    const topCategories = stateData.categories.slice(0, 3).map(c => c.name.toLowerCase()).join(', ')
    const keywords = `${stateData.state_name.toLowerCase()} u-pick farms, pick your own ${stateData.state_name.toLowerCase()}, ${stateData.state_name.toLowerCase()} farms, u-pick ${stateData.state_code.toLowerCase()}, ${topCategories}`

    return {
      title,
      description,
      keywords,
      openGraph: {
        title: `${stateData.total_farms} U-Pick Farms in ${stateData.state_name}`,
        description: `${stateData.total_farms} pick-your-own farms across ${stateData.state_name}`,
        type: 'website',
        url: `https://pickafarm.com/${slug}`
      },
      twitter: {
        card: 'summary_large_image',
        title: `${stateData.total_farms} U-Pick Farms in ${stateData.state_name}`,
        description: `${stateData.total_farms} pick-your-own farms across ${stateData.state_name}`
      },
      alternates: {
        canonical: `https://pickafarm.com/${slug}`
      }
    }
  }
  
  // Otherwise, treat as category page
  const category = Object.values(categoriesData).find((cat: any) => cat.slug === slug)
  
  if (!category) {
    return {
      title: 'Page Not Found | Pick A Farm',
      description: 'The requested page could not be found.'
    }
  }

  // Calculate total farms for this category across all locations
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

  const matchingCategories = getCategoryVariations(category.name)
  
  // Count unique farms for this category
  const uniqueFarmIds = new Set()
  locationsWithFarms.forEach((location: any) => {
    location.farms?.forEach((farm: any) => {
      let farmCategories: string[] = []
      try {
        farmCategories = JSON.parse(farm.categories || '[]')
        if (typeof farmCategories === 'string') {
          farmCategories = [farmCategories]
        }
      } catch (error) {
        farmCategories = farm.categories ? [farm.categories] : []
      }
      
      const matches = matchingCategories.some(catName => 
        farmCategories.some((farmCat: string) => 
          farmCat.toLowerCase().includes(catName.toLowerCase())
        )
      )
      
      if (matches) {
        uniqueFarmIds.add(farm.id)
      }
    })
  })
  
  const farmCount = uniqueFarmIds.size
  
  return generateCategoryMetadata(category.name, category, farmCount)
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // Check if this is a state page
  const stateData = statesData.find(s => s.state_slug === slug)
  if (stateData) {
    return <StatePage stateData={stateData} slug={slug} />
  }
  
  // Otherwise, treat as category page
  const category = Object.values(categoriesData).find((cat: any) => cat.slug === slug)
  
  // If no category or state is found for the slug, show a 404 page
  if (!category) {
    notFound()
  }
  
  return <CategoryPage category={category} slug={slug} />
}

// Generate Schema.org structured data for state pages
function generateStateSchema(stateData: any, stateSlug: string) {
  const baseUrl = 'https://pickafarm.com'
  
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${baseUrl}/${stateSlug}`,
        "url": `${baseUrl}/${stateSlug}`,
        "name": `U-Pick Farms in ${stateData.state_name}`,
        "description": `Discover ${stateData.total_farms} u-pick farms across ${stateData.state_name}`,
        "inLanguage": stateData.country_code === 'CA' ? 'en-CA' : 'en-US',
        "isPartOf": {
          "@id": `${baseUrl}/#website`
        },
        "breadcrumb": {
          "@id": `${baseUrl}/${stateSlug}#breadcrumb`
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${baseUrl}/${stateSlug}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": stateData.state_name,
            "item": `${baseUrl}/${stateSlug}`
          }
        ]
      },
      {
        "@type": "ItemList",
        "numberOfItems": Math.min(stateData.total_farms, 50),
        "itemListOrder": "https://schema.org/ItemListOrderAscending",
        "itemListElement": stateData.farms.slice(0, 50).map((farm: any, index: number) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "LocalBusiness",
            "@id": `${baseUrl}/farms/${farm.slug}`,
            "name": farm.name,
            "url": `${baseUrl}/farms/${farm.slug}`,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": farm.street || "",
              "addressLocality": farm.city_name,
              "addressRegion": farm.state_province,
              "addressCountry": farm.country === 'Canada' ? 'CA' : 'US',
              "postalCode": farm.postal_code || ""
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": farm.latitude,
              "longitude": farm.longitude
            },
            ...(farm.reviews && farm.reviews > 0 && farm.rating && {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": farm.rating,
                "reviewCount": farm.reviews,
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }
        }))
      }
    ]
  }
}

// State Page Component
function StatePage({ stateData, slug }: { stateData: any; slug: string }) {
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
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">{stateData.state_name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* State Map Section */}
      <Suspense fallback={<MapSkeleton />}>
        <StateMapSection stateData={stateData} />
      </Suspense>

      <main className="flex-1">
        {/* Popular Cities Section */}
        {stateData.cities.length > 0 && (
          <section className="py-16 px-4 bg-muted/30">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4 text-foreground">
                Popular Cities in {stateData.state_name}
              </h2>
              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                Explore u-pick farms in these cities across {stateData.state_name}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {stateData.cities.map((city: any, index: number) => (
                  <Link
                    key={index}
                    href={`/farms-near/${city.slug}`}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="pt-6 pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{city.name}</h3>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{city.farm_count} {city.farm_count === 1 ? 'farm' : 'farms'}</span>
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

        {/* Top Categories Section */}
        {stateData.categories.length > 0 && (
          <section className="py-16 px-4 bg-background">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4 text-foreground">
                Farm Types in {stateData.state_name}
              </h2>
              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                Popular u-pick experiences available across the {stateData.geographic_type.toLowerCase()}
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                {stateData.categories.map((category: any, index: number) => {
                  // Look up the actual category slug from categoriesData
                  const categoryData = Object.values(categoriesData).find(
                    (cat: any) => cat.name === category.name
                  )
                  const categorySlug = categoryData?.slug || category.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '')

                  return (
                    <Link
                      key={index}
                      href={`/${slug}/${categorySlug}`}
                    >
                      <Badge
                        variant="secondary"
                        className="text-sm px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      >
                        {category.name} ({category.count})
                      </Badge>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* About Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              About U-Pick Farms in {stateData.state_name}
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              {stateData.state_name} is home to {stateData.total_farms} pick-your-own farms offering fresh, locally-grown produce and memorable agritourism experiences. From {stateData.categories[0]?.name.toLowerCase() || 'seasonal farms'} to {stateData.categories[1]?.name.toLowerCase() || 'family farms'}, discover the best u-pick destinations across the {stateData.geographic_type.toLowerCase()}.
            </p>
            <p className="text-lg text-muted-foreground">
              Use the interactive map above to find farms near you, check ratings and reviews, get directions, and plan your visit. Save your favorite farms to your account to receive updates on seasonal availability and special events.
            </p>
          </div>
        </section>
      </main>

      <FarmFooter />

      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStateSchema(stateData, slug))
        }}
      />
    </div>
  )
}

// Category Page Component
async function CategoryPage({ category, slug }: { category: any; slug: string }) {
  // Fetch varieties for this category using the slug as the tag
  const varieties = await getVarietiesByTag(slug).catch(err => {
    console.error(`Error fetching varieties for ${slug}:`, err)
    return []
  })

  // Create dynamic category mapping based on category names from category-content.json
  // This maps each category name to variations that might appear in farm data
  const getCategoryVariations = (categoryName: string): string[] => {
    const variations = [categoryName] // Always include the exact name
    
    // Add common variations based on the category name
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

  // Get matching category names for this slug using the current category
  const matchingCategories = getCategoryVariations(category.name)

  // Filter locations that have farms matching this category and count farms per location
  const locationsForCategory = locationsWithFarms
    .map((location: any) => {
      // Count farms that match this category
      const matchingFarms = location.farms?.filter((farm: any) => {
        // Handle both JSON array and plain string formats for categories
        let farmCategories: string[] = []
        try {
          // Try to parse as JSON first
          farmCategories = JSON.parse(farm.categories || '[]')
          // If it's a string, wrap it in an array
          if (typeof farmCategories === 'string') {
            farmCategories = [farmCategories]
          }
        } catch (error) {
          // If JSON parsing fails, treat as plain string
          farmCategories = farm.categories ? [farm.categories] : []
        }
        
        return matchingCategories.some(catName => 
          farmCategories.some((farmCat: string) => 
            farmCat.toLowerCase().includes(catName.toLowerCase())
          )
        )
      }) || []

      return {
        name: location.name,
        province: location.province,
        country: location.country,
        location_slug: location.location_slug,
        farmCount: matchingFarms.length,
        farms: matchingFarms
      }
    })
    .filter((location: any) => location.farmCount > 0) // Only include locations with matching farms
    .sort((a: any, b: any) => b.farmCount - a.farmCount) // Sort by farm count descending
    .slice(0, 6) // Take top 6 locations

  // Calculate total farms for this category across all locations
  // Use Set to count unique farms (avoid double-counting farms that appear in multiple locations)
  const uniqueFarmIds = new Set()
  locationsForCategory.forEach((loc: any) => {
    loc.farms?.forEach((farm: any) => {
      uniqueFarmIds.add(farm.id)
    })
  })
  const totalFarms = uniqueFarmIds.size

  // Get real featured farms for this category
  const getFeaturedFarms = () => {
    const allMatchingFarms: any[] = []
    
    // Collect all farms that match this category
    locationsForCategory.forEach((loc: any) => {
      loc.farms?.forEach((farm: any) => {
        // Avoid duplicates by checking if farm is already added
        if (!allMatchingFarms.find(f => f.id === farm.id)) {
          allMatchingFarms.push({
            id: farm.id,
            name: farm.name,
            slug: farm.slug,
            city: farm.city,
            province: farm.province,
            country: farm.country,
            url: `/farms/${farm.slug}`,
            blurb: farm.description || `Experience ${category.name.toLowerCase()} at this local farm.`,
            featured: farm.featured
          })
        }
      })
    })
    
    // Return ONLY farms that are actually featured (featured: true)
    return allMatchingFarms
      .filter(farm => farm.featured === true)
      .slice(0, 3)
  }

  // Calculate states/provinces with farms for this category
  const statesWithCategoryFarms = statesData
    .map((state: any) => {
      // Count farms in this state that match the category
      const categoryFarmCount = state.farms.filter((farm: any) => {
        let farmCategories: string[] = []
        try {
          farmCategories = JSON.parse(farm.categories || '[]')
          if (typeof farmCategories === 'string') {
            farmCategories = [farmCategories]
          }
        } catch (error) {
          farmCategories = farm.categories ? [farm.categories] : []
        }
        
        return matchingCategories.some(catName => 
          farmCategories.some((farmCat: string) => 
            farmCat.toLowerCase().includes(catName.toLowerCase())
          )
        )
      }).length
      
      return {
        ...state,
        categoryFarmCount
      }
    })
    .filter((state: any) => state.categoryFarmCount > 0)
    .sort((a: any, b: any) => b.categoryFarmCount - a.categoryFarmCount)

  // Separate US states and Canadian provinces
  const usStates = statesWithCategoryFarms.filter((state: any) => state.country === 'United States')
  const canadianProvinces = statesWithCategoryFarms.filter((state: any) => state.country === 'Canada')

  // Add enriched data for the category
  const enrichedCategory = {
    ...category,
    totalFarms: preGeneratedCategories.find((cat: any) => cat.slug === slug)?.totalFarms || 0,
    topCities: locationsForCategory.map((loc: any) => ({
      name: loc.name,
      regionCode: loc.province,
      countryCode: loc.country,
      slug: loc.location_slug,
      farmCount: loc.farmCount
    })),
    featuredFarms: getFeaturedFarms()
  }

  return (
    <div className="min-h-screen bg-background">
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
                <BreadcrumbPage className="font-medium">{enrichedCategory.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* NEW: Category Map Section - Shows map with category-filtered farms */}
      <Suspense fallback={<MapSkeleton />}>
        <CategoryMapSection
          categoryName={enrichedCategory.name}
          categorySlug={slug}
        />
      </Suspense>

      {/* Browse by US State Section */}
      {usStates.length > 0 && (
        <section className="py-16 px-4 bg-background">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Browse {enrichedCategory.name} by US State
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Discover {enrichedCategory.name.toLowerCase()} across the United States
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {usStates.map((state: any) => (
                <Link key={state.state_slug} href={`/${state.state_slug}/${slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="pt-6 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{state.state_name}</h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{state.categoryFarmCount} {state.categoryFarmCount === 1 ? 'farm' : 'farms'}</span>
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

      {/* Browse by Canadian Province Section */}
      {canadianProvinces.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Browse {enrichedCategory.name} by Canadian Province
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Discover {enrichedCategory.name.toLowerCase()} across Canada
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {canadianProvinces.map((province: any) => (
                <Link key={province.state_slug} href={`/${province.state_slug}/${slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="pt-6 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{province.state_name}</h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{province.categoryFarmCount} {province.categoryFarmCount === 1 ? 'farm' : 'farms'}</span>
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

      {/* Varieties Section - Only show if varieties exist */}
      {varieties && varieties.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <TreePine className="h-8 w-8 text-green-600" />
              <h2 className="text-3xl font-bold text-center">Tree Varieties</h2>
            </div>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Explore different Christmas tree varieties to find the perfect tree for your home
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {varieties.map((variety: any) => {
                const featuredImage = variety._embedded?.['wp:featuredmedia']?.[0]
                return (
                  <Link key={variety.id} href={`/varieties/${variety.slug}`}>
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden h-full group">
                      {featuredImage && (
                        <div className="relative w-full h-48 overflow-hidden">
                          <Image
                            src={featuredImage.source_url}
                            alt={featuredImage.alt_text || variety.title.rendered}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-green-600 transition-colors">
                          {variety.title.rendered}
                        </h3>
                        <div 
                          className="text-muted-foreground text-sm line-clamp-3"
                          dangerouslySetInnerHTML={{ 
                            __html: variety.excerpt.rendered.replace(/<[^>]*>?/gm, '').trim() 
                          }}
                        />
                        <div className="mt-4">
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Learn More
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Top Cities Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Locations for {enrichedCategory.name}</h2>
          {enrichedCategory.topCities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrichedCategory.topCities.map((city: any) => (
                <Link key={city.slug} href={`/${slug}/near/${city.slug}`}>
                  <Card
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-primary group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{city.name}</h3>
                          <p className="text-muted-foreground flex items-start text-left mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {city.regionCode}, {city.countryCode}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {city.farmCount} farm{city.farmCount !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No locations found with {enrichedCategory.name.toLowerCase()} farms.</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Farms Section - Only show if there are farms */}
      {enrichedCategory.featuredFarms && enrichedCategory.featuredFarms.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-center mb-6">
              <CategoryIcon categoryName={enrichedCategory.name} className="h-16 w-16 text-primary" />
            </div>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Featured {enrichedCategory.name}</h2>
              <p className="text-muted-foreground">
                Discover some of our top-rated {enrichedCategory.name.toLowerCase()} from our collection of {enrichedCategory.totalFarms}{" "}
                {enrichedCategory.totalFarms === 1 ? 'farm' : 'farms'}
              </p>
            </div>
            {/* Featured Farms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {enrichedCategory.featuredFarms.map((farm: any) => (
                <Link key={farm.id} href={farm.url}>
                  <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary flex flex-col h-full cursor-pointer">
                    <div className="p-6 pb-4">
                      {farm.featured && (
                        <Badge variant="secondary" className="text-xs w-fit mb-3">
                          Featured Farm
                        </Badge>
                      )}
                      <h3 className="text-xl leading-tight font-semibold mb-2">{farm.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mb-4">
                        <MapPin className="h-3 w-3 mr-1" />
                        {farm.city}, {farm.province}
                      </div>
                    </div>
                    <div className="px-6 pt-0 pb-6 flex-1 flex flex-col">
                      <p className="mb-6 text-base leading-relaxed flex-1">{farm.blurb}</p>
                      <div className="flex gap-2 mt-auto">
                        <Button 
                          variant="outline" 
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Informational Content Block */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">About {enrichedCategory.name}</h2>
          <div className="prose prose-lg max-w-none">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Wheat className="h-5 w-5 mr-2 text-primary" />
                  What Makes Them Special
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Christmas tree farms offer a unique blend of agricultural tradition and holiday magic. Unlike
                  store-bought trees, farm-fresh trees are cut at peak freshness, ensuring longer-lasting needles and
                  superior fragrance that fills your home with the authentic scent of the season.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-primary" />
                  Seasonal Experience
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Most farms operate from late November through December, offering the perfect family outing during the
                  holiday season. Many provide additional activities like hayrides, hot cocoa, and holiday decorations,
                  creating memorable experiences that become cherished family traditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-4">
            {enrichedCategory.faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-white rounded-lg border px-6">
                <AccordionTrigger className="text-left font-semibold py-6">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>


      <FarmFooter />
    </div>
  )
}
