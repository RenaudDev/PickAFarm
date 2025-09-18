"use client"

import { useState } from "react"
import { Sprout, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

function FarmNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hidden md:flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Sprout className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Pick A Farm</span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex items-center space-x-6">
              <a href="/" className="text-foreground hover:text-accent font-medium transition-colors">
                Home
              </a>
              <a href="about-us" className="text-foreground hover:text-accent font-medium transition-colors">
                About
              </a>
              <a href="contact-us" className="text-foreground hover:text-accent font-medium transition-colors">
                Contact
              </a>
            </div>
            <a href="#" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              List Your Farm
            </a>
          </div>
        </div>

        <div className="md:hidden">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Sprout className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Pick A Farm</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {isMobileMenuOpen && (
            <div className="pb-4 space-y-4 bg-background rounded-b-lg border-t border-border">
              <div className="space-y-2">
                <a href="#" className="block px-4 py-2 text-foreground hover:bg-muted rounded-md font-medium">
                  Home
                </a>
                <a href="#" className="block px-4 py-2 text-foreground hover:bg-muted rounded-md font-medium">
                  About
                </a>
                <a href="#" className="block px-4 py-2 text-foreground hover:bg-muted rounded-md font-medium">
                  Contact
                </a>
                <a href="#" className="block px-4 py-2 text-primary hover:bg-muted rounded-md font-semibold">
                  List Your Farm
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export { FarmNavbar }
export default FarmNavbar
