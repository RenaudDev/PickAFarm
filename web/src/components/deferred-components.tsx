"use client"

import dynamic from 'next/dynamic';

// Lazy load non-critical background components to improve LCP
// These components don't render anything visible and only run side effects
const LocationDetector = dynamic(
  () => import('@/components/location-detector').then(mod => ({ default: mod.LocationDetector })),
  { ssr: false }
);

const ClerkRedirectHandler = dynamic(
  () => import('@/components/clerk-redirect-handler').then(mod => ({ default: mod.ClerkRedirectHandler })),
  { ssr: false }
);

/**
 * Wrapper component that lazy-loads non-critical background components
 * This reduces the initial JavaScript bundle size and improves LCP
 */
export function DeferredComponents() {
  return (
    <>
      <LocationDetector />
      <ClerkRedirectHandler />
    </>
  );
}
