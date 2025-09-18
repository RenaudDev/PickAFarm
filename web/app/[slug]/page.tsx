import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MapPin, Search, Wheat, Star, ChevronRight } from "lucide-react"
import FarmNavbar from "@/components/farm-navbar"
import FarmFooter from "@/components/farm-footer"
import CategoryPageClient from "@/components/category-page-client"

// Import categories data for static generation
import categoriesData from "../../data/categories.json"

// Generate static params using slugs from dynamically generated categories.json
export async function generateStaticParams() {
  return categoriesData.map((category: any) => ({
    slug: category.slug
  }))
}

// Mock data - in real app this would come from props/API
const categoryData = {
  "christmas-tree-farms": {
    name: "Christmas Tree Farms",
    totalFarms: 47,
    description:
      "Find the perfect Christmas tree at local farms offering fresh-cut trees, family activities, and holiday traditions.",
    intro:
      "Christmas tree farms offer a magical holiday experience where families can select and cut their own perfect tree. These farms typically operate seasonally from late November through December, providing fresh Fraser Firs, Noble Firs, and other premium varieties alongside festive activities like hot cocoa, hayrides, and holiday decorations.",
    topCities: [
      { name: "Toronto", regionCode: "ON", countryCode: "CA", slug: "toronto-on-ca", farmCount: 12 },
      { name: "Vancouver", regionCode: "BC", countryCode: "CA", slug: "vancouver-bc-ca", farmCount: 8 },
      { name: "Montreal", regionCode: "QC", countryCode: "CA", slug: "montreal-qc-ca", farmCount: 6 },
      { name: "Calgary", regionCode: "AB", countryCode: "CA", slug: "calgary-ab-ca", farmCount: 5 },
      { name: "Ottawa", regionCode: "ON", countryCode: "CA", slug: "ottawa-on-ca", farmCount: 4 },
      { name: "Edmonton", regionCode: "AB", countryCode: "CA", slug: "edmonton-ab-ca", farmCount: 3 },
    ],
    featuredFarms: [
      {
        id: 1,
        name: "Evergreen Christmas Trees",
        city: "Mississauga",
        region: "ON",
        country: "CA",
        url: "/farm/1",
        blurb:
          "Family-owned farm with over 50 years of tradition, offering fresh-cut Fraser Firs and Noble Firs with complimentary hot cocoa.",
      },
      {
        id: 2,
        name: "Pine Valley Tree Farm",
        city: "Richmond Hill",
        region: "ON",
        country: "CA",
        url: "/farm/2",
        blurb:
          "Sustainable tree farm featuring pre-cut and choose-and-cut options, plus wagon rides and a festive gift shop.",
      },
      {
        id: 3,
        name: "Holiday Grove Farm",
        city: "Markham",
        region: "ON",
        country: "CA",
        url: "/farm/3",
        blurb:
          "Premium Christmas trees with family activities including tree decorating workshops and seasonal refreshments.",
      },
    ],
    faqs: [
      {
        question: "When is the best time to visit Christmas tree farms?",
        answer:
          "Most Christmas tree farms open the weekend after Thanksgiving and remain open through mid-December. The best selection is typically available in early December, while the freshest trees are cut closer to Christmas.",
      },
      {
        question: "What should I bring when visiting a tree farm?",
        answer:
          "Bring warm clothing, gloves, and sturdy shoes. Many farms provide saws and netting, but call ahead to confirm. Consider bringing a measuring tape to ensure your tree fits your space.",
      },
      {
        question: "Are pets allowed at Christmas tree farms?",
        answer:
          "Pet policies vary by farm. Many welcome leashed pets, but some may restrict animals during busy periods. Always call ahead to confirm their pet policy before visiting.",
      },
      {
        question: "How much do Christmas trees typically cost?",
        answer:
          "Prices vary by tree type, size, and location, typically ranging from $30-80 CAD. Premium varieties like Fraser Fir may cost more than traditional options like Balsam Fir.",
      },
    ],
  },
}

export default async function CategoryLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = categoryData[slug as keyof typeof categoryData] || categoryData["christmas-tree-farms"]

  return (
    <div className="min-h-screen bg-background">
      <FarmNavbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            Find the Best {category.name}
          </h1>
          <div className="flex justify-center mb-6">
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-primary/10 text-primary border-primary/20">
              {category.totalFarms} farms in our directory
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
            {category.intro}
          </p>

          {/* Search Bar - Client Component */}
          <CategoryPageClient category={category} slug={slug} />
        </div>
      </section>

      {/* Top Cities Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Locations for {category.name}</h2>
          {/* Cities Grid - Interactive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.topCities?.map((city: any) => (
              <Card
                key={city.slug}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-primary group"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{city.name}</h3>
                      <p className="text-muted-foreground flex items-center mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {city.regionCode}, {city.countryCode}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {city.farmCount} farms
                      </Badge>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Farms Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Farms</h2>
            <p className="text-muted-foreground">
              Discover some of our top-rated {category.name.toLowerCase()} from our collection of {category.totalFarms}{" "}
              farms
            </p>
          </div>
          {/* Featured Farms Grid - Interactive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {category.featuredFarms?.map((farm: any) => (
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
          <h2 className="text-3xl font-bold text-center mb-12">About {category.name}</h2>
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
            {category.faqs.map((faq, index) => (
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
