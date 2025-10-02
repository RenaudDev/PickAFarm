"use client"

import { useAuth, SignInButton } from "@clerk/nextjs"
import { useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
  variant = "default",
  size = "default",
  className 
}: SaveFarmButtonProps) {
  const { isSignedIn } = useAuth()
  const [isSaved, setIsSaved] = useState(false)

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsSaved(!isSaved)
    console.log(`Farm ${!isSaved ? 'saved' : 'unsaved'}: ${farmName}`)
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
    >
      <Heart className={cn(
        variant === "icon" ? "h-4 w-4" : "h-4 w-4 mr-2",
        isSaved ? "fill-red-500 text-red-500" : "text-red-500"
      )} />
      {variant !== "icon" && (isSaved ? "Saved" : "Save")}
    </Button>
  )
}
