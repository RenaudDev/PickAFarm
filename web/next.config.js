/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Optimize bundle size in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false
  },
  // Optimize JavaScript loading
  experimental: {
    optimizePackageImports: ['@clerk/nextjs', 'lucide-react']
  }
}

module.exports = nextConfig
