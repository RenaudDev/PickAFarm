const https = require('https');
const fs = require('fs');
const path = require('path');

// Generate a static map of the United States
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

if (!apiKey) {
  console.error('Error: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found in environment');
  process.exit(1);
}

const url = `https://maps.googleapis.com/maps/api/staticmap?center=39.8283,-98.5795&zoom=4&size=640x400&scale=2&maptype=roadmap&style=feature:poi|visibility:off&style=feature:transit|visibility:off&key=${apiKey}`;

console.log('Downloading static US map image...');

https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error('Error: Failed to download map. Status:', res.statusCode);
    process.exit(1);
  }

  const dest = fs.createWriteStream(path.join(__dirname, '../public/us-map-static.png'));
  res.pipe(dest);

  dest.on('finish', () => {
    console.log('✓ Static map image saved to public/us-map-static.png');
  });

  dest.on('error', (err) => {
    console.error('Error saving file:', err.message);
    process.exit(1);
  });
}).on('error', (err) => {
  console.error('Error downloading map:', err.message);
  process.exit(1);
});
