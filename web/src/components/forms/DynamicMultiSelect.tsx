'use client';

import { useFieldOptions } from '@/lib/hooks/useFieldOptions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface DynamicMultiSelectProps {
  fieldName: string;
  label: string;
  description?: string;
  value?: string[];
  onChange: (value: string[]) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Dynamic multi-select component that fetches options from the API.
 *
 * This component replaces hardcoded checkbox arrays with dynamically
 * loaded options from the database. It preserves existing values even
 * if they're not in the current options list (preventing data loss).
 *
 * Features:
 * - Auto-fetches options from /api/field-options/:fieldName
 * - Displays usage count for each option (e.g., "5 farms")
 * - Preserves existing values not in the options list
 * - Loading skeleton while fetching
 * - Error alert with fallback options
 * - Scrollable option list (max-height 192px)
 *
 * Usage:
 * ```tsx
 * <DynamicMultiSelect
 *   fieldName="categories"
 *   label="Categories"
 *   description="Select all that apply"
 *   value={form.watch('categories')}
 *   onChange={(value) => form.setValue('categories', value)}
 *   error={form.formState.errors.categories?.message}
 * />
 * ```
 */
export function DynamicMultiSelect({
  fieldName,
  label,
  description,
  value = [],
  onChange,
  error,
  disabled = false,
}: DynamicMultiSelectProps) {
  const { data: options, isLoading, isError } = useFieldOptions(fieldName);

  // Fallback hardcoded options in case API fails
  // These are organized by field and match the previous hardcoded options
  const getFallbackOptions = (): Record<string, string[]> => ({
    categories: [
      'Christmas Tree',
      'Pumpkin Patch',
      'Apple Orchard',
      'Berry Farm',
      'Vegetable Farm',
      'Sunflower Field',
      'Corn Maze',
      'Petting Zoo',
    ],
    amenities: [
      'Restrooms',
      'Gift Shop',
      'Wagon Rides',
      'Picnic Area',
      'Playground',
      'Food Service',
      'Parking',
      'Wheelchair Accessible',
    ],
    varieties: [
      'Balsam Fir',
      'Douglas Fir',
      'Blue Spruce',
      'Honeycrisp Apple',
      'Granny Smith Apple',
      'Blueberry',
      'Strawberry',
      'Pumpkin',
      'Corn',
      'Sunflower',
    ],
    payment_methods: [
      'Cash',
      'Credit Card',
      'Debit Card',
      'Venmo',
      'PayPal',
      'Apple Pay',
      'Google Pay',
    ],
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Label>{label}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError && !options) {
    // Use fallback options if API fails
    const fallbackOptions = getFallbackOptions();
    const fallbackItems = fallbackOptions[fieldName] || [];

    return (
      <div className="space-y-3">
        <Label>{label}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
          ⚠️ Using offline options. Some choices may not be available.
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
          {fallbackItems.map((option) => (
            <CheckboxOption
              key={option}
              option={option}
              label={option}
              checked={value.includes(option)}
              onChange={(checked) => handleChange(option, checked)}
              disabled={disabled}
            />
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter((v) => v !== optionValue));
    }
  };

  // Combine API options with any existing values not in the options
  // This prevents data loss if a value is removed from the database
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
      sort_order: 999,
      usage_count: 0,
    })),
  ];

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
        {combinedOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No options available</p>
        ) : (
          combinedOptions.map((option) => (
            <CheckboxOption
              key={option.option_value}
              option={option.option_value}
              label={option.option_label}
              usageCount={option.usage_count}
              checked={value.includes(option.option_value)}
              onChange={(checked) => handleChange(option.option_value, checked)}
              disabled={disabled}
            />
          ))
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

interface CheckboxOptionProps {
  option: string;
  label: string;
  usageCount?: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
}

/**
 * Individual checkbox option with optional usage count display.
 */
function CheckboxOption({
  option,
  label,
  usageCount,
  checked,
  onChange,
  disabled,
}: CheckboxOptionProps) {
  const id = `checkbox-${option.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
      <Label htmlFor={id} className="flex-1 font-normal cursor-pointer">
        <span>{label}</span>
        {usageCount !== undefined && usageCount > 0 && (
          <span className="text-xs text-muted-foreground ml-2">
            ({usageCount} {usageCount === 1 ? 'farm' : 'farms'})
          </span>
        )}
      </Label>
    </div>
  );
}
