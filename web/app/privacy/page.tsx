import StaticPageLayout from '@/components/static-page-layout';
import { Metadata } from 'next';
import { generateMetadata as createMetadata } from '@/lib/seo-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return createMetadata({
    title: 'Privacy Policy - PickAFarm',
    description:
      "Read PickAFarm's privacy policy to understand how we collect, use, and protect your personal information.",
    keywords: ['privacy policy', 'data protection', 'user privacy'],
    url: 'https://pickafarm.com/privacy/',
  });
}

export default function PrivacyPolicyPage() {
  return (
    <StaticPageLayout
      title="Privacy Policy"
      description="How we collect, use, and protect your personal information."
      lastUpdated="December 2024"
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">Information We Collect</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>We collect information you provide directly to us, such as when you:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Create an account or profile</li>
              <li>Submit farm listings or reviews</li>
              <li>Contact us for support</li>
              <li>Subscribe to our newsletter</li>
              <li>Use our search and filtering features</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">How We Use Your Information</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide and improve our services</li>
              <li>Process farm listings and reviews</li>
              <li>Send you updates about farms and events</li>
              <li>Respond to your inquiries and provide support</li>
              <li>Analyze usage patterns to enhance user experience</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">Information Sharing</h2>
          <p className="text-muted-foreground">
            We do not sell, trade, or otherwise transfer your personal information to third parties
            without your consent, except as described in this policy. We may share information with
            trusted partners who assist us in operating our website and serving our users.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">Data Security</h2>
          <p className="text-muted-foreground">
            We implement appropriate security measures to protect your personal information against
            unauthorized access, alteration, disclosure, or destruction. However, no method of
            transmission over the internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">Contact Us</h2>
          <p className="text-muted-foreground">
            If you have questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:privacy@pickafarm.ca" className="text-primary hover:underline">
              hello@pickafarm.ca
            </a>
          </p>
        </section>
      </div>
    </StaticPageLayout>
  );
}
