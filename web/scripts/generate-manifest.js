const fs = require('fs');
const path = require('path');

// Import category data
const categoryContent = require('../data/category-content.json');

// Base manifest configuration
const baseManifest = {
  "name": "Pick A Farm - Find Local U-Pick Farms",
  "short_name": "Pick A Farm",
  "description": "Discover the best pick-your-own farms. Fresh produce, family activities, and seasonal fun await!",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#22c55e",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "en-CA",
  "categories": ["agriculture", "food", "lifestyle", "travel"],
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ]
};

// Generate shortcuts dynamically from category data
function generateShortcuts() {
  const shortcuts = [];
  
  // Get all categories and sort by name for consistency
  const categories = Object.values(categoryContent)
    .filter(category => category && category.slug && category.name)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 4); // Limit to top 4 categories for shortcuts
  
  categories.forEach(category => {
    shortcuts.push({
      "name": `Find ${category.name}`,
      "short_name": category.name,
      "description": `Find ${category.name.toLowerCase()} near you`,
      "url": `/${category.slug}`,
      "icons": [
        {
          "src": "/android-chrome-192x192.png",
          "sizes": "192x192"
        }
      ]
    });
  });
  
  return shortcuts;
}

// Generate the complete manifest
function generateManifest() {
  const shortcuts = generateShortcuts();
  const manifest = {
    ...baseManifest,
    shortcuts
  };
  
  return manifest;
}

// Write the manifest file
function writeManifest() {
  try {
    const manifest = generateManifest();
    const manifestPath = path.join(__dirname, '../public/site.webmanifest');
    
    // Ensure the public directory exists
    const publicDir = path.dirname(manifestPath);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write the manifest file
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('✅ Generated site.webmanifest with dynamic shortcuts:');
    manifest.shortcuts.forEach(shortcut => {
      console.log(`   - ${shortcut.name} (${shortcut.url})`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error generating manifest:', error);
    return false;
  }
}

// Run the script
if (require.main === module) {
  writeManifest();
}

module.exports = { generateManifest, writeManifest };
