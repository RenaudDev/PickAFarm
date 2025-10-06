"use client"

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
    const defer = (window.requestIdleCallback || window.setTimeout);

    defer(() => {
      // Defer Service Worker registration
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      }

      // Any other heavy third-party scripts can be added here
      // Example: Google Analytics, tracking pixels, etc.
    });
  }, []);

  return null;
}
