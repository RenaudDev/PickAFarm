'use client';

import { StatCard } from '@/components/dashboard/stat-card';
import { ProgressBar } from '@/components/dashboard/progress-bar';
import { TaskChecklistItem } from '@/components/dashboard/task-checklist-item';
import { ActivityFeedItem } from '@/components/dashboard/activity-feed-item';
import { Eye, Users, Heart, TrendingUp } from 'lucide-react';

/**
 * Test page for dashboard components
 * 
 * Visit: http://localhost:3000/test-dashboard
 */

export default function TestDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Dashboard Components Test
          </h1>
          <p className="text-gray-600">
            Testing all foundation components for the Farmer Dashboard redesign
          </p>
        </div>

        {/* StatCard Tests */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">StatCard Component</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Basic numeric stat */}
            <StatCard 
              title="Subscribers" 
              value={34}
              icon={Users}
            />
            
            {/* With circular progress */}
            <StatCard 
              title="Profile Completion" 
              value="72%" 
              progressPercent={72} 
            />
            
            {/* With trend (up) */}
            <StatCard 
              title="Views" 
              value={1247} 
              icon={Eye}
              trend={{ value: "+12%", direction: "up" }} 
            />
            
            {/* With trend (down) */}
            <StatCard 
              title="Engagement" 
              value={34} 
              icon={Heart}
              trend={{ value: "-5%", direction: "down" }} 
            />
            
            {/* With status: Active */}
            <StatCard 
              title="Verification" 
              value="Active" 
              status="Active" 
            />
            
            {/* With status: Pending */}
            <StatCard 
              title="Verification" 
              value="Pending" 
              status="Pending" 
            />
            
            {/* With status: Suspended */}
            <StatCard 
              title="Verification" 
              value="Suspended" 
              status="Suspended" 
            />
            
            {/* Clickable */}
            <StatCard 
              title="Total Views" 
              value={1247}
              icon={TrendingUp}
              onClick={() => alert('StatCard clicked!')}
            />
            
          </div>
        </section>

        {/* ProgressBar Tests */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">ProgressBar Component</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            
            <div>
              <p className="text-sm text-gray-600 mb-2">0% Progress</p>
              <ProgressBar percentage={0} />
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">25% Progress</p>
              <ProgressBar percentage={25} />
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">50% Progress</p>
              <ProgressBar percentage={50} />
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">75% Progress</p>
              <ProgressBar percentage={75} />
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">100% Progress</p>
              <ProgressBar percentage={100} />
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Custom Label</p>
              <ProgressBar percentage={72} label="Profile Completion" />
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">No Label</p>
              <ProgressBar percentage={72} showLabel={false} />
            </div>
            
          </div>
        </section>

        {/* TaskChecklistItem Tests */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">TaskChecklistItem Component</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            
            {/* Completed task */}
            <TaskChecklistItem
              id="task-1"
              title="Add farm description"
              description="Sets the foundation for your listing"
              completed={true}
            />
            
            {/* Incomplete task with button */}
            <TaskChecklistItem
              id="task-2"
              title="Upload at least 5 high-quality photos"
              description="Farms with 5+ photos get 40% more views"
              completed={false}
              quickWin={true}
              badge="Quick Win"
              onComplete={() => alert('Complete task clicked!')}
            />
            
            {/* Incomplete task without button */}
            <TaskChecklistItem
              id="task-3"
              title="Set your operating hours"
              description="Helps visitors plan their trip"
              completed={false}
            />
            
            {/* Completed with badge */}
            <TaskChecklistItem
              id="task-4"
              title="Add contact information"
              description="Phone, email, or website"
              completed={true}
              badge="Essential"
            />
            
            {/* Quick Win badge */}
            <TaskChecklistItem
              id="task-5"
              title="Add amenities (parking, restrooms, etc.)"
              description="Boosts your listing in search results"
              completed={false}
              quickWin={true}
              badge="Quick Win"
              onComplete={() => alert('Amenities task clicked!')}
            />
            
          </div>
        </section>

        {/* ActivityFeedItem Tests */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">ActivityFeedItem Component</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            
            {/* With icon */}
            <ActivityFeedItem
              id="1"
              title="12 new profile views"
              timestamp="2 hours ago"
              icon={Eye}
            />
            
            <ActivityFeedItem
              id="2"
              title="3 new subscribers"
              timestamp="Yesterday"
              icon={Users}
            />
            
            <ActivityFeedItem
              id="3"
              title="2 users saved your farm"
              timestamp="2 days ago"
              icon={Heart}
            />
            
            {/* Without icon */}
            <ActivityFeedItem
              id="4"
              title="Profile viewed from search results"
              timestamp="3 days ago"
            />
            
            {/* Clickable */}
            <ActivityFeedItem
              id="5"
              title="View full analytics report"
              timestamp="Updated today"
              icon={TrendingUp}
              onClick={() => alert('Activity clicked!')}
            />
            
          </div>
        </section>

        {/* Loading States */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Loading States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Loading..." value={undefined} />
            <StatCard title="Loading..." value={undefined} />
            <StatCard title="Loading..." value={undefined} />
            <StatCard title="Loading..." value={undefined} />
          </div>
        </section>

        {/* Interactive Demo */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Interactive Demo</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Keyboard Navigation Test</h3>
            <p className="text-sm text-gray-600 mb-4">
              Use <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">Tab</kbd> to navigate, 
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs ml-2">Enter</kbd> or 
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs ml-2">Space</kbd> to activate
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              <StatCard 
                title="Click Me" 
                value={1}
                onClick={() => alert('Clicked via mouse or keyboard!')}
              />
              <StatCard 
                title="Click Me Too" 
                value={2}
                onClick={() => alert('Another clickable card!')}
              />
              <StatCard 
                title="Me Three" 
                value={3}
                onClick={() => alert('Keyboard accessible!')}
              />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

