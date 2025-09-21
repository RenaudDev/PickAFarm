import { NextRequest } from 'next/server'

// Required for static export
export const dynamic = 'force-static'

// Data sources
import locationsWithFarms from '../../data/locations-with-farms.json'

interface Location {
  location_slug: string
  name: string
  full_location: string
  farms: Array<{
    id: string
    name: string
    categories?: string
  }>
}

function farmMatchesChristmasTreeCategory(farm: { categories?: string }): boolean {
  if (!farm) return false
  let farmCategories: string[] = []
  try {
    farmCategories = JSON.parse(farm.categories || '[]')
    if (typeof farmCategories === 'string') farmCategories = [farmCategories]
  } catch {
    farmCategories = farm.categories ? [farm.categories] : []
  }
  
  const christmasTreeTerms = ['Christmas Trees', 'Christmas Tree', 'Tree Farm']
  return christmasTreeTerms.some(term =>
    farmCategories.some((farmCat: string) =>
      farmCat?.toLowerCase?.().includes(term.toLowerCase())
    )
  )
}

export async function GET(request: NextRequest) {
  const baseUrl = 'https://pickafarm.com'
  const currentDate = new Date().toISOString()
  const category = 'christmas-tree-farms'

  // Filter locations to only ones with at least one Christmas tree farm
  const locations = (locationsWithFarms as Location[]).filter(loc =>
    Array.isArray(loc.farms) && loc.farms.some(farm => farmMatchesChristmasTreeCategory(farm))
  )

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locations.map(loc => `  <url>
    <loc>${baseUrl}/${category}/near/${loc.location_slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
