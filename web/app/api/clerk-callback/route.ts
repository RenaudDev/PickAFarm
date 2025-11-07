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
 *
 * IMPORTANT: This route waits for Clerk webhook to complete metadata migration.
 * The webhook (user.created) sets publicMetadata asynchronously, so we poll
 * with retries to ensure metadata is available before redirecting.
 */
export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user from Clerk
    let user = await currentUser();

    if (!user) {
      // User not authenticated - redirect to sign-in
      console.warn('Clerk callback: No user found, redirecting to sign-in');
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    console.log(
      `✅ Clerk callback: User authenticated - ${user.id} (${user.emailAddresses[0]?.emailAddress})`
    );

    // Poll for metadata availability (webhook may still be processing)
    // Max 5 retries with 500ms intervals = 2.5 seconds total wait time
    const maxRetries = 5;
    const retryDelay = 500; // milliseconds
    let retries = 0;
    let role = user.publicMetadata?.role as string | undefined;
    let farmId = user.publicMetadata?.farmId as string | undefined;

    while (retries < maxRetries && !role && user.unsafeMetadata?.role === 'farmer') {
      // Only poll if user has unsafeMetadata indicating they're claiming a farm
      // Regular users don't need polling
      console.log(
        `⏳ Metadata not yet available (attempt ${retries + 1}/${maxRetries}), waiting ${retryDelay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      user = await currentUser(); // Refetch user to get updated metadata
      role = user?.publicMetadata?.role as string | undefined;
      farmId = user?.publicMetadata?.farmId as string | undefined;
      retries++;
    }

    if (retries > 0) {
      console.log(
        `📋 Metadata polling complete after ${retries} retries: role=${role}, farmId=${farmId}`
      );
    } else {
      console.log(`📋 User metadata: role=${role}, farmId=${farmId}`);
    }

    // Check if user is a farmer with valid farm association
    if (role === 'farmer' && farmId) {
      console.log(`🚜 Redirecting farmer to dashboard: /dashboard/farmer`);
      return NextResponse.redirect(new URL('/dashboard/farmer', request.url));
    }

    // Check if user has partial farmer metadata (error case)
    if (role === 'farmer' && !farmId) {
      console.error(`⚠️ Farmer role without farmId - data inconsistency for user ${user.id}`);
      const errorUrl = new URL('/claim-error', request.url);
      errorUrl.searchParams.set('reason', 'data_inconsistency');
      return NextResponse.redirect(errorUrl);
    }

    // Check if metadata still missing after polling (timeout case)
    // Only applies to users who were claiming a farm (have unsafeMetadata)
    if (!role && user.unsafeMetadata?.role === 'farmer') {
      console.error(
        `⚠️ Metadata timeout: Farmer claim metadata not available after ${maxRetries} retries for user ${user.id}`
      );
      const errorUrl = new URL('/claim-error', request.url);
      errorUrl.searchParams.set('reason', 'timeout');
      return NextResponse.redirect(errorUrl);
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
