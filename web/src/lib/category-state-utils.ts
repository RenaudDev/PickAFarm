/**
 * Utility functions for State + Category filtering
 * Shared between route handlers and components
 */

/**
 * Get all category name variations for matching farms
 * Returns array of possible category names that should match
 */
export function getCategoryVariations(categoryName: string): string[] {
  const variations = [categoryName];

  if (categoryName.includes('Christmas Tree')) {
    variations.push(
      'Christmas Tree',
      'Christmas Trees',
      'Christmas Tree Farms',
      'Christmas Tree Farm'
    );
  }
  if (categoryName.includes('Apple')) {
    variations.push('Apple', 'Apple Orchard', 'Apple Picking', 'Apple Orchards', 'Apples');
  }
  if (categoryName.includes('Pumpkin')) {
    variations.push('Pumpkin', 'Pumpkin Patch', 'Pumpkin Patches', 'Pumpkins');
  }
  if (categoryName.includes('Berry')) {
    variations.push('Berry', 'Berry Farm', 'Berry Picking', 'Berry Farms', 'Berries');
  }
  if (categoryName.includes('Corn Maze')) {
    variations.push('Corn Maze', 'Corn Mazes', 'Maze');
  }
  if (categoryName.includes('Sunflower')) {
    variations.push('Sunflower', 'Sunflowers', 'Sunflower Field');
  }
  if (categoryName.includes('Lavender')) {
    variations.push('Lavender', 'Lavender Farm', 'Lavender Farms');
  }
  if (categoryName.includes('Vegetable')) {
    variations.push('Vegetable', 'Vegetables', 'Veggie', 'Veggies');
  }

  return variations;
}

/**
 * Parse farm categories from various formats
 * Handles JSON strings, arrays, and comma-separated strings
 */
export function parseFarmCategories(categoriesField: any): string[] {
  if (!categoriesField) return [];

  // Already an array
  if (Array.isArray(categoriesField)) {
    return categoriesField;
  }

  // Try parsing as JSON
  if (typeof categoriesField === 'string') {
    try {
      const parsed = JSON.parse(categoriesField);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      // Single string after parsing
      return [parsed];
    } catch (error) {
      // Not JSON, treat as comma-separated or single value
      if (categoriesField.includes(',')) {
        return categoriesField
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);
      }
      return [categoriesField];
    }
  }

  return [];
}

/**
 * Check if a farm matches the given category
 */
export function farmMatchesCategory(farm: any, categoryName: string): boolean {
  const categoryVariations = getCategoryVariations(categoryName);
  const farmCategories = parseFarmCategories(farm.categories);

  return categoryVariations.some((catName) =>
    farmCategories.some((farmCat: string) => farmCat.toLowerCase().includes(catName.toLowerCase()))
  );
}

/**
 * Get all farms in a state that match a specific category
 */
export function getStateCategoryFarms(stateData: any, categoryData: any) {
  if (!stateData?.farms || !categoryData?.name) {
    return [];
  }

  return stateData.farms.filter((farm: any) => farmMatchesCategory(farm, categoryData.name));
}

/**
 * Count farms in a state that match a specific category
 */
export function getStateCategoryCount(stateData: any, categoryData: any): number {
  return getStateCategoryFarms(stateData, categoryData).length;
}

/**
 * Get all states that have farms in a specific category
 * Returns array of states with their farm counts for this category
 */
export function getStatesWithCategoryFarms(
  statesData: any[],
  categoryData: any
): Array<{ state: any; farmCount: number }> {
  return statesData
    .map((state) => ({
      state,
      farmCount: getStateCategoryCount(state, categoryData),
    }))
    .filter((item) => item.farmCount > 0)
    .sort((a, b) => b.farmCount - a.farmCount);
}

/**
 * Get all categories that have farms in a specific state
 * Returns array of categories with their farm counts in this state
 */
export function getCategoriesInState(
  stateData: any,
  categoriesData: any
): Array<{ category: any; farmCount: number }> {
  return Object.values(categoriesData)
    .map((category: any) => ({
      category,
      farmCount: getStateCategoryCount(stateData, category),
    }))
    .filter((item) => item.farmCount > 0)
    .sort((a, b) => b.farmCount - a.farmCount);
}
