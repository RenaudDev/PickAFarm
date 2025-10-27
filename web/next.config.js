/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  productionBrowserSourceMaps: true, // Enable source maps in production

  // 301 Redirects for 404 Error Resolution (PRD-2025-001)
  // Fix malformed location URLs from data generation bug
  async redirects() {
    return [
      // FIX: "united-states" → "us" pattern (fixes ~300+ 404s)
      {
        source: '/:path*-united-states/',
        destination: '/:path*-us/',
        permanent: true,
      },
      {
        source: '/:path*-united-states',
        destination: '/:path*-us/',
        permanent: true,
      },

      // FIX: US states with wrong country code -ca instead of -us
      // Catches malformed URLs like "phoenix-ny-ca" → "phoenix-ny-us"
      {
        source: '/:category/near/:city-:state(al|ak|az|ar|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy|pr|dc)-ca/',
        destination: '/:category/near/:city-:state-us/',
        permanent: true,
      },

      // Catch-all for non-trailing-slash URLs (add trailing slash)
      // This handles URLs like /category/near/location without trailing slash
      {
        source: '/:category/near/:location([a-z0-9-]+)$',
        destination: '/:category/near/:location/',
        permanent: true,
      },

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
        source:
          '/:category/near/:city-:state(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy|dc)-canada/',
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

      // Pattern 6: Full US state names → 2-letter codes
      // Handles URLs like "chicago-illinois-us" → "chicago-il-us"
      {
        source: '/:category/near/:city-alabama-:country(us|united-states)/',
        destination: '/:category/near/:city-al-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-alaska-:country(us|united-states)/',
        destination: '/:category/near/:city-ak-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-arizona-:country(us|united-states)/',
        destination: '/:category/near/:city-az-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-arkansas-:country(us|united-states)/',
        destination: '/:category/near/:city-ar-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-california-:country(us|united-states)/',
        destination: '/:category/near/:city-ca-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-colorado-:country(us|united-states)/',
        destination: '/:category/near/:city-co-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-connecticut-:country(us|united-states)/',
        destination: '/:category/near/:city-ct-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-delaware-:country(us|united-states)/',
        destination: '/:category/near/:city-de-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-florida-:country(us|united-states)/',
        destination: '/:category/near/:city-fl-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-georgia-:country(us|united-states)/',
        destination: '/:category/near/:city-ga-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-hawaii-:country(us|united-states)/',
        destination: '/:category/near/:city-hi-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-idaho-:country(us|united-states)/',
        destination: '/:category/near/:city-id-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-illinois-:country(us|united-states)/',
        destination: '/:category/near/:city-il-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-indiana-:country(us|united-states)/',
        destination: '/:category/near/:city-in-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-iowa-:country(us|united-states)/',
        destination: '/:category/near/:city-ia-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-kansas-:country(us|united-states)/',
        destination: '/:category/near/:city-ks-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-kentucky-:country(us|united-states)/',
        destination: '/:category/near/:city-ky-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-louisiana-:country(us|united-states)/',
        destination: '/:category/near/:city-la-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-maine-:country(us|united-states)/',
        destination: '/:category/near/:city-me-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-maryland-:country(us|united-states)/',
        destination: '/:category/near/:city-md-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-massachusetts-:country(us|united-states)/',
        destination: '/:category/near/:city-ma-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-michigan-:country(us|united-states)/',
        destination: '/:category/near/:city-mi-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-minnesota-:country(us|united-states)/',
        destination: '/:category/near/:city-mn-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-mississippi-:country(us|united-states)/',
        destination: '/:category/near/:city-ms-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-missouri-:country(us|united-states)/',
        destination: '/:category/near/:city-mo-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-montana-:country(us|united-states)/',
        destination: '/:category/near/:city-mt-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-nebraska-:country(us|united-states)/',
        destination: '/:category/near/:city-ne-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-nevada-:country(us|united-states)/',
        destination: '/:category/near/:city-nv-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-new-hampshire-:country(us|united-states)/',
        destination: '/:category/near/:city-nh-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-new-jersey-:country(us|united-states)/',
        destination: '/:category/near/:city-nj-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-new-mexico-:country(us|united-states)/',
        destination: '/:category/near/:city-nm-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-new-york-:country(us|united-states)/',
        destination: '/:category/near/:city-ny-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-north-carolina-:country(us|united-states)/',
        destination: '/:category/near/:city-nc-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-north-dakota-:country(us|united-states)/',
        destination: '/:category/near/:city-nd-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-ohio-:country(us|united-states)/',
        destination: '/:category/near/:city-oh-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-oklahoma-:country(us|united-states)/',
        destination: '/:category/near/:city-ok-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-oregon-:country(us|united-states)/',
        destination: '/:category/near/:city-or-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-pennsylvania-:country(us|united-states)/',
        destination: '/:category/near/:city-pa-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-rhode-island-:country(us|united-states)/',
        destination: '/:category/near/:city-ri-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-south-carolina-:country(us|united-states)/',
        destination: '/:category/near/:city-sc-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-south-dakota-:country(us|united-states)/',
        destination: '/:category/near/:city-sd-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-tennessee-:country(us|united-states)/',
        destination: '/:category/near/:city-tn-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-texas-:country(us|united-states)/',
        destination: '/:category/near/:city-tx-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-utah-:country(us|united-states)/',
        destination: '/:category/near/:city-ut-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-vermont-:country(us|united-states)/',
        destination: '/:category/near/:city-vt-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-virginia-:country(us|united-states)/',
        destination: '/:category/near/:city-va-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-washington-:country(us|united-states)/',
        destination: '/:category/near/:city-wa-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-west-virginia-:country(us|united-states)/',
        destination: '/:category/near/:city-wv-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-wisconsin-:country(us|united-states)/',
        destination: '/:category/near/:city-wi-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-wyoming-:country(us|united-states)/',
        destination: '/:category/near/:city-wy-us/',
        permanent: true,
      },
      {
        source: '/:category/near/:city-puerto-rico-:country(us|united-states)/',
        destination: '/:category/near/:city-pr-us/',
        permanent: true,
      },

      // Pattern 7: US states with -ca suffix (wrong country abbreviation)
      // Handles URLs like "cadott-wi-ca" → "cadott-wi-us"
      // This is different from Pattern 1 which catches -canada (full word)
      // With trailing slash
      {
        source:
          '/:category/near/:city-:state(al|ak|az|ar|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy|dc)-ca/',
        destination: '/:category/near/:city-:state-us/',
        permanent: true,
      },
      // Without trailing slash
      {
        source:
          '/:category/near/:city-:state(al|ak|az|ar|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy|dc)-ca',
        destination: '/:category/near/:city-:state-us/',
        permanent: true,
      },

      // Pattern 8: Blog post URL fixes
      // Fix singular/plural blog post URLs
      {
        source: '/blog/best-christmas-tree/',
        destination: '/blog/best-christmas-trees/',
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
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Optimize JavaScript loading
  experimental: {
    optimizePackageImports: ['@clerk/nextjs', 'lucide-react'],
    optimizeCss: true, // Enable CSS optimization
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
};

module.exports = nextConfig;
