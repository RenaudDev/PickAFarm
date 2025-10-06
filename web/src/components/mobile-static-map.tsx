"use client"

import { Button } from '@/components/ui/button'
import { MapPin, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface MobileStaticMapProps {
  onLoadInteractiveMap: () => void
  farmCount?: number
  isCalculating?: boolean
}

export function MobileStaticMap({ onLoadInteractiveMap, farmCount = 0, isCalculating = false }: MobileStaticMapProps) {
  return (
    <div className="relative w-full h-[70vh] lg:h-[80vh] overflow-hidden">
      {/* Static Map Background */}
      <div className="absolute inset-0">
        <Image
          src="/us-map-static.png"
          alt="Map of the United States"
          width={640}
          height={400}
          className="object-cover w-full h-full"
          priority
          fetchPriority="high"
          unoptimized
        />
        {/* Overlay to darken background slightly */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Modal Overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-2xl p-8 max-w-sm w-full border border-border">
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {isCalculating ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <MapPin className="h-8 w-8 text-primary" />
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-foreground">
              {isCalculating ? (
                'Finding Farms Near You...'
              ) : (
                `${farmCount} ${farmCount === 1 ? 'Farm' : 'Farms'} Near You`
              )}
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-sm">
              Load the interactive map to explore farms, view details, and get directions
            </p>

            {/* Button */}
            <Button
              onClick={onLoadInteractiveMap}
              size="lg"
              className="w-full"
              disabled={isCalculating}
            >
              {isCalculating ? 'Calculating...' : 'Load Interactive Map'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
