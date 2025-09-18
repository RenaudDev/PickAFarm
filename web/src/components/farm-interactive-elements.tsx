"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Share2, Navigation } from "lucide-react"

export default function FarmInteractiveElements() {
  const [isFavorited, setIsFavorited] = useState(false)

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        size="lg"
        onClick={() => setIsFavorited(!isFavorited)}
        className={`${
          isFavorited ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"
        } px-6`}
      >
        <Heart className={`w-4 h-4 mr-2 ${isFavorited ? "fill-red-600" : ""}`} />
        {isFavorited ? "Saved" : "Save"}
      </Button>
      <Button variant="outline" size="lg" className="px-6 hover:bg-gray-50 bg-transparent">
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>
      <Button size="lg" className="bg-primary hover:bg-primary/90 px-8">
        <Navigation className="w-4 h-4 mr-2" />
        Get Directions
      </Button>
    </div>
  )
}
