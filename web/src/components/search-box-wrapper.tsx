"use client"

import dynamic from "next/dynamic"

// Dynamically import the SearchBox client component
const SearchBox = dynamic(() => import("@/components/search-box"), {
  ssr: false,
  loading: () => (
    <div className="space-y-3">
      <div className="md:hidden max-w-md mx-auto space-y-3">
        <div className="h-12 bg-muted animate-pulse rounded-md"></div>
        <div className="h-12 bg-muted animate-pulse rounded-md"></div>
        <div className="h-12 bg-muted animate-pulse rounded-md"></div>
      </div>
      <div className="hidden md:block">
        <div className="h-12 w-48 bg-muted animate-pulse rounded-md mx-auto"></div>
      </div>
    </div>
  )
})

export default function SearchBoxWrapper() {
  return <SearchBox />
}
