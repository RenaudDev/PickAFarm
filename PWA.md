# Progressive Web App (PWA) Implementation Plan for PickAFarm

## 🎯 Goal
Transform PickAFarm into a fully functional PWA that users can install on their devices, use offline, and receive push notifications about farm updates.

---

## 📋 Phase 1: Web App Manifest

### 1.1 Create/Update Manifest File
**File:** `/web/public/manifest.json`

```json
{
  "name": "PickAFarm - Find U-Pick Farms Near You",
  "short_name": "PickAFarm",
  "description": "Discover local farms for apple picking, pumpkin patches, Christmas trees, and more!",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2d5016",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Find Farms Near Me",
      "short_name": "Near Me",
      "description": "Find farms based on your location",
      "url": "/map",
      "icons": [{ "src": "/icons/map-icon.png", "sizes": "96x96" }]
    },
    {
      "name": "Saved Farms",
      "short_name": "Saved",
      "description": "View your saved farms",
      "url": "/saved-farms",
      "icons": [{ "src": "/icons/heart-icon.png", "sizes": "96x96" }]
    },
    {
      "name": "Christmas Tree Farms",
      "short_name": "Trees",
      "description": "Find Christmas tree farms",
      "url": "/christmas-tree-farms",
      "icons": [{ "src": "/icons/tree-icon.png", "sizes": "96x96" }]
    }
  ],
  "categories": ["lifestyle", "travel", "food"],
  "screenshots": [
    {
      "src": "/screenshots/home-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/map-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/home-desktop.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
```

### 1.2 Link Manifest in Next.js
**File:** `/web/app/layout.tsx`

Add to metadata:
```typescript
export const metadata: Metadata = {
  manifest: '/manifest.json',
  // ... existing metadata
}
```

### 1.3 Generate Icons
**Tools needed:**
- Use https://realfavicongenerator.net/ OR
- Use https://www.pwabuilder.com/imageGenerator

**Sizes needed:**
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

**Maskable icons:** Create icons with safe zone for Android adaptive icons

---

## 📋 Phase 2: Service Worker

### 2.1 Install Next.js PWA Plugin
```bash
npm install next-pwa
npm install --save-dev webpack
```

### 2.2 Configure Next.js with PWA
**File:** `/web/next.config.mjs`

```javascript
import withPWA from 'next-pwa';

const nextConfig = {
  // ... existing config
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    {
      urlPattern: /^https:\/\/pickafarm-api\..*\.workers\.dev\/api\/farms/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-farms',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 // 1 day
        },
        networkTimeoutSeconds: 10
      }
    },
    {
      urlPattern: /\.(?:jpg|jpeg|png|webp|svg|gif)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    {
      urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'google-maps',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
        }
      }
    }
  ]
})(nextConfig);
```

### 2.3 Custom Service Worker (Optional)
**File:** `/web/public/sw.js` (for advanced features)

```javascript
// Custom service worker for advanced offline features
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Listen for push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.farmId
    },
    actions: [
      {
        action: 'view',
        title: 'View Farm'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(`/farms/${event.notification.data.primaryKey}`)
    );
  }
});
```

---

## 📋 Phase 3: Offline Functionality

### 3.1 Offline Fallback Page
**File:** `/web/app/offline/page.tsx`

```typescript
export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">You're Offline</h1>
      <p className="text-muted-foreground mb-8">
        Check your internet connection and try again
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-primary text-white rounded-lg"
      >
        Retry
      </button>
    </div>
  );
}
```

### 3.2 Add Offline Indicator
**File:** `/web/components/offline-indicator.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-yellow-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-3 z-50">
      <WifiOff className="w-5 h-5" />
      <div>
        <p className="font-semibold">You're offline</p>
        <p className="text-sm">Some features may be limited</p>
      </div>
    </div>
  )
}
```

### 3.3 Cache Critical Data
**File:** `/web/lib/offline-cache.ts`

```typescript
export async function cacheCriticalData() {
  if ('caches' in window) {
    const cache = await caches.open('critical-data-v1');
    
    await cache.addAll([
      '/data/farms.json',
      '/data/categories.json',
      '/data/locations.json',
      '/',
      '/map',
      '/saved-farms'
    ]);
  }
}
```

---

## 📋 Phase 4: Install Prompt

### 4.1 Create Install Prompt Component
**File:** `/web/components/install-prompt.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Don't show if already dismissed or installed
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches
      
      if (!dismissed && !isInstalled) {
        setTimeout(() => setShowPrompt(true), 3000) // Show after 3 seconds
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('PWA installed')
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true')
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border shadow-lg rounded-lg p-4 z-50">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <Download className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Install PickAFarm</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Get quick access and receive notifications about your saved farms
          </p>
          <Button onClick={handleInstall} size="sm" className="w-full">
            Install App
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### 4.2 Add to Root Layout
**File:** `/web/app/layout.tsx`

```typescript
import { InstallPrompt } from '@/components/install-prompt'
import { OfflineIndicator } from '@/components/offline-indicator'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <InstallPrompt />
        <OfflineIndicator />
      </body>
    </html>
  )
}
```

---

## 📋 Phase 5: Push Notifications

### 5.1 Add Web Push Notifications Setup
**File:** `/web/lib/push-notifications.ts`

```typescript
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })

    // Send subscription to backend
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    })

    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    return null
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
```

### 5.2 Add Push Notification Prompt
**File:** `/web/components/notification-prompt.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { subscribeToPushNotifications } from '@/lib/push-notifications'

export function NotificationPrompt() {
  const [dismissed, setDismissed] = useState(false)
  const [granted, setGranted] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  )

  if (dismissed || granted) return null

  const handleEnable = async () => {
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      await subscribeToPushNotifications()
      setGranted(true)
    } else {
      setDismissed(true)
    }
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-blue-500" />
        <div className="flex-1">
          <p className="font-semibold">Enable Notifications</p>
          <p className="text-sm text-muted-foreground">
            Get notified when your saved farms update their opening dates
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleEnable} size="sm">
            Enable
          </Button>
          <Button onClick={() => setDismissed(true)} variant="ghost" size="sm">
            Not Now
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### 5.3 Backend: Generate VAPID Keys
```bash
npx web-push generate-vapid-keys
```

Save keys to environment variables:
- `VAPID_PUBLIC_KEY` (add to `.env.local`)
- `VAPID_PRIVATE_KEY` (add to Cloudflare Workers secrets)

### 5.4 Backend: Update Notification Endpoint
**File:** `/src/index.js` (Cloudflare Worker)

Add endpoint to send push notifications:
```javascript
async function sendPushNotification(subscription, payload) {
  const webpush = require('web-push')
  
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  )
  
  await webpush.sendNotification(subscription, JSON.stringify(payload))
}
```

---

## 📋 Phase 6: Enhanced Features

### 6.1 Add to Home Screen Badge (iOS)
**File:** `/web/app/layout.tsx`

```typescript
export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PickAFarm'
  }
}
```

### 6.2 Share Target API
Add to manifest.json:
```json
{
  "share_target": {
    "action": "/share",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

### 6.3 Background Sync (for offline saves)
**File:** `/web/lib/background-sync.ts`

```typescript
export async function registerBackgroundSync(tag: string, data: any) {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready
    
    // Store data in IndexedDB
    await storeOfflineData(tag, data)
    
    // Register sync
    await registration.sync.register(tag)
  }
}
```

---

## 📋 Phase 7: Testing & Optimization

### 7.1 PWA Testing Checklist
- [ ] Lighthouse PWA audit (score > 90)
- [ ] Test offline functionality
- [ ] Test install prompt on mobile/desktop
- [ ] Test service worker updates
- [ ] Test push notifications
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test on desktop Chrome/Edge/Firefox

### 7.2 Performance Optimization
- [ ] Optimize icon sizes (use WebP where possible)
- [ ] Minimize service worker bundle size
- [ ] Implement lazy loading for non-critical features
- [ ] Use Cache API efficiently
- [ ] Monitor cache storage limits

### 7.3 Lighthouse Audit Commands
```bash
# Run Lighthouse
npx lighthouse https://pickafarm.com --view

# PWA specific
npx lighthouse https://pickafarm.com --only-categories=pwa --view
```

---

## 📋 Phase 8: Deployment

### 8.1 Update Cloudflare Pages Headers
**File:** `/web/public/_headers`

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/manifest.json
  Content-Type: application/manifest+json
  Cache-Control: public, max-age=31536000

/sw.js
  Content-Type: application/javascript
  Cache-Control: public, max-age=0, must-revalidate

/icons/*
  Cache-Control: public, max-age=31536000, immutable
```

### 8.2 Environment Variables
Add to Cloudflare Pages:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

Add to Cloudflare Workers:
- `VAPID_PRIVATE_KEY`

### 8.3 Post-Deployment Verification
```bash
# Check manifest
curl https://pickafarm.com/manifest.json

# Check service worker
curl https://pickafarm.com/sw.js

# Check icons
curl -I https://pickafarm.com/icons/icon-512x512.png
```

---

## 📋 Phase 9: Analytics & Monitoring

### 9.1 Track PWA Metrics
```typescript
// Track install events
window.addEventListener('appinstalled', () => {
  console.log('PWA installed')
  // Send to analytics
})

// Track standalone mode
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('Running as PWA')
}
```

### 9.2 Monitor Service Worker
```typescript
navigator.serviceWorker.addEventListener('controllerchange', () => {
  console.log('Service worker updated')
})
```

---

## 🎯 Success Criteria

- ✅ PWA installable on all major platforms
- ✅ Lighthouse PWA score > 90
- ✅ Offline functionality works
- ✅ Push notifications working
- ✅ Install prompt shows appropriately
- ✅ Service worker caches assets efficiently
- ✅ App loads in < 3 seconds on 3G

---

## 📚 Resources

- [Next.js PWA Documentation](https://github.com/shadowwalker/next-pwa)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox (Google)](https://developers.google.com/web/tools/workbox)

---

## 🚀 Implementation Timeline

**Week 1:**
- Phase 1: Web App Manifest
- Phase 2: Service Worker Setup
- Generate all icons

**Week 2:**
- Phase 3: Offline Functionality
- Phase 4: Install Prompt
- Initial testing

**Week 3:**
- Phase 5: Push Notifications
- Backend integration
- Notification testing

**Week 4:**
- Phase 6: Enhanced Features
- Phase 7: Testing & Optimization
- Phase 8: Deployment
- Phase 9: Analytics

---

## 📝 Notes

- **iOS Limitations:** iOS Safari has limited PWA support (no background sync, limited storage)
- **Testing:** Test on real devices, not just simulators
- **Updates:** Service worker updates require careful cache versioning
- **Storage:** Monitor cache sizes to stay within browser limits
- **HTTPS Required:** PWA requires HTTPS (already have with Cloudflare)
