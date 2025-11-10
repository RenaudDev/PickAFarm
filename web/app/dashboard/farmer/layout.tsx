import type { Metadata } from 'next';

/**
 * Farmer Dashboard Layout
 * 
 * Sets SEO metadata for all farmer dashboard routes.
 * All dashboard pages are protected and should never be indexed by search engines.
 */

export const metadata: Metadata = {
  title: 'Farmer Dashboard | PickAFarm',
  description: 'Manage your farm listing and track your performance.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
  // Additional meta tags to prevent indexing
  other: {
    'robots': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
  },
};

export default function FarmerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

