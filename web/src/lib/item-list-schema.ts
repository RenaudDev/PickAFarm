/**
 * ItemList/CollectionPage Schema Generator
 * Generates Schema.org structured data for farm listings and map results
 */

const BASE_URL = 'https://pickafarm.com'

interface Farm {
  id: string
  name: string
  slug: string
  city_name?: string
  state_province?: string
  country?: string
  description?: string
  rating?: number
  reviews?: number
  image?: string
}

/**
 * Generate ItemList schema for farm collections
 * Use this for category pages, location pages, and map results
 */
export function generateItemListSchema(
  farms: Farm[],
  pageUrl: string,
  listName: string,
  description?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listName,
    "description": description || `A collection of ${farms.length} farms`,
    "url": pageUrl,
    "numberOfItems": farms.length,
    "itemListElement": farms.map((farm, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "LocalBusiness",
        "@id": `${BASE_URL}/farms/${farm.slug}/`,
        "name": farm.name,
        "url": `${BASE_URL}/farms/${farm.slug}/`,
        "description": farm.description || `Visit ${farm.name} for pick-your-own produce and farm activities`,
        ...(farm.image && {
          "image": farm.image
        }),
        ...(farm.city_name && farm.state_province && {
          "address": {
            "@type": "PostalAddress",
            "addressLocality": farm.city_name,
            "addressRegion": farm.state_province,
            "addressCountry": farm.country || "US"
          }
        }),
        ...(farm.rating && farm.reviews && farm.reviews > 0 && {
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
}

/**
 * Generate CollectionPage schema with ItemList embedded
 * Use this for paginated or filtered farm listings
 */
export function generateCollectionPageSchema(
  farms: Farm[],
  pageUrl: string,
  pageName: string,
  pageDescription: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": pageName,
    "description": pageDescription,
    "url": pageUrl,
    "mainEntity": generateItemListSchema(farms, pageUrl, pageName, pageDescription)
  }
}

/**
 * Generate simplified ItemList for map markers
 * Lighter weight for map components
 */
export function generateMapItemListSchema(
  farms: Farm[],
  pageUrl: string,
  listName: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listName,
    "url": pageUrl,
    "numberOfItems": farms.length,
    "itemListElement": farms.slice(0, 50).map((farm, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "LocalBusiness",
        "@id": `${BASE_URL}/farms/${farm.slug}/`,
        "name": farm.name,
        "url": `${BASE_URL}/farms/${farm.slug}/`
      }
    }))
  }
}
