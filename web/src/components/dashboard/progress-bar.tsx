'use client';

import { cn } from '@/lib/utils';

/**
 * ProgressBar Component
 * 
 * Displays a horizontal progress bar with optional label showing percentage.
 * Used for showing completion progress (e.g., profile completion, task completion).
 * 
 * @example
 * <ProgressBar percentage={72} showLabel={true} />
 */

interface ProgressBarProps {
  /** Progress percentage (0-100) */
  percentage: number;
  
  /** Show percentage label above bar */
  showLabel?: boolean;
  
  /** Enable smooth animation */
  animated?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Custom label text (overrides default "Progress") */
  label?: string;
}

export function ProgressBar({ 
  percentage, 
  showLabel = true, 
  animated = true,
  className,
  label = 'Progress'
}: ProgressBarProps) {
  // Clamp percentage to valid range (0-100)
  const clampedPercent = Math.max(0, Math.min(100, percentage));
  
  return (
    <div className={cn("space-y-2", className)}>
      {/* Label and percentage */}
      {showLabel && (
        <div className="flex justify-between items-baseline text-sm">
          <span className="text-gray-600 font-medium">{label}</span>
          <span className="font-semibold text-gray-900">{clampedPercent}%</span>
        </div>
      )}
      
      {/* Progress bar track */}
      <div 
        className="h-2 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${clampedPercent}%`}
      >
        {/* Progress bar fill */}
        <div 
          className={cn(
            "h-full bg-green-600 rounded-full",
            animated && "transition-all duration-500 ease-out"
          )}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}

