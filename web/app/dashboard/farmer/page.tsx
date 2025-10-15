/**
 * Farmer Dashboard Home Page
 * Story 2.2: Clerk Farmer Role & Magic Link Authentication
 *
 * Route: /dashboard/farmer
 *
 * This is a placeholder page for the farmer dashboard.
 * Full dashboard implementation will be in Story 2.4+
 */

import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Farmer Dashboard | PickAFarm',
  description: 'Manage your farm listing and engage with customers.',
  robots: 'noindex, nofollow', // Don't index dashboard pages
};

export default async function FarmerDashboardPage() {
  // Verify user is authenticated
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Extract farm context from metadata
  const farmId = user.unsafeMetadata?.farmId as string | undefined;
  const role = user.unsafeMetadata?.role as string | undefined;

  // Verify user has farmer role
  if (role !== 'farmer') {
    redirect('/dashboard'); // Redirect to general dashboard
  }

  // Verify user has farm association
  if (!farmId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error: No Farm Associated</h1>
          <p className="text-gray-600 mb-6">Your account is not associated with a farm listing.</p>
          <a
            href="mailto:support@pickafarm.com"
            className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  const userName = user.firstName || user.emailAddresses[0]?.emailAddress || 'Farmer';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Farmer Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {userName}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/profile" className="text-gray-600 hover:text-gray-900">
                Profile
              </a>
              <a href="/sign-out" className="text-red-600 hover:text-red-700">
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-900">
                🎉 Welcome to Your Farmer Dashboard!
              </h3>
              <p className="mt-2 text-green-800">
                You've successfully claimed your farm listing. Your dashboard is currently under
                construction.
              </p>
              <p className="mt-2 text-sm text-green-700">
                Farm ID: <code className="bg-green-100 px-2 py-1 rounded">{farmId}</code>
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Farm Profile Card */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Farm Profile</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Edit your farm information, hours, and contact details.
            </p>
            <p className="text-sm text-gray-500 italic">Coming in Story 2.5</p>
          </div>

          {/* Photos Card */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Photo Gallery</h3>
            </div>
            <p className="text-gray-600 mb-4">Upload and manage your farm photos and logos.</p>
            <p className="text-sm text-gray-500 italic">Coming in Story 2.6</p>
          </div>

          {/* Broadcast Messages Card */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Broadcasts</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Send updates to your subscribers about opening dates and events.
            </p>
            <p className="text-sm text-gray-500 italic">Coming in Story 2.7</p>
          </div>

          {/* Analytics Card */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Analytics</h3>
            </div>
            <p className="text-gray-600 mb-4">
              View subscriber counts, page views, and engagement metrics.
            </p>
            <p className="text-sm text-gray-500 italic">Coming in Story 2.4</p>
          </div>

          {/* Subscribers Card */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-red-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Subscribers</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Manage your subscriber list and notification preferences.
            </p>
            <p className="text-sm text-gray-500 italic">Coming in Story 2.4</p>
          </div>

          {/* Settings Card */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Settings</h3>
            </div>
            <p className="text-gray-600 mb-4">Configure your account settings and preferences.</p>
            <p className="text-sm text-gray-500 italic">Coming in Story 2.5+</p>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-gray-600 mb-4">
            We're here to help you get the most out of your farmer dashboard.
          </p>
          <div className="space-y-2">
            <a
              href="mailto:support@pickafarm.com"
              className="inline-flex items-center text-green-700 hover:text-green-800 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Email Support
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
