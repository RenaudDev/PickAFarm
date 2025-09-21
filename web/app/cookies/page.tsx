import StaticPageLayout from "@/components/static-page-layout"

export default function CookiePolicyPage() {
  return (
    <StaticPageLayout
      title="Cookie Policy"
      description="How we use cookies and similar technologies on PickAFarm."
      lastUpdated="December 2024"
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">What Are Cookies</h2>
          <p className="text-muted-foreground">
            Cookies are small text files that are placed on your computer or mobile device when you visit our website.
            They help us provide you with a better experience by remembering your preferences and improving site
            functionality.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">Types of Cookies We Use</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-foreground">Essential Cookies</h3>
              <p className="text-muted-foreground">
                These cookies are necessary for the website to function properly. They enable basic functions like page
                navigation and access to secure areas.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2 text-foreground">Analytics Cookies</h3>
              <p className="text-muted-foreground">
                We use analytics cookies to understand how visitors interact with our website, helping us improve our
                services and user experience.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2 text-foreground">Preference Cookies</h3>
              <p className="text-muted-foreground">
                These cookies remember your preferences and settings, such as your preferred location for farm searches
                and display preferences.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">Managing Cookies</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>You can control and manage cookies in several ways:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Browser settings: Most browsers allow you to refuse cookies or delete existing ones</li>
              <li>Opt-out tools: Use browser extensions or privacy tools to manage tracking</li>
              <li>Website preferences: Adjust your cookie preferences in our privacy settings</li>
            </ul>
            <p className="mt-4">
              Please note that disabling certain cookies may affect the functionality of our website.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">Third-Party Cookies</h2>
          <p className="text-muted-foreground">
            We may use third-party services like Google Analytics to help us understand website usage. These services
            may place their own cookies on your device. Please refer to their respective privacy policies for more
            information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">Updates to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated
            revision date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">Contact Us</h2>
          <p className="text-muted-foreground">
            If you have questions about our use of cookies, please contact us at{" "}
            <a href="mailto:privacy@pickafarm.ca" className="text-primary hover:underline">
              hello@pickafarm.ca
            </a>
          </p>
        </section>
      </div>
    </StaticPageLayout>
  )
}
