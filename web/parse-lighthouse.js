const report = require('./lighthouse-mobile-report.json');
const perf = report.categories.performance;
const audits = report.audits;

console.log('Performance Score:', Math.round(perf.score * 100));
console.log('\n=== Core Web Vitals ===');
console.log('LCP:', audits['largest-contentful-paint'].displayValue, '- Score:', audits['largest-contentful-paint'].score);
console.log('FCP:', audits['first-contentful-paint'].displayValue);
console.log('TBT:', audits['total-blocking-time'].displayValue);
console.log('CLS:', audits['cumulative-layout-shift'].displayValue);
console.log('Speed Index:', audits['speed-index'].displayValue);

console.log('\n=== LCP Details ===');
console.log('LCP Element:', audits['largest-contentful-paint-element']?.displayValue);

const lcpBreakdown = audits['lcp-breakdown'];
if (lcpBreakdown && lcpBreakdown.details) {
  console.log('\nLCP Breakdown:');
  lcpBreakdown.details.items.forEach(item => {
    console.log(`  ${item.phase}: ${item.timing}ms`);
  });
}

console.log('\n=== Top Performance Issues (by potential savings) ===');
const issues = Object.entries(audits)
  .filter(([k,v]) => v.score !== null && v.score < 0.9 && v.details && v.details.overallSavingsMs)
  .sort((a,b) => (b[1].details.overallSavingsMs || 0) - (a[1].details.overallSavingsMs || 0))
  .slice(0,8);

issues.forEach(([key, audit]) => {
  console.log(`\n${audit.title}`);
  console.log(`  Potential savings: ${audit.details.overallSavingsMs}ms`);
  if (audit.details.items && audit.details.items.length > 0) {
    console.log('  Top items:');
    audit.details.items.slice(0, 3).forEach(item => {
      if (item.url) console.log(`    - ${item.url.slice(0, 80)}`);
    });
  }
});

console.log('\n=== Render Blocking Resources ===');
const renderBlocking = audits['render-blocking-resources'];
if (renderBlocking && renderBlocking.details && renderBlocking.details.items) {
  renderBlocking.details.items.forEach(item => {
    console.log(`  ${item.url} - ${item.totalBytes} bytes - ${item.wastedMs}ms`);
  });
}
