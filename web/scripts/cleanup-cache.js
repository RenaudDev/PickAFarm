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

cacheDirectories.forEach(target => {
  if (fs.existsSync(target)) {
    const stats = fs.lstatSync(target);
    if (stats.isDirectory()) {
      deleteFolderRecursive(target);
    } else if (stats.isFile()) {
      fs.unlinkSync(target);
      console.log(`✅ Deleted file: ${target}`);
    }
  } else {
    console.log(`⚠️  Not found: ${target}`);
  }
});

console.log('✨ Cache cleanup complete!');
