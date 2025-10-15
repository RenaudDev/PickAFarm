import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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
    const { userId, sessionClaims } = await auth();
    const { pathname } = request.nextUrl;

    // Skip role-based routing if user is not authenticated
    if (!userId) {
      return NextResponse.next(); // Let Clerk handle auth redirect
    }

    // Extract role from session claims
    const unsafeMetadata = sessionClaims?.unsafeMetadata as { role?: string } | undefined;
    const role = unsafeMetadata?.role;

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
