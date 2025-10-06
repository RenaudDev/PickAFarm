/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
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
  }
}

module.exports = nextConfig
