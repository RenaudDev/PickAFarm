/**
 * DynamicMultiSelect Component
 * Story 2.5.2: Dynamic Form Field Options System
 *
 * Dynamic multi-select field that fetches options from the API.
 * Features:
 * - Fetches options dynamically from API
 * - Falls back to hardcoded options if API fails
 * - Preserves existing values not in options list
 * - Shows loading state
 * - Does NOT display usage count (per user feedback)
 */

'use client';

import { useFieldOptions, getFallbackOptions } from '@/lib/hooks/useFieldOptions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DynamicMultiSelectProps {
  fieldName: string;
  label: string;
  description?: string;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function DynamicMultiSelect({
  fieldName,
  label,
  description,
  value = [],
  onChange,
  error,
  disabled = false,
  className,
}: DynamicMultiSelectProps) {
  const { data: options, isLoading, isError } = useFieldOptions(fieldName);

  // Handle checkbox toggle
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter((v) => v !== optionValue));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Label>{label}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state with fallback
  if (isError && !options) {
    const fallbackOptions = getFallbackOptions(fieldName);

    return (
      <div className={cn('space-y-3', className)}>
        <Label>{label}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <div className="mb-3 p-3 border border-yellow-300 bg-yellow-50 rounded-md flex gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-700 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700">
            Using offline options. Some choices may not be available.
          </p>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
          {fallbackOptions.map((option) => (
            <CheckboxOption
              key={option.option_value}
              option={option.option_value}
              label={option.option_label}
              checked={value.includes(option.option_value)}
              onChange={(checked) => handleChange(option.option_value, checked)}
              disabled={disabled}
            />
          ))}
        </div>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </div>
    );
  }

  // Combine API options with any existing values not in the options
  const allOptions = options || [];
  const existingValuesNotInOptions = value.filter(
    (v) => !allOptions.some((opt) => opt.option_value === v)
  );

  // Add existing values as options to prevent data loss
  const combinedOptions = [
    ...allOptions,
    ...existingValuesNotInOptions.map((v) => ({
      option_value: v,
      option_label: v,
      usage_count: 0,
    })),
  ];

  return (
    <div className={cn('space-y-3', className)}>
      <Label htmlFor={`${fieldName}-multiselect`}>{label}</Label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      <div
        className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3"
        role="group"
        aria-labelledby={`${fieldName}-multiselect`}
      >
        {combinedOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No options available</p>
        ) : (
          combinedOptions.map((option) => (
            <CheckboxOption
              key={option.option_value}
              option={option.option_value}
              label={option.option_label}
              checked={value.includes(option.option_value)}
              onChange={(checked) => handleChange(option.option_value, checked)}
              disabled={disabled}
            />
          ))
        )}
      </div>

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}

      {existingValuesNotInOptions.length > 0 && (
        <p className="text-xs text-muted-foreground">
          * Some selected values are preserved from your existing data
        </p>
      )}
    </div>
  );
}

interface CheckboxOptionProps {
  option: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
}

function CheckboxOption({ option, label, checked, onChange, disabled }: CheckboxOptionProps) {
  // Generate stable ID for the checkbox
  const id = `checkbox-${option.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
      />
      <Label
        htmlFor={id}
        className={cn(
          'flex-1 font-normal cursor-pointer select-none',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span>{label}</span>
        {/* NOTE: User feedback - do NOT display usage count */}
      </Label>
    </div>
  );
}
