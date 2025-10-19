/**
 * useFieldOptions Hook
 * Story 2.5.2: Dynamic Form Field Options System
 *
 * Fetches and caches field options from the API with localStorage caching.
 * Provides fallback to hardcoded options if API fails.
 */

'use client';

import { useQuery } from '@tanstack/react-query';

const CACHE_KEY = 'farm-field-options';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface FieldOption {
  option_value: string;
  option_label: string;
  usage_count?: number;
}

interface CachedData {
  data: FieldOption[];
  timestamp: number;
}

/**
 * Hook to fetch field options for dynamic multi-select fields
 * @param fieldName - The name of the field to fetch options for
 * @returns Query result with field options, loading state, and error state
 */
export function useFieldOptions(fieldName: string) {
  return useQuery<FieldOption[]>({
    queryKey: ['field-options', fieldName],
    queryFn: async () => {
      // Check localStorage cache first
      const cacheKey = `${CACHE_KEY}-${fieldName}`;

      try {
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          const { data, timestamp }: CachedData = JSON.parse(cached);

          // Check if cache is still valid
          if (Date.now() - timestamp < CACHE_DURATION) {
            console.log(`Using cached options for ${fieldName}`);
            return data;
          }
        }
      } catch (error) {
        // Ignore cache errors and fetch fresh data
        console.warn('Error reading cache:', error);
      }

      // Fetch from API
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';
      const response = await fetch(`${apiUrl}/api/field-options/${fieldName}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch field options: ${response.statusText}`);
      }

      const result = await response.json();
      const options: FieldOption[] = result.options || [];

      // Cache in localStorage
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: options,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        // Ignore cache write errors (e.g., localStorage full)
        console.warn('Error writing cache:', error);
      }

      return options;
    },
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Batch fetch multiple field options in one request
 * @param fieldNames - Array of field names to fetch options for
 * @returns Query result with grouped field options
 */
export function useFieldOptionsBatch(fieldNames: string[]) {
  return useQuery<Record<string, FieldOption[]>>({
    queryKey: ['field-options-batch', ...fieldNames],
    queryFn: async () => {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';
      const fieldsParam = fieldNames.join(',');

      const response = await fetch(
        `${apiUrl}/api/field-options?fields=${encodeURIComponent(fieldsParam)}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch field options: ${response.statusText}`);
      }

      const result = await response.json();
      const grouped: Record<string, FieldOption[]> = result.grouped || {};

      // Cache each field separately
      Object.entries(grouped).forEach(([field, options]) => {
        const cacheKey = `${CACHE_KEY}-${field}`;
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: options,
              timestamp: Date.now(),
            })
          );
        } catch (error) {
          console.warn('Error writing cache:', error);
        }
      });

      return grouped;
    },
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Clear all field options from localStorage cache
 */
export function clearFieldOptionsCache() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_KEY)) {
        localStorage.removeItem(key);
      }
    });
    console.log('Field options cache cleared');
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
}

/**
 * Get fallback options for when API fails
 * These are the hardcoded options from the original implementation
 */
export function getFallbackOptions(fieldName: string): FieldOption[] {
  const fallbacks: Record<string, string[]> = {
    categories: [
      'Christmas Tree Farm',
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
      'Douglas Fir',
      'Fraser Fir',
      'Noble Fir',
      'Nordmann Fir',
      'Blue Spruce',
      'Norway Spruce',
      'White Pine',
      'Scotch Pine',
    ],
    payment_methods: [
      'Cash',
      'Credit Card',
      'Debit Card',
      'Check',
      'Venmo',
      'PayPal',
      'Apple Pay',
      'Google Pay',
    ],
    activities: [
      'U-Pick',
      'Pre-Cut Trees',
      'Cut Your Own',
      'Hayrides',
      'Corn Maze',
      'Petting Zoo',
      'Farm Tours',
      'Special Events',
    ],
    seasonal_activities: [
      'Christmas Trees',
      'Pumpkin Picking',
      'Apple Picking',
      'Berry Picking',
      'Sunflower Fields',
      'Easter Egg Hunts',
      'Fall Festivals',
      'Holiday Markets',
    ],
    christmas_trees_available: [
      'Douglas Fir',
      'Fraser Fir',
      'Noble Fir',
      'Nordmann Fir',
      'Blue Spruce',
      'Norway Spruce',
      'White Pine',
      'Scotch Pine',
      'Concolor Fir',
      'Balsam Fir',
    ],
    christmas_activities: [
      'Santa Visits',
      'Hot Cocoa',
      'Wreaths For Sale',
      'Garlands For Sale',
      'Tree Netting',
      'Tree Drilling',
      'Tree Wrapping',
      'Gift Shop',
    ],
    christmas_products: [
      'Wreaths',
      'Garlands',
      'Ornaments',
      'Tree Stands',
      'Tree Preservative',
      'Holiday Decorations',
      'Gift Baskets',
      'Hot Cocoa',
    ],
  };

  const options = fallbacks[fieldName] || [];

  // Convert to FieldOption format
  return options.map((option) => ({
    option_value: option,
    option_label: option,
    usage_count: 0,
  }));
}

/**
 * Type export for use in components
 */
export type { FieldOption };
