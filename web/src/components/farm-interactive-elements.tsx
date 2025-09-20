"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell, Share2, MapPin } from "lucide-react"

interface FarmInteractiveElementsProps {
  farmName?: string
  locationLink?: string
}

export default function FarmInteractiveElements({ 
  farmName = "this farm", 
  locationLink = "https://maps.google.com" 
}: FarmInteractiveElementsProps) {
  const [isNotifying, setIsNotifying] = useState(false)

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

  const handleGetNotified = () => {
    setIsNotifying(!isNotifying)
    // Here you would integrate with your notification system
    console.log(isNotifying ? 'Unsubscribed from notifications' : 'Subscribed to notifications')
  }

  return (
    <div className="flex flex-wrap gap-3">
      
      
      <Button 
        variant="outline" 
        size="lg" 
        onClick={handleShare}
        className="px-6 hover:bg-primary bg-transparent"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>
      
      <Button 
        variant="outline" 
        size="lg" 
        onClick={handleDirections}
        className="px-6 hover:bg-primary bg-transparent"
      >
        <MapPin className="w-4 h-4 mr-2" />
        Directions
      </Button>

      <Button
        size="lg"
        onClick={handleGetNotified}
        className={`${
          isNotifying 
            ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
            : "bg-primary hover:bg-primary/90"
        } px-6`}
      >
        <Bell className="w-4 h-4 mr-2" />
        {isNotifying ? "Notifying" : "Get Notified"}
      </Button>
    </div>
  )
}
