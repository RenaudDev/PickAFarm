import { NextRequest } from 'next/server'

// Required for static export
export const dynamic = 'force-static'

// Import static data
import locationsData from '../../data/locations-with-farms.json'

interface Location {
  name: string
  slug: string
  location_slug: string
  full_location: string
  seo_title: string
  meta_description: string
  farms: any[]
}

export async function GET(request: NextRequest) {
  const baseUrl = 'https://pickafarm.com'
  
  // Get current date for lastmod
  const currentDate = new Date().toISOString()
  
  // Get locations with farms
  const allLocations = locationsData as Location[]
  // Filter to only include locations that actually have farms
  const locations = allLocations.filter(location => location.farms && location.farms.length > 0)
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- All Farms Near City Pages (/farms-near/) -->
${locations.map(location => `  <url>
    <loc>${baseUrl}/farms-near/${location.location_slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}

</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
    },
  })
}
