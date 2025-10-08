import StaticPageLayout from "@/components/static-page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Phone, Mail, Clock } from "lucide-react"
import { Metadata } from "next"
import { generateMetadata as createMetadata } from "@/lib/seo-metadata"

export async function generateMetadata(): Promise<Metadata> {
  return createMetadata({
    title: "Contact Us - PickAFarm",
    description: "Get in touch with the PickAFarm team. Questions about farm listings, partnerships, or need help? We're here to assist you.",
    keywords: [
      "contact pickafarm",
      "farm directory contact",
      "list your farm",
      "farm partnership"
    ],
    url: "https://pickafarm.com/contact/"
  })
}

export default function ContactPage() {
  return (
    <StaticPageLayout
      title="Contact Us"
      description="Get in touch with the PickAFarm team. We're here to help you find the perfect farm experience."
    >
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Send us a message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="listing">Add My Farm</option>
                  <option value="support">Technical Support</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  placeholder="Tell us how we can help you..."
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
                />
              </div>

              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Get in touch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Email</h3>
                <p className="text-muted-foreground">hello@pickafarm.com</p>
                <p className="text-muted-foreground">support@pickafarm.com</p>
              </div>
            </div>

            

            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Business Hours</h3>
                <p className="text-muted-foreground">
                  Monday - Friday: 9:00 AM - 6:00 PM EST
                  <br />
                  Saturday: 10:00 AM - 4:00 PM EST
                  <br />
                  Sunday: Closed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-primary">For Farm Owners</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Want to list your farm on PickAFarm? We'd love to help you connect with visitors looking for authentic
              farm experiences.
            </p>
            <Button className="w-full">
              List Your Farm
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-16 p-8 bg-primary/5 rounded-lg">
        <h2 className="text-2xl font-bold text-primary mb-4">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-foreground mb-2">How do I add my farm to the directory?</h3>
            <p className="text-muted-foreground text-sm">
              Contact us using the form above or email us directly. We'll guide you through the listing process.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">Is there a cost to list my farm?</h3>
            <p className="text-muted-foreground text-sm">
              Basic listings are free. We also offer premium features for enhanced visibility.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">How can I update my farm information?</h3>
            <p className="text-muted-foreground text-sm">
              Send us an email with your updates, or contact us to discuss dashboard access for self-service updates.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">Do you verify farm information?</h3>
            <p className="text-muted-foreground text-sm">
              Yes, we verify all farm listings to ensure accuracy and quality for our users.
            </p>
          </div>
        </div>
      </div>
    </StaticPageLayout>
  )
}