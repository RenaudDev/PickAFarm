import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import ReviewForm from '@/components/review-form'
import ReviewsList from '@/components/review-list'

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Clock,
  DollarSign,
  Calendar,
  Star,
  Heart,
  Share2,
  Navigation,
  PawPrint,
  CheckCircle,
  Crown,
  TreePine,
  Home,
} from "lucide-react"
import FarmNavbar from "@/components/farm-navbar"
import FarmFooter from "@/components/farm-footer"
import FarmInteractiveElements from "@/components/farm-interactive-elements"
import { CategoryIcon } from "@/lib/category-icons"
import Link from "next/link"
import Image from "next/image"
import { notFound } from 'next/navigation'
import { generateFarmMetadata } from "@/lib/seo-metadata"
import { getVarietySlug } from "@/lib/variety-mapper"
import { Metadata } from "next"
import { getReviews } from "@/lib/reviews"

// Import farms data for static generation
import farmsData from "../../../data/farms.json"

// Make this route dynamic (users find farms via money pages)
export const runtime = 'edge' // Required for Cloudflare Pages
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 3600 // Cache for 1 hour

// Import category content for mapping
import categoryContent from "../../../data/category-content.json"

// Import categories data to validate against existing categories
import categoriesData from "../../../data/categories.json"

// Import locations data for breadcrumb
import locationsWithFarms from "../../../data/locations-with-farms.json"

// Type definition for farm data
type FarmData = {
  id: string
  name: string
  slug: string
  street: string
  city_name: string
  state_province: string
  country: string
  latitude: number
  longitude: number
  phone: string
  email: string
  website?: string
  facebook?: string
  instagram?: string
  description: string
  categories: string
  type: string
  amenities?: string
  varieties?: string
  pet_friendly: number
  price_range?: string
  verified: number
  featured: number
  active: number
  updated_at: string
  // Optional fields that might exist in database but not in build-time JSON
  payment_methods?: string
  opening_date?: string
  closing_date?: string
  opening_time?: string
  closing_time?: string
  monday_hours?: string
  tuesday_hours?: string
  wednesday_hours?: string
  thursday_hours?: string
  friday_hours?: string
  saturday_hours?: string
  sunday_hours?: string
  hours_of_operation?: string
  seasonal_hours?: string
}


// Add this after the imports, before generateStaticParams

// Farm detail pages are fully dynamic - no static generation

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  
  // Find the farm data based on the slug
  const farm = farmsData.find((f: FarmData) => f.slug === id)
  
  if (!farm) {
    return {
      title: 'Farm Not Found | PickAFarm',
      description: 'The requested farm could not be found.'
    }
  }
  
  return generateFarmMetadata(farm)
}

const getCategoryInfo = (categories: string) => {
  const categoryArray = categories.split(',').map(category => category.trim())
  
  return categoryArray.map(category => {
    // Find matching category in categories.json (the actual valid categories)
    const matchingCategory = categoriesData.find((cat: any) => {
      const catName = cat.name.toLowerCase()
      const categoryLower = category.toLowerCase()
      
      // Exact match or partial match
      return catName === categoryLower || 
             catName.includes(categoryLower) || 
             categoryLower.includes(catName.replace(/s$/, '')) // Handle plural/singular
    })

    if (matchingCategory) {
      return {
        name: matchingCategory.name,
        slug: matchingCategory.slug,
      }
    }

    // Return null for categories that don't exist in categories.json
    return null
  }).filter(Boolean) // Remove null entries
}


export default async function FarmListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Find the farm data based on the slug from farms.json
  const farm = farmsData.find((f: FarmData) => f.slug === id)
  
  // If no farm is found for the slug, show a 404 page
  if (!farm) {
    notFound()
  }

  // ✅ Fetch reviews INSIDE the component
  const reviewsData = await getReviews(farm.id)

  // Parse comma-separated strings into arrays
  const amenities = farm.amenities ? farm.amenities.split(',').map((a: string) => a.trim()) : []
  const varieties = farm.varieties ? farm.varieties.split(',').map((v: string) => v.trim()) : []
  
  // Parse categories (already a string, but getCategoryInfo expects it)
  const categories = getCategoryInfo(farm.categories || "")

  // Find the nearest city for breadcrumb
  const findNearestCity = () => {
    // Look for a location that contains this farm
    const locationWithFarm = locationsWithFarms.find(location => 
      location.farms?.some(locationFarm => locationFarm.id === farm.id)
    )
    
    if (locationWithFarm) {
      return {
        name: locationWithFarm.name,
        province: locationWithFarm.province,
        slug: locationWithFarm.location_slug
      }
    }
    
    // Fallback: use the farm's city_name if no location match found
    return {
      name: farm.city_name,
      province: farm.state_province,
      slug: `${farm.city_name.toLowerCase().replace(/\s+/g, '-')}-${farm.state_province.toLowerCase().replace(/\s+/g, '-')}-ca` 
    }
  }
  
  const nearestCity = findNearestCity()

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
                <BreadcrumbLink href={`/farms-near/${nearestCity.slug}`} className="hover:text-primary transition-colors">
                  {nearestCity.name}, {nearestCity.province}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">{farm.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
      <main className="container mx-auto px-4 lg:px-8 py-12 max-w-7xl">
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {farm.verified === 1 && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 px-3 py-1">
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    Verified
                  </Badge>
                )}
                {farm.featured === 1 && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 px-3 py-1">
                    <Crown className="w-3.5 h-3.5 mr-1.5" />
                    Featured
                  </Badge>
                )}
                {farm.pet_friendly === 1 && (
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 px-3 py-1">
                    <PawPrint className="w-3.5 h-3.5 mr-1.5" />
                    Pet Friendly
                  </Badge>
                )}
              </div>

              <div>
                <h1 className="text-4xl font-bold text-foreground mb-3 leading-tight">{farm.name}</h1>
                
                <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-medium">
                      {farm.city_name}, {farm.state_province}
                    </span>
                  </div>
                  
                  {/* Category Tags */}
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/${category.slug}`}
                        className="inline-flex items-center rounded-full text-sm font-medium text-primary"
                      >
                        <CategoryIcon categoryName={category.name} className="w-4 h-4 mr-1.5" />
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <FarmInteractiveElements 
              farmName={farm.name}
              locationLink={`https://maps.google.com/?q=${encodeURIComponent(`${farm.street}, ${farm.city_name}, ${farm.state_province}`)}`}
              farmId={`zcrm_${farm.id}`}
              farmCity={farm.city_name}
              farmState={farm.state_province}
              farmPhone={farm.phone}
              farmWebsite={farm.website}
            />
          </div>
          <div className="w-full h-80 lg:h-[500px] rounded-2xl overflow-hidden shadow-sm border">
            <Image
              src="/images/farms/christmas-tree.webp"
              alt={`${farm.name} - Christmas Tree Farm`}
              width={800}
              height={500}
              className="w-full h-full object-cover"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            />
          </div>
        </div>
        <div className="bg-primary border border-primary/50 p-4 rounded-xl mb-6">
          <p className="text-white font-medium">
          <strong>Opening Date:</strong> {farm.opening_date} • <strong>Closing Date:</strong> {farm.closing_date}
          </p>
        </div>

        {/* Unverified Farm Disclaimer */}
        {farm.verified !== 1 && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6 flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-amber-900 font-semibold mb-1">Not Verified by Owner</p>
              <p className="text-amber-800 text-sm leading-relaxed">
                This farm's information has not been verified by the owner. We recommend calling ahead to confirm hours, availability, and pricing before visiting.
              </p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-semibold mb-4">About This Farm</CardTitle>
                
                {/* Farm Type Badge */}
                <div>
                  <Badge className="text-sm font-medium">
                    {farm.type}
                  </Badge>
                </div>

                
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="prose prose-lg max-w-none">
                  <p className="text-muted-foreground leading-relaxed text-lg mb-0">
                    {farm.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                  <Clock className="w-6 h-6 text-primary" />
                  Operating Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.keys(farm).filter(key => key.endsWith('_hours')).length > 0 ? (
                  <div className="space-y-3">
                    {Object.keys(farm).filter(key => key.endsWith('_hours')).map(key => (
                      <div
                        key={key}
                        className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
                      >
                        <span className="font-semibold text-foreground">{key.replace('_hours', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        <span
                          className={`font-medium ${
                            farm[key as keyof typeof farm] === "Closed" ? "text-red-500" : "text-emerald-600"
                          }`}
                        >
                          {farm[key as keyof typeof farm] as string}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Operating hours not available. Please contact the farm for more information.</p>
                )}
              </CardContent>
            </Card>


            <div className="flex flex-col gap-6">
              <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold">Crop Varieties</CardTitle>
                </CardHeader>
                <CardContent>
  <div className="flex flex-wrap gap-3">
    {varieties.map((variety) => {
      const varietySlug = getVarietySlug(variety)
      
      if (varietySlug) {
        return (
          <Link key={variety} href={`/varieties/${varietySlug}`}>
            <Badge className="bg-primary text-white border-primary px-3 text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors">
              <TreePine className="w-3.5 h-3.5 mr-1.5" />
              {variety}
            </Badge>
          </Link>
        )
      }
      
      return (
        <Badge key={variety} className="bg-primary text-white border-primary px-3 text-sm font-medium">
          {variety}
        </Badge>
      )
    })}
  </div>
</CardContent>
              </Card>

              <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold">Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline" className="px-3 text-sm font-medium">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <ReviewsList farmId={farm.id} />
  <ReviewForm farmId={farm.id} farmName={farm.name} />

            </div>

            
          </div>

          <div className="space-y-6">

            <Card className="shadow-sm border-0 bg-white">
            <div className="w-full h-64 rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCjA7seTNfSd-MypolPjrg6Q6648TSCvTE'}&q=${encodeURIComponent(`${farm.street}, ${farm.city_name}, ${farm.state_province}`)}&zoom=15`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Location of ${farm.name}`}
                  />
                </div>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">Contact Information</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm leading-relaxed">
                      <div className="font-medium">{farm.street}</div>
                      <div className="text-muted-foreground">
                        {farm.city_name}, {farm.state_province} {farm.postal_code}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    <a href={`tel:${farm.phone}`} className="text-sm font-medium hover:text-primary transition-colors">
                      {farm.phone}
                    </a>
                  </div>

                  <div className="flex items-center gap-4">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                    <a
                      href={`mailto:${farm.email}`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {farm.email}
                    </a>
                  </div>

                  {farm.website && (
                    <div className="flex items-center gap-4">
                      <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                      <a
                        href={farm.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex gap-3">
                  {farm.facebook && (
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                      <a href={farm.facebook} target="_blank" rel="noopener noreferrer">
                        <Facebook className="w-4 h-4 mr-2" />
                        Facebook
                      </a>
                    </Button>
                  )}
                  {farm.instagram && (
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                      <a href={farm.instagram} target="_blank" rel="noopener noreferrer">
                        <Instagram className="w-4 h-4 mr-2" />
                        Instagram
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                  <DollarSign className="w-6 h-6 text-primary" />
                  Pricing & Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2 font-medium">Price Range</p>
                  <p className="text-2xl font-bold text-primary">{farm.price_range || "Contact for pricing"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Opening Date</p>
                    <p className="text-lg font-semibold text-foreground">
                      {farm.opening_date || (farm.categories?.toLowerCase().includes('christmas') ? 'Late November' : 'Coming soon')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Closing Date</p>
                    <p className="text-lg font-semibold text-foreground">
                      {farm.closing_date || (farm.categories?.toLowerCase().includes('christmas') ? 'December 24th' : 'Coming soon')}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-3 font-medium">Payment Methods</p>
                  {farm.payment_methods ? (
                    <div className="flex flex-wrap gap-2">
                      {farm.payment_methods.split(',').map((method: string) => (
                        <Badge 
                          key={method.trim()} 
                          variant="outline" 
                          className="px-3 py-1 text-sm font-medium cursor-pointer hover:bg-primary/5 transition-colors"
                        >
                          {method.trim()}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Contact farm for payment options</p>
                  )}
                </div>

                {farm.pet_friendly === 1 && (
                  <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <PawPrint className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold">Pet Friendly Farm</span>
                  </div>
                )}
              </CardContent>
            </Card>

           
          </div>
        </div>
      </main>

      <FarmFooter />
    </div>
  )
}
