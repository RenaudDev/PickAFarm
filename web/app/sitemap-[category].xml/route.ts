import { NextRequest } from 'next/server'

// Required for static export
export const dynamic = 'force-static'

// Data sources
import locationsWithFarms from '../../data/locations-with-farms.json'
import categories from '../../data/categories.json'

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

// Map our category slugs to possible farm category labels appearing in farm data
const CATEGORY_MATCH: Record<string, string[]> = {
  'apple-orchards': ['Apple Orchard', 'Apple Picking', 'Apples'],
  'pumpkin-patches': ['Pumpkin Patch', 'Pumpkins'],
  'berry-farms': ['Berry Farm', 'Berry Picking', 'Berries'],
  'christmas-tree-farms': ['Christmas Trees', 'Christmas Tree', 'Tree Farm'],
}

function farmMatchesCategory(farm: { categories?: string }, categorySlug: string): boolean {
  if (!farm) return false
  let farmCategories: string[] = []
  try {
    farmCategories = JSON.parse(farm.categories || '[]')
    if (typeof farmCategories === 'string') farmCategories = [farmCategories]
  } catch {
    farmCategories = farm.categories ? [farm.categories] : []
  }
  const targets = CATEGORY_MATCH[categorySlug] || []
  if (targets.length === 0) return false
  return targets.some(t => farmCategories.some(fc => fc?.toLowerCase?.().includes(t.toLowerCase())))
}

// Generate static params for all categories
export async function generateStaticParams() {
  try {
    const categoryParams = (categories as Array<{ slug: string }>).map(category => ({
      category: category.slug
    }))
    
    console.log(`📋 Generated ${categoryParams.length} static params for category sitemaps:`, categoryParams.map(p => p.category))
    return categoryParams
  } catch (error) {
    console.error('Error generating static params for category sitemaps:', error)
    // Fallback: return at least one param to prevent build failure
    return [
      { category: 'christmas-tree-farms' }
    ]
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ category: string }> }
) {
  const baseUrl = 'https://pickafarm.com'
  const currentDate = new Date().toISOString()
  const { category } = await context.params

  // Validate category exists (optional, but keeps sitemap clean)
  const known = (categories as Array<{ slug: string }>).some(c => c.slug === category)
  if (!known) {
    const empty = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`
    return new Response(empty, { headers: { 'Content-Type': 'application/xml' } })
  }

  // Filter locations to only ones with at least one farm in this category
  const locations = (locationsWithFarms as Location[]).filter(loc =>
    Array.isArray(loc.farms) && loc.farms.some(farm => farmMatchesCategory(farm, category))
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
