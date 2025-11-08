'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * StatCard Component
 * 
 * Displays dashboard statistics with optional progress indicator, trend, or status badge.
 * Used for showing metrics like profile completion, verification status, views, and subscribers.
 * 
 * @example
 * // Numeric value with trend
 * <StatCard title="Views" value={1247} trend={{ value: "+12%", direction: "up" }} />
 * 
 * // Progress percentage with circular indicator
 * <StatCard title="Profile Completion" value="72%" progressPercent={72} />
 * 
 * // Status badge
 * <StatCard title="Verification" value="Pending" status="Pending" />
 */

interface StatCardProps {
  /** Display title (e.g., "Views", "Subscribers") */
  title: string;
  
  /** Main value to display */
  value: string | number;
  
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Optional trend indicator */
  trend?: {
    value: string;                    // "+12%" or "-5%"
    direction: 'up' | 'down';
  };
  
  /** Optional circular progress (0-100) */
  progressPercent?: number;
  
  /** Optional status badge */
  status?: 'Active' | 'Pending' | 'Suspended';
  
  /** Optional click handler */
  onClick?: () => void;
  
  /** Additional CSS classes */
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  progressPercent,
  status,
  onClick,
  className 
}: StatCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Loading state - show skeleton
  if (value === undefined) {
    return <StatCardSkeleton />;
  }
  
  // Determine if card is interactive
  const isInteractive = !!onClick;
  
  return (
    <div 
      className={cn(
        "bg-green-50 border border-gray-200 rounded-lg p-6 text-center transition-all duration-150",
        isInteractive && "cursor-pointer hover:shadow-md hover:border-green-300",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`${title}: ${value}`}
    >
      {/* Icon in top-right corner */}
      {Icon && (
        <div className="flex justify-end mb-2">
          <Icon className="h-5 w-5 text-green-600" aria-hidden="true" />
        </div>
      )}
      
      {/* Circular progress variant */}
      {progressPercent !== undefined && (
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-3">
          {/* Background circle */}
          <svg className="w-20 h-20 transform -rotate-90" aria-hidden="true">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressPercent / 100)}`}
              className="text-green-600 transition-all duration-500 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-xl font-bold text-gray-900">
            {progressPercent}%
          </span>
        </div>
      )}
      
      {/* Standard value display (no progress circle) */}
      {progressPercent === undefined && (
        <p className="text-3xl font-bold text-gray-900 mb-2">
          {value}
        </p>
      )}
      
      {/* Title */}
      <p className="text-sm font-medium text-gray-600">
        {title}
      </p>
      
      {/* Trend indicator */}
      {trend && (
        <p 
          className={cn(
            "text-xs mt-2 font-medium",
            trend.direction === 'up' ? "text-green-600" : "text-red-600"
          )}
          aria-label={`Trend: ${trend.value}`}
        >
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
        </p>
      )}
      
      {/* Status badge */}
      {status && (
        <div className="mt-3">
          <Badge 
            variant={
              status === 'Active' ? 'default' : 
              status === 'Pending' ? 'secondary' : 
              'destructive'
            }
            className={cn(
              "text-xs",
              status === 'Active' && "bg-emerald-100 text-emerald-700 border-emerald-200",
              status === 'Pending' && "bg-amber-100 text-amber-700 border-amber-200",
              status === 'Suspended' && "bg-red-100 text-red-700 border-red-200"
            )}
          >
            {status === 'Active' && '✓ '}
            {status === 'Pending' && '⏱ '}
            {status === 'Suspended' && '✗ '}
            {status}
          </Badge>
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for StatCard
 */
function StatCardSkeleton() {
  return (
    <div className="bg-green-50 border border-gray-200 rounded-lg p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2" />
      <div className="h-4 bg-gray-200 rounded w-24 mx-auto" />
    </div>
  );
}

