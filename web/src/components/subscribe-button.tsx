"use client"

import { useAuth, useUser } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SubscriptionConsentModal } from "@/components/subscription-consent-modal"
import { PreAuthSubscriptionModal } from "@/components/pre-auth-subscription-modal"
import { useRouter } from "next/navigation"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://pickafarm-api.94623956quebecinc.workers.dev"

interface SubscribeButtonProps {
  farmId: string
  farmName: string
  farmSlug: string
  city: string
  state: string
  phone?: string
  website?: string
  variant?: "default" | "icon"
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
}

export function SubscribeButton({
  farmId,
  farmName,
  farmSlug,
  city,
  state,
  phone,
  website,
  variant = "default",
  size = "default",
  className
}: SubscribeButtonProps) {
  const { isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [showPreAuthModal, setShowPreAuthModal] = useState(false)
  const [userPreferences, setUserPreferences] = useState<any>(null)
  const [shouldAnimate, setShouldAnimate] = useState(true)

  // Check if farm is already subscribed on mount
  useEffect(() => {
    async function checkIfSubscribed() {
      console.log('🔔 useEffect checkIfSubscribed - isSignedIn:', isSignedIn)

      if (!isSignedIn) {
        // Trigger animation for non-logged in users
        console.log('🔔 Not signed in - enabling bell animation')
        setShouldAnimate(true)
        return
      }

      console.log('🔔 User is signed in, checking subscription status...')

      try {
        const token = await getToken()
        const response = await fetch(`${API_URL}/api/farms/saved`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const subscriptions = data.saved_farms || []
          const alreadySubscribed = subscriptions.some((farm: any) => farm.farm_id === farmId)
          setIsSubscribed(alreadySubscribed)

          // Only animate if NOT subscribed
          setShouldAnimate(!alreadySubscribed)
          console.log(`🔔 Bell animation: ${!alreadySubscribed ? 'ENABLED' : 'DISABLED'} (subscribed: ${alreadySubscribed})`)
        }
      } catch (error) {
        console.error('Error checking subscription status:', error)
        setShouldAnimate(true)
      }
    }

    checkIfSubscribed()
  }, [isSignedIn, farmId, getToken])

  // Get user preferences - SIMPLIFIED: Check if user has any saved farms
  useEffect(() => {
    async function getUserPrefs() {
      console.log('🔔 useEffect getUserPrefs - isSignedIn:', isSignedIn)

      if (!isSignedIn) {
        console.log('🔔 Not signed in, skipping preferences fetch')
        return
      }

      console.log('🔔 Checking if user has given consent before...')

      try {
        const token = await getToken()

        // Check saved farms to determine if user has subscribed before
        const response = await fetch(`${API_URL}/api/farms/saved`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const savedFarms = data.saved_farms || []

          // If user has ANY saved farms, they've given consent before
          const hasSubscribedBefore = savedFarms.length > 0
          console.log('🔔 User has subscribed before:', hasSubscribedBefore)

          // Set fake preferences based on saved farms
          setUserPreferences({
            first_subscription_consent_shown: hasSubscribedBefore ? 1 : 0
          })
        } else {
          console.error('🔔 Failed to fetch saved farms:', response.status)
          // Default to showing consent modal to be safe
          setUserPreferences({
            first_subscription_consent_shown: 0
          })
        }
      } catch (error) {
        console.error('🔔 Error checking consent status:', error)
        // Default to showing consent modal to be safe
        setUserPreferences({
          first_subscription_consent_shown: 0
        })
      }
    }

    getUserPrefs()
  }, [isSignedIn, getToken])

  // Check for pending subscription after sign-up
  useEffect(() => {
    async function completePendingSubscription() {
      if (!isSignedIn) return

      const pendingStr = sessionStorage.getItem('pending_subscription')
      if (!pendingStr) return

      try {
        const pending = JSON.parse(pendingStr)

        // Check if this is the same farm
        if (pending.farmId === farmId && pending.consentGiven) {
          console.log('Completing pending subscription for:', pending.farmName)

          // Clear the pending subscription
          sessionStorage.removeItem('pending_subscription')

          // Subscribe to the farm
          await handleSubscribe(true) // Pass true to bypass modal
        }
      } catch (error) {
        console.error('Error completing pending subscription:', error)
        sessionStorage.removeItem('pending_subscription')
      }
    }

    completePendingSubscription()
  }, [isSignedIn, farmId])

  const handleSubscribe = async (bypassModal: boolean = false) => {
    setIsLoading(true)

    try {
      const token = await getToken()

      // Sync user first
      const syncResponse = await fetch(`${API_URL}/api/users/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.primaryEmailAddress?.emailAddress,
          firstName: user?.firstName,
          lastName: user?.lastName
        }),
      })

      if (!syncResponse.ok) {
        console.error('Failed to sync user')
        alert('Failed to sync user. Please try again.')
        return
      }

      // Subscribe to farm
      const requestData = {
        farm_id: farmId,
        farm_name: farmName,
        farm_city: city,
        farm_state: state,
        farm_phone: phone,
        farm_website: website,
        consent_given: true // Always true when this function is called
      }

      const response = await fetch(`${API_URL}/api/farms/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        setIsSubscribed(true)

        // Update first-time consent flag if needed
        if (!userPreferences?.first_subscription_consent_shown) {
          await fetch(`${API_URL}/api/user/preferences`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              first_subscription_consent_shown: 1
            }),
          })
        }

        console.log('Subscribed to farm:', farmName)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to subscribe:', errorData)
        alert(errorData.message || 'Failed to subscribe. Please try again.')
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    if (isLoading) return

    setIsLoading(true)

    try {
      const token = await getToken()

      const response = await fetch(`${API_URL}/api/farms/unsave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farm_id: farmId
        }),
      })

      if (response.ok) {
        setIsSubscribed(false)
        console.log('Unsubscribed from farm:', farmName)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to unsubscribe:', errorData)
        alert('Failed to unsubscribe. Please try again.')
      }
    } catch (error) {
      console.error('Error unsubscribing:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLoading) return

    console.log('🔔 Subscribe button clicked - isSignedIn:', isSignedIn)

    if (!isSignedIn) {
      // Show pre-auth modal for non-logged-in users
      console.log('🔔 Showing pre-auth modal')
      setShowPreAuthModal(true)
      return
    }

    if (isSubscribed) {
      // Unsubscribe immediately
      console.log('🔔 User is subscribed, unsubscribing...')
      await handleUnsubscribe()
    } else {
      // Check if this is first subscription (show consent modal)
      console.log('🔔 Checking first subscription consent:', userPreferences)

      if (!userPreferences?.first_subscription_consent_shown) {
        console.log('🔔 First subscription - showing consent modal')
        setShowConsentModal(true)
      } else {
        console.log('🔔 Not first subscription - subscribing directly')
        // Subsequent subscriptions - no modal
        await handleSubscribe(false)
      }
    }
  }

  const handleConsentConfirm = async () => {
    setShowConsentModal(false)
    await handleSubscribe(false)
  }

  const handlePreAuthProceed = () => {
    setShowPreAuthModal(false)
    // Note: The pending subscription is already stored in sessionStorage
    // Clerk will handle the sign-up, then redirect back to the same page
    // The useEffect will detect the pending subscription and complete it
  }

  return (
    <>
      <Button
        size={size}
        variant={variant === "icon" ? "outline" : "default"}
        className={cn(
          variant === "icon" ? "px-3" : "",
          isSubscribed
            ? "bg-primary hover:bg-primary/90 text-white border-primary"
            : "bg-white hover:bg-primary/10 text-primary border-2 border-primary",
          className
        )}
        onClick={handleClick}
        disabled={isLoading}
        aria-label={isSubscribed ? `Unsubscribe from ${farmName}` : `Subscribe to ${farmName} updates`}
      >
        <Bell
          className={cn(
            variant === "icon" ? "h-4 w-4" : "h-4 w-4 mr-2",
            isSubscribed ? "text-white fill-white" : "text-primary",
            shouldAnimate && !isSubscribed && "animate-wiggle"
          )}
          style={shouldAnimate && !isSubscribed ? {
            animation: 'wiggle 1s ease-in-out 0.5s',
            transformOrigin: 'top center'
          } : undefined}
        />
        {variant !== "icon" && (
          isLoading ? "..." : isSubscribed ? "Subscribed" : "Subscribe"
        )}
      </Button>

      {/* Consent modal for logged-in first-time subscribers */}
      <SubscriptionConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConfirm={handleConsentConfirm}
        farmName={farmName}
        isFirstTime={!userPreferences?.first_subscription_consent_shown}
      />

      {/* Pre-auth modal for non-logged-in users */}
      <PreAuthSubscriptionModal
        isOpen={showPreAuthModal}
        onClose={() => setShowPreAuthModal(false)}
        farmId={farmId}
        farmName={farmName}
        farmSlug={farmSlug}
        onProceedToSignUp={handlePreAuthProceed}
      />
    </>
  )
}
