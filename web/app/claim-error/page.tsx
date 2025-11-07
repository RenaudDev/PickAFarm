/**
 * Claim Error Page
 * Story 2.2: Magic Link Claim Flow - Error Handling
 *
 * Route: /claim-error?reason={error_reason}
 *
 * This page displays user-friendly error messages when magic link claim fails.
 * Handles various failure scenarios with appropriate messaging.
 */

import type { Metadata } from 'next';

// Cloudflare Pages requires edge runtime for dynamic routes
export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Claim Failed | PickAFarm',
  description: 'There was an issue processing your farm claim request.',
  robots: 'noindex, nofollow', // Don't index error pages
};

/**
 * Server Component - displays error based on reason parameter
 */
export default async function ClaimErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const { reason } = params;

  const errorMessages: Record<string, { title: string; message: string; iconColor: string }> = {
    missing_params: {
      title: 'Invalid Claim Link',
      message: 'This claim link is missing required information. Please contact support to request a new invitation link.',
      iconColor: 'text-red-600',
    },
    invalid_claim: {
      title: 'Invalid or Used Link',
      message: 'This claim link is invalid or has already been used. Magic links can only be used once and expire after 24 hours.',
      iconColor: 'text-red-600',
    },
    data_inconsistency: {
      title: 'Account Configuration Error',
      message: 'Your account has incomplete farmer information. Please contact support to resolve this issue.',
      iconColor: 'text-yellow-600',
    },
    timeout: {
      title: 'Processing Timeout',
      message: 'Claim processing took longer than expected. Your account may still be setting up. Please try signing in, or contact support if the issue persists.',
      iconColor: 'text-yellow-600',
    },
  };

  const error = errorMessages[reason || ''] || {
    title: 'Claim Failed',
    message: 'An unexpected error occurred during claim processing. Please contact support for assistance.',
    iconColor: 'text-red-600',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className={`inline-block p-4 ${reason === 'timeout' || reason === 'data_inconsistency' ? 'bg-yellow-100' : 'bg-red-100'} rounded-full mb-6`}>
          <svg
            className={`w-12 h-12 ${error.iconColor}`}
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
        <h1 className={`text-3xl font-bold ${error.iconColor} mb-4`}>{error.title}</h1>
        <p className="text-gray-600 mb-8">{error.message}</p>
        <div className="space-y-3">
          {reason === 'timeout' && (
            <a
              href="/sign-in"
              className="block bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 font-medium transition-colors"
            >
              Try Signing In
            </a>
          )}
          <a
            href="mailto:support@pickafarm.com?subject=Magic Link Claim Failed"
            className="block bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 font-medium transition-colors"
          >
            Contact Support
          </a>
          <a
            href="/"
            className="block text-green-700 hover:text-green-800 font-medium"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}

