#!/usr/bin/env node
/**
 * Run multiple scripts in parallel
 * Cross-platform parallel script execution
 */

const { spawn } = require('child_process');
const path = require('path');

// Scripts to run in parallel (after dependencies are met)
const parallelScripts = [
  'generate-search-data.js',
  'generate-categories.js',
  'generate-location-data.js',
  'generate-state-data.js',
  'generate-manifest.js',
  'generate-sitemaps.js',
  'generate-static-map.js'
];

console.log(`🚀 Running ${parallelScripts.length} scripts in parallel...`);

const processes = parallelScripts.map(script => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, script);
    // On Windows, use quoted path to handle spaces
    const proc = spawn(process.platform === 'win32' ? 'node.exe' : 'node', [scriptPath], {
      stdio: 'inherit',
      shell: false,  // Disable shell to avoid path parsing issues
      windowsHide: true
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${script} exited with code ${code}`));
      } else {
        resolve();
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
});

Promise.all(processes)
  .then(() => {
    console.log('✅ All parallel scripts completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error running parallel scripts:', error);
    process.exit(1);
  });
