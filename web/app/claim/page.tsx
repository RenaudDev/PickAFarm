/**
 * Magic Link Claim Landing Page
 * Story 2.2: Clerk Farmer Role & Magic Link Authentication
 *
 * Route: /claim?token={encrypted}&expires={timestamp}
 *
 * This page validates the magic link token and initiates Clerk signup with
 * pre-filled email and farm context.
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Claim Your Farm Listing | PickAFarm',
  description: 'Complete your farm listing claim and access your farmer dashboard.',
  robots: 'noindex, nofollow' // Don't index claim pages
};

/**
 * Server Component - validates token server-side
 */
export default async function ClaimPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; expires?: string }>
}) {
  const params = await searchParams;
  const { token, expires } = params;

  // Validate params exist
  if (!token || !expires) {
    notFound();
  }

  // Check expiration client-side first (early exit)
  const expiresTimestamp = parseInt(expires, 10);
  const now = Math.floor(Date.now() / 1000);

  if (expiresTimestamp < now) {
    return <TokenExpiredError />;
  }

  // Validate token server-side
  let farmContext;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';
    const response = await fetch(
      `${apiUrl}/api/claim/validate-token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, expires }),
        cache: 'no-store' // Don't cache validation responses
      }
    );

    if (!response.ok) {
      throw new Error('Token validation failed');
    }

    const data = await response.json();

    if (!data.valid) {
      // Check specific error types
      if (data.error === 'Token expired') {
        return <TokenExpiredError />;
      }
      if (data.error === 'Token already used') {
        return <TokenAlreadyUsedError claimedAt={data.claimedAt} />;
      }
      return <TokenInvalidError />;
    }

    farmContext = data;
  } catch (error) {
    console.error('Token validation error:', error);
    return <TokenInvalidError />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Farm Context Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-green-600 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Claim Your Farm Listing
          </h1>
          <p className="text-gray-600 mb-4">
            Complete your account setup to manage your farm dashboard
          </p>

          {/* Farm Info Card */}
          <div className="bg-white border-2 border-green-200 rounded-lg p-4 mt-6 text-left">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
              Your Farm
            </p>
            <p className="text-xl font-bold text-green-800">
              {farmContext.farmName}
            </p>
            {farmContext.farmLocation && (
              <p className="text-sm text-gray-600 mt-1">
                📍 {farmContext.farmLocation}
              </p>
            )}
          </div>
        </div>

        {/* Clerk Signup Component */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <Suspense fallback={<ClerkLoadingSkeleton />}>
            <ClaimSignUpForm
              email={farmContext.email}
              farmId={farmContext.farmId}
              claimToken={token}
            />
          </Suspense>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Need help?{' '}
          <a
            href="mailto:support@pickafarm.com"
            className="text-green-700 hover:text-green-800 font-medium"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}

/**
 * Client Component for Clerk signup
 */
'use client';
function ClaimSignUpForm({
  email,
  farmId,
  claimToken
}: {
  email: string;
  farmId: string;
  claimToken: string;
}) {
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: 'w-full',
          card: 'shadow-none',
          headerTitle: 'text-xl font-bold text-gray-900',
          headerSubtitle: 'text-gray-600',
          socialButtonsBlockButton: 'border-gray-300 hover:bg-gray-50',
          formButtonPrimary: 'bg-green-700 hover:bg-green-800',
          footerActionLink: 'text-green-700 hover:text-green-800'
        }
      }}
      initialValues={{
        emailAddress: email
      }}
      unsafeMetadata={{
        farmId,
        role: 'farmer',
        claimToken
      }}
      redirectUrl="/dashboard/farmer"
      routing="hash"
    />
  );
}

/**
 * Loading skeleton for Clerk component
 */
function ClerkLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      <div className="h-12 bg-gray-300 rounded"></div>
    </div>
  );
}

/**
 * Token Expired Error Page
 */
function TokenExpiredError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-block p-4 bg-red-100 rounded-full mb-6">
          <svg
            className="w-12 h-12 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Link Expired
        </h1>
        <p className="text-gray-600 mb-8">
          This claim link has expired. Magic links are valid for 24 hours.
        </p>
        <p className="text-gray-600 mb-8">
          Please contact support to request a new invitation link.
        </p>
        <a
          href="mailto:support@pickafarm.com?subject=Magic Link Expired"
          className="inline-block bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 font-medium transition-colors"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}

/**
 * Token Already Used Error Page
 */
function TokenAlreadyUsedError({ claimedAt }: { claimedAt?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-block p-4 bg-yellow-100 rounded-full mb-6">
          <svg
            className="w-12 h-12 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-yellow-700 mb-4">
          Link Already Used
        </h1>
        <p className="text-gray-600 mb-8">
          This farm listing has already been claimed.
          {claimedAt && (
            <span className="block mt-2 text-sm text-gray-500">
              Claimed on {new Date(claimedAt).toLocaleDateString()}
            </span>
          )}
        </p>
        <p className="text-gray-600 mb-8">
          If you're the farm owner, please sign in to access your dashboard.
        </p>
        <div className="space-y-3">
          <a
            href="/sign-in"
            className="block bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 font-medium transition-colors"
          >
            Sign In
          </a>
          <a
            href="mailto:support@pickafarm.com?subject=Already Claimed Farm"
            className="block text-green-700 hover:text-green-800 font-medium"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Token Invalid Error Page
 */
function TokenInvalidError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-block p-4 bg-red-100 rounded-full mb-6">
          <svg
            className="w-12 h-12 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Invalid Link
        </h1>
        <p className="text-gray-600 mb-8">
          This claim link is invalid or has been tampered with.
        </p>
        <p className="text-gray-600 mb-8">
          If you need assistance claiming your farm, please contact support.
        </p>
        <a
          href="mailto:support@pickafarm.com?subject=Invalid Magic Link"
          className="inline-block bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 font-medium transition-colors"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
