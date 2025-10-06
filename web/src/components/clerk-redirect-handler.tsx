"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

/**
 * Handles redirecting users back to their intended page after Clerk sign-up/sign-in
 */
export function ClerkRedirectHandler() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    // Only run when Clerk is loaded and user is signed in
    if (!isLoaded || !isSignedIn) return

    // Check if there's a stored redirect URL
    const redirectUrl = sessionStorage.getItem('clerk_redirect_url')

    if (redirectUrl) {
      console.log('🔔 ClerkRedirectHandler: Found redirect URL:', redirectUrl)

      // Clear the stored URL
      sessionStorage.removeItem('clerk_redirect_url')

      // Redirect after a short delay to ensure Clerk is fully initialized
      setTimeout(() => {
        console.log('🔔 ClerkRedirectHandler: Redirecting to:', redirectUrl)
        router.push(redirectUrl)
      }, 100)
    }
  }, [isLoaded, isSignedIn, router])

  return null // This component doesn't render anything
}
