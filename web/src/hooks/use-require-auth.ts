"use client"

import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * Hook to require authentication for a page
 * Redirects to home if user is not signed in
 */
export function useRequireAuth(redirectTo: string = "/") {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(redirectTo)
    }
  }, [isLoaded, isSignedIn, router, redirectTo])

  return { isLoaded, isSignedIn }
}
