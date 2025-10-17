'use client';

import { useEffect, useState } from 'react';

const CACHE_KEY = 'farm-field-options';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface FieldOption {
  option_value: string;
  option_label: string;
  sort_order?: number;
  usage_count?: number;
}

export interface UseFieldOptionsResult {
  data: FieldOption[] | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and cache form field options from the API.
 *
 * Features:
 * - localStorage caching for offline support (24-hour TTL)
 * - Automatic cache invalidation on stale data
 * - Error handling with fallback to cached data
 * - TypeScript support for all options
 *
 * Usage:
 * ```tsx
 * const { data: options, isLoading, isError } = useFieldOptions('categories');
 *
 * if (isLoading) return <Skeleton />;
 * if (isError) return <div>Failed to load options</div>;
 *
 * return options.map(option => (
 *   <Checkbox key={option.option_value} value={option.option_value}>
 *     {option.option_label}
 *   </Checkbox>
 * ));
 * ```
 *
 * @param fieldName - The field name to fetch options for (e.g., 'categories', 'amenities')
 * @returns Object with data, isLoading, isError, and error
 */
export function useFieldOptions(fieldName: string): UseFieldOptionsResult {
  const [data, setData] = useState<FieldOption[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchOptions() {
      try {
        setIsLoading(true);
        setIsError(false);
        setError(null);

        // Check localStorage cache first
        const cacheKey = `${CACHE_KEY}-${fieldName}`;
        const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;

        if (cached) {
          try {
            const { data: cachedData, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
              setData(cachedData);
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.warn('Failed to parse cached field options:', err);
          }
        }

        // Fetch from API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
        const response = await fetch(`${apiUrl}/api/field-options/${fieldName}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch field options for ${fieldName}`);
        }

        const result = await response.json();
        const options = result.options || [];

        // Cache in localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                data: options,
                timestamp: Date.now(),
              })
            );
          } catch (err) {
            console.warn('Failed to cache field options:', err);
          }
        }

        setData(options);
      } catch (err) {
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        // Still try to return cached data even on error
        const cacheKey = `${CACHE_KEY}-${fieldName}`;
        const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
        if (cached) {
          try {
            const { data: cachedData } = JSON.parse(cached);
            setData(cachedData);
          } catch (parseErr) {
            console.warn('Failed to parse fallback cached data:', parseErr);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchOptions();
  }, [fieldName]);

  return { data, isLoading, isError, error };
}

/**
 * Clear all cached field options from localStorage.
 * Useful for force-refreshing when options change.
 */
export function clearFieldOptionsCache() {
  if (typeof window === 'undefined') return;

  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(CACHE_KEY)) {
      localStorage.removeItem(key);
    }
  });
}
