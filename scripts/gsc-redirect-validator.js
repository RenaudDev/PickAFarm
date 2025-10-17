#!/usr/bin/env node

/**
 * GSC Redirect Pattern Validator
 * Tests URLs from GSC exports against existing Next.js redirect patterns
 * Identifies which patterns are working and which are missing
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

// Load existing redirect patterns from next.config.js
// These are the patterns you've already implemented
const EXISTING_PATTERNS = [
  // Pattern 0: Legacy all-farms-near routes
  {
    id: 'pattern-0',
    name: 'Legacy all-farms-near routes',
    pattern: /^\/all-farms-near\/near\/([^/]+)\/$/,
    destination: '/farms-near/$1/',
    test: (url) => {
      const match = url.match(/^\/all-farms-near\/near\/([^/]+)\/$/);
      return match ? { matched: true, destination: `/farms-near/${match[1]}/` } : { matched: false };
    }
  },

  // Pattern 1: US states incorrectly tagged as Canada
  {
    id: 'pattern-1',
    name: 'US states marked as Canada',
    pattern: /^\/(.+?)-(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)-canada\/$/,
    destination: '/$1-$2-us/',
    test: (url) => {
      const states = 'al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy';
      const match = url.match(new RegExp(`^\/(.+?)-(${states})-canada\/$`));
      return match ? { matched: true, destination: `/${match[1]}-${match[2]}-us/` } : { matched: false };
    }
  },

  // Pattern 2: Full state names to abbreviations
  {
    id: 'pattern-2',
    name: 'Full state names to abbreviations',
    pattern: 'multiple patterns',
    test: (url) => {
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
        const pattern = new RegExp(`^\/(.+?)-${full}-(us|ca)\/$`);
        const match = url.match(pattern);
        if (match) {
          return { matched: true, destination: `/${match[1]}-${abbr}-${match[2]}/` };
        }
      }
      return { matched: false };
    }
  },

  // Pattern 3: wrong-canada patterns
  {
    id: 'pattern-3',
    name: 'Wrong Canada patterns',
    pattern: /^\/(.+?)-canada\/$/,
    test: (url) => {
      // This is specifically for Canadian provinces
      const provinces = 'ab|bc|mb|nb|nl|nt|ns|nu|on|pe|qc|sk|yt';
      const match = url.match(new RegExp(`^\/(.+?)-(${provinces})-canada\/$`));
      if (match) {
        // This should actually be -ca not -canada
        return { matched: true, destination: `/${match[1]}-${match[2]}-ca/` };
      }
      return { matched: false };
    }
  },

  // Pattern 4: Trailing slash enforcement
  {
    id: 'pattern-4',
    name: 'Trailing slash',
    pattern: 'automatic via trailingSlash: true',
    test: (url) => {
      if (!url.endsWith('/') && !url.includes('.')) {
        return { matched: true, destination: url + '/', automatic: true };
      }
      return { matched: false };
    }
  }
];

/**
 * Test a URL against all redirect patterns
 */
function testUrl(url) {
  const results = {
    url,
    matched: false,
    pattern: null,
    destination: null,
    automatic: false
  };

  for (const pattern of EXISTING_PATTERNS) {
    const test = pattern.test(url);
    if (test.matched) {
      results.matched = true;
      results.pattern = pattern.name;
      results.patternId = pattern.id;
      results.destination = test.destination;
      results.automatic = test.automatic || false;
      break;
    }
  }

  return results;
}

/**
 * Analyze patterns in URLs that aren't being caught
 */
function analyzeUnmatchedPatterns(unmatchedUrls) {
  const patterns = {
    doubleSlashes: [],
    queryParameters: [],
    hashFragments: [],
    upperCase: [],
    specialCharacters: [],
    deepNesting: [],
    apiRoutes: [],
    fileExtensions: [],
    dashboardRoutes: [],
    savedFarmRoutes: [],
    unknownStructure: []
  };

  for (const url of unmatchedUrls) {
    // Check for various patterns
    if (url.includes('//') && !url.startsWith('http')) {
      patterns.doubleSlashes.push(url);
    } else if (url.includes('?')) {
      patterns.queryParameters.push(url);
    } else if (url.includes('#')) {
      patterns.hashFragments.push(url);
    } else if (url !== url.toLowerCase()) {
      patterns.upperCase.push(url);
    } else if (/[^a-z0-9\-\/.]/.test(url)) {
      patterns.specialCharacters.push(url);
    } else if ((url.match(/\//g) || []).length > 4) {
      patterns.deepNesting.push(url);
    } else if (url.includes('/api/')) {
      patterns.apiRoutes.push(url);
    } else if (/\.(html|php|asp|jsp)/.test(url)) {
      patterns.fileExtensions.push(url);
    } else if (url.includes('/dashboard')) {
      patterns.dashboardRoutes.push(url);
    } else if (url.includes('/saved-farms')) {
      patterns.savedFarmRoutes.push(url);
    } else {
      patterns.unknownStructure.push(url);
    }
  }

  return patterns;
}

/**
 * Load and parse CSV file
 */
function loadCsvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    return records;
  } catch (error) {
    console.log(`${colors.yellow}Warning: Could not load ${filePath}${colors.reset}`);
    return [];
  }
}

/**
 * Main validation function
 */
function validateRedirects() {
  console.log(`${colors.cyan}${colors.bold}GSC Redirect Pattern Validator${colors.reset}`);
  console.log(`${colors.gray}${'='.repeat(80)}${colors.reset}\n`);

  const docsPath = path.join(__dirname, '..', 'docs', 'gsc', 'exports');

  // Load CSV files
  const errorFiles = [
    { name: '404 Errors', file: '404-errors.csv', urlColumn: 'URL' },
    { name: 'Redirect Issues', file: 'redirect-issues.csv', urlColumn: 'URL' }
  ];

  const allResults = [];

  for (const fileConfig of errorFiles) {
    const filePath = path.join(docsPath, fileConfig.file);
    console.log(`${colors.blue}Loading ${fileConfig.name}:${colors.reset} ${filePath}`);

    const records = loadCsvFile(filePath);
    if (records.length === 0) {
      console.log(`${colors.yellow}  No data found or file missing${colors.reset}\n`);
      continue;
    }

    console.log(`  Found ${colors.bold}${records.length}${colors.reset} URLs\n`);

    const matched = [];
    const unmatched = [];

    for (const record of records) {
      const url = record[fileConfig.urlColumn];
      if (!url) continue;

      // Extract path from full URL if needed
      const urlPath = url.replace(/^https?:\/\/[^\/]+/, '');
      const result = testUrl(urlPath);

      allResults.push({
        source: fileConfig.name,
        ...result
      });

      if (result.matched) {
        matched.push(result);
      } else {
        unmatched.push(urlPath);
      }
    }

    // Display results
    console.log(`${colors.green}✓ Matched:${colors.reset} ${matched.length} URLs`);
    console.log(`${colors.red}✗ Unmatched:${colors.reset} ${unmatched.length} URLs\n`);

    // Show pattern usage
    if (matched.length > 0) {
      const patternCounts = {};
      for (const result of matched) {
        patternCounts[result.pattern] = (patternCounts[result.pattern] || 0) + 1;
      }

      console.log(`${colors.cyan}Pattern Usage:${colors.reset}`);
      for (const [pattern, count] of Object.entries(patternCounts)) {
        console.log(`  • ${pattern}: ${count} matches`);
      }
      console.log();
    }

    // Analyze unmatched patterns
    if (unmatched.length > 0) {
      console.log(`${colors.magenta}Unmatched URL Patterns:${colors.reset}`);
      const patterns = analyzeUnmatchedPatterns(unmatched);

      for (const [type, urls] of Object.entries(patterns)) {
        if (urls.length > 0) {
          const displayName = type.replace(/([A-Z])/g, ' $1').trim();
          console.log(`  • ${displayName}: ${urls.length} URLs`);

          // Show first 3 examples
          const examples = urls.slice(0, 3);
          for (const example of examples) {
            console.log(`    ${colors.gray}${example}${colors.reset}`);
          }
          if (urls.length > 3) {
            console.log(`    ${colors.gray}... and ${urls.length - 3} more${colors.reset}`);
          }
        }
      }
      console.log();
    }
  }

  // Generate detailed report
  const reportPath = path.join(__dirname, '..', 'docs', 'gsc', 'redirect-validation-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalUrls: allResults.length,
      matched: allResults.filter(r => r.matched).length,
      unmatched: allResults.filter(r => !r.matched).length
    },
    patternEffectiveness: {},
    unmatchedSamples: [],
    recommendations: []
  };

  // Calculate pattern effectiveness
  for (const pattern of EXISTING_PATTERNS) {
    const matches = allResults.filter(r => r.patternId === pattern.id).length;
    report.patternEffectiveness[pattern.id] = {
      name: pattern.name,
      matches,
      percentage: allResults.length > 0 ? ((matches / allResults.length) * 100).toFixed(2) + '%' : '0%'
    };
  }

  // Store unmatched samples
  report.unmatchedSamples = allResults
    .filter(r => !r.matched)
    .slice(0, 50)
    .map(r => r.url);

  // Generate recommendations
  const unmatchedUrls = allResults.filter(r => !r.matched).map(r => r.url);
  const unmatchedPatterns = analyzeUnmatchedPatterns(unmatchedUrls);

  if (unmatchedPatterns.doubleSlashes.length > 10) {
    report.recommendations.push({
      priority: 'HIGH',
      issue: 'Double slashes in URLs',
      count: unmatchedPatterns.doubleSlashes.length,
      solution: 'Add redirect pattern to clean double slashes'
    });
  }

  if (unmatchedPatterns.queryParameters.length > 10) {
    report.recommendations.push({
      priority: 'MEDIUM',
      issue: 'URLs with query parameters',
      count: unmatchedPatterns.queryParameters.length,
      solution: 'Consider removing query parameters in redirects or handling them separately'
    });
  }

  if (unmatchedPatterns.dashboardRoutes.length > 0) {
    report.recommendations.push({
      priority: 'HIGH',
      issue: 'Dashboard routes being crawled',
      count: unmatchedPatterns.dashboardRoutes.length,
      solution: 'Add /dashboard/* to robots.txt Disallow'
    });
  }

  if (unmatchedPatterns.savedFarmRoutes.length > 0) {
    report.recommendations.push({
      priority: 'HIGH',
      issue: 'Saved farms routes being crawled',
      count: unmatchedPatterns.savedFarmRoutes.length,
      solution: 'Add /saved-farms/* to robots.txt Disallow'
    });
  }

  // Save report
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`${colors.green}✓ Report saved:${colors.reset} ${reportPath}\n`);

  // Display summary
  console.log(`${colors.cyan}${colors.bold}Summary:${colors.reset}`);
  console.log(`${'─'.repeat(40)}`);
  console.log(`Total URLs tested: ${colors.bold}${report.summary.totalUrls}${colors.reset}`);
  console.log(`Successfully matched: ${colors.green}${report.summary.matched}${colors.reset} (${((report.summary.matched / report.summary.totalUrls) * 100).toFixed(1)}%)`);
  console.log(`Failed to match: ${colors.red}${report.summary.unmatched}${colors.reset} (${((report.summary.unmatched / report.summary.totalUrls) * 100).toFixed(1)}%)`);

  if (report.recommendations.length > 0) {
    console.log(`\n${colors.yellow}${colors.bold}Top Recommendations:${colors.reset}`);
    for (const rec of report.recommendations.slice(0, 3)) {
      console.log(`  ${colors.red}[${rec.priority}]${colors.reset} ${rec.issue}`);
      console.log(`  ${colors.gray}→ ${rec.solution}${colors.reset}`);
    }
  }
}

// Run validation
validateRedirects();