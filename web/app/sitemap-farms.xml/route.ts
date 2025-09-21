import { NextRequest } from 'next/server'

// Required for static export
export const dynamic = 'force-static'

// Import static data
import farmsData from '../../data/farms.json'

interface Farm {
  id: string
  slug: string
  updated_at: string
  featured: number
  verified: number
  active: number
}

export async function GET(request: NextRequest) {
  const baseUrl = 'https://pickafarm.com'
  
  // Get current date for lastmod
  const currentDate = new Date().toISOString()
  
  // Filter active farms
  const activeFarms = (farmsData as Farm[]).filter(farm => farm.active === 1)
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

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
      'Cache-Control': 'public, max-age=7200, s-maxage=7200', // Cache for 2 hours
    },
  })
}
