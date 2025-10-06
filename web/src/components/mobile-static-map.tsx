"use client"

import { Button } from '@/components/ui/button'
import { MapPin, Loader2 } from 'lucide-react'

interface MobileStaticMapProps {
  onLoadInteractiveMap: () => void
  farmCount?: number
  isCalculating?: boolean
}

export function MobileStaticMap({ onLoadInteractiveMap, farmCount = 0, isCalculating = false }: MobileStaticMapProps) {
  return (
    <div className="relative w-full h-[70vh] lg:h-[80vh] overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
      {/* SVG map with roads, regions, and pins */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="softBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
          </filter>
          <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'rgb(229, 231, 235)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'rgb(209, 213, 219)', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Map regions/land areas */}
        <g opacity="0.4" filter="url(#softBlur)">
          <path d="M 50 100 L 200 80 L 350 120 L 450 90 L 600 110 L 750 95 L 900 120 L 950 250 L 900 380 L 850 500 L 750 620 L 600 680 L 450 700 L 300 690 L 150 650 L 80 520 L 50 380 Z"
                fill="rgba(34, 197, 94, 0.15)" stroke="rgba(34, 197, 94, 0.2)" strokeWidth="1" />
          <path d="M 100 200 Q 250 180, 400 210 T 700 200 Q 800 250, 750 350 T 500 420 Q 300 450, 150 380 Z"
                fill="rgba(132, 204, 22, 0.12)" stroke="rgba(132, 204, 22, 0.15)" strokeWidth="1" />
          <path d="M 400 400 L 550 380 L 700 420 L 800 500 L 750 600 L 600 650 L 450 640 L 350 580 Z"
                fill="rgba(16, 185, 129, 0.1)" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" />
        </g>

        {/* Road network */}
        <g opacity="0.3" stroke="url(#roadGradient)" fill="none">
          {/* Horizontal roads */}
          <path d="M 50 200 Q 300 190, 500 200 T 950 200" strokeWidth="3" strokeLinecap="round" />
          <path d="M 50 350 Q 350 340, 600 350 T 950 350" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 100 500 Q 400 490, 650 500 T 900 500" strokeWidth="2" strokeLinecap="round" />
          {/* Vertical roads */}
          <path d="M 250 80 Q 245 300, 250 500 T 250 750" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 500 90 Q 495 300, 500 500 T 500 750" strokeWidth="3" strokeLinecap="round" />
          <path d="M 750 95 Q 745 300, 750 500 T 750 750" strokeWidth="2" strokeLinecap="round" />
          {/* Diagonal/curved roads */}
          <path d="M 150 150 Q 400 300, 650 250 T 850 400" strokeWidth="2" strokeLinecap="round" />
          <path d="M 100 600 Q 350 500, 600 550 T 900 600" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Location pins/markers */}
        <g opacity="0.5">
          <circle cx="250" cy="200" r="8" fill="rgb(34, 197, 94)" />
          <path d="M 250 192 Q 250 180, 250 180 L 250 200" stroke="rgb(34, 197, 94)" strokeWidth="2" fill="none" />

          <circle cx="500" cy="350" r="8" fill="rgb(16, 185, 129)" />
          <path d="M 500 342 Q 500 330, 500 330 L 500 350" stroke="rgb(16, 185, 129)" strokeWidth="2" fill="none" />

          <circle cx="650" cy="250" r="8" fill="rgb(132, 204, 22)" />
          <path d="M 650 242 Q 650 230, 650 230 L 650 250" stroke="rgb(132, 204, 22)" strokeWidth="2" fill="none" />

          <circle cx="400" cy="500" r="8" fill="rgb(34, 197, 94)" />
          <path d="M 400 492 Q 400 480, 400 480 L 400 500" stroke="rgb(34, 197, 94)" strokeWidth="2" fill="none" />

          <circle cx="750" cy="400" r="8" fill="rgb(16, 185, 129)" />
          <path d="M 750 392 Q 750 380, 750 380 L 750 400" stroke="rgb(16, 185, 129)" strokeWidth="2" fill="none" />
        </g>

        {/* Small dots for cities/towns */}
        <g opacity="0.3" fill="rgb(100, 116, 139)">
          <circle cx="320" cy="280" r="3" />
          <circle cx="580" cy="220" r="3" />
          <circle cx="420" cy="420" r="3" />
          <circle cx="680" cy="320" r="3" />
          <circle cx="300" cy="550" r="3" />
          <circle cx="550" cy="480" r="3" />
          <circle cx="800" cy="280" r="3" />
          <circle cx="180" cy="380" r="3" />
        </g>
      </svg>

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
