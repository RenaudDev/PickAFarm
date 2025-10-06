const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const Critters = require('critters');

async function inlineCriticalCSS() {
  console.log('🎨 Starting critical CSS inlining...');

  const outDir = path.join(__dirname, '../out');

  // Check if out directory exists
  if (!fs.existsSync(outDir)) {
    console.error('❌ Error: out/ directory not found. Run build first.');
    process.exit(1);
  }

  const critters = new Critters({
    path: outDir,
    publicPath: '/',
    preload: 'swap',
    noscriptFallback: true,
    inlineFonts: false, // Don't inline fonts (keep them external)
    logLevel: 'info',
    pruneSource: false, // Keep the original CSS file
  });

  // Find all HTML files
  const htmlFiles = await glob('**/*.html', { cwd: outDir });
  console.log(`📄 Found ${htmlFiles.length} HTML files`);

  let processedCount = 0;

  for (const file of htmlFiles) {
    const filePath = path.join(outDir, file);
    const html = fs.readFileSync(filePath, 'utf8');

    try {
      // Process HTML with Critters
      const inlinedHtml = await critters.process(html);

      // Write back to file
      fs.writeFileSync(filePath, inlinedHtml);
      processedCount++;

      if (processedCount % 10 === 0) {
        console.log(`   Processed ${processedCount}/${htmlFiles.length} files...`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  console.log(`✓ Successfully inlined critical CSS in ${processedCount} files`);
}

inlineCriticalCSS().catch(err => {
  console.error('❌ Critical CSS inlining failed:', err);
  process.exit(1);
});
