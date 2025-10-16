/**
 * User Dashboard Home Page
 * Story 2.2.3: Farmer/User UX Polish & Dashboard Page Fixes
 *
 * Route: /dashboard
 *
 * This page is for regular users (not farmers).
 * Farmers are automatically redirected to /dashboard/farmer by middleware.
 *
 * Fixed: Converted to Server Component to resolve white screen and RSC payload issues.
 * Client-side features extracted to DashboardStats client component island.
 */

import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { FarmNavbar } from '@/components/farm-navbar';
import { DashboardStats } from './dashboard-stats';

// Cloudflare Pages requires edge runtime for dynamic routes
export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Dashboard | PickAFarm',
  description: 'Manage your saved farms and notification preferences.',
  robots: 'noindex, nofollow', // Don't index dashboard pages
};

export default async function DashboardPage() {
  // Verify user is authenticated (server-side check)
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Get user's name for personalization
  const userName = user.firstName || 'there';

  return (
    <>
      <FarmNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Welcome back, {userName}!</h1>
            <p className="text-muted-foreground mt-2">This is your personal dashboard</p>
          </div>

          {/* Client Component Island: Handles API calls and localStorage */}
          <DashboardStats userId={user.id} />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Your Profile</h3>
              <p className="text-sm text-muted-foreground">
                Email: {user.primaryEmailAddress?.emailAddress}
              </p>
              <p className="text-sm text-muted-foreground">
                Member since:{' '}
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Your Reviews</h3>
              <p className="text-sm text-muted-foreground">You haven't written any reviews yet</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
