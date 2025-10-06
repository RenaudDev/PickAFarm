/**
 * Breadcrumb Schema Generator
 * Generates Schema.org BreadcrumbList structured data for SEO
 */

const BASE_URL = 'https://pickafarm.com'

export interface BreadcrumbItem {
  name: string
  url: string
}

/**
 * Generate BreadcrumbList schema for any page
 * @param items - Array of breadcrumb items (name and url)
 * @returns Schema.org BreadcrumbList JSON-LD object
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${BASE_URL}${item.url}`
    }))
  }
}

/**
 * Generate breadcrumb schema for state pages
 * Example: Home > Wisconsin
 */
export function generateStateBreadcrumbSchema(stateName: string, stateSlug: string) {
  return generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: stateName, url: `/${stateSlug}` }
  ])
}

/**
 * Generate breadcrumb schema for location pages
 * Example: Home > Ontario > Ajax
 */
export function generateLocationBreadcrumbSchema(
  stateName: string,
  stateSlug: string,
  cityName: string,
  locationSlug: string
) {
  return generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: stateName, url: `/${stateSlug}` },
    { name: cityName, url: `/farms-near/${locationSlug}` }
  ])
}

/**
 * Generate breadcrumb schema for farm detail pages
 * Example: Home > Wisconsin > Farm Name
 */
export function generateFarmBreadcrumbSchema(
  stateName: string,
  stateSlug: string,
  farmName: string,
  farmSlug: string
) {
  return generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: stateName, url: `/${stateSlug}` },
    { name: farmName, url: `/farms/${farmSlug}` }
  ])
}

/**
 * Generate breadcrumb schema for category pages
 * Example: Home > Christmas Tree Farms
 */
export function generateCategoryBreadcrumbSchema(categoryName: string, categorySlug: string) {
  return generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: categoryName, url: `/${categorySlug}` }
  ])
}

/**
 * Generate breadcrumb schema for state+category pages
 * Example: Home > Wisconsin > Christmas Tree Farms
 */
export function generateStateCategoryBreadcrumbSchema(
  stateName: string,
  stateSlug: string,
  categoryName: string,
  categorySlug: string
) {
  return generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: stateName, url: `/${stateSlug}` },
    { name: categoryName, url: `/${stateSlug}/${categorySlug}` }
  ])
}

/**
 * Generate breadcrumb schema for category+location pages
 * Example: Home > Ontario > Ajax > Christmas Tree Farms
 */
export function generateCategoryLocationBreadcrumbSchema(
  stateName: string,
  stateSlug: string,
  cityName: string,
  locationSlug: string,
  categoryName: string,
  categorySlug: string
) {
  return generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: stateName, url: `/${stateSlug}` },
    { name: cityName, url: `/farms-near/${locationSlug}` },
    { name: categoryName, url: `/${categorySlug}/near/${locationSlug}` }
  ])
}
