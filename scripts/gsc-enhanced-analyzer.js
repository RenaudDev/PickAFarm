#!/usr/bin/env node

/**
 * Enhanced GSC Export Analyzer
 * Systematically analyzes GSC Coverage exports to identify exact problem patterns
 * Generates validated fixes based on actual data, not guesses
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

class GSCAnalyzer {
  constructor() {
    this.exportPath = path.join(__dirname, '..', 'docs', 'gsc', 'exports');
    this.fixesPath = path.join(__dirname, '..', 'docs', 'gsc', 'fixes');
    this.errors404 = [];
    this.redirectIssues = [];
    this.noindexIssues = [];
    this.patterns = {};
    this.recommendations = [];

    // Ensure directories exist
    if (!fs.existsSync(this.exportPath)) {
      fs.mkdirSync(this.exportPath, { recursive: true });
    }
    if (!fs.existsSync(this.fixesPath)) {
      fs.mkdirSync(this.fixesPath, { recursive: true });
    }
  }

  /**
   * Load CSV exports from GSC
   */
  loadExports() {
    console.log(`${colors.cyan}${colors.bold}Loading GSC Exports${colors.reset}`);
    console.log(`${colors.gray}${'='.repeat(80)}${colors.reset}\n`);

    // Try to load 404 errors
    const errors404Path = path.join(this.exportPath, '404-errors.csv');
    if (fs.existsSync(errors404Path)) {
      const content = fs.readFileSync(errors404Path, 'utf-8');
      this.errors404 = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      console.log(`${colors.green}✓${colors.reset} Loaded ${colors.bold}${this.errors404.length}${colors.reset} 404 errors`);
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} No 404 errors export found at ${errors404Path}`);
    }

    // Try to load redirect issues
    const redirectPath = path.join(this.exportPath, 'redirect-issues.csv');
    if (fs.existsSync(redirectPath)) {
      const content = fs.readFileSync(redirectPath, 'utf-8');
      this.redirectIssues = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      console.log(`${colors.green}✓${colors.reset} Loaded ${colors.bold}${this.redirectIssues.length}${colors.reset} redirect issues`);
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} No redirect issues export found at ${redirectPath}`);
    }

    // Try to load noindex issues
    const noindexPath = path.join(this.exportPath, 'noindex-issues.csv');
    if (fs.existsSync(noindexPath)) {
      const content = fs.readFileSync(noindexPath, 'utf-8');
      this.noindexIssues = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      console.log(`${colors.green}✓${colors.reset} Loaded ${colors.bold}${this.noindexIssues.length}${colors.reset} noindex issues`);
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} No noindex issues export found at ${noindexPath}`);
    }

    console.log();
    return this.errors404.length + this.redirectIssues.length + this.noindexIssues.length > 0;
  }

  /**
   * Extract path from full URL
   */
  extractPath(url) {
    if (!url) return '';
    // Remove protocol and domain
    return url.replace(/^https?:\/\/[^\/]+/, '');
  }

  /**
   * Analyze patterns in URLs
   */
  analyzePatterns() {
    console.log(`${colors.cyan}${colors.bold}Analyzing URL Patterns${colors.reset}`);
    console.log(`${colors.gray}${'='.repeat(80)}${colors.reset}\n`);

    this.patterns = {
      // Legacy route patterns
      allFarmsNear: [],           // /all-farms-near/near/*

      // Location patterns
      wrongCountryCode: [],       // US states with -canada
      fullStateNames: [],         // Using full state names instead of abbreviations
      canadaInsteadOfCa: [],      // Using -canada instead of -ca

      // URL structure issues
      missingTrailingSlash: [],   // URLs without trailing slash
      doubleSlashes: [],          // URLs with // (not in protocol)
      upperCaseChars: [],         // URLs with uppercase characters

      // Query and fragments
      queryParameters: [],        // URLs with ?param=value
      hashFragments: [],          // URLs with #fragment

      // File extensions
      htmlFiles: [],              // .html, .htm
      phpFiles: [],               // .php
      xmlFiles: [],               // .xml (except sitemaps)

      // Private routes that shouldn't be crawled
      apiRoutes: [],              // /api/*
      dashboardRoutes: [],        // /dashboard/*
      savedFarmsRoutes: [],       // /saved-farms/*
      claimRoutes: [],            // /claim/*
      adminRoutes: [],            // /admin/*

      // Farm-specific patterns
      farmsWithoutSlash: [],      // /farms/farm-name (no trailing slash)
      malformedFarmUrls: [],      // Incorrectly formatted farm URLs

      // Category patterns
      wrongCategoryFormat: [],    // Incorrect category URL format

      // Unknown patterns
      unknown: []
    };

    // Analyze all URLs
    const allUrls = [
      ...this.errors404.map(r => ({ url: this.extractPath(r.URL || r.url || ''), type: '404' })),
      ...this.redirectIssues.map(r => ({ url: this.extractPath(r.URL || r.url || ''), type: 'redirect' })),
      ...this.noindexIssues.map(r => ({ url: this.extractPath(r.URL || r.url || ''), type: 'noindex' }))
    ];

    for (const { url, type } of allUrls) {
      if (!url) continue;

      let matched = false;

      // Check legacy routes
      if (url.includes('/all-farms-near/near/')) {
        this.patterns.allFarmsNear.push({ url, type });
        matched = true;
      }

      // Check wrong country codes
      const usStates = 'al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy';
      const wrongCountryPattern = new RegExp(`-(${usStates})-canada(/|$)`);
      if (wrongCountryPattern.test(url)) {
        this.patterns.wrongCountryCode.push({ url, type });
        matched = true;
      }

      // Check full state names
      const fullStates = [
        'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
        'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
        'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
        'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
        'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
        'new-hampshire', 'new-jersey', 'new-mexico', 'new-york',
        'north-carolina', 'north-dakota', 'ohio', 'oklahoma', 'oregon',
        'pennsylvania', 'rhode-island', 'south-carolina', 'south-dakota',
        'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
        'west-virginia', 'wisconsin', 'wyoming'
      ];

      for (const stateName of fullStates) {
        if (url.includes(`-${stateName}-`)) {
          this.patterns.fullStateNames.push({ url, type });
          matched = true;
          break;
        }
      }

      // Check Canada vs CA
      const provinces = 'ab|bc|mb|nb|nl|nt|ns|nu|on|pe|qc|sk|yt';
      const canadaPattern = new RegExp(`-(${provinces})-canada(/|$)`);
      if (canadaPattern.test(url)) {
        this.patterns.canadaInsteadOfCa.push({ url, type });
        matched = true;
      }

      // Check missing trailing slash
      if (!url.endsWith('/') && !url.includes('.') && !url.includes('?') && !url.includes('#')) {
        this.patterns.missingTrailingSlash.push({ url, type });
        matched = true;
      }

      // Check double slashes
      const urlWithoutProtocol = url.replace(/^https?:\/\//, '');
      if (urlWithoutProtocol.includes('//')) {
        this.patterns.doubleSlashes.push({ url, type });
        matched = true;
      }

      // Check uppercase characters
      if (url !== url.toLowerCase()) {
        this.patterns.upperCaseChars.push({ url, type });
        matched = true;
      }

      // Check query parameters
      if (url.includes('?')) {
        this.patterns.queryParameters.push({ url, type });
        matched = true;
      }

      // Check hash fragments
      if (url.includes('#')) {
        this.patterns.hashFragments.push({ url, type });
        matched = true;
      }

      // Check file extensions
      if (url.endsWith('.html') || url.endsWith('.htm')) {
        this.patterns.htmlFiles.push({ url, type });
        matched = true;
      } else if (url.endsWith('.php')) {
        this.patterns.phpFiles.push({ url, type });
        matched = true;
      } else if (url.endsWith('.xml') && !url.includes('sitemap')) {
        this.patterns.xmlFiles.push({ url, type });
        matched = true;
      }

      // Check private routes
      if (url.startsWith('/api/')) {
        this.patterns.apiRoutes.push({ url, type });
        matched = true;
      } else if (url.includes('/dashboard')) {
        this.patterns.dashboardRoutes.push({ url, type });
        matched = true;
      } else if (url.includes('/saved-farms')) {
        this.patterns.savedFarmsRoutes.push({ url, type });
        matched = true;
      } else if (url.includes('/claim')) {
        this.patterns.claimRoutes.push({ url, type });
        matched = true;
      } else if (url.includes('/admin')) {
        this.patterns.adminRoutes.push({ url, type });
        matched = true;
      }

      // Check farm-specific patterns
      if (url.startsWith('/farms/') && !url.endsWith('/')) {
        this.patterns.farmsWithoutSlash.push({ url, type });
        matched = true;
      }

      // If no pattern matched, add to unknown
      if (!matched) {
        this.patterns.unknown.push({ url, type });
      }
    }

    // Display pattern statistics
    for (const [patternName, urls] of Object.entries(this.patterns)) {
      if (urls.length > 0) {
        const displayName = patternName
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();

        console.log(`${colors.yellow}${displayName}:${colors.reset} ${colors.bold}${urls.length}${colors.reset} URLs`);

        // Show examples
        const examples = urls.slice(0, 2);
        for (const { url, type } of examples) {
          console.log(`  ${colors.gray}[${type}] ${url}${colors.reset}`);
        }
        if (urls.length > 2) {
          console.log(`  ${colors.gray}... and ${urls.length - 2} more${colors.reset}`);
        }
      }
    }

    console.log();
  }

  /**
   * Generate redirect fixes
   */
  generateRedirectFixes() {
    console.log(`${colors.cyan}${colors.bold}Generating Redirect Fixes${colors.reset}`);
    console.log(`${colors.gray}${'='.repeat(80)}${colors.reset}\n`);

    const redirects = [];
    const robotsDisallow = [];

    // Fix legacy routes
    if (this.patterns.allFarmsNear.length > 0) {
      redirects.push({
        comment: '// Legacy all-farms-near routes',
        source: '/all-farms-near/near/:location/',
        destination: '/farms-near/:location/',
        permanent: true
      });
    }

    // Fix wrong country codes
    if (this.patterns.wrongCountryCode.length > 0) {
      redirects.push({
        comment: '// US states incorrectly marked as Canada',
        source: '/:path*-:state(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)-canada/',
        destination: '/:path*-:state-us/',
        permanent: true
      });
    }

    // Fix full state names
    if (this.patterns.fullStateNames.length > 0) {
      const stateMap = {
        'alabama': 'al', 'alaska': 'ak', 'arizona': 'az', 'arkansas': 'ar',
        'california': 'ca', 'colorado': 'co', 'connecticut': 'ct', 'delaware': 'de',
        'florida': 'fl', 'georgia': 'ga', 'hawaii': 'hi', 'idaho': 'id',
        'illinois': 'il', 'indiana': 'in', 'iowa': 'ia', 'kansas': 'ks',
        'kentucky': 'ky', 'louisiana': 'la', 'maine': 'me', 'maryland': 'md',
        'massachusetts': 'ma', 'michigan': 'mi', 'minnesota': 'mn', 'mississippi': 'ms',
        'missouri': 'mo', 'montana': 'mt', 'nebraska': 'ne', 'nevada': 'nv',
        'new-hampshire': 'nh', 'new-jersey': 'nj', 'new-mexico': 'nm', 'new-york': 'ny',
        'north-carolina': 'nc', 'north-dakota': 'nd', 'ohio': 'oh', 'oklahoma': 'ok',
        'oregon': 'or', 'pennsylvania': 'pa', 'rhode-island': 'ri', 'south-carolina': 'sc',
        'south-dakota': 'sd', 'tennessee': 'tn', 'texas': 'tx', 'utah': 'ut',
        'vermont': 'vt', 'virginia': 'va', 'washington': 'wa', 'west-virginia': 'wv',
        'wisconsin': 'wi', 'wyoming': 'wy'
      };

      for (const [full, abbr] of Object.entries(stateMap)) {
        redirects.push({
          source: `/:path*-${full}-:country(us|ca)/`,
          destination: `/:path*-${abbr}-:country/`,
          permanent: true
        });
      }
    }

    // Fix Canada to CA
    if (this.patterns.canadaInsteadOfCa.length > 0) {
      redirects.push({
        comment: '// Canadian provinces with wrong country code',
        source: '/:path*-:province(ab|bc|mb|nb|nl|nt|ns|nu|on|pe|qc|sk|yt)-canada/',
        destination: '/:path*-:province-ca/',
        permanent: true
      });
    }

    // Add robots.txt exclusions
    if (this.patterns.apiRoutes.length > 0) {
      robotsDisallow.push('Disallow: /api/');
    }
    if (this.patterns.dashboardRoutes.length > 0) {
      robotsDisallow.push('Disallow: /dashboard/');
    }
    if (this.patterns.savedFarmsRoutes.length > 0) {
      robotsDisallow.push('Disallow: /saved-farms/');
    }
    if (this.patterns.claimRoutes.length > 0) {
      robotsDisallow.push('Disallow: /claim/');
    }
    if (this.patterns.adminRoutes.length > 0) {
      robotsDisallow.push('Disallow: /admin/');
    }

    // Save redirect fixes
    const redirectsFile = `// GSC Redirect Fixes - Generated ${new Date().toISOString()}
// Add these to your next.config.js redirects() function

module.exports = {
  async redirects() {
    return [
      ${redirects.map(r => {
        let result = '';
        if (r.comment) result += r.comment + '\n      ';
        result += `{
        source: '${r.source}',
        destination: '${r.destination}',
        permanent: ${r.permanent}
      }`;
        return result;
      }).join(',\n      ')}
    ];
  }
};`;

    fs.writeFileSync(
      path.join(this.fixesPath, 'redirects-to-add.js'),
      redirectsFile
    );
    console.log(`${colors.green}✓${colors.reset} Generated redirect fixes: docs/gsc/fixes/redirects-to-add.js`);

    // Save robots.txt additions
    if (robotsDisallow.length > 0) {
      const robotsFile = `# Add these to your robots.txt file
# Generated ${new Date().toISOString()}

User-agent: *
${robotsDisallow.join('\n')}`;

      fs.writeFileSync(
        path.join(this.fixesPath, 'robots-additions.txt'),
        robotsFile
      );
      console.log(`${colors.green}✓${colors.reset} Generated robots.txt additions: docs/gsc/fixes/robots-additions.txt`);
    }

    console.log();
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    console.log(`${colors.cyan}${colors.bold}Priority Recommendations${colors.reset}`);
    console.log(`${colors.gray}${'='.repeat(80)}${colors.reset}\n`);

    // Critical issues
    if (this.patterns.allFarmsNear.length > 50) {
      this.recommendations.push({
        priority: 'CRITICAL',
        issue: 'Legacy routes still being crawled',
        count: this.patterns.allFarmsNear.length,
        impact: 'High 404 rate',
        solution: 'Verify Pattern 0 in next.config.js is working correctly'
      });
    }

    if (this.patterns.wrongCountryCode.length > 50) {
      this.recommendations.push({
        priority: 'CRITICAL',
        issue: 'US states marked as Canada',
        count: this.patterns.wrongCountryCode.length,
        impact: 'Major geographic confusion',
        solution: 'Check Pattern 1 regex - may need to be more specific'
      });
    }

    // High priority
    if (this.patterns.dashboardRoutes.length > 0) {
      this.recommendations.push({
        priority: 'HIGH',
        issue: 'Private dashboard routes being crawled',
        count: this.patterns.dashboardRoutes.length,
        impact: 'Wasted crawl budget on auth-required pages',
        solution: 'Add to robots.txt immediately'
      });
    }

    if (this.patterns.missingTrailingSlash.length > 100) {
      this.recommendations.push({
        priority: 'HIGH',
        issue: 'Trailing slash inconsistency',
        count: this.patterns.missingTrailingSlash.length,
        impact: 'Duplicate content issues',
        solution: 'Verify trailingSlash: true is working in next.config.js'
      });
    }

    // Medium priority
    if (this.patterns.queryParameters.length > 50) {
      this.recommendations.push({
        priority: 'MEDIUM',
        issue: 'URLs with query parameters',
        count: this.patterns.queryParameters.length,
        impact: 'Potential duplicate content',
        solution: 'Consider canonical URLs or parameter handling'
      });
    }

    // Display recommendations
    const critical = this.recommendations.filter(r => r.priority === 'CRITICAL');
    const high = this.recommendations.filter(r => r.priority === 'HIGH');
    const medium = this.recommendations.filter(r => r.priority === 'MEDIUM');

    if (critical.length > 0) {
      console.log(`${colors.red}${colors.bold}CRITICAL Issues:${colors.reset}`);
      for (const rec of critical) {
        console.log(`  • ${rec.issue} (${rec.count} URLs)`);
        console.log(`    Impact: ${rec.impact}`);
        console.log(`    Solution: ${colors.cyan}${rec.solution}${colors.reset}`);
      }
      console.log();
    }

    if (high.length > 0) {
      console.log(`${colors.yellow}${colors.bold}HIGH Priority:${colors.reset}`);
      for (const rec of high) {
        console.log(`  • ${rec.issue} (${rec.count} URLs)`);
        console.log(`    Solution: ${colors.cyan}${rec.solution}${colors.reset}`);
      }
      console.log();
    }

    if (medium.length > 0) {
      console.log(`${colors.blue}${colors.bold}MEDIUM Priority:${colors.reset}`);
      for (const rec of medium) {
        console.log(`  • ${rec.issue} (${rec.count} URLs)`);
        console.log(`    Solution: ${colors.cyan}${rec.solution}${colors.reset}`);
      }
      console.log();
    }
  }

  /**
   * Generate detailed report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total404s: this.errors404.length,
        totalRedirects: this.redirectIssues.length,
        totalNoindex: this.noindexIssues.length
      },
      patterns: {},
      recommendations: this.recommendations,
      nextSteps: []
    };

    // Add pattern counts
    for (const [pattern, urls] of Object.entries(this.patterns)) {
      if (urls.length > 0) {
        report.patterns[pattern] = {
          count: urls.length,
          percentage: ((urls.length / (this.errors404.length + this.redirectIssues.length)) * 100).toFixed(2) + '%',
          samples: urls.slice(0, 5).map(u => u.url)
        };
      }
    }

    // Add next steps
    if (this.patterns.allFarmsNear.length > 0) {
      report.nextSteps.push('Debug Pattern 0 in next.config.js - legacy routes not redirecting');
    }
    if (this.patterns.wrongCountryCode.length > 0) {
      report.nextSteps.push('Test Pattern 1 regex with sample URLs to find why it\'s not matching');
    }
    if (this.patterns.dashboardRoutes.length > 0) {
      report.nextSteps.push('Add dashboard routes to robots.txt immediately');
    }

    // Save report
    fs.writeFileSync(
      path.join(this.fixesPath, 'analysis-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log(`${colors.green}✓${colors.reset} Detailed report saved: docs/gsc/fixes/analysis-report.json`);
  }

  /**
   * Main execution
   */
  async run() {
    console.log(`${colors.cyan}${colors.bold}Enhanced GSC Export Analyzer${colors.reset}`);
    console.log(`Systematic analysis of GSC Coverage errors\n`);

    // Load exports
    if (!this.loadExports()) {
      console.log(`${colors.red}No export files found!${colors.reset}\n`);
      console.log('Please export your GSC Coverage data:');
      console.log('1. Go to Google Search Console');
      console.log('2. Navigate to Indexing → Pages');
      console.log('3. Click on "Not found (404)" and export CSV');
      console.log('4. Click on "Page with redirect" and export CSV');
      console.log('5. Save files to: docs/gsc/exports/');
      console.log('   - 404-errors.csv');
      console.log('   - redirect-issues.csv');
      return;
    }

    // Analyze patterns
    this.analyzePatterns();

    // Generate fixes
    this.generateRedirectFixes();

    // Generate recommendations
    this.generateRecommendations();

    // Generate report
    this.generateReport();

    // Summary
    console.log(`\n${colors.cyan}${colors.bold}Summary${colors.reset}`);
    console.log(`${colors.gray}${'='.repeat(80)}${colors.reset}`);
    console.log(`Total issues analyzed: ${colors.bold}${this.errors404.length + this.redirectIssues.length}${colors.reset}`);
    console.log(`Patterns identified: ${colors.bold}${Object.values(this.patterns).filter(p => p.length > 0).length}${colors.reset}`);
    console.log(`Critical issues: ${colors.red}${this.recommendations.filter(r => r.priority === 'CRITICAL').length}${colors.reset}`);
    console.log(`High priority: ${colors.yellow}${this.recommendations.filter(r => r.priority === 'HIGH').length}${colors.reset}`);

    console.log(`\n${colors.green}${colors.bold}Next Steps:${colors.reset}`);
    console.log('1. Review the generated fixes in docs/gsc/fixes/');
    console.log('2. Test redirect patterns with gsc-redirect-validator.js');
    console.log('3. Apply fixes incrementally and monitor results');
    console.log('4. Run this analyzer again after fixes to measure progress');
  }
}

// Run the analyzer
const analyzer = new GSCAnalyzer();
analyzer.run().catch(console.error);