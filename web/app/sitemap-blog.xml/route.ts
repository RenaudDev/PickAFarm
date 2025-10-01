import { NextRequest } from 'next/server'
import { getAllPosts } from '@/lib/wordpress'

// Required for static export
export const dynamic = 'force-static'

export async function GET(request: NextRequest) {
  const baseUrl = 'https://pickafarm.com'
  const currentDate = new Date().toISOString()
  
  try {
    // Fetch blog posts from WordPress
    const posts = await getAllPosts()
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- Blog Posts -->
${posts.map(post => `  <url>
    <loc>${baseUrl}/blog/${post.slug}/</loc>
    <lastmod>${post.modified || post.date || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}

</urlset>`

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error)
    
    // Return empty sitemap on error to prevent build failure
    const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Blog posts could not be fetched at build time -->
</urlset>`

    return new Response(emptySitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  }
}