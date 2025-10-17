#!/usr/bin/env node

/**
 * GSC Sitemap Diagnostic Tool
 * Checks why GSC might be reporting fewer farms than actually exist
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Configuration
const SITE_URL = 'https://pickafarm.com/';
const KEY_FILE = path.join('c:', 'Users', 'Renaud Gagne', 'Downloads', 'farmsfinder-63f57cd9191d.json');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

async function checkSitemaps() {
  console.log(`${colors.cyan}${colors.bold}GSC Sitemap Diagnostic${colors.reset}`);
  console.log('Checking sitemap status in Google Search Console\n');

  try {
    // Authenticate
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    // Get sitemap list
    console.log(`${colors.blue}Fetching sitemap information...${colors.reset}`);
    const sitemapResponse = await searchconsole.sitemaps.list({
      siteUrl: SITE_URL,
    });

    const sitemaps = sitemapResponse.data.sitemap || [];

    if (sitemaps.length === 0) {
      console.log(`${colors.yellow}No sitemaps found in GSC${colors.reset}`);
      return;
    }

    console.log(`\n${colors.green}Found ${sitemaps.length} sitemap(s):${colors.reset}\n`);

    // Analyze each sitemap
    for (const sitemap of sitemaps) {
      console.log(`${colors.cyan}Sitemap: ${sitemap.path}${colors.reset}`);
      console.log(`  Status: ${sitemap.isPending ? 'Pending' : 'Processed'}`);
      console.log(`  Type: ${sitemap.type}`);

      if (sitemap.lastSubmitted) {
        console.log(`  Last Submitted: ${new Date(sitemap.lastSubmitted).toLocaleDateString()}`);
      }

      if (sitemap.lastDownloaded) {
        console.log(`  Last Downloaded: ${new Date(sitemap.lastDownloaded).toLocaleDateString()}`);
      }

      if (sitemap.contents && sitemap.contents.length > 0) {
        console.log(`  ${colors.bold}Contents:${colors.reset}`);

        let totalUrls = 0;
        for (const content of sitemap.contents) {
          console.log(`    Type: ${content.type}`);
          console.log(`    Submitted: ${content.submitted || 0} URLs`);

          if (content.indexed !== undefined) {
            console.log(`    ${colors.green}Indexed: ${content.indexed}${colors.reset}`);
          }

          totalUrls += (content.submitted || 0);
        }

        console.log(`  ${colors.bold}Total URLs: ${totalUrls}${colors.reset}`);
      }

      if (sitemap.errors) {
        console.log(`  ${colors.red}Errors: ${sitemap.errors}${colors.reset}`);
      }

      if (sitemap.warnings) {
        console.log(`  ${colors.yellow}Warnings: ${sitemap.warnings}${colors.reset}`);
      }

      console.log();
    }

    // Check indexing coverage
    console.log(`${colors.blue}Checking indexing status...${colors.reset}`);

    try {
      const urlInspection = google.searchconsole({ version: 'v1', auth });

      // Test a sample farm URL
      const testUrl = 'https://pickafarm.com/farms/cd-trees/';
      console.log(`\nTesting sample URL: ${testUrl}`);

      const inspectResponse = await urlInspection.urlInspection.index.inspect({
        siteUrl: SITE_URL,
        requestBody: {
          inspectionUrl: testUrl,
          languageCode: 'en-US'
        }
      });

      const result = inspectResponse.data.inspectionResult;
      if (result) {
        console.log(`  Coverage State: ${result.indexStatusResult?.coverageState || 'Unknown'}`);
        console.log(`  Indexing State: ${result.indexStatusResult?.indexingState || 'Unknown'}`);
        console.log(`  Page Fetch State: ${result.indexStatusResult?.pageFetchState || 'Unknown'}`);

        if (result.indexStatusResult?.sitemap) {
          console.log(`  Found in Sitemaps: ${result.indexStatusResult.sitemap.join(', ')}`);
        }
      }
    } catch (err) {
      console.log(`${colors.yellow}Could not inspect URL: ${err.message}${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);

    if (error.message.includes('ENOENT')) {
      console.log('\nMake sure the service account key file exists at:');
      console.log(KEY_FILE);
    }
  }
}

// Local file analysis
function analyzeLocalSitemaps() {
  console.log(`\n${colors.cyan}${colors.bold}Local Sitemap Analysis${colors.reset}`);
  console.log('Checking sitemap files in web/public/\n');

  const sitemapDir = path.join(__dirname, '..', 'web', 'public');
  const sitemapFiles = fs.readdirSync(sitemapDir).filter(f => f.endsWith('.xml'));

  let totalUrls = 0;
  const breakdown = {};

  for (const file of sitemapFiles) {
    const content = fs.readFileSync(path.join(sitemapDir, file), 'utf-8');
    const urlCount = (content.match(/<loc>/g) || []).length;

    breakdown[file] = urlCount;
    totalUrls += urlCount;

    console.log(`  ${file}: ${colors.bold}${urlCount}${colors.reset} URLs`);
  }

  console.log(`\n${colors.green}Total URLs across all sitemaps: ${colors.bold}${totalUrls}${colors.reset}`);

  // Check for specific issues
  console.log(`\n${colors.cyan}Potential Issues:${colors.reset}`);

  if (breakdown['sitemap-farms.xml'] && breakdown['sitemap-farms.xml'] < 800) {
    console.log(`${colors.red}✗ Farm sitemap has only ${breakdown['sitemap-farms.xml']} farms (expected 800+)${colors.reset}`);
  } else if (breakdown['sitemap-farms.xml']) {
    console.log(`${colors.green}✓ Farm sitemap has ${breakdown['sitemap-farms.xml']} farms${colors.reset}`);
  }

  // Check sitemap index
  const indexPath = path.join(sitemapDir, 'sitemap.xml');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const referencedSitemaps = (indexContent.match(/<loc>.*?<\/loc>/g) || []);
    console.log(`\n${colors.blue}Sitemap index references ${referencedSitemaps.length} sub-sitemaps${colors.reset}`);

    // Check if farms sitemap is referenced
    if (indexContent.includes('sitemap-farms.xml')) {
      console.log(`${colors.green}✓ sitemap-farms.xml is properly referenced in index${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ sitemap-farms.xml is NOT referenced in index!${colors.reset}`);
    }
  }
}

// Run both checks
async function main() {
  analyzeLocalSitemaps();
  console.log('\n' + '='.repeat(80) + '\n');
  await checkSitemaps();

  console.log(`\n${colors.cyan}${colors.bold}Diagnosis Summary:${colors.reset}`);
  console.log('\nIf GSC shows fewer farms than your sitemap contains, possible causes:');
  console.log('1. GSC is still processing the sitemap (can take days/weeks)');
  console.log('2. Some farm URLs have crawl errors (404s, redirects)');
  console.log('3. Google has chosen not to index all pages yet');
  console.log('4. Sitemap was recently updated and GSC hasn\'t recrawled');
  console.log('5. There might be multiple sitemaps and GSC is showing partial data');

  console.log('\n' + colors.yellow + 'Recommended Actions:' + colors.reset);
  console.log('1. Check the "Coverage" report in GSC for excluded pages');
  console.log('2. Use URL Inspection tool on sample farm URLs');
  console.log('3. Resubmit sitemap if it was recently updated');
  console.log('4. Check if farm pages have noindex tags or robots.txt blocks');
}

main().catch(console.error);