/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  productionBrowserSourceMaps: true, // Enable source maps in production
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
