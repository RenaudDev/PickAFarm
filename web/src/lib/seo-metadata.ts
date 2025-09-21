import { Metadata } from 'next'

interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url: string
  type?: 'website' | 'article'
  isBusiness?: boolean
  noIndex?: boolean
}

const DEFAULT_KEYWORDS = [
  "pick your own farms",
  "u-pick farms", 
  "fresh produce",
  "farms near me",
  "local farms",
  "seasonal activities",
  "farm visits"
]

const SITE_CONFIG = {
  siteName: "PickAFarm",
  domain: "https://pickafarm.com",
  defaultImage: "/images/og-pickafarm.webp",
  twitterHandle: "@pickafarm"
}

export function generateMetadata({
  title,
  description,
  keywords = [],
  image = SITE_CONFIG.defaultImage,
  url,
  type = "website",
  isBusiness = false,
  noIndex = false
}: SEOConfig): Metadata {
  
  // Combine default keywords with page-specific ones
  const allKeywords = [...DEFAULT_KEYWORDS, ...keywords].filter(Boolean)
  
  // Ensure title has site name
  const fullTitle = title.includes("PickAFarm") || title.includes("Pick A Farm") || title.includes(" Near ") || title.includes("Farms") || title.includes("Orchards") ? title : `${title} | PickAFarm`
  
  // Ensure image is absolute URL
  const imageUrl = image.startsWith('http') ? image : `${SITE_CONFIG.domain}${image}`
  
  return {
    title: fullTitle,
    description,
    keywords: allKeywords.join(", "),
    
    // Open Graph Protocol
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_CONFIG.siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      type,
    },
    
    // Twitter Card
    twitter: {
      card: "summary_large_image",
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
      title,
      description,
      images: [imageUrl],
    },
    
    // Robots and indexing
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Canonical URL
    alternates: {
      canonical: url,
    },
    
    // Additional structured data and meta tags
    other: {
      // Open Graph additional
      'og:site_name': SITE_CONFIG.siteName,
      'og:locale': 'en_US',
      
      // Additional SEO
      'theme-color': '#22c55e',
      'msapplication-TileColor': '#22c55e',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'format-detection': 'telephone=no',
      
      // Geographic targeting
      'geo.region': 'CA-ON',
      'geo.placename': 'Ontario, Canada',
      'ICBM': '43.6532, -79.3832', // Toronto coordinates as default
      
      // Business schema hints
      ...(isBusiness ? {
        'business:contact_data:locality': 'Ontario',
        'business:contact_data:region': 'Canada',
      } : {}),
    },
  }
}

// Farm-specific SEO metadata
export function generateFarmMetadata(farm: any): Metadata {
  // Create a simple title with just farm name
  const title = `${farm.name} | Pick A Farm`
  
  // Get category name and create singular/plural versions
  const categoryName = farm.categories || ""
  const categorySingular = categoryName.replace(/s$/, '') // Remove trailing 's' for singular
  const categoryPlural = categoryName.endsWith('s') ? categoryName : `${categoryName}s` // Add 's' for plural if not already there
  
  // Create a better description with categories
  const description = `${farm.name} is a ${categoryPlural.toLowerCase()} in ${farm.city_name}, ${farm.state_province}. Visit us to learn more.`
  
  const keywords = [
    farm.name.toLowerCase(),
    farm.categories?.toLowerCase().replace(/\s+/g, ' '),
    farm.city_name?.toLowerCase(),
    farm.state_province?.toLowerCase(),
    farm.type?.toLowerCase(),
    `${farm.categories?.toLowerCase()} ${farm.city_name?.toLowerCase()}`,
    `${farm.categories?.toLowerCase()} ${farm.state_province?.toLowerCase()}`,
    ...(farm.varieties ? farm.varieties.split(',').map((v: string) => v.trim().toLowerCase()) : []),
    ...(farm.amenities ? farm.amenities.split(',').map((a: string) => a.trim().toLowerCase()) : [])
  ].filter(Boolean)
  
  return generateMetadata({
    title,
    description,
    keywords,
    url: `${SITE_CONFIG.domain}/farms/${farm.slug}`,
    type: "article",
    isBusiness: true
  })
}

// Location-based SEO metadata
export function generateLocationMetadata(category: string, location: string, farmCount: number): Metadata {
  const title = `${category} Near ${location}`
  const description = `Find ${farmCount} ${category.toLowerCase()} near ${location}. Fresh produce, seasonal activities, and family fun at local pick-your-own farms.`
  
  const keywords = [
    category.toLowerCase(),
    location.toLowerCase(),
    "near me",
    "local farms",
    `${category.toLowerCase()} near ${location.toLowerCase()}`,
    "family activities",
    "seasonal fun"
  ]
  
  const locationSlug = location.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  
  return generateMetadata({
    title,
    description,
    keywords,
    url: `${SITE_CONFIG.domain}/${categorySlug}/near/${locationSlug}`
  })
}

// Category SEO metadata
export function generateCategoryMetadata(category: string, categoryData: any, farmCount: number): Metadata {
  const title = `Find the Best ${category} Near You`
  const description = categoryData?.description || 
    `Discover ${farmCount} ${category.toLowerCase()} across Ontario and beyond. Find the perfect farm for pick-your-own fun, fresh produce, and family activities.`
  
  const keywords = [
    category.toLowerCase(),
    `${category.toLowerCase()} ontario`,
    `${category.toLowerCase()} canada`,
    "pick your own",
    "family farms",
    "seasonal activities"
  ]
  
  const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  
  return generateMetadata({
    title,
    description,
    keywords,
    url: `${SITE_CONFIG.domain}/${categorySlug}`
  })
}

// Homepage SEO metadata
export function generateHomepageMetadata(): Metadata {
  return generateMetadata({
    title: "Discover Local U-Pick Farms - Pick A Farm",
    description: "Discover the best pick-your-own farms, Christmas tree farms, and u-pick locations across Canada. Fresh produce, family activities, and seasonal fun await!",
    keywords: [
      "pick your own farms canada",
      "u-pick farms ontario", 
      "christmas tree farms",
      "family farm activities",
      "fresh produce near me",
      "seasonal farm visits"
    ],
    url: SITE_CONFIG.domain
  })
}
