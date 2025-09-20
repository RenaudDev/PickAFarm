'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { TreePine } from 'lucide-react'

interface FarmImageProps {
  farmSlug: string
  farmName: string
  className?: string
}

export default function FarmImage({ farmSlug, farmName, className = "" }: FarmImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Try different image formats
  const imageFormats = ['webp', 'jpg', 'jpeg', 'png']

  useEffect(() => {
    const tryImageFormats = async () => {
      for (const format of imageFormats) {
        try {
          const testSrc = `/images/farms/${farmSlug}.${format}`
          const response = await fetch(testSrc, { method: 'HEAD' })
          if (response.ok) {
            setImageSrc(testSrc)
            setIsLoading(false)
            return
          }
        } catch (error) {
          // Continue to next format
        }
      }
      // No image found in any format
      setImageError(true)
      setIsLoading(false)
    }

    tryImageFormats()
  }, [farmSlug])

  if (isLoading) {
    return (
      <div className={`bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center ${className}`}>
        <div className="text-center text-emerald-700">
          <TreePine className="w-20 h-20 mx-auto mb-4 opacity-60 animate-pulse" />
          <p className="text-xl font-semibold mb-2">Loading...</p>
        </div>
      </div>
    )
  }

  if (imageError || !imageSrc) {
    // Fallback placeholder when no image is found
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

  return (
    <Image
      src={imageSrc}
      alt={`${farmName} - Farm Photo`}
      width={800}
      height={500}
      className={`object-cover ${className}`}
      onError={() => setImageError(true)}
      onLoad={() => setIsLoading(false)}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    />
  )
}
