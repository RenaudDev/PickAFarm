import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
} from "lucide-react"
import FarmNavbar from "@/components/farm-navbar"
import FarmFooter from "@/components/farm-footer"
import FarmInteractiveElements from "@/components/farm-interactive-elements"

// Import farms data for static generation
import farmsData from "../../../data/farms.json"

// Generate static params using slugs from farms.json
export async function generateStaticParams() {
  return farmsData.map((farm: any) => ({
    id: farm.slug
  }))
}

// Mock data - in real app this would come from API/database
const mockFarmData = {
  id: "1",
  name: "Evergreen Christmas Tree Farm",
  description:
    "A family-owned Christmas tree farm offering fresh-cut and u-pick trees in a beautiful countryside setting. We've been serving families for over 30 years with the finest Fraser Firs, Noble Firs, and Douglas Firs.",
  street: "123 Pine Tree Lane",
  city: "Markham",
  state: "Ontario",
  postal_code: "L3R 1A1",
  country: "Canada",
  phone: "(905) 555-0123",
  email: "info@evergreenfarm.ca",
  website: "https://evergreenfarm.ca",
  facebook: "https://facebook.com/evergreenfarm",
  instagram: "https://instagram.com/evergreenfarm",
  location_link: "https://maps.google.com/?q=123+Pine+Tree+Lane+Markham+ON",
  categories: ["Christmas Trees", "U-Pick", "Pre-Cut"],
  established_in: 1992,
  opening_date: "November 15",
  closing_date: "December 23",
  type: "U-Pick & Pre-Cut",
  amenities: ["Free Hot Chocolate", "Wagon Rides", "Gift Shop", "Parking", "Restrooms", "Picnic Area"],
  varieties: ["Fraser Fir", "Noble Fir", "Douglas Fir", "Balsam Fir"],
  pet_friendly: true,
  price_range: "$39 - $89",
  price_range_min: 39,
  price_range_max: 89,
  payment_methods: ["Cash", "Credit Card", "Debit", "E-Transfer"],
  verified: true,
  featured: true,
  rating: 4.8,
  reviews: 127,
  // Operating hours
  sunday_hours: "9:00 AM - 6:00 PM",
  monday_hours: "Closed",
  tuesday_hours: "Closed",
  wednesday_hours: "Closed",
  thursday_hours: "Closed",
  friday_hours: "10:00 AM - 8:00 PM",
  saturday_hours: "9:00 AM - 8:00 PM",
}

const daysOfWeek = [
  { key: "sunday_hours", label: "Sunday" },
  { key: "monday_hours", label: "Monday" },
  { key: "tuesday_hours", label: "Tuesday" },
  { key: "wednesday_hours", label: "Wednesday" },
  { key: "thursday_hours", label: "Thursday" },
  { key: "friday_hours", label: "Friday" },
  { key: "saturday_hours", label: "Saturday" },
]

export default async function FarmListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // In real app, fetch farm data based on params.id
  // For now, use mock data for all pages
  const farm = mockFarmData

  return (
    <div className="min-h-screen bg-background">
      <FarmNavbar />

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {farm.verified && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 px-3 py-1">
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    Verified
                  </Badge>
                )}
                {farm.featured && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 px-3 py-1">
                    <Crown className="w-3.5 h-3.5 mr-1.5" />
                    Featured
                  </Badge>
                )}
               
              </div>

              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-3 leading-tight">{farm.name}</h1>

                <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-medium">
                      {farm.city}, {farm.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-foreground">{farm.rating}</span>
                    <span>({farm.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span>Est. {farm.established_in}</span>
                  </div>
                </div>
              </div>
            </div>

            <FarmInteractiveElements />
          </div>

          <div className="w-full h-80 lg:h-[500px] bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 rounded-2xl flex items-center justify-center shadow-sm border">
            <div className="text-center text-emerald-700">
              <TreePine className="w-20 h-20 mx-auto mb-4 opacity-60" />
              <p className="text-xl font-semibold mb-2">Farm Gallery</p>
              <p className="text-sm opacity-75">Beautiful photos of the farm would be displayed here</p>
            </div>
            
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-6">
                  <p className="text-emerald-800 font-medium">
                    <strong>Harvest Season:</strong> {farm.opening_date} - {farm.closing_date}
                  </p>
                </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-semibold">About This Farm</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-lg">{farm.description}</p>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
              <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold">Crop Varieties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {farm.varieties.map((variety) => (
                      <Badge
                        key={variety}
                        className="bg-green-50 text-green-700 border-green-200 px-3 py-2 text-sm font-medium"
                      >
                        {variety}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold">Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {farm.amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline" className="px-3 py-2 text-sm font-medium">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                  <Clock className="w-6 h-6 text-primary" />
                  Operating Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {daysOfWeek.map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
                    >
                      <span className="font-semibold text-foreground">{label}</span>
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

                
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="shadow-sm border-0 bg-white top-6">
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
                        {farm.city}, {farm.state} {farm.postal_code}
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
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                    <a href={farm.facebook} target="_blank" rel="noopener noreferrer">
                      <Facebook className="w-4 h-4 mr-2" />
                      Facebook
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                    <a href={farm.instagram} target="_blank" rel="noopener noreferrer">
                      <Instagram className="w-4 h-4 mr-2" />
                      Instagram
                    </a>
                  </Button>
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
                  <p className="text-2xl font-bold text-primary">{farm.price_range}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-3 font-medium">Payment Methods</p>
                  <div className="grid grid-cols-2 gap-2">
                    {farm.payment_methods.map((method) => (
                      <Badge key={method} variant="outline" className="justify-center py-2 text-xs font-medium">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>

                {farm.pet_friendly && (
                  <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <PawPrint className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold">Pet Friendly Farm</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">Farm Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground font-medium">Type</span>
                  <span className="text-sm font-semibold">{farm.type}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground font-medium">Established</span>
                  <span className="text-sm font-semibold">{farm.established_in}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground font-medium">Season</span>
                  <span className="text-sm font-semibold">
                    {farm.opening_date} - {farm.closing_date}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <FarmFooter />
    </div>
  )
}
