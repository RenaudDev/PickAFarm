/**
 * Farmer Dashboard Main Page - Redirect to Overview
 * Story 2.5: Dashboard UX Restructure
 *
 * Route: /dashboard/farmer
 *
 * Redirects to the new overview tab as the default dashboard view.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect to Overview tab
 * The main dashboard now defaults to /dashboard/farmer/overview
 */
export default function FarmerDashboardRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/farmer/overview');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Redirecting to dashboard...</p>
    </div>
  );
}
