'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Fuse from 'fuse.js';

/**
 * SmartTagInput component for multi-select fields with autocomplete.
 *
 * This component maintains backward compatibility with the existing data flow:
 * - Accepts arrays from the form (React Hook Form)
 * - Fetches options from /api/field-options endpoint (D1 database)
 * - Returns arrays to the form
 * - The API handles CSV conversion for D1 storage and Zoho sync
 *
 * @example
 * <SmartTagInput
 *   fieldName="varieties"
 *   label="Product Varieties"
 *   value={field.value || []}
 *   onChange={field.onChange}
 *   placeholder="Start typing to search varieties..."
 * />
 */

interface SmartTagInputProps {
  fieldName: string;
  label: string;
  description?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: string;
  allowCustom?: boolean;
  maxTags?: number;
  required?: boolean;
  disabled?: boolean;
}

interface FieldOption {
  value: string;
  label: string;
  sort_order?: number;
}

export function SmartTagInput({
  fieldName,
  label,
  description,
  value,
  onChange,
  placeholder = 'Start typing to search...',
  error,
  allowCustom = false,
  maxTags,
  required = false,
  disabled = false,
}: SmartTagInputProps) {
  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : [];

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`SmartTagInput[${fieldName}] - value:`, value, '→ safeValue:', safeValue);
  }
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<FieldOption[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<FieldOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fuseRef = useRef<Fuse<FieldOption> | null>(null);

  // Fetch options from API
  useEffect(() => {
    const fetchOptions = async () => {
      // Check localStorage cache first
      const cacheKey = `field-options-${fieldName}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          // Use cache if less than 30 minutes old
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`Using cached options for ${fieldName}:`, data.length, 'options');
            }

            setOptions(data);
            setFilteredOptions(data); // Also set filtered options immediately

            // Initialize Fuse.js for fuzzy search
            fuseRef.current = new Fuse(data, {
              keys: ['label', 'value'],
              threshold: 0.3,
              includeScore: true,
            });
            return;
          }
        } catch (e) {
          console.error('Error parsing cached options:', e);
        }
      }

      // Fetch from API
      setIsLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';
        const response = await fetch(`${apiUrl}/api/field-options?field=${fieldName}`);
        if (response.ok) {
          const data = await response.json();

          if (process.env.NODE_ENV === 'development') {
            console.log(`API Response for ${fieldName}:`, data);
          }

          // Handle different response structures and ensure options exists
          const rawOptions = data.options || data || [];

          // Ensure we have an array
          const optionsArray = Array.isArray(rawOptions) ? rawOptions : [];

          if (process.env.NODE_ENV === 'development') {
            console.log(`Options array for ${fieldName}:`, optionsArray);
          }

          const formattedOptions: FieldOption[] = optionsArray.map((opt: any) => {
            // Handle both object format and string format
            if (typeof opt === 'string') {
              return {
                value: opt,
                label: opt,
                sort_order: 0
              };
            }

            return {
              value: opt.value || opt.option_value || '',
              label: opt.label || opt.option_label || '',
              sort_order: opt.sort_order || 0,
            };
          });

          if (process.env.NODE_ENV === 'development') {
            console.log(`Formatted options for ${fieldName}:`, formattedOptions);
          }

          setOptions(formattedOptions);
          setFilteredOptions(formattedOptions); // Also set filtered options immediately

          // Cache the options (with quota exceeded handling)
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              data: formattedOptions,
              timestamp: Date.now(),
            }));
          } catch (storageError) {
            // Handle quota exceeded error silently
            console.warn('Failed to cache field options:', storageError);
          }

          // Initialize Fuse.js for fuzzy search
          fuseRef.current = new Fuse(formattedOptions, {
            keys: ['label', 'value'],
            threshold: 0.3,
            includeScore: true,
          });
        } else {
          // Handle non-ok responses
          console.warn(`Failed to fetch field options for ${fieldName}:`, response.status);
          // Fallback to empty options or cached data
        }
      } catch (error) {
        console.error('Error fetching field options:', error);
        // Component continues to work with empty options
      } finally {
        setIsLoading(false);
      }
    };

    if (fieldName) {
      fetchOptions();
    }
  }, [fieldName]);

  // Filter options based on input (with implicit debounce via React's batching)
  useEffect(() => {
    // Reset selected index when filtering
    setSelectedIndex(-1);

    if (!inputValue) {
      // Show all options when input is empty
      setFilteredOptions(options);

      if (process.env.NODE_ENV === 'development') {
        console.log(`Setting filtered options for ${fieldName} (empty input):`, options.length, 'options');
      }
      return;
    }

    // Use a microtask to allow React to batch updates
    const timeoutId = setTimeout(() => {
      if (fuseRef.current) {
        // Use fuzzy search
        const results = fuseRef.current.search(inputValue);
        const filtered = results.map(r => r.item);
        setFilteredOptions(filtered);

        if (process.env.NODE_ENV === 'development') {
          console.log(`Fuzzy search for ${fieldName} with "${inputValue}":`, filtered.length, 'results');
        }
      } else {
        // Fallback to simple filter
        const filtered = options.filter(
          opt => opt.label.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredOptions(filtered);

        if (process.env.NODE_ENV === 'development') {
          console.log(`Simple filter for ${fieldName} with "${inputValue}":`, filtered.length, 'results');
        }
      }
    }, 100); // 100ms debounce for search

    return () => clearTimeout(timeoutId);
  }, [inputValue, options]);

  // Handle dropdown visibility
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (option: FieldOption) => {
    if (safeValue.includes(option.value)) return;
    if (maxTags && safeValue.length >= maxTags) return;

    onChange([...safeValue, option.value]);
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagValue: string) => {
    onChange(safeValue.filter(v => v !== tagValue));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
        addTag(filteredOptions[selectedIndex]);
      } else if (allowCustom && inputValue.trim()) {
        // Add custom value
        if (!safeValue.includes(inputValue.trim())) {
          onChange([...safeValue, inputValue.trim()]);
          setInputValue('');
          setIsOpen(false);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Backspace' && !inputValue && safeValue.length > 0) {
      // Remove last tag when backspace pressed on empty input
      removeTag(safeValue[safeValue.length - 1]);
    }
  };

  const getDisplayLabel = (tagValue: string) => {
    const option = options.find(opt => opt.value === tagValue);
    return option ? option.label : tagValue;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName} className={cn(required && 'required')}>
        {label}
      </Label>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="relative">
        {/* Selected tags */}
        {safeValue.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {safeValue.map(tagValue => (
              <Badge
                key={tagValue}
                variant="secondary"
                className="px-2 py-1"
              >
                <span className="text-xs">{getDisplayLabel(tagValue)}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tagValue)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Remove ${getDisplayLabel(tagValue)}`}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Input field */}
        <div className="relative">
          <Input
            ref={inputRef}
            id={fieldName}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
              if (process.env.NODE_ENV === 'development') {
                console.log(`Focus on ${fieldName}: isOpen=true, filteredOptions=`, filteredOptions.length);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              maxTags && safeValue.length >= maxTags
                ? `Maximum ${maxTags} items selected`
                : placeholder
            }
            disabled={disabled || (maxTags && safeValue.length >= maxTags)}
            className={cn(
              'pr-8',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
            aria-label={label}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldName}-error` : undefined}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={`${fieldName}-listbox`}
            aria-autocomplete="list"
          />
          <ChevronDown
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>

        {/* Dropdown */}
        {isOpen && process.env.NODE_ENV === 'development' && console.log(`Rendering dropdown for ${fieldName}: isLoading=${isLoading}, filteredOptions=${filteredOptions.length}`)}
        {isOpen && (
          <div
            ref={dropdownRef}
            id={`${fieldName}-listbox`}
            role="listbox"
            className="absolute z-50 mt-1 w-full rounded-md border bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-auto"
          >
            {isLoading ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Loading options...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                {inputValue && allowCustom
                  ? 'Press Enter to add custom value'
                  : 'No options found'}
              </div>
            ) : (
              <div>
                {filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={index === selectedIndex}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                      index === selectedIndex && 'bg-accent',
                      safeValue.includes(option.value) && 'opacity-50'
                    )}
                    onClick={() => addTag(option)}
                    disabled={safeValue.includes(option.value)}
                  >
                    {option.label}
                    {safeValue.includes(option.value) && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (selected)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p id={`${fieldName}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Selected count */}
      {maxTags && (
        <p className="text-xs text-muted-foreground">
          {safeValue.length} / {maxTags} selected
        </p>
      )}

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isLoading && 'Loading options...'}
        {!isLoading && filteredOptions.length > 0 && (
          `${filteredOptions.length} options available. Use arrow keys to navigate.`
        )}
        {!isLoading && filteredOptions.length === 0 && inputValue && (
          allowCustom ? 'No matches found. Press Enter to add custom value.' : 'No matches found.'
        )}
      </div>
    </div>
  );
}