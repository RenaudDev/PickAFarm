'use client';

import { cn } from '@/lib/utils';

/**
 * ActivityFeedItem Component
 * 
 * Displays a single activity item in the recent activity feed.
 * Shows activity title, timestamp, and optional icon.
 * 
 * @example
 * <ActivityFeedItem
 *   id="1"
 *   title="12 new profile views"
 *   timestamp="2 hours ago"
 *   icon={Eye}
 * />
 */

interface ActivityFeedItemProps {
  /** Unique activity identifier */
  id: string;
  
  /** Activity title/description */
  title: string;
  
  /** Human-readable timestamp (e.g., "2 hours ago") */
  timestamp: string;
  
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Optional click handler (makes item interactive) */
  onClick?: () => void;
}

export function ActivityFeedItem({ 
  id,
  title, 
  timestamp, 
  icon: Icon, 
  onClick 
}: ActivityFeedItemProps) {
  const isInteractive = !!onClick;
  
  return (
    <div 
      className={cn(
        "flex items-start gap-3 py-2 text-sm",
        isInteractive && "cursor-pointer hover:bg-green-50 rounded-md px-2 -mx-2 transition-colors"
      )}
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      data-activity-id={id}
    >
      {/* Icon */}
      {Icon && (
        <Icon 
          className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" 
          aria-hidden="true"
        />
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-gray-900 font-medium">
          {title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {timestamp}
        </p>
      </div>
    </div>
  );
}

