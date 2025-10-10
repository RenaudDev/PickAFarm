#!/usr/bin/env node

/**
 * Test 404 Redirect Fixes
 *
 * This script tests all URLs from Bugs/Table.csv to verify that:
 * 1. Redirects are working correctly (308 status)
 * 2. Final destination pages return 200 OK
 * 3. No URLs result in 404 errors
 *
 * Usage:
 *   node web/scripts/test-404-redirects.js [options]
 *
 * Options:
 *   --url <base-url>  Base URL to test (default: http://localhost:3000)
 *   --csv <path>      Path to CSV file (default: Bugs/Table.csv)
 *   --sample <n>      Test only first N URLs (for quick tests)
 *   --verbose         Show detailed output for each URL
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (flag, defaultValue) => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const BASE_URL = getArg('--url', 'http://localhost:3000');
const CSV_PATH = getArg('--csv', path.join(__dirname, '../../Bugs/Table.csv'));
const SAMPLE_SIZE = getArg('--sample', null);
const VERBOSE = args.includes('--verbose');

// HTTP client that follows redirects and reports the chain
async function testUrl(url, maxRedirects = 5) {
  const results = {
    originalUrl: url,
    redirectChain: [],
    finalStatus: null,
    finalUrl: null,
    error: null,
    success: false
  };

  let currentUrl = url;
  let redirectCount = 0;

  while (redirectCount < maxRedirects) {
    try {
      const response = await makeRequest(currentUrl);

      results.redirectChain.push({
        url: currentUrl,
        status: response.statusCode,
        location: response.headers.location
      });

      // Check if this is a redirect
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        redirectCount++;

        // Handle relative URLs
        const nextUrl = response.headers.location.startsWith('http')
          ? response.headers.location
          : new URL(response.headers.location, currentUrl).toString();

        currentUrl = nextUrl;
        continue;
      }

      // Final destination reached
      results.finalStatus = response.statusCode;
      results.finalUrl = currentUrl;
      results.success = response.statusCode === 200;
      break;

    } catch (error) {
      results.error = error.message;
      results.finalStatus = 'ERROR';
      break;
    }
  }

  if (redirectCount >= maxRedirects) {
    results.error = 'Too many redirects';
    results.finalStatus = 'REDIRECT_LOOP';
  }

  return results;
}

// Make HTTP request without following redirects
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const options = {
      method: 'GET',
      headers: {
        'User-Agent': 'PickAFarm-Redirect-Tester/1.0'
      }
    };

    const req = client.get(url, options, (res) => {
      // Don't read body, we only care about headers
      res.resume();
      resolve({
        statusCode: res.statusCode,
        headers: res.headers
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Parse CSV file
function parseCSV(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').slice(1); // Skip header

  const urls = lines
    .map(line => line.split(',')[0])
    .filter(url => url && url.startsWith('http'))
    .map(url => url.trim());

  return urls;
}

// Format redirect chain for display
function formatRedirectChain(chain) {
  return chain.map((step, index) => {
    const arrow = index < chain.length - 1 ? ' →' : ' ✓';
    return `  ${step.status} ${step.url}${arrow}`;
  }).join('\n');
}

// Main test function
async function runTests() {
  console.log('🧪 Testing 404 Redirect Fixes\n');
  console.log('='.repeat(80));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`CSV File: ${CSV_PATH}`);
  console.log('='.repeat(80));
  console.log('');

  // Load URLs from CSV
  let urls;
  try {
    urls = parseCSV(CSV_PATH);
    console.log(`📋 Loaded ${urls.length} URLs from CSV\n`);
  } catch (error) {
    console.error(`❌ Failed to load CSV: ${error.message}`);
    process.exit(1);
  }

  // Apply sample size if specified
  if (SAMPLE_SIZE) {
    urls = urls.slice(0, parseInt(SAMPLE_SIZE));
    console.log(`🔬 Testing sample of ${urls.length} URLs\n`);
  }

  // Convert pickafarm.com URLs to test server
  const testUrls = urls.map(url => url.replace('https://pickafarm.com', BASE_URL));

  // Test each URL
  const results = {
    total: testUrls.length,
    success: 0,
    redirects: 0,
    notFound: 0,
    errors: 0,
    details: []
  };

  console.log('🚀 Starting tests...\n');

  for (let i = 0; i < testUrls.length; i++) {
    const urlToTest = testUrls[i];
    const originalUrl = urls[i];

    process.stdout.write(`Testing ${i + 1}/${testUrls.length}... \r`);

    const result = await testUrl(urlToTest);

    // Categorize result
    if (result.success) {
      results.success++;
      if (result.redirectChain.length > 1) {
        results.redirects++;
      }
    } else if (result.finalStatus === 404) {
      results.notFound++;
      results.details.push({ type: '404', url: originalUrl, result });
    } else {
      results.errors++;
      results.details.push({ type: 'ERROR', url: originalUrl, result });
    }

    // Show detailed output in verbose mode
    if (VERBOSE) {
      console.log(`\n${originalUrl}`);
      console.log(formatRedirectChain(result.redirectChain));
      if (result.error) {
        console.log(`  ❌ Error: ${result.error}`);
      }
      console.log('');
    }
  }

  // Print summary
  console.log('\n');
  console.log('='.repeat(80));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Total URLs tested:     ${results.total}`);
  console.log(`✅ Successful:          ${results.success} (${Math.round(results.success / results.total * 100)}%)`);
  console.log(`🔀 With redirects:      ${results.redirects}`);
  console.log(`❌ 404 Not Found:       ${results.notFound}`);
  console.log(`⚠️  Errors:              ${results.errors}`);
  console.log('');

  // Show failures
  if (results.details.length > 0) {
    console.log('='.repeat(80));
    console.log('❌ FAILED URLS');
    console.log('='.repeat(80));
    console.log('');

    results.details.forEach(({ type, url, result }) => {
      console.log(`[${type}] ${url}`);
      console.log(formatRedirectChain(result.redirectChain));
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      console.log('');
    });
  }

  // Exit with appropriate code
  const exitCode = results.notFound === 0 && results.errors === 0 ? 0 : 1;

  if (exitCode === 0) {
    console.log('✅ All tests passed! No 404 errors found.');
  } else {
    console.log('❌ Some tests failed. Please review the errors above.');
  }

  process.exit(exitCode);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
