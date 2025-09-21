import { NextRequest } from 'next/server'

// Required for static export
export const dynamic = 'force-static'

export async function GET(request: NextRequest) {
  const baseUrl = 'https://pickafarm.com'
  
  // Get current date for lastmod
  const currentDate = new Date().toISOString()
  
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Main Pages Sitemap -->
  <sitemap>
    <loc>${baseUrl}/sitemap-main.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>

  <!-- Christmas Tree Farms Sitemap -->
  <sitemap>
    <loc>${baseUrl}/sitemap-christmas-tree-farms.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>

  <!-- Locations Sitemap -->
  <sitemap>
    <loc>${baseUrl}/sitemap-locations.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>

  <!-- Farms Sitemap -->
  <sitemap>
    <loc>${baseUrl}/sitemap-farms.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>

</sitemapindex>`

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
    },
  })
}
