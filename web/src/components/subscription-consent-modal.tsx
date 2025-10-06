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
import { Bell } from "lucide-react"

interface SubscriptionConsentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  farmName: string
  isFirstTime: boolean
}

export function SubscriptionConsentModal({
  isOpen,
  onClose,
  onConfirm,
  farmName,
  isFirstTime
}: SubscriptionConsentModalProps) {
  const [consentGiven, setConsentGiven] = useState(false)

  const handleConfirm = () => {
    if (consentGiven) {
      onConfirm()
      setConsentGiven(false) // Reset for next time
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
            <DialogTitle className="text-xl">Subscribe to Farm Updates</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            By subscribing to <strong>{farmName}</strong>, you will receive email notifications when:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Opening dates are announced</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Hours of operation change</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Special events are posted</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Farm information is updated</span>
            </li>
          </ul>

          <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2 mt-4">
            <p className="text-muted-foreground">
              Your email address will be used solely for these farm update notifications.
            </p>
            <p className="text-muted-foreground">
              You can unsubscribe at any time from your subscriptions page or any email we send.
            </p>
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
              I agree to receive email updates from {farmName}
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
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!consentGiven}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            Subscribe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
