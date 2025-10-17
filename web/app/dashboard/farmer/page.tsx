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
  verification: {
    status: 'Active' | 'Pending';
    missingFields: string[];
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
        {/* Hero Section (Story 2.5) */}
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.firstName || 'Farmer'}!
                </h1>
                <p className="text-lg text-gray-700 mb-4">
                  Managing <strong>{data.farm.name}</strong>
                </p>
                <p className="text-gray-600">
                  Keep your farm information up to date and engage with your subscribers.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                  <a href="/dashboard/farmer/farm-info">
                    <PenSquare className="mr-2 h-4 w-4" />
                    Edit Farm Info
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a
                    href={`/farms/${data.farm.slug}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View My Listing
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Status Card (Story 2.5) */}
        {data.verification.status === 'Pending' && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Farm Verification Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-800 mb-4">
                Your farm listing needs a few more details to be verified. Complete your profile
                to increase visibility and attract more visitors!
              </p>
              <div className="mb-4">
                <p className="font-semibold text-orange-900 mb-2">Missing information:</p>
                <ul className="list-disc list-inside space-y-1 text-orange-800">
                  {data.verification.missingFields.map((field) => (
                    <li key={field} className="capitalize">
                      {field.replace('_', ' ')}
                    </li>
                  ))}
                </ul>
              </div>
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <a href="/dashboard/farmer/farm-info">
                  <PenSquare className="mr-2 h-4 w-4" />
                  Complete Profile
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {data.verification.status === 'Active' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 rounded-full p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Farm Verified</h3>
                  <p className="text-green-800">Your farm profile is complete and verified!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto py-4" asChild>
                <a href="/dashboard/farmer/farm-info" className="flex flex-col items-center gap-2">
                  <PenSquare className="h-5 w-5" />
                  <span className="text-sm font-medium">Edit Farm Info</span>
                </a>
              </Button>
              <Button variant="outline" className="h-auto py-4" disabled title="Coming in Story 2.6">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-5 w-5" />
                  <span className="text-sm font-medium">Upload Images</span>
                </div>
              </Button>
              <Button variant="outline" className="h-auto py-4" disabled title="Coming in Story 2.8">
                <div className="flex flex-col items-center gap-2">
                  <Send className="h-5 w-5" />
                  <span className="text-sm font-medium">Send Broadcast</span>
                </div>
              </Button>
              <Button variant="outline" className="h-auto py-4" asChild>
                <a
                  href={`/farms/${data.farm.slug}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2"
                >
                  <ExternalLink className="h-5 w-5" />
                  <span className="text-sm font-medium">View Listing</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

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
