import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react"
import Image from "next/image"

export function FarmFooter() {
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Image 
                src="/images/Footer-pickafarm.webp" 
                alt="Pick A Farm Logo" 
                width={100} 
                height={100} 
                className="h-64 w-64"
              />
            </div>
            
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <div className="space-y-2">
              <a href="/" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Home
              </a>
              <a href="/about" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                About Us
              </a>
              <a href="/contact" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Contact
              </a>
              <a href="https://zfrmz.ca/LsxdRy6JtAUjFjuPfRd3" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                List Your Farm
              </a>
            </div>
          </div>

          {/* Farm Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Popular Categories</h3>
            <div className="space-y-2">
              <a href="/christmas-tree-farms/" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Christmas Tree Farms
              </a>
              
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Get in Touch</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>hello@pickafarm.com</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Rigaud, Quebec, CA</span>
              </div>
            </div>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/pickafarm" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Follow us on Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/pickafarm" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Follow us on Instagram">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row md:justify-between items-start md:items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground"> {new Date().getFullYear()} Pick A Farm. All rights reserved.</p>
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-6">
            <a href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
            
            <a href="/cookies" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default FarmFooter
