// Mapping table for farm variety names to WordPress variety slugs
const VARIETY_SLUG_MAP: Record<string, string> = {
    // Firs
    "balsam fir": "balsam-fir-christmas-trees",
    "fraser fir": "fraser-fir-christmas-trees",
    "canaan fir": "canaan-fir-christmas-trees",
    "concolor fir": "concolor-fir-christmas-trees",
    "grand fir": "grand-fir-christmas-trees",
    "noble fir": "noble-fir-christmas-trees",
    "nordmann fir": "nordmann-fir-christmas-trees",
    "douglas fir": "douglas-fir-christmas-trees",
    "cook blue fir": "cook-blue-fir-christmas-trees",
    
    // Spruces
    "white spruce": "white-spruce-christmas-trees",
    "norway spruce": "norway-spruce-christmas-trees",
    "colorado blue spruce": "colorado-blue-spruce-christmas-trees",
    "serbian spruce": "serbian-spruce-christmas-trees",
    
    // Pines
    "white pine": "white-pine-christmas-trees",
    "scotch pine": "scotch-pine-christmas-trees",
    "monterrey pine": "monterrey-pines-christmas-trees",
    "lodgepole pine": "lodgepole-pine-christmas-trees",
  }
  
  export function getVarietySlug(varietyName: string): string | null {
    const normalized = varietyName.toLowerCase().trim()
    return VARIETY_SLUG_MAP[normalized] || null
  }