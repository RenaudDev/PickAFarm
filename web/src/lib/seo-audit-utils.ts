/**
 * SEO Audit Utilities
 * Helper functions for validating and auditing SEO elements
 */

import { Metadata } from 'next'

export interface SEOAuditResult {
  passed: boolean
  score: number
  issues: SEOIssue[]
  warnings: SEOWarning[]
}

export interface SEOIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  message: string
  element?: string
  fix?: string
}

export interface SEOWarning {
  category: string
  message: string
  recommendation?: string
}

/**
 * Validate title tag length and format
 */
export function validateTitle(title: string): SEOIssue[] {
  const issues: SEOIssue[] = []

  if (!title || title.trim().length === 0) {
    issues.push({
      severity: 'critical',
      category: 'Meta Tags',
      message: 'Missing title tag',
      fix: 'Add a unique, descriptive title tag (50-60 characters)'
    })
  } else if (title.length < 30) {
    issues.push({
      severity: 'medium',
      category: 'Meta Tags',
      message: `Title too short (${title.length} characters)`,
      fix: 'Expand title to 50-60 characters for optimal SEO'
    })
  } else if (title.length > 60) {
    issues.push({
      severity: 'medium',
      category: 'Meta Tags',
      message: `Title too long (${title.length} characters, may be truncated in SERPs)`,
      fix: 'Shorten title to 50-60 characters'
    })
  }

  return issues
}

/**
 * Validate meta description length and format
 */
export function validateDescription(description: string): SEOIssue[] {
  const issues: SEOIssue[] = []

  if (!description || description.trim().length === 0) {
    issues.push({
      severity: 'critical',
      category: 'Meta Tags',
      message: 'Missing meta description',
      fix: 'Add a unique, descriptive meta description (150-160 characters)'
    })
  } else if (description.length < 120) {
    issues.push({
      severity: 'medium',
      category: 'Meta Tags',
      message: `Description too short (${description.length} characters)`,
      fix: 'Expand description to 150-160 characters'
    })
  } else if (description.length > 160) {
    issues.push({
      severity: 'low',
      category: 'Meta Tags',
      message: `Description too long (${description.length} characters, may be truncated)`,
      fix: 'Shorten description to 150-160 characters'
    })
  }

  return issues
}

/**
 * Validate Open Graph tags
 */
export function validateOpenGraph(metadata: Metadata): SEOIssue[] {
  const issues: SEOIssue[] = []
  const og = metadata.openGraph

  if (!og) {
    issues.push({
      severity: 'high',
      category: 'Open Graph',
      message: 'Missing Open Graph tags',
      fix: 'Add og:title, og:description, og:image, og:url'
    })
    return issues
  }

  if (!og.title) {
    issues.push({
      severity: 'high',
      category: 'Open Graph',
      message: 'Missing og:title',
      fix: 'Add Open Graph title tag'
    })
  }

  if (!og.description) {
    issues.push({
      severity: 'high',
      category: 'Open Graph',
      message: 'Missing og:description',
      fix: 'Add Open Graph description tag'
    })
  }

  if (!og.images || (Array.isArray(og.images) && og.images.length === 0)) {
    issues.push({
      severity: 'high',
      category: 'Open Graph',
      message: 'Missing og:image',
      fix: 'Add Open Graph image (1200x630px recommended)'
    })
  }

  if (!og.url) {
    issues.push({
      severity: 'medium',
      category: 'Open Graph',
      message: 'Missing og:url',
      fix: 'Add canonical URL to Open Graph tags'
    })
  }

  return issues
}

/**
 * Validate Twitter Card tags
 */
export function validateTwitterCard(metadata: Metadata): SEOIssue[] {
  const issues: SEOIssue[] = []
  const twitter = metadata.twitter

  if (!twitter) {
    issues.push({
      severity: 'medium',
      category: 'Twitter Card',
      message: 'Missing Twitter Card tags',
      fix: 'Add twitter:card, twitter:title, twitter:description, twitter:image'
    })
    return issues
  }

  if (!twitter.card) {
    issues.push({
      severity: 'medium',
      category: 'Twitter Card',
      message: 'Missing twitter:card type',
      fix: 'Add twitter:card (use "summary_large_image")'
    })
  }

  if (!twitter.title) {
    issues.push({
      severity: 'medium',
      category: 'Twitter Card',
      message: 'Missing twitter:title',
      fix: 'Add Twitter Card title'
    })
  }

  if (!twitter.description) {
    issues.push({
      severity: 'medium',
      category: 'Twitter Card',
      message: 'Missing twitter:description',
      fix: 'Add Twitter Card description'
    })
  }

  if (!twitter.images || (Array.isArray(twitter.images) && twitter.images.length === 0)) {
    issues.push({
      severity: 'medium',
      category: 'Twitter Card',
      message: 'Missing twitter:image',
      fix: 'Add Twitter Card image'
    })
  }

  return issues
}

/**
 * Validate canonical URL
 */
export function validateCanonical(metadata: Metadata, expectedUrl: string): SEOIssue[] {
  const issues: SEOIssue[] = []

  if (!metadata.alternates?.canonical) {
    issues.push({
      severity: 'high',
      category: 'Canonical',
      message: 'Missing canonical URL',
      fix: `Add canonical tag pointing to: ${expectedUrl}`
    })
  } else if (metadata.alternates.canonical !== expectedUrl) {
    issues.push({
      severity: 'medium',
      category: 'Canonical',
      message: `Canonical URL mismatch: ${metadata.alternates.canonical} !== ${expectedUrl}`,
      fix: `Update canonical to: ${expectedUrl}`
    })
  }

  return issues
}

/**
 * Validate robots meta tags
 */
export function validateRobots(metadata: Metadata, shouldIndex: boolean = true): SEOIssue[] {
  const issues: SEOIssue[] = []
  const robots = metadata.robots

  if (!robots) {
    issues.push({
      severity: 'low',
      category: 'Robots',
      message: 'Missing robots meta tags',
      fix: 'Add robots meta tags for explicit crawl directives'
    })
    return issues
  }

  if (typeof robots === 'object') {
    if (shouldIndex && robots.index === false) {
      issues.push({
        severity: 'high',
        category: 'Robots',
        message: 'Page set to noindex but should be indexed',
        fix: 'Change robots.index to true'
      })
    }

    if (!shouldIndex && robots.index !== false) {
      issues.push({
        severity: 'high',
        category: 'Robots',
        message: 'Page not set to noindex but should be',
        fix: 'Set robots.index to false'
      })
    }
  }

  return issues
}

/**
 * Validate structured data JSON-LD
 */
export function validateStructuredData(jsonLd: any, expectedType: string): SEOIssue[] {
  const issues: SEOIssue[] = []

  if (!jsonLd) {
    issues.push({
      severity: 'high',
      category: 'Structured Data',
      message: `Missing ${expectedType} structured data`,
      fix: `Add Schema.org ${expectedType} JSON-LD`
    })
    return issues
  }

  if (!jsonLd['@context']) {
    issues.push({
      severity: 'critical',
      category: 'Structured Data',
      message: 'Missing @context in JSON-LD',
      fix: 'Add "@context": "https://schema.org"'
    })
  }

  if (!jsonLd['@type']) {
    issues.push({
      severity: 'critical',
      category: 'Structured Data',
      message: 'Missing @type in JSON-LD',
      fix: `Add "@type": "${expectedType}"`
    })
  } else if (jsonLd['@type'] !== expectedType && !Array.isArray(jsonLd['@type'])) {
    issues.push({
      severity: 'medium',
      category: 'Structured Data',
      message: `Expected @type "${expectedType}" but found "${jsonLd['@type']}"`,
      fix: `Change @type to "${expectedType}"`
    })
  }

  return issues
}

/**
 * Audit complete page metadata
 */
export function auditPageMetadata(
  metadata: Metadata,
  pageUrl: string,
  options: {
    shouldIndex?: boolean
    expectedSchemaType?: string
    structuredData?: any
  } = {}
): SEOAuditResult {
  const { shouldIndex = true, expectedSchemaType, structuredData } = options

  const issues: SEOIssue[] = []

  // Validate title
  if (metadata.title) {
    const titleString = typeof metadata.title === 'string'
      ? metadata.title
      : (metadata.title as any)?.default || ''
    issues.push(...validateTitle(titleString))
  } else {
    issues.push({
      severity: 'critical',
      category: 'Meta Tags',
      message: 'Missing title',
      fix: 'Add title metadata'
    })
  }

  // Validate description
  if (metadata.description) {
    issues.push(...validateDescription(metadata.description))
  } else {
    issues.push({
      severity: 'critical',
      category: 'Meta Tags',
      message: 'Missing description',
      fix: 'Add description metadata'
    })
  }

  // Validate Open Graph
  issues.push(...validateOpenGraph(metadata))

  // Validate Twitter Card
  issues.push(...validateTwitterCard(metadata))

  // Validate canonical
  issues.push(...validateCanonical(metadata, pageUrl))

  // Validate robots
  issues.push(...validateRobots(metadata, shouldIndex))

  // Validate structured data if provided
  if (expectedSchemaType && structuredData) {
    issues.push(...validateStructuredData(structuredData, expectedSchemaType))
  }

  // Calculate score (100 - deductions)
  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const highCount = issues.filter(i => i.severity === 'high').length
  const mediumCount = issues.filter(i => i.severity === 'medium').length
  const lowCount = issues.filter(i => i.severity === 'low').length

  const score = Math.max(0, 100 - (criticalCount * 20) - (highCount * 10) - (mediumCount * 5) - (lowCount * 2))

  return {
    passed: score >= 80,
    score,
    issues,
    warnings: []
  }
}

/**
 * Generate audit report summary
 */
export function generateAuditSummary(results: SEOAuditResult): string {
  const { score, issues } = results

  let summary = `## SEO Audit Score: ${score}/100\n\n`

  if (score >= 90) {
    summary += '✅ **Excellent** - SEO is optimized\n\n'
  } else if (score >= 80) {
    summary += '✓ **Good** - Minor improvements needed\n\n'
  } else if (score >= 60) {
    summary += '⚠️ **Fair** - Several issues to address\n\n'
  } else {
    summary += '❌ **Poor** - Critical issues require immediate attention\n\n'
  }

  const criticalIssues = issues.filter(i => i.severity === 'critical')
  const highIssues = issues.filter(i => i.severity === 'high')
  const mediumIssues = issues.filter(i => i.severity === 'medium')
  const lowIssues = issues.filter(i => i.severity === 'low')

  if (criticalIssues.length > 0) {
    summary += `### 🔴 Critical Issues (${criticalIssues.length})\n`
    criticalIssues.forEach(issue => {
      summary += `- **${issue.category}**: ${issue.message}\n`
      if (issue.fix) summary += `  - Fix: ${issue.fix}\n`
    })
    summary += '\n'
  }

  if (highIssues.length > 0) {
    summary += `### 🟠 High Priority Issues (${highIssues.length})\n`
    highIssues.forEach(issue => {
      summary += `- **${issue.category}**: ${issue.message}\n`
      if (issue.fix) summary += `  - Fix: ${issue.fix}\n`
    })
    summary += '\n'
  }

  if (mediumIssues.length > 0) {
    summary += `### 🟡 Medium Priority Issues (${mediumIssues.length})\n`
    mediumIssues.forEach(issue => {
      summary += `- **${issue.category}**: ${issue.message}\n`
      if (issue.fix) summary += `  - Fix: ${issue.fix}\n`
    })
    summary += '\n'
  }

  if (lowIssues.length > 0) {
    summary += `### 🟢 Low Priority Issues (${lowIssues.length})\n`
    lowIssues.forEach(issue => {
      summary += `- **${issue.category}**: ${issue.message}\n`
      if (issue.fix) summary += `  - Fix: ${issue.fix}\n`
    })
    summary += '\n'
  }

  if (issues.length === 0) {
    summary += '✨ No issues found! Page is fully optimized.\n'
  }

  return summary
}
