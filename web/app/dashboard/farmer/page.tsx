/**
 * Farmer Dashboard Overview Page
 * Story 2.4: Farmer Dashboard Layout & Overview Page
 *
 * Route: /dashboard/farmer
 *
 * Displays key metrics, chart, and quick actions for authenticated farmers.
 * Replaces placeholder page from Story 2.2.
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Users, Eye, Star, Calendar, ExternalLink, PenSquare, Upload, Send } from 'lucide-react';
import DashboardLayout from '@/components/farmer/dashboard-layout';

// Lazy-load chart component (Recharts is ~200KB, load only when needed)
const PageViewsChart = dynamic(() => import('@/components/farmer/page-views-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Chart requires DOM
});

interface DashboardData {
  farm: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    status: string;
    rating: number;
    reviewCount: number;
  };
  metrics: {
    subscribers: number;
    pageViews: number;
    rating: number;
    daysUntilOpening: number | null;
  };
  recentActivity: {
    broadcasts: number;
    lastBroadcastDate: string | null;
    newSubscribersThisWeek: number;
  };
  chartData: Array<{ date: string; views: number }>;
}

export default function FarmerDashboardPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/farmer/overview`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [getToken]);

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Empty state (no data)
  if (!data) {
    return (
      <DashboardLayout>
        <EmptyState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'Farmer'}!
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with {data.farm.name}</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Subscribers"
            value={data.metrics.subscribers}
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Page Views"
            value={data.metrics.pageViews || 'N/A'}
            icon={Eye}
            color="green"
            subtitle={data.metrics.pageViews === 0 ? 'Coming in Story 2.12' : undefined}
          />
          <MetricCard
            title="Average Rating"
            value={data.metrics.rating ? `${data.metrics.rating} ⭐` : 'No reviews yet'}
            icon={Star}
            color="yellow"
          />
          <MetricCard
            title="Days Until Opening"
            value={
              data.metrics.daysUntilOpening !== null ? data.metrics.daysUntilOpening : 'Not set'
            }
            icon={Calendar}
            color="purple"
          />
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Page Views (Last 30 Days)</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Mock data for development (real analytics coming in Story 2.12)
            </p>
          </CardHeader>
          <CardContent>
            {data.chartData && data.chartData.length > 0 ? (
              <PageViewsChart data={data.chartData} />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <p>No chart data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Button variant="outline" asChild>
                <a
                  href={`/farms/${data.farm.slug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View My Listing
                </a>
              </Button>
              <Button variant="outline" disabled title="Coming in Story 2.5">
                <PenSquare className="mr-2 h-4 w-4" />
                Edit Farm Info
              </Button>
              <Button variant="outline" disabled title="Coming in Story 2.6">
                <Upload className="mr-2 h-4 w-4" />
                Upload Images
              </Button>
              <Button variant="outline" disabled title="Coming in Story 2.8">
                <Send className="mr-2 h-4 w-4" />
                Send Broadcast
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        {data.recentActivity.newSubscribersThisWeek > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <span className="font-semibold text-green-600">
                    {data.recentActivity.newSubscribersThisWeek}
                  </span>{' '}
                  new subscriber{data.recentActivity.newSubscribersThisWeek !== 1 ? 's' : ''} this
                  week
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  subtitle?: string;
}

function MetricCard({ title, value, icon: Icon, color, subtitle }: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">🌾</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome to Your Dashboard!</h2>
        <p className="text-gray-600 max-w-md">
          Complete your farm profile to start managing your listing and engaging with customers.
        </p>
        <Button className="mt-6" disabled>
          Complete Your Profile (Coming in Story 2.5)
        </Button>
      </div>
    </div>
  );
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
      <Skeleton className="h-48" />
    </div>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-80 w-full" />;
}
