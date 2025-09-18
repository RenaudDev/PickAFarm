"use client"

import dynamic from "next/dynamic"

// Dynamically import the SearchBox client component with SSR enabled
const SearchBox = dynamic(() => import("@/components/search-box"), {
  ssr: true,
  loading: () => (
    <div className="space-y-0">
      {/* Mobile Loading Skeleton - Matches actual mobile layout */}
      <div className="md:hidden max-w-md mx-auto space-y-3">
        <div className="h-12 bg-muted animate-pulse rounded-md"></div>
        <div className="h-12 bg-muted animate-pulse rounded-md"></div>
        <div className="h-12 bg-muted animate-pulse rounded-md"></div>
      </div>

      {/* Desktop Loading Skeleton - Matches actual desktop layout */}
      <div className="hidden md:block max-w-4xl mx-auto">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <div className="h-12 bg-muted animate-pulse rounded-md"></div>
          </div>
          <div className="flex-1">
            <div className="h-12 bg-muted animate-pulse rounded-md"></div>
          </div>
          <div className="flex-shrink-0">
            <div className="h-12 w-32 bg-muted animate-pulse rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default function SearchBoxWrapper() {
  return <SearchBox />
}
