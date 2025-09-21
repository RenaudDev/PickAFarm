import { NextRequest } from 'next/server'

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
  slug: string
  city: string
  state_province: string
  country: string
  farm_count: number
}

interface CategoryData {
  [key: string]: {
    name: string
    description: string
  }
}

export async function GET(request: NextRequest) {
  const baseUrl = 'https://pickafarm.com'
  
  // Get current date for lastmod
  const currentDate = new Date().toISOString()
  
  // Filter active farms
  const activeFarms = (farmsData as Farm[]).filter(farm => farm.active === 1)
  
  // Get locations with farms
  const locations = locationsData as Location[]
  
  // Get available categories
  const categories = Object.keys(categoryContent as CategoryData)
  
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
${categories.flatMap(categorySlug => 
    locations.map(location => `  <url>
    <loc>${baseUrl}/${categorySlug}/near/${location.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`)
).join('\n')}

  <!-- Category Pages -->
${categories.map(categorySlug => `  <url>
    <loc>${baseUrl}/${categorySlug}</loc>
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
