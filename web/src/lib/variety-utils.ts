import { getVarietySlug } from "./variety-mapper"

/**
 * Interface for a farm with varieties
 */
export interface FarmWithVarieties {
  varieties?: string
  [key: string]: any
}

/**
 * Interface for variety information
 */
export interface VarietyInfo {
  name: string
  slug: string
  normalizedName: string
}

/**
 * Extract unique varieties from an array of farms
 * @param farms - Array of farm objects
 * @returns Array of unique variety names
 */
export function extractVarietiesFromFarms(farms: FarmWithVarieties[]): string[] {
  const varietiesSet = new Set<string>()

  farms.forEach(farm => {
    if (farm.varieties && typeof farm.varieties === 'string') {
      const varietyList = farm.varieties.split(',').map(v => v.trim()).filter(v => v.length > 0)
      varietyList.forEach(variety => varietiesSet.add(variety))
    }
  })

  return Array.from(varietiesSet).sort()
}

/**
 * Get varieties that have corresponding blog articles
 * @param varieties - Array of variety names from farms
 * @returns Array of variety objects with name and slug
 */
export function getVarietiesWithArticles(varieties: string[]): VarietyInfo[] {
  const varietiesWithSlugs: VarietyInfo[] = []

  varieties.forEach(varietyName => {
    const slug = getVarietySlug(varietyName)
    if (slug) {
      varietiesWithSlugs.push({
        name: varietyName,
        slug: slug,
        normalizedName: varietyName.toLowerCase().trim()
      })
    }
  })

  return varietiesWithSlugs
}

/**
 * Get varieties from farms that have blog articles
 * Complete pipeline: extract from farms -> filter to those with articles
 * @param farms - Array of farm objects
 * @returns Array of variety objects with name and slug
 */
export function getLocationVarietiesWithArticles(farms: FarmWithVarieties[]): VarietyInfo[] {
  const allVarieties = extractVarietiesFromFarms(farms)
  return getVarietiesWithArticles(allVarieties)
}

/**
 * Limit varieties to the most common ones (for UI display)
 * @param farms - Array of farm objects
 * @param limit - Maximum number of varieties to return
 * @returns Array of most common variety objects with name and slug
 */
export function getTopVarietiesWithArticles(farms: FarmWithVarieties[], limit: number = 12): VarietyInfo[] {
  // Count occurrences of each variety
  const varietyCount = new Map<string, number>()

  farms.forEach(farm => {
    if (farm.varieties && typeof farm.varieties === 'string') {
      const varietyList = farm.varieties.split(',').map(v => v.trim()).filter(v => v.length > 0)
      varietyList.forEach(variety => {
        const normalized = variety.toLowerCase().trim()
        varietyCount.set(normalized, (varietyCount.get(normalized) || 0) + 1)
      })
    }
  })

  // Get all varieties with articles
  const varietiesWithArticles = getLocationVarietiesWithArticles(farms)

  // Sort by frequency and limit
  const sortedVarieties = varietiesWithArticles
    .sort((a, b) => {
      const countA = varietyCount.get(a.normalizedName) || 0
      const countB = varietyCount.get(b.normalizedName) || 0
      return countB - countA
    })
    .slice(0, limit)

  return sortedVarieties
}
