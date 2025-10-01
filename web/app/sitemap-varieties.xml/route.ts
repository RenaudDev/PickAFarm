import { NextRequest } from 'next/server'

// Required for static export
export const dynamic = 'force-static'

export async function GET(request: NextRequest) {
  const baseUrl = 'https://pickafarm.com'
  
  // Get current date for lastmod
  const currentDate = new Date().toISOString()
  
  // Static list of all variety slugs (from your variety-mapper.ts)
  const varietySlugs = [
    'balsam-fir-christmas-trees',
    'fraser-fir-christmas-trees',
    'canaan-fir-christmas-trees',
    'concolor-fir-christmas-trees',
    'grand-fir-christmas-trees',
    'noble-fir-christmas-trees',
    'nordmann-fir-christmas-trees',
    'douglas-fir-christmas-trees',
    'cook-blue-fir-christmas-trees',
    'white-spruce-christmas-trees',
    'norway-spruce-christmas-trees',
    'colorado-blue-spruce-christmas-trees',
    'serbian-spruce-christmas-trees',
    'white-pine-christmas-trees',
    'scotch-pine-christmas-trees',
    'monterrey-pines-christmas-trees',
    'lodgepole-pine-christmas-trees',
  ]
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Christmas Tree Varieties -->
${varietySlugs.map(slug => `  <url>
    <loc>${baseUrl}/varieties/${slug}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}

</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
    },
  })
}