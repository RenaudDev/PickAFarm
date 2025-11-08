'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * TaskChecklistItem Component
 * 
 * Displays a single task in a checklist with completion status, description, and optional action button.
 * Used in the "Complete Your Listing" widget for onboarding tasks.
 * 
 * @example
 * <TaskChecklistItem
 *   id="add-description"
 *   title="Add farm description"
 *   description="Sets the foundation for your listing"
 *   completed={true}
 * />
 * 
 * <TaskChecklistItem
 *   id="upload-photos"
 *   title="Upload at least 5 high-quality photos"
 *   description="Farms with 5+ photos get 40% more views"
 *   completed={false}
 *   quickWin={true}
 *   badge="Quick Win"
 *   onComplete={() => navigate('/dashboard/farmer/information#media')}
 * />
 */

interface TaskChecklistItemProps {
  /** Unique task identifier */
  id: string;
  
  /** Task title */
  title: string;
  
  /** Task description/benefit */
  description: string;
  
  /** Whether task is completed */
  completed: boolean;
  
  /** Whether this is a high-impact quick win */
  quickWin?: boolean;
  
  /** Optional badge text (e.g., "Quick Win") */
  badge?: string;
  
  /** Optional completion handler (shows "Complete Task" button if provided) */
  onComplete?: () => void;
}

export function TaskChecklistItem({ 
  id,
  title, 
  description, 
  completed, 
  quickWin = false,
  badge,
  onComplete 
}: TaskChecklistItemProps) {
  return (
    <div 
      className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0"
      data-task-id={id}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {completed ? (
          <CheckCircle2 
            className="h-5 w-5 text-green-600" 
            aria-label="Completed"
          />
        ) : (
          <XCircle 
            className="h-5 w-5 text-gray-400" 
            aria-label="Incomplete"
          />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4 
            className={cn(
              "text-sm font-semibold",
              completed 
                ? "text-gray-600 line-through" 
                : "text-gray-900"
            )}
          >
            {title}
          </h4>
          
          {badge && (
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs px-2 py-0",
                quickWin && "bg-yellow-100 text-yellow-800 border-yellow-200"
              )}
            >
              {badge}
            </Badge>
          )}
        </div>
        
        <p className="text-xs text-gray-600">
          {description}
        </p>
      </div>
      
      {/* Action Button (only show if incomplete and handler provided) */}
      {!completed && onComplete && (
        <Button 
          size="sm" 
          variant="default"
          onClick={onComplete}
          className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white"
        >
          Complete Task
        </Button>
      )}
    </div>
  );
}

