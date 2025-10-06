"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, UserPlus } from "lucide-react"
import { SignUpButton } from "@clerk/nextjs"

interface PreAuthSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  farmId: string
  farmName: string
  farmSlug: string
  onProceedToSignUp: (consent: boolean) => void
}

export function PreAuthSubscriptionModal({
  isOpen,
  onClose,
  farmId,
  farmName,
  farmSlug,
  onProceedToSignUp
}: PreAuthSubscriptionModalProps) {
  const [consentGiven, setConsentGiven] = useState(false)

  const handleProceed = () => {
    if (consentGiven) {
      // Store pending subscription in sessionStorage
      const pendingSubscription = {
        farmId,
        farmName,
        farmSlug,
        consentGiven: true,
        timestamp: new Date().toISOString()
      }
      sessionStorage.setItem('pending_subscription', JSON.stringify(pendingSubscription))

      // ALSO store the current URL for redirect after sign-up
      sessionStorage.setItem('clerk_redirect_url', `/farms/${farmSlug}`)

      // Call the callback
      onProceedToSignUp(true)

      // Reset state
      setConsentGiven(false)
    }
  }

  const handleClose = () => {
    setConsentGiven(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-6 w-6 text-primary" />
            <DialogTitle className="text-xl">Create an Account to Subscribe</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            To receive updates from <strong>{farmName}</strong>, you need a free Pick A Farm account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <p className="text-sm text-muted-foreground">
            By subscribing, you will receive email notifications when this farm posts:
          </p>

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Opening dates and seasonal availability</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Hours of operation changes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Special events and announcements</span>
            </li>
          </ul>

          <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2 mt-4">
            <p className="text-muted-foreground">
              <strong>What happens next:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Create your free account (takes 30 seconds)</li>
              <li>You'll be automatically subscribed to {farmName}</li>
              <li>Receive email updates when the farm posts news</li>
            </ol>
          </div>

          <div className="flex items-start space-x-3 pt-4">
            <Checkbox
              id="consent"
              checked={consentGiven}
              onCheckedChange={(checked) => setConsentGiven(checked === true)}
              className="mt-1"
            />
            <label
              htmlFor="consent"
              className="text-sm font-medium leading-relaxed cursor-pointer"
            >
              I agree to receive email updates from farms I subscribe to
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <SignUpButton
            mode="modal"
            forceRedirectUrl={`/farms/${farmSlug}`}
            fallbackRedirectUrl={`/farms/${farmSlug}`}
          >
            <Button
              type="button"
              onClick={handleProceed}
              disabled={!consentGiven}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Create Free Account
            </Button>
          </SignUpButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
