"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs"

function FarmNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isSignedIn } = useAuth()

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hidden md:flex items-center justify-between h-24">
        <a href="/">
          <div className="flex items-center space-x-3">
            
            <Image 
              src="/images/navbarlogo1.webp" 
              alt="Pick A Farm Logo" 
              width={56} 
              height={28} 
              className="h-20 w-60"
            />
            
            
          </div>
          </a>
          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex items-center space-x-6">
              <a href="/" className="text-foreground hover:text-accent font-medium transition-colors">
                Home
              </a>
              <a href="/about" className="text-foreground hover:text-accent font-medium transition-colors">
                About
              </a>
              <a href="/contact" className="text-foreground hover:text-accent font-medium transition-colors">
                Contact
              </a>
            </div>
            <a href="https://zfrmz.ca/LsxdRy6JtAUjFjuPfRd3" className="text-foreground hover:text-accent font-medium transition-colors">
              List Your Farm
            </a>
            {!isSignedIn ? (
              <>
                <SignInButton mode="modal">
                  <Button 
                    variant="outline" 
                    className="font-medium border-border hover:bg-muted hover:text-foreground transition-colors"
                  >
                    Log In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    Sign Up
                  </Button>
                </SignUpButton>
              </>
            ) : (
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 rounded-full",
                    userButtonPopoverCard: "shadow-lg",
                    userButtonPopoverActionButton: "hover:bg-muted"
                  }
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Dashboard"
                    labelIcon={<span>📊</span>}
                    href="/dashboard"
                  />
                  <UserButton.Link
                    label="Subscriptions"
                    labelIcon={<span>🔔</span>}
                    href="/saved-farms"
                  />
                  <UserButton.Action label="manageAccount" />
                  <UserButton.Action label="signOut" />
                </UserButton.MenuItems>
              </UserButton>
            )}
          </div>
        </div>

        <div className="md:hidden">
          <div className="flex items-center justify-between h-20">
          <a href="/">
            <div className="flex items-center space-x-2">
              
              <Image 
                src="/images/navbarlogo1.webp" 
                alt="Pick A Farm Logo" 
                width={56} 
                height={28} 
                className="h-16 w-42"
              />
              
            </div>
            </a>
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
                <a href="/" className="block px-4 py-2 text-foreground hover:bg-muted rounded-md font-medium">
                  Home
                </a>
                <a href="/about" className="block px-4 py-2 text-foreground hover:bg-muted rounded-md font-medium">
                  About
                </a>
                <a href="/contact" className="block px-4 py-2 text-foreground hover:bg-muted rounded-md font-medium">
                  Contact
                </a>
                <a href="https://zfrmz.ca/LsxdRy6JtAUjFjuPfRd3" className="block px-4 py-2 text-primary hover:bg-muted rounded-md font-semibold">
                  List Your Farm
                </a>
                {!isSignedIn ? (
                  <>
                    <div className="px-4 py-2">
                      <SignInButton mode="modal">
                        <Button 
                          variant="outline" 
                          className="w-full font-medium border-border hover:bg-muted hover:text-foreground transition-colors"
                        >
                          Log In
                        </Button>
                      </SignInButton>
                    </div>
                    <div className="px-4 py-2">
                      <SignUpButton mode="modal">
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                          Sign Up
                        </Button>
                      </SignUpButton>
                    </div>
                  </>
                ) : (
                  <>
                    <a href="/dashboard" className="block px-4 py-2 text-foreground hover:bg-muted rounded-md font-medium">
                      📊 Dashboard
                    </a>
                    <a href="/saved-farms" className="block px-4 py-2 text-foreground hover:bg-muted rounded-md font-medium">
                      🔔 Subscriptions
                    </a>
                    <div className="px-4 py-2 flex items-center justify-center">
                      <UserButton 
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            avatarBox: "w-10 h-10 rounded-full"
                          }
                        }}
                      />
                    </div>
                  </>
                )}
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
