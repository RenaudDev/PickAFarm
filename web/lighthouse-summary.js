const desktop = require('./lighthouse-desktop-latest.json');
const mobile = require('./lighthouse-mobile-latest.json');

console.log('=== DESKTOP SCORES ===');
Object.entries(desktop.categories).forEach(([k, v]) => {
  console.log(`  ${v.title}: ${Math.round(v.score * 100)}`);
});

console.log('\n=== MOBILE SCORES ===');
Object.entries(mobile.categories).forEach(([k, v]) => {
  console.log(`  ${v.title}: ${Math.round(v.score * 100)}`);
});

console.log('\n=== DESKTOP CORE WEB VITALS ===');
const da = desktop.audits;
console.log(`  FCP: ${(da['first-contentful-paint'].numericValue/1000).toFixed(2)}s`);
console.log(`  LCP: ${(da['largest-contentful-paint'].numericValue/1000).toFixed(2)}s`);
console.log(`  TBT: ${da['total-blocking-time'].numericValue}ms`);
console.log(`  CLS: ${da['cumulative-layout-shift'].numericValue.toFixed(3)}`);
console.log(`  SI: ${(da['speed-index'].numericValue/1000).toFixed(2)}s`);

console.log('\n=== MOBILE CORE WEB VITALS ===');
const ma = mobile.audits;
console.log(`  FCP: ${(ma['first-contentful-paint'].numericValue/1000).toFixed(2)}s`);
console.log(`  LCP: ${(ma['largest-contentful-paint'].numericValue/1000).toFixed(2)}s`);
console.log(`  TBT: ${ma['total-blocking-time'].numericValue}ms`);
console.log(`  CLS: ${ma['cumulative-layout-shift'].numericValue.toFixed(3)}`);
console.log(`  SI: ${(ma['speed-index'].numericValue/1000).toFixed(2)}s`);
