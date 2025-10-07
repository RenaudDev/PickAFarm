import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Bell, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getCategoryEmoji } from "@/lib/category-utils"

interface FarmListItemProps {
  farm: {
    id: string
    name: string
    slug: string
    city_name: string
    state_province: string
    categories?: string
    featured?: number
    verified?: number
    reviews?: number
    rating?: number
    subscriber_count?: number
  }
}

export function FarmListItem({ farm }: FarmListItemProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        farm.featured === 1 && "border-2 border-yellow-400 bg-yellow-50/30"
      )}
    >
      <CardHeader className="pb-1 p-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {farm.categories && (
              <div className="flex items-center gap-1 mb-1 flex-wrap">
                {farm.categories.split(',').slice(0, 4).map((cat, idx) => (
                  <span
                    key={idx}
                    className="text-lg"
                    title={cat.trim()}
                  >
                    {getCategoryEmoji(cat.trim())}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <CardTitle className="text-xs leading-tight">{farm.name}</CardTitle>
              {(farm.verified === 1 || farm.featured === 1) && (
                <div className="flex gap-1">
                  {farm.verified === 1 && (
                    <span className="text-xs" title="Verified">✓</span>
                  )}
                  {farm.featured === 1 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 text-yellow-600 border-yellow-600">
                      Featured
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <MapPin className="h-3 w-3 mr-1" />
              {farm.city_name}, {farm.state_province}
            </div>

            {/* Stats: Subscriber count and Reviews */}
            <div className="space-y-1">
              {/* Subscriber count */}
              <div className="flex items-center gap-1 text-xs">
                <Bell className="h-3 w-3 text-primary" />
                <span className="font-medium text-foreground">
                  {farm.subscriber_count || 0}
                </span>
                <span className="text-muted-foreground">
                  {(farm.subscriber_count || 0) === 1 ? 'subscriber' : 'subscribers'}
                </span>
              </div>

              {/* Review rating */}
              <div className="flex items-center gap-1 text-xs">
                {farm.reviews && farm.reviews > 0 ? (
                  <>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-foreground">{farm.rating?.toFixed(1) || '5.0'}</span>
                    <span className="text-muted-foreground">
                      ({farm.reviews} {farm.reviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground italic">No reviews yet</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {/* Subscribe icon indicator */}
            <div className="h-8 w-8 rounded-md border border-border bg-background flex items-center justify-center hover:bg-accent transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 p-2.5">
        <Link
          href={`/farms/${farm.slug}/`}
          className="w-full block"
          aria-label={`View details for ${farm.name} in ${farm.city_name}, ${farm.state_province}`}
        >
          <Button
            size="sm"
            className="w-full text-xs bg-primary hover:bg-primary/90 text-white transition-all hover:shadow-md"
          >
            <span>View Details</span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
