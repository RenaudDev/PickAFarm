import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Role-Based Route Guards Middleware
 * Story 2.2.1: Farmer/User UX Separation
 *
 * IMPORTANT SETUP REQUIRED:
 * This middleware requires Clerk session token customization to work.
 * See docs/CLERK_SETUP.md for configuration instructions.
 *
 * Without session token customization, middleware cannot detect farmer role
 * and all users will be treated as regular users.
 */

// Role constants for type safety and maintainability
const USER_ROLES = {
  FARMER: 'farmer',
} as const;

// Development logging helper
function logRedirect(message: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${new Date().toISOString()} - ${message}`);
  }
}

export default clerkMiddleware(async (auth, request) => {
  try {
    const { pathname } = request.nextUrl;

    // CRITICAL: Let Clerk handle its own API routes first
    // Don't interfere with Clerk's internal authentication endpoints
    if (pathname.startsWith('/api/__clerk') || pathname.startsWith('/api/clerk')) {
      return NextResponse.next();
    }

    // Story 2.2.2: Handle POST requests from Clerk's router.refresh()
    // Clerk's __unstable__onBeforeSetActive calls router.refresh() after auth state changes
    // This makes POST requests to the current route to revalidate server components
    // Since page routes only handle GET requests, we catch POSTs here and return 200
    // This prevents 405 Method Not Allowed errors during login/logout
    if (request.method === 'POST' && !pathname.startsWith('/api/')) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const { userId, sessionClaims } = await auth();

    // Skip role-based routing if user is not authenticated
    if (!userId) {
      return NextResponse.next(); // Let Clerk handle auth redirect
    }

    // Extract role from session claims
    // CONFIGURATION REQUIRED: Clerk Dashboard -> Sessions -> Customize session token
    // Add custom claim: name="metadata", value="{{user.public_metadata}}"
    // This exposes user.publicMetadata in the JWT as sessionClaims.metadata
    // Without this config, sessionClaims.metadata will be undefined
    // See: docs/CLERK_SETUP.md for detailed setup instructions
    const role = sessionClaims?.metadata?.role as string | undefined;

    // Role-based routing logic for farmers
    if (role === USER_ROLES.FARMER) {
      // Farmers: redirect /dashboard → /dashboard/farmer
      if (pathname === '/dashboard' || pathname === '/dashboard/') {
        logRedirect(`Redirecting farmer from ${pathname} to /dashboard/farmer`);
        return NextResponse.redirect(new URL('/dashboard/farmer', request.url));
      }

      // Farmers: block /saved-farms
      if (pathname.startsWith('/saved-farms')) {
        logRedirect(`Blocking farmer from ${pathname}, redirecting to /dashboard/farmer`);
        return NextResponse.redirect(new URL('/dashboard/farmer', request.url));
      }
    } else {
      // Regular users: block /dashboard/farmer/*
      if (pathname.startsWith('/dashboard/farmer')) {
        logRedirect(`Blocking regular user from ${pathname}, redirecting to /dashboard`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return NextResponse.next(); // Allow request to proceed
  } catch (error) {
    // Log error in development, fail gracefully in production
    if (process.env.NODE_ENV === 'development') {
      console.error('[Middleware] Role-based routing error:', error);
    }
    // Allow request to proceed if middleware fails
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
