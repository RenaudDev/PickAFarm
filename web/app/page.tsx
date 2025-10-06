import React from "react"
import Link from "next/link"
import { Metadata } from "next"

import { FarmNavbar } from "@/components/farm-navbar"
import { FarmFooter } from "@/components/farm-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Calendar, ArrowRight } from "lucide-react"
import SearchBoxWrapper from "@/components/search-box-wrapper"
import { FarmMapSection } from "@/components/farm-map-section"
import { FAQSection } from "@/components/faq-section"
import farmsData from "../data/farms.json"
import categoriesData from "../data/categories.json"
import statesData from "../data/states-with-farms.json"
import blogImages from "../data/blog-images.json"
import { CategoryIcon } from "@/lib/category-icons"
import { generateHomepageMetadata } from "@/lib/seo-metadata"
import { getAllPosts } from '@/lib/wordpress'
import Image from "next/image"

// Function to get top categories from generated categories data
// Only show categories with at least 10 farms (viable inventory)
function getTopCategories() {
  const MINIMUM_FARMS_FOR_CATEGORY = 10
  
  // Filter categories that have sufficient farms and sort by farm count
  return categoriesData
    .filter(category => category.totalFarms >= MINIMUM_FARMS_FOR_CATEGORY)
    .sort((a, b) => b.totalFarms - a.totalFarms)
    .slice(0, 4) // Top 4 categories
}

// Get US states sorted by farm count
function getUSStates() {
  return statesData
    .filter(state => state.country_code === 'US')
    .sort((a, b) => b.total_farms - a.total_farms)
    .slice(0, 12) // Top 12 US states
}

// Get Canadian provinces sorted by farm count
function getCanadianProvinces() {
  return statesData
    .filter(state => state.country_code === 'CA')
    .sort((a, b) => b.total_farms - a.total_farms)
}

// Generate metadata for SEO
export function generateMetadata(): Metadata {
  return generateHomepageMetadata()
}

export default async function Home() {
  const topCategories = getTopCategories()
  const usStates = getUSStates()
  const canadianProvinces = getCanadianProvinces()
  
  // Fetch latest blog posts
  const blogPosts = await getAllPosts()
  const latestPosts = blogPosts.slice(0, 3) // Get 3 latest posts

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FarmNavbar />
      <FarmMapSection />

      <main className="flex-1">
        

        {/* Browse by US States */}
        <section className="py-16 px-4 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Browse Farms by US State</h2>
              <p className="text-muted-foreground">Discover u-pick farms across the United States</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {usStates.map((state) => (
                <Link key={state.state_slug} href={`/${state.state_slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="pt-6 pb-4">
                      <h3 className="font-semibold text-lg mb-2">{state.state_name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{state.total_farms} farms</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Browse by Canadian Provinces */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Browse Farms by Canadian Province</h2>
              <p className="text-muted-foreground">Explore u-pick farms across Canada</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {canadianProvinces.map((province) => (
                <Link key={province.state_slug} href={`/${province.state_slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="pt-6 pb-4">
                      <h3 className="font-semibold text-lg mb-2">{province.state_name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{province.total_farms} farms</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Latest Blog Posts */}
        {latestPosts.length > 0 && (
          <section className="py-16 px-4 bg-background">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h2 className="text-3xl font-bold mb-2 text-foreground">Latest from Our Blog</h2>
                  <p className="text-muted-foreground">Tips, guides, and stories from the farm</p>
                </div>
                <Link href="/blog" className="text-primary hover:underline flex items-center gap-2">
                  View All Posts
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-8 md:grid-cols-3">
                {latestPosts.map((post, index) => {
                  const imageData = blogImages[post.id as keyof typeof blogImages]

                  return (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group"
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                        {imageData && (
                          <div className="relative w-full h-48 overflow-hidden bg-muted">
                            <picture>
                              {/* AVIF for modern browsers */}
                              <source
                                srcSet={`${imageData.avif['400']} 400w, ${imageData.avif['800']} 800w`}
                                sizes="(max-width: 768px) 100vw, 33vw"
                                type="image/avif"
                              />
                              {/* WebP fallback */}
                              <source
                                srcSet={`${imageData.webp['400']} 400w, ${imageData.webp['800']} 800w`}
                                sizes="(max-width: 768px) 100vw, 33vw"
                                type="image/webp"
                              />
                              {/* Use fetchpriority for first image (LCP element) */}
                              <img
                                src={imageData.webp['800']}
                                alt={imageData.alt}
                                width={imageData.width}
                                height={imageData.height}
                                loading={index === 0 ? 'eager' : 'lazy'}
                                fetchPriority={index === 0 ? 'high' : 'auto'}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                              />
                            </picture>
                          </div>
                        )}
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title.rendered}
                          </h3>

                          <div className="flex items-center text-sm text-muted-foreground mb-3">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{new Date(post.date).toLocaleDateString()}</span>
                          </div>

                          <div
                            className="text-sm text-muted-foreground line-clamp-3"
                            dangerouslySetInnerHTML={{
                              __html: post.excerpt.rendered
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 px-4 bg-primary">
          <div className="max-w-4xl mx-auto text-center">
            <Users className="h-16 w-16 mx-auto mb-6 text-primary-foreground opacity-90" />
            <h2 className="text-3xl font-bold mb-4 text-balance text-primary-foreground">
            Get More Families to Your Farm
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto text-pretty text-primary-foreground">
            Join thousands of pick-your-own farms across Canada reaching customers actively searching for agritourism experiences. List your farm and connect with families ready to pick, explore, and spend.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://zfrmz.ca/LsxdRy6JtAUjFjuPfRd3" className="bg-secondary hover:bg-secondary/90 text-primary-foreground font-semibold px-4 py-2">
                List Your Farm
              </a>
              
            </div>
          </div>
        </section>

        <FAQSection />
      </main>
      <FarmFooter />
    </div>
  )
}
