const fs = require('fs');
const path = require('path');

/**
 * Cleanup script to remove cache files after build
 * This prevents Cloudflare Pages from hitting the 25 MiB file size limit
 */

const cacheDirectories = [
  path.join(__dirname, '..', '.next', 'cache'),
  path.join(__dirname, '..', '.next', 'trace')
];

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
    console.log(`✅ Deleted: ${directoryPath}`);
  }
}

console.log('🧹 Cleaning up cache files...');

cacheDirectories.forEach(dir => {
  if (fs.existsSync(dir)) {
    deleteFolderRecursive(dir);
  } else {
    console.log(`⚠️  Directory not found: ${dir}`);
  }
});

console.log('✨ Cache cleanup complete!');
