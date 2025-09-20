import Image from 'next/image'
import { TreePine } from 'lucide-react'

interface FarmImageServerProps {
  farmSlug: string
  farmName: string
  farmCategories?: string
  className?: string
}

export default function FarmImageServer({ 
  farmSlug, 
  farmName, 
  farmCategories = "", 
  className = "" 
}: FarmImageServerProps) {
  // Check if this is a Christmas Tree Farm
  const isChristmasTreeFarm = farmCategories.toLowerCase().includes('christmas')

  if (isChristmasTreeFarm) {
    return (
      <Image
        src="/images/farms/christmas-tree.webp"
        alt={`${farmName} - Christmas Tree Farm`}
        width={800}
        height={500}
        className={`object-cover ${className}`}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      />
    )
  }

  // Fallback placeholder for non-Christmas Tree Farms
  return (
    <div className={`bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center ${className}`}>
      <div className="text-center text-emerald-700">
        <TreePine className="w-20 h-20 mx-auto mb-4 opacity-60" />
        <p className="text-xl font-semibold mb-2">Farm Gallery</p>
        <p className="text-sm opacity-75">Beautiful photos of {farmName} would be displayed here</p>
      </div>
    </div>
  )
}
