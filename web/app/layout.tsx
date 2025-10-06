// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { DeferredComponents } from '@/components/deferred-components';
import { GeistSans } from 'geist/font/sans';
import "./globals.css";

export const metadata: Metadata = {
  title: "PickAFarm",
  description: "Find local farms and fresh produce",
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  manifest: '/site.webmanifest'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={GeistSans.className}>
        <head>
          {/* Resource hints for performance */}
          <link rel="preconnect" href="https://clerk.pickafarm.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://admin.pickafarm.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://maps.googleapis.com" />
          <link rel="dns-prefetch" href="https://ipapi.co" />
          <link rel="dns-prefetch" href="https://stats.g.doubleclick.net" />
        </head>
        <body>
          <DeferredComponents />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}