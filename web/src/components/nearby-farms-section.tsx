"use client"

import { useInteractiveMap } from "@/components/adaptive-map-wrapper"
import { NearbyFarmsList } from "@/components/nearby-farms-list"

export function NearbyFarmsSection() {
  const { showInteractiveMap } = useInteractiveMap()

  // Hide this section when interactive map is showing on mobile
  if (showInteractiveMap) {
    return null
  }

  return (
    <section className="py-8 px-4 bg-background border-t">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 text-foreground">Farms Near You</h2>
          <p className="text-sm text-muted-foreground">Browse farms near your location or use the map above to explore</p>
        </div>

        {/* Client-side list with location detection and working subscribe buttons */}
        <NearbyFarmsList />
      </div>
    </section>
  )
}
