/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  productionBrowserSourceMaps: true, // Enable source maps in production

  // 301 Redirects for 404 Error Resolution (PRD-2025-001)
  // Fix malformed location URLs from data generation bug
  async redirects() {
    return [
      // Pattern 0: Legacy route - all-farms-near/near/* → farms-near/*
      // Old route structure that no longer exists
      {
        source: '/all-farms-near/near/:location/',
        destination: '/farms-near/:location/',
        permanent: true,
      },
      // Pattern 1: US states incorrectly tagged as Canada
      // All 50 US states + DC that were marked as "canada"
      {
        source: '/:category/near/:city-:state(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy|dc)-canada/',
        destination: '/:category/near/:city-:state-us/',
        permanent: true,
      },

      // Pattern 2: Full country name "united-states" → "us"
      {
        source: '/:category/near/:location-united-states/',
        destination: '/:category/near/:location-us/',
        permanent: true,
      },

      // Pattern 3: Full Canadian province names → 2-letter codes
      // Ontario
      {
        source: '/:category/near/:city-ontario-canada/',
        destination: '/:category/near/:city-on-ca/',
        permanent: true,
      },
      // Quebec
      {
        source: '/:category/near/:city-quebec-canada/',
        destination: '/:category/near/:city-qc-ca/',
        permanent: true,
      },
      // British Columbia
      {
        source: '/:category/near/:city-british-columbia-canada/',
        destination: '/:category/near/:city-bc-ca/',
        permanent: true,
      },
      // Alberta
      {
        source: '/:category/near/:city-alberta-canada/',
        destination: '/:category/near/:city-ab-ca/',
        permanent: true,
      },
      // Manitoba
      {
        source: '/:category/near/:city-manitoba-canada/',
        destination: '/:category/near/:city-mb-ca/',
        permanent: true,
      },
      // Saskatchewan
      {
        source: '/:category/near/:city-saskatchewan-canada/',
        destination: '/:category/near/:city-sk-ca/',
        permanent: true,
      },
      // Nova Scotia
      {
        source: '/:category/near/:city-nova-scotia-canada/',
        destination: '/:category/near/:city-ns-ca/',
        permanent: true,
      },
      // New Brunswick
      {
        source: '/:category/near/:city-new-brunswick-canada/',
        destination: '/:category/near/:city-nb-ca/',
        permanent: true,
      },
      // Newfoundland and Labrador
      {
        source: '/:category/near/:city-newfoundland-and-labrador-canada/',
        destination: '/:category/near/:city-nl-ca/',
        permanent: true,
      },
      // Prince Edward Island
      {
        source: '/:category/near/:city-prince-edward-island-canada/',
        destination: '/:category/near/:city-pe-ca/',
        permanent: true,
      },
      // Northwest Territories
      {
        source: '/:category/near/:city-northwest-territories-canada/',
        destination: '/:category/near/:city-nt-ca/',
        permanent: true,
      },
      // Yukon
      {
        source: '/:category/near/:city-yukon-canada/',
        destination: '/:category/near/:city-yt-ca/',
        permanent: true,
      },
      // Nunavut
      {
        source: '/:category/near/:city-nunavut-canada/',
        destination: '/:category/near/:city-nu-ca/',
        permanent: true,
      },

      // Pattern 4: Canadian province codes with "canada" suffix → "ca"
      // This catches URLs like "montreal-qc-canada" → "montreal-qc-ca"
      {
        source: '/:category/near/:city-:province(on|qc|bc|ab|mb|sk|ns|nb|nl|pe|nt|yt|nu)-canada/',
        destination: '/:category/near/:city-:province-ca/',
        permanent: true,
      },

      // Pattern 5: Special cases - Cities with malformed slugs from special character stripping
      // Saint-Jérôme: "saint-j-r-me" → "saint-jerome"
      {
        source: '/all-farms-near/near/saint-j-r-me-qc-canada/',
        destination: '/farms-near/saint-jerome-qc-ca/',
        permanent: true,
      },
      {
        source: '/:category/near/saint-j-r-me-qc-canada/',
        destination: '/:category/near/saint-jerome-qc-ca/',
        permanent: true,
      },
      // Trois-Rivières: "trois-rivi-res" → "trois-rivieres"
      {
        source: '/all-farms-near/near/trois-rivi-res-qc-canada/',
        destination: '/farms-near/trois-rivieres-qc-ca/',
        permanent: true,
      },
      {
        source: '/:category/near/trois-rivi-res-qc-canada/',
        destination: '/:category/near/trois-rivieres-qc-ca/',
        permanent: true,
      },
    ];
  },

  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year for static images
  },
  // Optimize bundle size in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false
  },
  // Optimize JavaScript loading
  experimental: {
    optimizePackageImports: ['@clerk/nextjs', 'lucide-react'],
    optimizeCss: true // Enable CSS optimization
  },
  // Webpack optimizations for bundle splitting
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimize bundle splitting for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Split Clerk into its own chunk for better caching
            clerk: {
              test: /[\\/]node_modules[\\/]@clerk[\\/]/,
              name: 'clerk',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Split React/Next.js core into separate chunk
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              name: 'framework',
              priority: 40,
              reuseExistingChunk: true,
            },
            // Common libraries
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'lib',
              priority: 30,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
}

module.exports = nextConfig
