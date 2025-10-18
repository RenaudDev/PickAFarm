'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

/**
 * FormProgressIndicator Component
 *
 * Displays form completion progress with a visual progress bar and percentage text.
 *
 * **Features:**
 * - Radix UI Progress component for accessibility
 * - Smooth animated transitions (300ms)
 * - Gradient green progress bar (from-green-500 to green-600)
 * - Optional percentage text display
 * - ARIA live region support for screen readers
 * - Clamped percentage value (0-100)
 * - Fully accessible WCAG compliant
 *
 * **Usage:**
 * ```tsx
 * <FormProgressIndicator
 *   percentage={75}
 *   showPercentage={true}
 * />
 * ```
 *
 * **Accessibility:**
 * - ARIA labels for progress indication
 * - Screen reader announces current percentage
 * - Complies with WCAG guidelines for color contrast
 * - Works with keyboard navigation
 *
 * **Props:**
 * - `percentage`: (0-100) Form completion percentage
 * - `showPercentage`: Show "XX% Complete" text below bar
 * - `className`: Optional CSS classes for custom styling
 */

interface FormProgressIndicatorProps {
  /** Percentage completion (0-100) */
  percentage: number;
  /** Optional CSS class */
  className?: string;
  /** Show percentage text */
  showPercentage?: boolean;
}

const FormProgressIndicator = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  FormProgressIndicatorProps
>(({ percentage, className, showPercentage = true }, ref) => {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  const displayText = Math.round(clampedPercentage);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress Bar */}
      <ProgressPrimitive.Root
        ref={ref}
        value={clampedPercentage}
        max={100}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-gray-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-green-500'
        )}
        aria-label="Form completion progress"
        aria-valuenow={displayText}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full w-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300',
            'rounded-full'
          )}
          style={{ transform: `translateX(-${100 - clampedPercentage}%)` }}
        />
      </ProgressPrimitive.Root>

      {/* Percentage Text */}
      {showPercentage && (
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-600">
            <span className="text-green-600">{displayText}%</span> Complete
          </p>
        </div>
      )}
    </div>
  );
});

FormProgressIndicator.displayName = 'FormProgressIndicator';

export { FormProgressIndicator };
