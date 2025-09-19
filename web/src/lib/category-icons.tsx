import React from "react"
import { Apple, Grape, TreePine, Wheat, Cherry, Carrot, Flower2, LucideIcon } from "lucide-react"

// Centralized icon mapping for categories
const iconMap: { [key: string]: LucideIcon } = {
  'Apple Orchard': Apple,
  'Apple Orchards': Apple,
  'Berry Farm': Grape,
  'Berry Farms': Grape,
  'Christmas Tree Farms': TreePine,
  'Christmas Trees': TreePine,
  'Pumpkin Patch': Wheat,
  'Pumpkin Patches': Wheat,
  'Corn Maze': Wheat,
  'U-Pick': Cherry,
  'Cut Your Own': TreePine,
  'Vegetable Farm': Carrot,
  'Flower Farm': Flower2,
}

/**
 * Get the appropriate icon component for a category name
 * @param categoryName - The name of the category
 * @returns The corresponding Lucide icon component
 */
export const getCategoryIcon = (categoryName: string): LucideIcon => {
  // Try exact match first
  if (iconMap[categoryName]) {
    return iconMap[categoryName]
  }
  
  // Try partial matches for flexibility
  const lowerCaseName = categoryName.toLowerCase()
  
  if (lowerCaseName.includes('apple')) return Apple
  if (lowerCaseName.includes('berry')) return Grape
  if (lowerCaseName.includes('christmas') || lowerCaseName.includes('tree')) return TreePine
  if (lowerCaseName.includes('pumpkin') || lowerCaseName.includes('corn')) return Wheat
  if (lowerCaseName.includes('vegetable') || lowerCaseName.includes('veggie')) return Carrot
  if (lowerCaseName.includes('flower')) return Flower2
  if (lowerCaseName.includes('pick') || lowerCaseName.includes('cherry')) return Cherry
  
  // Default fallback
  return Wheat
}

/**
 * Get category icon as JSX element with optional styling
 * @param categoryName - The name of the category
 * @param className - Optional CSS classes to apply
 * @returns JSX element with the icon
 */
export const CategoryIcon: React.FC<{ 
  categoryName: string
  className?: string 
}> = ({ 
  categoryName, 
  className = "h-5 w-5" 
}) => {
  const IconComponent = getCategoryIcon(categoryName)
  return <IconComponent className={className} />
}

/**
 * Display multiple category icons in a horizontal list
 * @param categories - Array of category names or comma-separated string
 * @param className - Optional CSS classes for each icon
 * @param maxIcons - Maximum number of icons to display (default: 3)
 * @returns JSX element with horizontal list of category icons
 */
export const CategoryIconList: React.FC<{
  categories: string[] | string
  className?: string
  maxIcons?: number
}> = ({
  categories,
  className = "h-4 w-4",
  maxIcons = 3
}) => {
  // Parse categories - handle both array and comma-separated string
  let categoryArray: string[] = []
  
  if (typeof categories === 'string') {
    // Handle comma-separated string or JSON string
    try {
      const parsed = JSON.parse(categories)
      categoryArray = Array.isArray(parsed) ? parsed : [categories]
    } catch {
      // If not JSON, split by comma
      categoryArray = categories.split(',').map(cat => cat.trim())
    }
  } else {
    categoryArray = categories
  }

  // Limit to maxIcons and filter out empty strings
  const displayCategories = categoryArray
    .filter(cat => cat && cat.trim())
    .slice(0, maxIcons)

  return (
    <div className="flex items-center gap-1">
      {displayCategories.map((category, index) => {
        const IconComponent = getCategoryIcon(category.trim())
        return (
          <div
            key={index}
            className="p-1 bg-primary/10 rounded-full flex items-center justify-center"
            title={category.trim()}
          >
            <IconComponent className={className} />
          </div>
        )
      })}
      {categoryArray.length > maxIcons && (
        <div className="text-xs text-muted-foreground ml-1">
          +{categoryArray.length - maxIcons}
        </div>
      )}
    </div>
  )
}
