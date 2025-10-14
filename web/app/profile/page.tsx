'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { useUser } from '@clerk/nextjs';
import { FarmNavbar } from '@/components/farm-navbar';
import { Button } from '@/components/ui/button';
import { UserCircle, Mail, Calendar, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const { user } = useUser();
  const [savedFarmsCount, setSavedFarmsCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`saved-farms-${user.id}`);
      if (saved) {
        const farms = JSON.parse(saved);
        setSavedFarmsCount(farms.length);
      }
    }
  }, [user?.id]);

  return (
    <ProtectedRoute>
      <FarmNavbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Your Profile</h1>
              <p className="text-muted-foreground mt-2">Manage your account information</p>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || 'User'}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-16 h-16 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {user?.fullName || 'User'}
                </h2>
                <p className="text-muted-foreground">@{user?.username || user?.id?.slice(0, 8)}</p>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </div>
                  <p className="text-foreground font-medium">
                    {user?.primaryEmailAddress?.emailAddress || 'Not provided'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    Member Since
                  </div>
                  <p className="text-foreground font-medium">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <UserCircle className="w-4 h-4 mr-2" />
                    First Name
                  </div>
                  <p className="text-foreground font-medium">{user?.firstName || 'Not provided'}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Last Name
                  </div>
                  <p className="text-foreground font-medium">{user?.lastName || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{savedFarmsCount}</div>
              <p className="text-sm text-muted-foreground">Saved Farms</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">0</div>
              <p className="text-sm text-muted-foreground">Reviews Written</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">0</div>
              <p className="text-sm text-muted-foreground">Visits Logged</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href="/saved-farms">View Saved Farms</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/">Browse Farms</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
