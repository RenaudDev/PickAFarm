import StaticPageLayout from "@/components/static-page-layout"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "About PickAFarm - Connecting Families with Local Farms",
  description: "Connecting families with local farms for authentic agricultural experiences across Ontario and beyond.",
  alternates: {
    canonical: 'https://pickafarm.com/about/'
  }
}

export default function AboutPage() {
  return (
    <StaticPageLayout
      title="About PickAFarm"
      description="Connecting families with local farms for authentic agricultural experiences across Ontario and beyond."
    >
      <div className="space-y-8">
        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              PickAFarm is dedicated to connecting families and individuals with local farms, creating meaningful
              connections between urban communities and agricultural heritage. We believe that visiting farms provides
              educational opportunities, supports local agriculture, and creates lasting memories for families.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">What We Do</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Our comprehensive directory features hundreds of farms across Ontario, offering everything from
                pick-your-own experiences to educational tours, seasonal events, and fresh produce sales.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Apple orchards and berry farms for pick-your-own adventures</li>
                <li>Pumpkin patches and corn mazes for fall family fun</li>
                <li>Christmas tree farms for holiday traditions</li>
                <li>Educational farm tours and school programs</li>
                <li>Farm markets with fresh, local produce</li>
                <li>Seasonal events and agricultural festivals</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">For Farm Owners</h2>
            <p className="text-muted-foreground leading-relaxed">
              We help farm owners connect with their communities by providing a platform to showcase their offerings,
              share their stories, and attract visitors. Our verified listings ensure quality experiences while
              supporting local agricultural businesses.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Contact Us</h2>
            <div className="text-muted-foreground space-y-2">
              <p>Have questions or want to list your farm?</p>
              <p>
                Email:{" "}
                <a href="mailto:hello@pickafarm.ca" className="text-primary hover:underline">
                  hello@pickafarm.ca
                </a>
              </p>
              
            </div>
          </CardContent>
        </Card>
      </div>
    </StaticPageLayout>
  )
}
