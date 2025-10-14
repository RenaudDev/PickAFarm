const https = require('https');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '../public/us-map-static.png');

// Check if file already exists (committed to repo)
if (fs.existsSync(outputPath)) {
  console.log('✓ Static map image already exists at public/us-map-static.png');
  process.exit(0);
}

// Generate a static map of the United States
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

if (!apiKey) {
  console.warn('Warning: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found in environment');
  console.warn('Skipping static map generation (file should exist in repo)');
  process.exit(0);
}

// Generate mobile-optimized map: 640x400 at scale 1 (not 2) to reduce file size
// This matches mobile viewport better and reduces the 45KB waste Lighthouse found
const url = `https://maps.googleapis.com/maps/api/staticmap?center=39.8283,-98.5795&zoom=4&size=640x400&scale=1&maptype=roadmap&style=feature:poi|visibility:off&style=feature:transit|visibility:off&key=${apiKey}`;

console.log('Downloading mobile-optimized static US map image (640x400)...');

https
  .get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error('Error: Failed to download map. Status:', res.statusCode);
      process.exit(1);
    }

    const dest = fs.createWriteStream(outputPath);
    res.pipe(dest);

    dest.on('finish', () => {
      console.log('✓ Static map image saved to public/us-map-static.png');
    });

    dest.on('error', (err) => {
      console.error('Error saving file:', err.message);
      process.exit(1);
    });
  })
  .on('error', (err) => {
    console.error('Error downloading map:', err.message);
    process.exit(1);
  });
