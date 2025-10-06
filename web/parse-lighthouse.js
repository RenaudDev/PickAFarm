const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./lighthouse-mobile-report.json'));

const report = {
  scores: {
    performance: data.categories.performance.score * 100,
    accessibility: data.categories.accessibility.score * 100,
    bestPractices: data.categories['best-practices'].score * 100,
    seo: data.categories.seo.score * 100
  },
  metrics: {
    fcp: data.audits['first-contentful-paint'],
    lcp: data.audits['largest-contentful-paint'],
    tbt: data.audits['total-blocking-time'],
    cls: data.audits['cumulative-layout-shift'],
    speedIndex: data.audits['speed-index']
  },
  failedAudits: Object.entries(data.audits)
    .filter(([k,v]) => v.score !== null && v.score < 1)
    .map(([k,v]) => ({
      id: k,
      title: v.title,
      score: v.score,
      displayValue: v.displayValue,
      description: v.description
    }))
    .sort((a, b) => a.score - b.score)
};

console.log(JSON.stringify(report, null, 2));
