const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./lighthouse-final.json'));

console.log('=== ALL SCORES ===');
Object.entries(data.categories).forEach(([key, cat]) => {
  console.log(cat.title + ':', Math.round(cat.score * 100) + '/100');
});

console.log('\n=== PERFORMANCE METRICS ===');
console.log('FCP:', data.audits['first-contentful-paint'].displayValue);
console.log('LCP:', data.audits['largest-contentful-paint'].displayValue);
console.log('TBT:', data.audits['total-blocking-time'].displayValue);
console.log('CLS:', data.audits['cumulative-layout-shift'].displayValue);

console.log('\n=== FAILED ACCESSIBILITY ===');
Object.values(data.audits)
  .filter(a => a.id && data.categories.accessibility.auditRefs.find(r => r.id === a.id) && a.score !== null && a.score < 1)
  .forEach(a => console.log('-', a.title));

console.log('\n=== FAILED BEST PRACTICES ===');
Object.values(data.audits)
  .filter(a => a.id && data.categories['best-practices'].auditRefs.find(r => r.id === a.id) && a.score !== null && a.score < 1)
  .forEach(a => console.log('-', a.title));
