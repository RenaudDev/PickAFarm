/**
 * Farmer Dashboard Layout Component
 * Story 2.4: Farmer Dashboard Layout & Overview Page
 *
 * Provides consistent layout wrapper for all farmer dashboard pages with:
 * - Sidebar navigation (desktop)
 * - Mobile hamburger menu
 * - Responsive header
 * - PickAFarm branding
 */

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import {
  Home,
  Image as ImageIcon,
  Send,
  BarChart,
  TrendingUp,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const navItems = [
  { name: 'Overview', href: '/dashboard/farmer', icon: Home },
  { name: 'Images', href: '/dashboard/farmer/images', icon: ImageIcon, disabled: true },
  { name: 'Broadcasts', href: '/dashboard/farmer/broadcasts', icon: Send, disabled: true },
  { name: 'Analytics', href: '/dashboard/farmer/analytics', icon: BarChart, disabled: true },
  { name: 'Marketing', href: '/dashboard/farmer/marketing', icon: TrendingUp, disabled: true },
  { name: 'Settings', href: '/dashboard/farmer/settings', icon: Settings, disabled: true },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 hidden lg:block z-30">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-center">
            <Image
              src="/images/navbarlogo1.webp"
              alt="PickAFarm Logo"
              width={180}
              height={60}
              className="object-contain"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.disabled ? '#' : item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive ? 'bg-[#2D5016] text-white' : 'text-gray-700 hover:bg-gray-100',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={(e) => item.disabled && e.preventDefault()}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{item.name}</span>
                  {item.disabled && <span className="ml-auto text-xs">Soon</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">Farmer Account</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 lg:hidden z-40">
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Image
            src="/images/navbarlogo1.webp"
            alt="PickAFarm Logo"
            width={120}
            height={40}
            className="object-contain"
          />
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Mobile Menu Dialog */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="fixed inset-0 bg-white p-0 lg:hidden max-w-full">
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#2D5016]">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.disabled ? '#' : item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      isActive ? 'bg-[#2D5016] text-white' : 'text-gray-700 hover:bg-gray-100',
                      item.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={(e) => {
                      if (item.disabled) {
                        e.preventDefault();
                      } else {
                        setMobileMenuOpen(false);
                      }
                    }}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{item.name}</span>
                    {item.disabled && <span className="ml-auto text-xs">Soon</span>}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile User Section */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <UserButton afterSignOutUrl="/" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">Farmer Account</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="lg:ml-60 pt-16 lg:pt-0">{children}</main>
    </div>
  );
}
