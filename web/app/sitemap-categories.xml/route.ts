import { NextRequest } from 'next/server'

// Required for static export
export const dynamic = 'force-static'

// Import static data
import locationsData from '../../data/locations-with-farms.json'
import categoryContent from '../../data/category-content.json'

interface Location {
  name: string
  slug: string
  location_slug: string
  full_location: string
  seo_title: string
  meta_description: string
  farms: any[]
}

interface CategoryData {
  [key: string]: {
    name: string
    slug: string
    intro: string
    description: string
    faqs: any[]
  }
}

export async function GET(request: NextRequest) {
  const baseUrl = 'https://pickafarm.com'
  
  // Get current date for lastmod
  const currentDate = new Date().toISOString()
  
  // Get locations with farms
  const allLocations = locationsData as Location[]
  // Filter to only include locations that actually have farms
  const locations = allLocations.filter(location => location.farms && location.farms.length > 0)
  
  // Get available categories from category-content.json
  const categoryData = categoryContent as CategoryData
  const categories = Object.keys(categoryData)
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Category Pages -->
${categories.map(categoryKey => `  <url>
    <loc>${baseUrl}/${categoryData[categoryKey].slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}

  <!-- Category + Location Pages (Highest Priority) -->
${categories.flatMap(categoryKey => 
    locations.slice(0, 20).map(location => `  <url>
    <loc>${baseUrl}/${categoryData[categoryKey].slug}/near/${location.location_slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`)
).join('\n')}

</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
    },
  })
}
