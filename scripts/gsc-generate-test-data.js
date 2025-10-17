#!/usr/bin/env node

/**
 * GSC Test Data Generator
 * Creates sample CSV files that mimic GSC Coverage exports for testing
 * Based on known problematic patterns from the actual site
 */

const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

class TestDataGenerator {
  constructor() {
    this.exportPath = path.join(__dirname, '..', 'docs', 'gsc', 'exports');
    this.baseUrl = 'https://pickafarm.com';

    // Ensure export directory exists
    if (!fs.existsSync(this.exportPath)) {
      fs.mkdirSync(this.exportPath, { recursive: true });
    }
  }

  /**
   * Generate sample 404 error URLs based on known patterns
   */
  generate404Errors() {
    const errors = [];

    // Pattern 1: Legacy all-farms-near routes
    const legacyLocations = [
      'toronto-on-canada',
      'vancouver-bc-canada',
      'montreal-qc-canada',
      'calgary-ab-canada',
      'chicago-il-us',
      'los-angeles-ca-us',
      'new-york-ny-us',
      'houston-tx-us',
      'miami-fl-us',
      'seattle-wa-us'
    ];

    legacyLocations.forEach(location => {
      errors.push({
        URL: `${this.baseUrl}/all-farms-near/near/${location}/`,
        'Last crawled': '2024-01-15'
      });
    });

    // Pattern 2: US states incorrectly marked as Canada
    const usStatesAsCanada = [
      'chicago-il-canada',
      'los-angeles-ca-canada',
      'new-york-ny-canada',
      'houston-tx-canada',
      'miami-fl-canada',
      'seattle-wa-canada',
      'boston-ma-canada',
      'denver-co-canada',
      'atlanta-ga-canada',
      'phoenix-az-canada'
    ];

    usStatesAsCanada.forEach(location => {
      errors.push({
        URL: `${this.baseUrl}/farms-near/${location}/`,
        'Last crawled': '2024-01-14'
      });
      errors.push({
        URL: `${this.baseUrl}/christmas-tree-farms/near/${location}/`,
        'Last crawled': '2024-01-14'
      });
    });

    // Pattern 3: Full state names instead of abbreviations
    const fullStateNames = [
      { full: 'california', abbr: 'ca' },
      { full: 'texas', abbr: 'tx' },
      { full: 'florida', abbr: 'fl' },
      { full: 'new-york', abbr: 'ny' },
      { full: 'illinois', abbr: 'il' },
      { full: 'pennsylvania', abbr: 'pa' },
      { full: 'massachusetts', abbr: 'ma' },
      { full: 'georgia', abbr: 'ga' },
      { full: 'north-carolina', abbr: 'nc' },
      { full: 'michigan', abbr: 'mi' }
    ];

    fullStateNames.forEach(state => {
      errors.push({
        URL: `${this.baseUrl}/farms-near/city-${state.full}-us/`,
        'Last crawled': '2024-01-13'
      });
      errors.push({
        URL: `${this.baseUrl}/christmas-tree-farms/near/city-${state.full}-us/`,
        'Last crawled': '2024-01-13'
      });
    });

    // Pattern 4: Missing trailing slashes
    const farmsWithoutSlash = [
      'maple-ridge-farm',
      'sunny-acres-orchard',
      'green-valley-farms',
      'heritage-farm-market',
      'autumn-harvest-farm',
      'spring-creek-farm',
      'willow-brook-farms',
      'oak-hill-orchards',
      'pine-grove-farm',
      'riverside-berries'
    ];

    farmsWithoutSlash.forEach(farm => {
      errors.push({
        URL: `${this.baseUrl}/farms/${farm}`,
        'Last crawled': '2024-01-12'
      });
    });

    // Pattern 5: Canadian provinces with -canada instead of -ca
    const canadianCities = [
      'toronto-on-canada',
      'montreal-qc-canada',
      'vancouver-bc-canada',
      'calgary-ab-canada',
      'edmonton-ab-canada',
      'ottawa-on-canada',
      'winnipeg-mb-canada',
      'quebec-city-qc-canada',
      'halifax-ns-canada',
      'saskatoon-sk-canada'
    ];

    canadianCities.forEach(city => {
      errors.push({
        URL: `${this.baseUrl}/farms-near/${city}/`,
        'Last crawled': '2024-01-11'
      });
    });

    // Pattern 6: Private routes that shouldn't be crawled
    const privateRoutes = [
      '/dashboard/',
      '/dashboard/settings/',
      '/dashboard/farms/',
      '/saved-farms/',
      '/saved-farms/notifications/',
      '/claim/farm-123/',
      '/claim/verify/',
      '/api/farms',
      '/api/saved-farms',
      '/admin/login/'
    ];

    privateRoutes.forEach(route => {
      errors.push({
        URL: `${this.baseUrl}${route}`,
        'Last crawled': '2024-01-10'
      });
    });

    // Pattern 7: URLs with double slashes
    const doubleSlashUrls = [
      '/farms-near//toronto-on-ca/',
      '/christmas-tree-farms//near/chicago-il-us/',
      '/farms//maple-farm/',
      '//farms-near/city-state-us/'
    ];

    doubleSlashUrls.forEach(url => {
      errors.push({
        URL: `${this.baseUrl}${url}`,
        'Last crawled': '2024-01-09'
      });
    });

    // Pattern 8: Old file extensions
    const oldFiles = [
      '/about.html',
      '/contact.php',
      '/farms/index.html',
      '/sitemap.xml.gz',
      '/old-page.asp'
    ];

    oldFiles.forEach(file => {
      errors.push({
        URL: `${this.baseUrl}${file}`,
        'Last crawled': '2024-01-08'
      });
    });

    return errors;
  }

  /**
   * Generate sample redirect issue URLs
   */
  generateRedirectIssues() {
    const redirects = [];

    // Variations of URLs that should redirect
    const redirectPatterns = [
      // Without trailing slash that should have one
      { from: '/farms-near/toronto-on-ca', to: '/farms-near/toronto-on-ca/' },
      { from: '/christmas-tree-farms', to: '/christmas-tree-farms/' },
      { from: '/farms/sample-farm', to: '/farms/sample-farm/' },

      // Case variations
      { from: '/Farms-Near/Toronto-ON-CA/', to: '/farms-near/toronto-on-ca/' },
      { from: '/CHRISTMAS-TREE-FARMS/', to: '/christmas-tree-farms/' },

      // Legacy category URLs
      { from: '/category/christmas-trees/', to: '/christmas-tree-farms/' },
      { from: '/category/pumpkin-patches/', to: '/pumpkin-patches/' },

      // Old location format
      { from: '/locations/toronto/', to: '/farms-near/toronto-on-ca/' },
      { from: '/locations/chicago/', to: '/farms-near/chicago-il-us/' },

      // Query parameters
      { from: '/farms-near/city-st-us/?page=2', to: '/farms-near/city-st-us/' },
      { from: '/farms/farm-name/?ref=google', to: '/farms/farm-name/' }
    ];

    // Create multiple instances of each pattern
    redirectPatterns.forEach(pattern => {
      for (let i = 0; i < 20; i++) {
        const variation = pattern.from.replace('toronto', `city${i}`)
          .replace('sample-farm', `farm${i}`)
          .replace('city-st', `city${i}-st`);

        redirects.push({
          URL: `${this.baseUrl}${variation}`,
          'Last crawled': '2024-01-07'
        });
      }
    });

    return redirects;
  }

  /**
   * Generate sample noindex issue URLs
   */
  generateNoindexIssues() {
    const noindex = [];

    // Pages that have noindex but shouldn't
    const shouldBeIndexed = [
      '/farms-near/toronto-on-ca/',
      '/christmas-tree-farms/',
      '/farms/heritage-farm/'
    ];

    // Pages that should have noindex
    const shouldNotBeIndexed = [
      '/dashboard/',
      '/saved-farms/',
      '/api/farms',
      '/claim/verify/',
      '/admin/'
    ];

    [...shouldBeIndexed, ...shouldNotBeIndexed].forEach(url => {
      noindex.push({
        URL: `${this.baseUrl}${url}`,
        'Last crawled': '2024-01-06'
      });
    });

    return noindex;
  }

  /**
   * Convert array to CSV format
   */
  arrayToCSV(data) {
    if (data.length === 0) return '';

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV string
    let csv = headers.join(',') + '\n';

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csv += values.join(',') + '\n';
    });

    return csv;
  }

  /**
   * Save CSV file
   */
  saveCSV(filename, data) {
    const csvContent = this.arrayToCSV(data);
    const filepath = path.join(this.exportPath, filename);
    fs.writeFileSync(filepath, csvContent);
    return filepath;
  }

  /**
   * Main execution
   */
  run() {
    console.log(`${colors.cyan}${colors.bold}GSC Test Data Generator${colors.reset}`);
    console.log(`Generating sample GSC export files for testing...\n`);

    // Generate 404 errors
    const errors404 = this.generate404Errors();
    const errors404Path = this.saveCSV('404-errors.csv', errors404);
    console.log(`${colors.green}✓${colors.reset} Generated ${colors.bold}${errors404.length}${colors.reset} sample 404 errors`);
    console.log(`  Saved to: ${errors404Path}`);

    // Generate redirect issues
    const redirects = this.generateRedirectIssues();
    const redirectsPath = this.saveCSV('redirect-issues.csv', redirects);
    console.log(`${colors.green}✓${colors.reset} Generated ${colors.bold}${redirects.length}${colors.reset} sample redirect issues`);
    console.log(`  Saved to: ${redirectsPath}`);

    // Generate noindex issues
    const noindex = this.generateNoindexIssues();
    const noindexPath = this.saveCSV('noindex-issues.csv', noindex);
    console.log(`${colors.green}✓${colors.reset} Generated ${colors.bold}${noindex.length}${colors.reset} sample noindex issues`);
    console.log(`  Saved to: ${noindexPath}`);

    console.log(`\n${colors.cyan}${colors.bold}Test Data Summary${colors.reset}`);
    console.log('─'.repeat(50));
    console.log(`Total test URLs generated: ${colors.bold}${errors404.length + redirects.length + noindex.length}${colors.reset}`);
    console.log(`\nPattern coverage:`);
    console.log(`  • Legacy routes (/all-farms-near/)`)
    console.log(`  • Wrong country codes (US states as Canada)`);
    console.log(`  • Full state names (california vs ca)`);
    console.log(`  • Missing trailing slashes`);
    console.log(`  • Canadian provinces (-canada vs -ca)`);
    console.log(`  • Private routes (dashboard, API)`);
    console.log(`  • Double slashes in URLs`);
    console.log(`  • Old file extensions (.html, .php)`);

    console.log(`\n${colors.yellow}Note:${colors.reset} These are sample URLs for testing.`);
    console.log(`Replace with actual GSC exports for production debugging.`);

    console.log(`\n${colors.green}${colors.bold}Next Steps:${colors.reset}`);
    console.log(`1. Run: ${colors.cyan}node scripts/gsc-enhanced-analyzer.js${colors.reset}`);
    console.log(`2. Run: ${colors.cyan}node scripts/gsc-redirect-validator.js${colors.reset}`);
    console.log(`3. Or use: ${colors.cyan}scripts\\gsc-diagnostic.bat${colors.reset} for guided workflow`);
  }
}

// Run the generator
const generator = new TestDataGenerator();
generator.run();