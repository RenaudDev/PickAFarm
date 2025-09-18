import { Sprout, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react"

export function FarmFooter() {
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sprout className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Pick A Farm</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Connecting communities with local farms. Discover fresh, sustainable produce and support your local
              farmers.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Home
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                About Us
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Contact
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                List Your Farm
              </a>
            </div>
          </div>

          {/* Farm Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Popular Categories</h3>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Organic Farms
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Dairy Farms
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Fruit Orchards
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Vegetable Farms
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
                <Phone className="h-4 w-4 text-primary" />
                <span>(555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row md:justify-between items-start md:items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">© 2024 Pick A Farm. All rights reserved.</p>
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default FarmFooter
