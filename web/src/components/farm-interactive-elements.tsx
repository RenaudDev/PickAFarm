"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell, Share2, MapPin } from "lucide-react"
import { SaveFarmButton } from "@/components/save-farm-button"

interface FarmInteractiveElementsProps {
  farmName?: string
  locationLink?: string
  farmId?: string
  farmCity?: string
  farmState?: string
  farmPhone?: string
  farmWebsite?: string
}

export default function FarmInteractiveElements({ 
  farmName = "this farm", 
  locationLink = "https://maps.google.com",
  farmId,
  farmCity,
  farmState,
  farmPhone,
  farmWebsite
}: FarmInteractiveElementsProps) {

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Check out ${farmName}`,
        text: `I found this great farm: ${farmName}`,
        url: window.location.href
      }).catch(console.error)
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        // Could show a toast notification here
        console.log('Link copied to clipboard')
      }).catch(console.error)
    }
  }

  const handleDirections = () => {
    window.open(locationLink, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button 
        variant="outline" 
        size="lg" 
        onClick={handleShare}
        className="px-6 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>
      
      <Button 
        variant="outline" 
        size="lg" 
        onClick={handleDirections}
        className="px-6 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold"
      >
        <MapPin className="w-4 h-4 mr-2" />
        Directions
      </Button>

      {farmId && farmCity && farmState && (
        <SaveFarmButton
          farmId={farmId}
          farmName={farmName}
          city={farmCity}
          state={farmState}
          phone={farmPhone}
          website={farmWebsite}
          variant="icon"
          size="lg"
        />
      )}
    </div>
  )
}
