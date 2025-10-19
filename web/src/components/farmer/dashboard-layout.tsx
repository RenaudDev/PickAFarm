/**
 * Farmer Dashboard Layout Component
 *
 * Provides layout wrapper for farmer dashboard pages with:
 * - Standard site navbar at the top
 * - Horizontal tabs for navigation
 * - Standard page width container
 */

'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import FarmNavbar from '@/components/farm-navbar';
import { cn } from '@/lib/utils';
import {
  FileText,
  Send,
  TrendingUp,
  BarChart3
} from 'lucide-react';

const tabs = [
  {
    name: 'Information',
    href: '/dashboard/farmer',
    icon: FileText,
    description: 'Manage your farm information'
  },
  {
    name: 'Broadcast',
    href: '/dashboard/farmer/broadcasts',
    icon: Send,
    description: 'Send updates to subscribers',
    disabled: true
  },
  {
    name: 'Marketing',
    href: '/dashboard/farmer/marketing',
    icon: TrendingUp,
    description: 'Promote your farm',
    disabled: true
  },
  {
    name: 'Analytics',
    href: '/dashboard/farmer/analytics',
    icon: BarChart3,
    description: 'View your farm analytics',
    disabled: true
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleTabClick = (href: string, disabled?: boolean) => {
    if (!disabled) {
      router.push(href);
    }
  };

  return (
    <>
      {/* Standard Site Navbar */}
      <FarmNavbar />

      {/* Dashboard Content with Standard Width */}
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your farm listing and connect with customers</p>
          </div>

          {/* Horizontal Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = pathname === tab.href;

                  return (
                    <button
                      key={tab.href}
                      onClick={() => handleTabClick(tab.href, tab.disabled)}
                      className={cn(
                        'group inline-flex items-center py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
                        isActive
                          ? 'border-green-800 text-green-800'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                        tab.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                      disabled={tab.disabled}
                    >
                      <Icon
                        className={cn(
                          'mr-2 h-5 w-5',
                          isActive ? 'text-green-800' : 'text-gray-400 group-hover:text-gray-500'
                        )}
                      />
                      <span className="block sm:inline">{tab.name}</span>
                      {tab.disabled && (
                        <span className="hidden sm:inline-flex ml-2 items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Description (shows for active tab) */}
            {tabs.map((tab) => {
              if (pathname === tab.href) {
                return (
                  <div key={tab.href} className="mt-4">
                    <p className="text-sm text-gray-600">{tab.description}</p>
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-lg shadow-sm overflow-visible">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}