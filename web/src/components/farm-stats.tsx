"use client"

import { useEffect, useState } from "react"
import { Bell, Star } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://pickafarm-api.94623956quebecinc.workers.dev"

interface FarmStatsProps {
  farmId: string
  reviewCount?: number
  averageRating?: number
}

export function FarmStats({ farmId, reviewCount = 0, averageRating = 0 }: FarmStatsProps) {
  const [subscriberCount, setSubscriberCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  console.log('🔔 FarmStats received props:', { farmId, reviewCount, averageRating })

  useEffect(() => {
    async function fetchSubscriberCount() {
      try {
        const response = await fetch(`${API_URL}/api/farms/${farmId}/subscriber-count`)
        if (response.ok) {
          const data = await response.json()
          setSubscriberCount(data.subscriber_count || 0)
        }
      } catch (error) {
        console.error('Error fetching subscriber count:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriberCount()
  }, [farmId])

  if (isLoading) {
    return (
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="animate-pulse h-5 w-24 bg-muted rounded"></div>
      </div>
    )
  }

  const scrollToReviews = (e: React.MouseEvent) => {
    e.preventDefault()
    const reviewSection = document.getElementById('reviews-section')
    if (reviewSection) {
      reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  console.log('🔔 Rendering with reviewCount:', reviewCount, 'showing reviews?', reviewCount > 0)

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        {/* Subscriber Count - always show */}
        <Bell className="w-4 h-4 text-primary" />
        <span className="font-medium text-foreground">{subscriberCount.toLocaleString()}</span>
        <span className="text-muted-foreground">
          {subscriberCount === 1 ? 'subscriber' : 'subscribers'}
        </span>

        {/* Review Stats - show if available */}
        {reviewCount > 0 && (
          <>
            <span className="text-muted-foreground mx-1">•</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({reviewCount.toLocaleString()} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </>
        )}

        {/* Write a review link - always show */}
        <span className="text-muted-foreground mx-1">•</span>
        <a
          href="#reviews-section"
          onClick={scrollToReviews}
          className="text-primary hover:underline font-medium"
        >
          Write a review
        </a>
      </div>
    </div>
  )
}
