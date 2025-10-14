import type { ReactNode } from 'react';
import FarmNavbar from './farm-navbar';
import FarmFooter from './farm-footer';

interface StaticPageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  lastUpdated?: string;
}

export default function StaticPageLayout({
  children,
  title,
  description,
  lastUpdated,
}: StaticPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <FarmNavbar />

      <main className="mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">{title}</h1>
          {description && (
            <p className="text-xl text-muted-foreground text-pretty">{description}</p>
          )}
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-4">Last updated: {lastUpdated}</p>
          )}
        </div>

        <div className="prose prose-lg max-w-none">{children}</div>
      </main>

      <FarmFooter />
    </div>
  );
}
