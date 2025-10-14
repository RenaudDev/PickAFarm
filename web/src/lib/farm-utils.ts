/**
 * Shared utilities for farm data processing
 */

// Import the FarmData type from schema
import type { FarmData } from './schema';

// Type for raw farm data from API (with boolean featured)
interface ApiFarmData {
  id: string;
  name: string;
  slug: string;
  url: string;
  latitude?: number;
  longitude?: number;
  city: string;
  province: string;
  country?: string;
  categories?: string;
  featured?: boolean;
  distance_km?: number;
  street?: string;
  postal_code?: string;
  phone?: string;
  image_url?: string;
}

// Category mapping for consistent filtering across the app
const CATEGORY_MAP: Record<string, string[]> = {
  'apple-orchards': ['Apple Orchard', 'Apple Picking'],
  'pumpkin-patches': ['Pumpkin Patch'],
  'berry-farms': ['Berry Farm', 'Berry Picking'],
  'christmas-tree-farms': ['Christmas Trees', 'Christmas Tree'],
};

/**
 * Converts API farm data to component-compatible format
 */
export function convertApiFarmData(apiFarms: ApiFarmData[]): FarmData[] {
  return apiFarms.map((farm) => ({
    ...farm,
    featured: farm.featured ? 1 : 0, // Convert boolean to number
  }));
}

/**
 * Parses farm categories from JSON string or plain string
 */
export function parseFarmCategories(categories: string | null | undefined): string[] {
  if (!categories) return [];

  try {
    const parsed = JSON.parse(categories);
    return typeof parsed === 'string' ? [parsed] : parsed;
  } catch {
    return [categories];
  }
}

/**
 * Filters farms by category slug - works with both ApiFarmData and FarmData
 */
export function filterFarmsByCategory(farms: FarmData[], categorySlug: string): FarmData[];
export function filterFarmsByCategory(farms: ApiFarmData[], categorySlug: string): FarmData[];
export function filterFarmsByCategory(
  farms: (ApiFarmData | FarmData)[],
  categorySlug: string
): FarmData[] {
  if (!categorySlug) {
    // If no category filter, convert to FarmData if needed
    return farms.map((farm) =>
      typeof farm.featured === 'boolean'
        ? ({ ...farm, featured: farm.featured ? 1 : 0 } as FarmData)
        : (farm as FarmData)
    );
  }

  const matchingCategories = CATEGORY_MAP[categorySlug] || [];
  if (matchingCategories.length === 0) {
    return farms.map((farm) =>
      typeof farm.featured === 'boolean'
        ? ({ ...farm, featured: farm.featured ? 1 : 0 } as FarmData)
        : (farm as FarmData)
    );
  }

  const filteredFarms = farms.filter((farm) => {
    const farmCategories = parseFarmCategories(farm.categories);
    return matchingCategories.some((catName) =>
      farmCategories.some((farmCat) => farmCat.toLowerCase().includes(catName.toLowerCase()))
    );
  });

  // Convert to FarmData format
  return filteredFarms.map((farm) =>
    typeof farm.featured === 'boolean'
      ? ({ ...farm, featured: farm.featured ? 1 : 0 } as FarmData)
      : (farm as FarmData)
  );
}

/**
 * Sorts farms with featured first, then by distance
 */
export function sortFarms(farms: FarmData[]): FarmData[] {
  return [...farms].sort((a, b) => {
    const featuredDiff = (b.featured || 0) - (a.featured || 0);
    if (featuredDiff !== 0) return featuredDiff;
    return (a.distance_km || 0) - (b.distance_km || 0);
  });
}
