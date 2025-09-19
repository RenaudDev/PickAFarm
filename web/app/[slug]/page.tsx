import type React from "react"
import { notFound } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MapPin, Search, Wheat, Star, ChevronRight } from "lucide-react"
import FarmNavbar from "@/components/farm-navbar"
import FarmFooter from "@/components/farm-footer"
import CategoryPageClient from "@/components/category-page-client"

// Import categories data for static generation
import categoriesData from "../../data/category-content.json"
import locationsWithFarms from "../../data/locations-with-farms.json"

// Generate static params using slugs from category-content.json
export async function generateStaticParams() {
  return Object.values(categoriesData)
    .filter((category: any) => category.slug !== undefined) // Skip _default
    .map((category: any) => ({
      slug: category.slug
    }))
}

export default async function CategoryLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // Find the category from the category-content.json data by slug
  const category = Object.values(categoriesData).find((cat: any) => cat.slug === slug)
  
  // If no category is found for the slug, show a 404 page
  if (!category) {
    notFound()
  }

  // Map category slugs to farm category names for filtering
  const categoryMap: Record<string, string[]> = {
    'apple-orchards': ['Apple Orchard', 'Apple Picking'],
    'pumpkin-patches': ['Pumpkin Patch'],
    'berry-farms': ['Berry Farm', 'Berry Picking'],
    'christmas-tree-farms': ['Christmas Trees']
  }

  // Get matching category names for this slug
  const matchingCategories = categoryMap[slug] || []

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
  const totalFarms = locationsForCategory.reduce((sum: number, loc: any) => sum + loc.farmCount, 0)

  // Add enriched data for the category
  const enrichedCategory = {
    ...category,
    totalFarms,
    topCities: locationsForCategory.map((loc: any) => ({
      name: loc.name,
      regionCode: loc.province,
      countryCode: loc.country,
      slug: loc.location_slug,
      farmCount: loc.farmCount
    })),
    featuredFarms: [
      {
        id: 1,
        name: "Sample Farm 1",
        city: "Toronto",
        region: "ON",
        country: "CA",
        url: "/farm/1",
        blurb: "A wonderful farm offering great experiences for families.",
      },
      {
        id: 2,
        name: "Sample Farm 2", 
        city: "Vancouver",
        region: "BC",
        country: "CA",
        url: "/farm/2",
        blurb: "Experience the best seasonal activities at this local favorite.",
      },
      {
        id: 3,
        name: "Sample Farm 3",
        city: "Montreal",
        region: "QC", 
        country: "CA",
        url: "/farm/3",
        blurb: "Family-owned farm with traditional farming practices and modern amenities.",
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      <FarmNavbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            Find the Best {enrichedCategory.name} Near You
          </h1>
          <div className="flex justify-center mb-6">
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-primary/10 text-primary border-primary/20">
              {enrichedCategory.totalFarms} {enrichedCategory.name} farms in our directory
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
            {enrichedCategory.intro}
          </p>

          {/* Search Bar - Client Component */}
          <CategoryPageClient category={enrichedCategory} slug={slug} />
        </div>
      </section>

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

      {/* Featured Farms Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured {enrichedCategory.name} Farms</h2>
            <p className="text-muted-foreground">
              Discover some of our top-rated {enrichedCategory.name.toLowerCase()} from our collection of {enrichedCategory.totalFarms}{" "}
              farms
            </p>
          </div>
          {/* Featured Farms Grid - Interactive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {enrichedCategory.featuredFarms?.map((farm: any) => (
              <Card
                key={farm.id}
                className="hover:shadow-lg transition-shadow border-l-4 border-l-primary flex flex-col h-full"
              >
                <div className="p-6 pb-4">
                  <Badge variant="secondary" className="text-xs w-fit mb-3">
                    Featured Farm
                  </Badge>
                  <h3 className="text-xl leading-tight font-semibold mb-2">{farm.name}</h3>
                  <div className="flex items-center justify-center text-sm text-muted-foreground mb-4">
                    <MapPin className="h-3 w-3 mr-1 text-center" />
                    {farm.city}, {farm.region}
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
            ))}
          </div>
        </div>
      </section>

      {/* Informational Content Block */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
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
        <div className="max-w-4xl mx-auto">
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
