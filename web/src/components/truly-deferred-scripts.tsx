'use client';

import { useEffect } from 'react';

/**
 * Scripts that should load AFTER LCP using requestIdleCallback
 * This ensures they don't block initial page render
 */
export function TrulyDeferredScripts() {
  useEffect(() => {
    // Only run in browser after mount
    if (typeof window === 'undefined') return;

    // Use requestIdleCallback or setTimeout fallback
    const defer = window.requestIdleCallback || window.setTimeout;

    defer(() => {
      // Service Worker disabled - Cloudflare Pages handles caching
      // If you need SW in the future, ensure sw.js is properly deployed
      // Any other heavy third-party scripts can be added here
      // Example: Google Analytics, tracking pixels, etc.
    });
  }, []);

  return null;
}
