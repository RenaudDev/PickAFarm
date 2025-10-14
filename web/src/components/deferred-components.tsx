'use client';

import dynamic from 'next/dynamic';

// Lazy load ALL non-critical background components to improve LCP
// These components don't render anything visible and only run side effects

const TrulyDeferredScripts = dynamic(
  () =>
    import('@/components/truly-deferred-scripts').then((mod) => ({
      default: mod.TrulyDeferredScripts,
    })),
  { ssr: false }
);

const LocationDetector = dynamic(
  () => import('@/components/location-detector').then((mod) => ({ default: mod.LocationDetector })),
  { ssr: false }
);

const ClerkRedirectHandler = dynamic(
  () =>
    import('@/components/clerk-redirect-handler').then((mod) => ({
      default: mod.ClerkRedirectHandler,
    })),
  { ssr: false }
);

/**
 * Wrapper component that lazy-loads non-critical background components
 * This reduces the initial JavaScript bundle size and improves LCP
 */
export function DeferredComponents() {
  return (
    <>
      <TrulyDeferredScripts />
      <LocationDetector />
      <ClerkRedirectHandler />
    </>
  );
}
