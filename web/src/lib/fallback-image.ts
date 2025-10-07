/**
 * Fallback Image Generator for Farms
 *
 * Generates placeholder images when custom logo/background not available
 */

/**
 * Generate a color based on farm name (consistent hashing)
 * @param farmName - Name of the farm
 * @returns Hex color code
 */
function getColorFromName(farmName: string): string {
  // Simple hash function to generate consistent colors
  let hash = 0;
  for (let i = 0; i < farmName.length; i++) {
    hash = farmName.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate pleasant colors (avoid too dark or too light)
  const colors = [
    '#10b981', // Green
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#84cc16', // Lime
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Generate fallback logo with farm's first letter
 * Returns a data URI SVG that can be used directly in img src
 *
 * @param farmName - Name of the farm
 * @returns Data URI string for SVG image
 */
export function generateFallbackLogo(farmName: string): string {
  if (!farmName) {
    farmName = 'Farm';
  }

  const firstLetter = farmName.charAt(0).toUpperCase();
  const bgColor = getColorFromName(farmName);

  // Create SVG with first letter in a colored circle
  const svg = `
    <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="150" height="150" fill="${bgColor}" rx="8"/>
      <text
        x="50%"
        y="50%"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="64"
        font-weight="600"
        fill="white"
        text-anchor="middle"
        dominant-baseline="central"
      >${firstLetter}</text>
    </svg>
  `.trim();

  // Convert to data URI
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Get the default background image path
 * @returns Path to default background image
 */
export function getDefaultBackground(): string {
  return '/images/farms/background.webp';
}

/**
 * Check if a URL is valid and not empty
 * @param url - URL to check
 * @returns True if URL is valid
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Basic URL validation
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
