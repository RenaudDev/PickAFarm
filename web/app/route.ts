/**
 * Root Route Handler
 * Story 2.2.2: Fix Clerk Metadata Access & Static Export Compatibility
 *
 * This route handler prevents 405 Method Not Allowed errors
 * when Clerk's internal router.refresh() makes POST requests
 * to the current route during authentication state changes.
 *
 * Background:
 * - ClerkProvider uses __unstable__onBeforeSetActive callback
 * - This callback calls Next.js router.refresh() after login/logout
 * - router.refresh() makes a POST request to revalidate server components
 * - Without this handler, POST to "/" returns 405 causing auth flow errors
 *
 * This handler accepts POST requests and returns an empty 200 response,
 * allowing Clerk's auth flows to complete without errors.
 */

import { NextResponse } from 'next/server';

/**
 * Handle POST requests to root route
 * Used by Clerk's router.refresh() during auth state changes
 */
export async function POST() {
  // Return empty 200 response - no action needed
  // Clerk just needs the request to not fail
  return NextResponse.json({ ok: true }, { status: 200 });
}

/**
 * Handle GET requests to root route
 * This shouldn't be called (page.tsx handles normal GET requests)
 * But include it for completeness
 */
export async function GET() {
  // Redirect to home page if someone hits the API route directly
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
}
