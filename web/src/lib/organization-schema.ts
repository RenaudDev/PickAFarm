/**
 * Organization & WebSite Schema Generator
 * Generates Schema.org structured data for homepage
 */

const BASE_URL = 'https://pickafarm.com'

/**
 * Generate Organization schema for homepage
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    "name": "PickAFarm",
    "url": BASE_URL,
    "logo": {
      "@type": "ImageObject",
      "url": `${BASE_URL}/logo.png`,
      "width": 512,
      "height": 512
    },
    "description": "Discover the best pick-your-own farms, Christmas tree farms, pumpkin patches, and agritourism experiences across North America. Find local farms near you for fresh produce, seasonal activities, and family fun.",
    "foundingDate": "2024",
    "sameAs": [
      "https://www.facebook.com/PickAFarmCanada",
      "https://twitter.com/PickAFarmCA",
      "https://www.instagram.com/pickafarmcanada"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "hello@pickafarm.com",
      "availableLanguage": ["English", "French"]
    }
  }
}

/**
 * Generate WebSite schema with SearchAction for homepage
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    "name": "PickAFarm",
    "url": BASE_URL,
    "description": "Find local pick-your-own farms, Christmas tree farms, and agricultural experiences",
    "publisher": {
      "@id": `${BASE_URL}/#organization`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": "en-US"
  }
}

/**
 * Generate combined Organization + WebSite schemas for homepage
 */
export function generateHomepageSchemas() {
  return [
    generateOrganizationSchema(),
    generateWebSiteSchema()
  ]
}
