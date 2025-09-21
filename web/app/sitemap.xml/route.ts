import { NextRequest } from 'next/server'

// Required for static export
export const dynamic = 'force-static'

// Import static data
import farmsData from '../../data/farms.json'
import locationsData from '../../data/locations-with-farms.json'
import categoryContent from '../../data/category-content.json'

interface Farm {
  id: string
  slug: string
  updated_at: string
  featured: number
  verified: number
  active: number
}

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
  
  // Filter active farms
  const activeFarms = (farmsData as Farm[]).filter(farm => farm.active === 1)
  
  // Get locations with farms
  const allLocations = locationsData as Location[]
  // Filter to only include locations that actually have farms
  const locations = allLocations.filter(location => location.farms && location.farms.length > 0)
  
  // Get available categories from category-content.json
  const categoryData = categoryContent as CategoryData
  const categories = Object.keys(categoryData)
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">

  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Category + Location Pages (Highest Priority) -->
${categories.flatMap(categoryKey => 
    locations.map(location => `  <url>
    <loc>${baseUrl}/${categoryData[categoryKey].slug}/near/${location.location_slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`)
).join('\n')}

  <!-- Category Pages -->
${categories.map(categoryKey => `  <url>
    <loc>${baseUrl}/${categoryData[categoryKey].slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}

  <!-- Individual Farm Pages -->
${activeFarms.map(farm => {
    const priority = farm.featured === 1 ? '0.8' : (farm.verified === 1 ? '0.7' : '0.6')
    const changefreq = farm.featured === 1 ? 'weekly' : 'monthly'
    const lastmod = farm.updated_at || currentDate
    
    return `  <url>
    <loc>${baseUrl}/farms/${farm.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}).join('\n')}

</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
    },
  })
}
