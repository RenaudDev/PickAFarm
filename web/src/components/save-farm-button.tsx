"use client"

import { useAuth, useUser, SignInButton } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://pickafarm-api.94623956quebecinc.workers.dev"

interface SaveFarmButtonProps {
  farmId: string
  farmName: string
  city: string
  state: string
  phone?: string
  website?: string
  variant?: "default" | "icon"
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
}

export function SaveFarmButton({ 
  farmId, 
  farmName, 
  city, 
  state, 
  phone, 
  website,
  variant = "default",
  size = "default",
  className 
}: SaveFarmButtonProps) {
  const { isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Check if farm is saved on mount
  useEffect(() => {
    async function checkSavedStatus() {
      if (!user?.id || !isSignedIn) {
        setIsLoading(false)
        return
      }

      try {
        const token = await getToken()
        const response = await fetch(`${API_URL}/api/farms/saved`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const saved = data.saved_farms.some((f: any) => f.farm_id === farmId)
          setIsSaved(saved)
        }
      } catch (error) {
        console.error('Error checking saved status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSavedStatus()
  }, [user?.id, farmId, isSignedIn, getToken])

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user?.id || isSaving) return

    setIsSaving(true)

    try {
      const token = await getToken()

      // First, sync user if this is their first time
      await fetch(`${API_URL}/api/users/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
        }),
      })

      if (isSaved) {
        // Unsave farm
        const response = await fetch(`${API_URL}/api/farms/unsave`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ farm_id: farmId }),
        })

        if (response.ok) {
          setIsSaved(false)
          console.log(`Farm removed: ${farmName}`)
        } else {
          throw new Error('Failed to unsave farm')
        }
      } else {
        // Save farm
        const response = await fetch(`${API_URL}/api/farms/save`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ farm_id: farmId }),
        })

        if (response.ok) {
          setIsSaved(true)
          console.log(`Farm saved: ${farmName}`)
        } else {
          throw new Error('Failed to save farm')
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error)
      alert('Failed to update farm. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button 
          size={size}
          variant={variant === "icon" ? "outline" : "secondary"}
          className={cn(
            variant === "icon" ? "px-3" : "",
            className
          )}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <Heart className={cn(
            variant === "icon" ? "h-4 w-4" : "h-4 w-4 mr-2"
          )} />
          {variant !== "icon" && "Save"}
        </Button>
      </SignInButton>
    )
  }

  if (isLoading) {
    return (
      <Button 
        size={size}
        variant={variant === "icon" ? "outline" : "secondary"}
        className={cn(
          variant === "icon" ? "px-3" : "",
          className
        )}
        disabled
      >
        <Heart className={cn(
          variant === "icon" ? "h-4 w-4" : "h-4 w-4 mr-2"
        )} />
        {variant !== "icon" && "Save"}
      </Button>
    )
  }

  return (
    <Button 
      size={size}
      variant={variant === "icon" ? "outline" : "secondary"}
      className={cn(
        variant === "icon" ? "px-3" : "",
        isSaved 
          ? "bg-red-50 hover:bg-red-100 border-red-200" 
          : "border-red-500 hover:bg-red-50 hover:border-red-600",
        className
      )}
      onClick={toggleSave}
      disabled={isSaving}
    >
      <Heart className={cn(
        variant === "icon" ? "h-4 w-4" : "h-4 w-4 mr-2",
        isSaved ? "fill-red-500 text-red-500" : "text-red-500"
      )} />
      {variant !== "icon" && (isSaving ? "Saving..." : isSaved ? "Saved" : "Save")}
    </Button>
  )
}
