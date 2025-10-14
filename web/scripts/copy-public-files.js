const fs = require('fs');
const path = require('path');

/**
 * Copy specific public files that Next.js static export doesn't automatically copy
 * This is a workaround for Next.js not copying all public files to the out directory
 */

const filesToCopy = ['sw.js', 'us-map-static.webp', 'us-map-static.png', '_headers'];

const publicDir = path.join(__dirname, '..', 'public');
const outDir = path.join(__dirname, '..', 'out');

console.log('Copying additional public files to out directory...');

filesToCopy.forEach((file) => {
  const src = path.join(publicDir, file);
  const dest = path.join(outDir, file);

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file}`);
  } else {
    console.log(`⚠ Skipped ${file} (not found in public/)`);
  }
});

console.log('Done copying public files.');
