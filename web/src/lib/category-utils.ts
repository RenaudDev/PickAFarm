/**
 * Category Utilities
 * 
 * Helper functions for filtering farms by category.
 * Used for category pages with interactive maps.
 */

import farmsData from '../../data/farms.json'

export interface CategoryFarm {
  id: string
  name: string
  slug: string
  street: string
  city_name: string
  state_province: string
  country: string
  postal_code: string
  latitude: number
  longitude: number
  phone: string
  email: string
  website: string | null
  facebook: string | null
  instagram: string | null
  description: string
  categories: string
  type: string
  amenities: string | null
  varieties: string | null
  pet_friendly: number
  price_range: string | null
  verified: number
  featured: number
  active: number
  updated_at: string
  payment_methods: string | null
  opening_date: string | null
  closing_date: string | null
  reviews: number
  rating: number
}

/**
 * Get all farms that match a specific category
 * @param categoryName - Full category name (e.g., "Christmas Tree Farms")
 * @returns Array of farms matching the category
 */
export function getFarmsForCategory(categoryName: string): CategoryFarm[] {
  const variations = getCategoryVariations(categoryName)
  
  const matchingFarms = farmsData
    .filter(farm => farm.active === 1)
    .filter(farm => {
      if (!farm.categories) return false
      
      // Split farm categories and normalize
      const farmCategories = farm.categories
        .split(',')
        .map(c => c.trim().toLowerCase())
      
      // Check if any variation matches any farm category
      return variations.some(variation => 
        farmCategories.some(farmCat => 
          farmCat.includes(variation.toLowerCase())
        )
      )
    })
  
  return matchingFarms as CategoryFarm[]
}

/**
 * Get category name variations for flexible matching
 * Handles different ways categories might be named in farm data
 * 
 * @param categoryName - Category name from category-content.json
 * @returns Array of possible variations to match against
 */
export function getCategoryVariations(categoryName: string): string[] {
  const variations = [categoryName]
  
  // Christmas Tree variations
  if (categoryName.includes('Christmas Tree')) {
    variations.push('Christmas Tree', 'Christmas Trees', 'Christmas Tree Farms')
  }
  
  // Apple variations
  if (categoryName.includes('Apple')) {
    variations.push('Apple', 'Apple Orchard', 'Apple Picking', 'Apple Orchards')
  }
  
  // Pumpkin variations
  if (categoryName.includes('Pumpkin')) {
    variations.push('Pumpkin', 'Pumpkin Patch', 'Pumpkin Patches')
  }
  
  // Berry variations
  if (categoryName.includes('Berry')) {
    variations.push('Berry', 'Berry Farm', 'Berry Picking', 'Berry Farms', 'Berries')
  }
  
  // Corn Maze variations
  if (categoryName.includes('Corn Maze')) {
    variations.push('Corn Maze', 'Corn Mazes', 'Maize Maze')
  }
  
  // Strawberry (specific berry type)
  if (categoryName.includes('Strawberry')) {
    variations.push('Strawberry', 'Strawberries', 'Strawberry Picking')
  }
  
  // Blueberry (specific berry type)
  if (categoryName.includes('Blueberry')) {
    variations.push('Blueberry', 'Blueberries', 'Blueberry Picking')
  }
  
  // Raspberry (specific berry type)
  if (categoryName.includes('Raspberry')) {
    variations.push('Raspberry', 'Raspberries', 'Raspberry Picking')
  }
  
  // Peach variations
  if (categoryName.includes('Peach')) {
    variations.push('Peach', 'Peaches', 'Peach Orchard')
  }
  
  // Cherry variations
  if (categoryName.includes('Cherry')) {
    variations.push('Cherry', 'Cherries', 'Cherry Picking')
  }
  
  // Vegetable variations
  if (categoryName.includes('Vegetable')) {
    variations.push('Vegetable', 'Vegetables', 'Veggie', 'Produce')
  }
  
  // Flower variations
  if (categoryName.includes('Flower')) {
    variations.push('Flower', 'Flowers', 'Flower Picking', 'Cut Flowers')
  }
  
  // Sunflower (specific flower type)
  if (categoryName.includes('Sunflower')) {
    variations.push('Sunflower', 'Sunflowers')
  }
  
  // Maple Syrup / Sugar Bush
  if (categoryName.includes('Maple') || categoryName.includes('Sugar')) {
    variations.push('Maple', 'Maple Syrup', 'Sugar Bush', 'Sugarbush')
  }
  
  // Winery / Vineyard
  if (categoryName.includes('Winery') || categoryName.includes('Vineyard')) {
    variations.push('Winery', 'Vineyard', 'Wine', 'Grapes')
  }
  
  // Petting Zoo / Farm Animals
  if (categoryName.includes('Petting Zoo') || categoryName.includes('Animal')) {
    variations.push('Petting Zoo', 'Farm Animals', 'Animals', 'Zoo')
  }
  
  // Hayride
  if (categoryName.includes('Hayride')) {
    variations.push('Hayride', 'Hay Ride', 'Hayrides')
  }
  
  return variations
}

/**
 * Get count of farms for a category
 * Useful for validation and displaying counts
 */
export function getCategoryFarmCount(categoryName: string): number {
  return getFarmsForCategory(categoryName).length
}

/**
 * Check if a farm matches a specific category
 * Useful for individual farm validation
 */
export function farmMatchesCategory(farm: any, categoryName: string): boolean {
  if (!farm.categories) return false

  const variations = getCategoryVariations(categoryName)
  const farmCategories = farm.categories
    .split(',')
    .map((c: string) => c.trim().toLowerCase())

  return variations.some(variation =>
    farmCategories.some((farmCat: string) =>
      farmCat.includes(variation.toLowerCase())
    )
  )
}

/**
 * Get emoji icon for a farm category
 * Used across the app to display consistent category icons
 *
 * @param category - Category name (e.g., "Christmas Trees", "Apple Orchards")
 * @returns Emoji string representing the category
 */
export function getCategoryEmoji(category: string): string {
  const lowerCategory = category.toLowerCase()

  if (lowerCategory.includes('christmas') || lowerCategory.includes('tree')) return '🎄'
  if (lowerCategory.includes('apple')) return '🍎'
  if (lowerCategory.includes('berry')) return '🫐'
  if (lowerCategory.includes('pumpkin')) return '🎃'
  if (lowerCategory.includes('corn')) return '🌽'
  if (lowerCategory.includes('maple') || lowerCategory.includes('sugar')) return '🍁'
  if (lowerCategory.includes('vegetable') || lowerCategory.includes('veggie')) return '🥕'
  if (lowerCategory.includes('flower')) return '🌻'
  if (lowerCategory.includes('vineyard') || lowerCategory.includes('wine')) return '🍇'
  if (lowerCategory.includes('zoo') || lowerCategory.includes('petting')) return '🐐'

  return '🌾' // Default farm emoji
}
