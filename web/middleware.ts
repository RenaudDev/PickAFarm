import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware((authObject, request) => {
  const { userId, sessionClaims } = authObject;
  const { pathname } = request.nextUrl;

  // Skip role-based routing if user is not authenticated
  if (!userId) {
    return NextResponse.next(); // Let Clerk handle auth redirect
  }

  // Extract role from session claims
  const role = sessionClaims?.unsafeMetadata?.role as string | undefined;

  // Role-based routing logic for farmers
  if (role === 'farmer') {
    // Farmers: redirect /dashboard → /dashboard/farmer
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      console.log(`[Middleware] ${new Date().toISOString()} - Redirecting farmer from ${pathname} to /dashboard/farmer`);
      return NextResponse.redirect(new URL('/dashboard/farmer', request.url));
    }

    // Farmers: block /saved-farms
    if (pathname.startsWith('/saved-farms')) {
      console.log(`[Middleware] ${new Date().toISOString()} - Blocking farmer from ${pathname}, redirecting to /dashboard/farmer`);
      return NextResponse.redirect(new URL('/dashboard/farmer', request.url));
    }
  } else {
    // Regular users: block /dashboard/farmer/*
    if (pathname.startsWith('/dashboard/farmer')) {
      console.log(`[Middleware] ${new Date().toISOString()} - Blocking regular user from ${pathname}, redirecting to /dashboard`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next(); // Allow request to proceed
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
