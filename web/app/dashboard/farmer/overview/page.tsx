'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/farmer/dashboard-layout';
import { StatCard } from '@/components/dashboard/stat-card';
import { ProgressBar } from '@/components/dashboard/progress-bar';
import { TaskChecklistItem } from '@/components/dashboard/task-checklist-item';
import { ActivityFeedItem } from '@/components/dashboard/activity-feed-item';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Users, 
  CheckCircle, 
  Upload, 
  Sparkles, 
  TrendingUp,
  FileText,
  Clock,
  Mail,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Farmer Dashboard Overview Page
 * 
 * Shows high-level dashboard with:
 * - Stats cards (subscribers, views, completion, verification)
 * - Quick actions (edit info, view listing, etc.)
 * - Profile completion progress
 * - Task checklist for onboarding
 * - Recent activity feed
 * - Boost visibility widget
 */

interface DashboardStats {
  profileCompletion: {
    percentage: number;
    completedTasks: number;
    totalTasks: number;
  };
  verification: {
    status: 'Active' | 'Pending' | 'Suspended';
    missingFields: string[] | null;
  };
  views: {
    total: number;
    trend: string | null;
    period: string;
  };
  subscribers: {
    total: number;
    period: string;
  };
}

export default function FarmerDashboardOverviewPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard stats on mount
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      
      if (!token) {
        router.push('/sign-in');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';

      const response = await fetch(`${apiUrl}/api/farmer/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/sign-in');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch dashboard stats: ${errorData.error || response.statusText || `Server responded with ${response.status}`}`);
      }

      const data = await response.json();
      setStats(data);
      
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }

  // Task completion handlers
  const handleCompleteTask = (taskId: string) => {
    switch (taskId) {
      case 'description':
      case 'hours':
      case 'contact':
      case 'amenities':
        router.push('/dashboard/farmer/information');
        break;
      case 'photos':
        router.push('/dashboard/farmer/information#media');
        break;
      default:
        router.push('/dashboard/farmer/information');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">
            Manage your farm listing and track your performance
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <StatCard key={i} title="Loading..." value={undefined} />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <Button onClick={fetchDashboardStats} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Main Content */}
        {stats && !loading && (
          <>
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              
              {/* Profile Completion */}
              <StatCard
                title="Profile Completion"
                value={`${stats.profileCompletion.percentage}%`}
                progressPercent={stats.profileCompletion.percentage}
                icon={CheckCircle}
                onClick={() => router.push('/dashboard/farmer/information')}
                className="bg-green-50"
              />
              
              {/* Verification Status */}
              <StatCard
                title="Verification Status"
                value={stats.verification.status}
                status={stats.verification.status}
                className="bg-green-50"
              />
              
              {/* Views */}
              <StatCard
                title="Views"
                value={stats.views.total}
                icon={Eye}
                trend={stats.views.trend ? {
                  value: stats.views.trend,
                  direction: stats.views.trend.startsWith('+') ? 'up' : 'down'
                } : undefined}
                className="bg-green-50"
              />
              
              {/* Subscribers */}
              <StatCard
                title="Subscribers"
                value={stats.subscribers.total}
                icon={Users}
                className="bg-green-50"
              />
              
            </div>

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column (2/3 width) */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Complete Your Listing Widget */}
                {stats.profileCompletion.percentage < 100 && (
                  <section className="bg-green-50 border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Complete Your Listing
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {stats.profileCompletion.completedTasks} of {stats.profileCompletion.totalTasks} tasks complete
                        </p>
                      </div>
                      <Sparkles className="h-6 w-6 text-yellow-500" />
                    </div>
                    
                    <ProgressBar 
                      percentage={stats.profileCompletion.percentage}
                      className="mb-6"
                    />
                    
                    <div>
                      <TaskChecklistItem
                        id="description"
                        title="Add a detailed farm description"
                        description="Tell visitors what makes your farm special"
                        completed={!stats.verification.missingFields?.includes('description')}
                        quickWin={stats.verification.missingFields?.includes('description')}
                        badge={stats.verification.missingFields?.includes('description') ? "Quick Win" : undefined}
                        onComplete={() => handleCompleteTask('description')}
                      />
                      
                      <TaskChecklistItem
                        id="photos"
                        title="Upload high-quality photos"
                        description="Farms with great photos get 40% more views"
                        completed={stats.profileCompletion.percentage >= 40} // Proxy for photos
                        quickWin={stats.profileCompletion.percentage < 40}
                        badge={stats.profileCompletion.percentage < 40 ? "High Impact" : undefined}
                        onComplete={() => handleCompleteTask('photos')}
                      />
                      
                      <TaskChecklistItem
                        id="hours"
                        title="Set your operating hours"
                        description="Helps visitors plan their trip"
                        completed={!stats.verification.missingFields?.includes('operating_hours')}
                        onComplete={() => handleCompleteTask('hours')}
                      />
                      
                      <TaskChecklistItem
                        id="contact"
                        title="Add contact information"
                        description="Phone, email, or website required"
                        completed={!stats.verification.missingFields?.includes('contact_info')}
                        onComplete={() => handleCompleteTask('contact')}
                      />
                      
                      <TaskChecklistItem
                        id="amenities"
                        title="List your amenities"
                        description="Parking, restrooms, wheelchair access, etc."
                        completed={stats.profileCompletion.percentage >= 80} // Proxy for amenities
                        quickWin={stats.profileCompletion.percentage < 80}
                        badge={stats.profileCompletion.percentage < 80 ? "Quick Win" : undefined}
                        onComplete={() => handleCompleteTask('amenities')}
                      />
                    </div>
                  </section>
                )}

                {/* Profile Complete - Boost Visibility */}
                {stats.profileCompletion.percentage === 100 && (
                  <section className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-green-100 rounded-full p-3">
                        <Sparkles className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                          🎉 Profile Complete!
                        </h2>
                        <p className="text-gray-700 mb-4">
                          Your listing is fully set up. Now let's boost your visibility!
                        </p>
                        <div className="space-y-3">
                          <TaskChecklistItem
                            id="share"
                            title="Share your farm on social media"
                            description="Get the word out to your community"
                            completed={false}
                            quickWin={true}
                            badge="Quick Win"
                            onComplete={() => toast.info('Share feature coming soon!')}
                          />
                          <TaskChecklistItem
                            id="email"
                            title="Send email to your subscribers"
                            description={`Reach ${stats.subscribers.total} subscriber${stats.subscribers.total !== 1 ? 's' : ''}`}
                            completed={false}
                            onComplete={() => router.push('/dashboard/farmer/broadcast')}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Quick Actions */}
                <section className="bg-green-50 border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => router.push('/dashboard/farmer/information')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Edit Information
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => window.open('/farms/your-farm-slug', '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Listing
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => router.push('/dashboard/farmer/broadcast')}
                      disabled
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Broadcast
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => toast.info('Share feature coming soon!')}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Farm
                    </Button>
                  </div>
                </section>
              </div>

              {/* Right Column (1/3 width) */}
              <div className="space-y-8">
                
                {/* Farm Media Upload Widget */}
                <section className="bg-green-50 border border-gray-200 rounded-lg p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Farm Photos
                  </h2>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-3">
                        Add logo and cover photos
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push('/dashboard/farmer/information#media')}
                      >
                        Upload Photos
                      </Button>
                    </div>
                  </div>
                </section>

                {/* Recent Activity */}
                <section className="bg-green-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">
                      Recent Activity
                    </h2>
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  {stats.views.total > 0 || stats.subscribers.total > 0 ? (
                    <div className="space-y-1">
                      {stats.views.total > 0 && (
                        <ActivityFeedItem
                          id="views"
                          title={`${stats.views.total} profile views`}
                          timestamp={stats.views.period}
                          icon={Eye}
                        />
                      )}
                      {stats.subscribers.total > 0 && (
                        <ActivityFeedItem
                          id="subscribers"
                          title={`${stats.subscribers.total} subscriber${stats.subscribers.total !== 1 ? 's' : ''}`}
                          timestamp={stats.subscribers.period}
                          icon={Users}
                        />
                      )}
                      {stats.profileCompletion.percentage === 100 && (
                        <ActivityFeedItem
                          id="complete"
                          title="Profile completed"
                          timestamp="Recently"
                          icon={CheckCircle}
                        />
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No activity yet. Complete your profile to start attracting visitors!
                    </p>
                  )}
                </section>

                {/* Help & Support */}
                <section className="bg-green-50 border border-gray-200 rounded-lg p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    Need Help?
                  </h2>
                  <p className="text-sm text-gray-700 mb-4">
                    Check out our guides or contact support
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full"
                    onClick={() => toast.info('Help center coming soon!')}
                  >
                    View Help Center
                  </Button>
                </section>

              </div>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}

