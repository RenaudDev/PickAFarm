/**
 * Clerk Post-Signup Redirect Handler
 * Story 2.2: Clerk Farmer Role & Magic Link Authentication
 *
 * Route: /api/clerk-callback
 *
 * This API route handles post-signup redirects from Clerk.
 * It checks the user's role and redirects to the appropriate dashboard.
 *
 * Flow:
 * 1. User completes Clerk signup
 * 2. Clerk redirects to this route
 * 3. Route checks user role from Clerk metadata
 * 4. Redirects to farmer dashboard or general dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

// Cloudflare Pages requires edge runtime for dynamic routes
export const runtime = 'edge';

/**
 * GET /api/clerk-callback
 *
 * Handles post-authentication redirects
 */
export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user from Clerk
    const user = await currentUser();

    if (!user) {
      // User not authenticated - redirect to sign-in
      console.warn('Clerk callback: No user found, redirecting to sign-in');
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    console.log(
      `✅ Clerk callback: User authenticated - ${user.id} (${user.emailAddresses[0]?.emailAddress})`
    );

    // Extract role and farmId from public metadata
    // NOTE: Using publicMetadata so it's available in session claims (middleware)
    const farmId = user.publicMetadata?.farmId as string | undefined;
    const role = user.publicMetadata?.role as string | undefined;

    console.log(`📋 User metadata: role=${role}, farmId=${farmId}`);

    // Check if user is a farmer with valid farm association
    if (role === 'farmer' && farmId) {
      console.log(`🚜 Redirecting farmer to dashboard: /dashboard/farmer`);
      return NextResponse.redirect(new URL('/dashboard/farmer', request.url));
    }

    // Check if user has partial farmer metadata (error case)
    if (role === 'farmer' && !farmId) {
      console.error(`⚠️ Farmer role without farmId - data inconsistency for user ${user.id}`);
      return NextResponse.redirect(new URL('/claim-error', request.url));
    }

    // Regular user - redirect to general dashboard
    console.log(`👤 Redirecting regular user to dashboard: /dashboard`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Clerk callback error:', error);

    // On error, redirect to homepage with error flag
    const errorUrl = new URL('/', request.url);
    errorUrl.searchParams.set('error', 'auth_callback_failed');
    return NextResponse.redirect(errorUrl);
  }
}
