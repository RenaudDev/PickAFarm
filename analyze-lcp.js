const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./lighthouse-final.json'));

console.log('=== LCP: 13.7s ANALYSIS ===\n');

// LCP Breakdown
const lcpBreakdown = data.audits['lcp-breakdown'];
if (lcpBreakdown?.details?.items) {
  console.log('LCP BREAKDOWN:');
  lcpBreakdown.details.items.forEach(item => {
    console.log(`  ${item.phase}: ${item.timing}ms`);
  });
  console.log();
}

// LCP Element
const lcpElement = data.audits['largest-contentful-paint-element'];
if (lcpElement?.details?.items?.[0]) {
  console.log('LCP ELEMENT:');
  console.log(`  ${lcpElement.details.items[0].node?.snippet || 'N/A'}`);
  console.log();
}

// Render blocking
const renderBlocking = data.audits['render-blocking-resources'];
if (renderBlocking?.details?.items) {
  console.log(`RENDER BLOCKING (${renderBlocking.details.items.length} resources):`);
  renderBlocking.details.items.forEach(item => {
    const url = item.url.split('/').pop() || item.url;
    console.log(`  ${url.substring(0, 60)} - ${Math.round(item.wastedMs)}ms`);
  });
  console.log();
}

// Main thread work
const mainThread = data.audits['mainthread-work-breakdown'];
if (mainThread?.details?.items) {
  console.log('MAIN THREAD WORK:');
  mainThread.details.items.slice(0, 5).forEach(item => {
    console.log(`  ${item.groupLabel}: ${Math.round(item.duration)}ms`);
  });
  console.log();
}

// Network RTT
const networkRtt = data.audits['network-rtt'];
if (networkRtt?.details?.items) {
  console.log('NETWORK LATENCY (RTT):');
  networkRtt.details.items.slice(0, 3).forEach(item => {
    console.log(`  ${item.origin}: ${item.rtt.toFixed(1)}ms`);
  });
}
