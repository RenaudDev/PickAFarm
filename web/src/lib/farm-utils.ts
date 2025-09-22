/**
 * Shared utilities for farm data processing
 */

// Category mapping for consistent filtering across the app
const CATEGORY_MAP: Record<string, string[]> = {
  'apple-orchards': ['Apple Orchard', 'Apple Picking'],
  'pumpkin-patches': ['Pumpkin Patch'],
  'berry-farms': ['Berry Farm', 'Berry Picking'],
  'christmas-tree-farms': ['Christmas Trees', 'Christmas Tree'],
};

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
 * Filters farms by category slug
 */
export function filterFarmsByCategory(farms: any[], categorySlug: string): any[] {
  if (!categorySlug) return farms;
  
  const matchingCategories = CATEGORY_MAP[categorySlug] || [];
  if (matchingCategories.length === 0) return farms;
  
  return farms.filter(farm => {
    const farmCategories = parseFarmCategories(farm.categories);
    return matchingCategories.some(catName =>
      farmCategories.some(farmCat =>
        farmCat.toLowerCase().includes(catName.toLowerCase())
      )
    );
  });
}

/**
 * Sorts farms with featured first, then by distance
 */
export function sortFarms(farms: any[]): any[] {
  return [...farms].sort((a, b) => {
    const featuredDiff = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    if (featuredDiff !== 0) return featuredDiff;
    return (a.distance_km || 0) - (b.distance_km || 0);
  });
}
