interface Farm {
  id: string
  name: string
  slug: string
  city_name: string
  state_province: string
  country: string
  latitude: number
  longitude: number
  phone?: string
  email?: string
  website?: string
  description?: string
  categories?: string
  reviews?: number
  rating?: number
  street?: string
  postal_code?: string
}

export function generateFarmsSchema(farms: Farm[], organizationName = "PickAFarm") {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": organizationName,
    "url": "https://pickafarm.com",
    "logo": "https://pickafarm.com/logo.png",
    "description": "Find the best pick-your-own farms, Christmas tree farms, pumpkin patches, and agritourism experiences across Canada.",
    "sameAs": [
      "https://www.facebook.com/PickAFarmCanada",
      "https://twitter.com/PickAFarmCA"
    ],
    "member": farms.slice(0, 50).map(farm => {
      const localBusiness: any = {
        "@type": "LocalBusiness",
        "@id": `https://pickafarm.com/farms/${farm.slug}`,
        "name": farm.name,
        "url": `https://pickafarm.com/farms/${farm.slug}`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": farm.street || "",
          "addressLocality": farm.city_name,
          "addressRegion": farm.state_province,
          "addressCountry": farm.country || "CA",
          "postalCode": farm.postal_code || ""
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": farm.latitude,
          "longitude": farm.longitude
        }
      }

      // Add optional fields
      if (farm.phone) {
        localBusiness.telephone = farm.phone
      }

      if (farm.email) {
        localBusiness.email = farm.email
      }

      if (farm.website) {
        localBusiness.url = farm.website
      }

      if (farm.description) {
        localBusiness.description = farm.description
      }

      // Add aggregateRating if reviews exist
      if (farm.reviews && farm.reviews > 0 && farm.rating) {
        localBusiness.aggregateRating = {
          "@type": "AggregateRating",
          "ratingValue": farm.rating,
          "reviewCount": farm.reviews,
          "bestRating": "5",
          "worstRating": "1"
        }
      }

      return localBusiness
    })
  }

  return organization
}
