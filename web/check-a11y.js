const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./lighthouse-production-mobile.json'));
const a11yAudits = Object.entries(data.audits)
  .filter(([k,v]) => data.categories.accessibility.auditRefs.some(ref => ref.id === k) && v.score !== null && v.score < 1)
  .map(([k,v]) => ({id: k, title: v.title, score: v.score}));

console.log('Failing Accessibility Audits:\n');
a11yAudits.forEach((audit, i) => console.log((i+1) + '.', audit.title, '- Score:', audit.score));
