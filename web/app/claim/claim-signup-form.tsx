'use client';

/**
 * Client Component for Clerk signup form
 * Story 2.2: Magic Link Claim Flow
 */

import { SignUp } from '@clerk/nextjs';

export function ClaimSignUpForm({
  email,
  farmId,
  claimToken,
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
          footerActionLink: 'text-green-700 hover:text-green-800',
        },
      }}
      initialValues={{
        emailAddress: email,
      }}
      publicMetadata={{
        farmId,
        role: 'farmer',
      }}
      unsafeMetadata={{
        claimToken,
      }}
      redirectUrl="/dashboard/farmer"
      routing="hash"
    />
  );
}

/**
 * Loading skeleton for Clerk component
 */
export function ClerkLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      <div className="h-12 bg-gray-300 rounded"></div>
    </div>
  );
}
