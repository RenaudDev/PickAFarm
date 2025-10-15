/**
 * Zoho Cliq webhook integration for critical alerts
 * Sends formatted notifications to Cliq channels
 */

import { logEvent, LogLevel } from './logger.js';

/**
 * Severity levels for Cliq alerts
 */
export const Severity = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * In-memory rate limiting for alerts
 * Prevents spam by tracking last alert time per alert type
 */
const alertRateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

/**
 * Check if an alert should be rate limited
 * @param {string} alertType - Type of alert (e.g., 'high_error_rate', 'build_failure')
 * @returns {boolean} True if alert should be sent, false if rate limited
 */
function checkRateLimit(alertType) {
  const now = Date.now();
  const lastAlert = alertRateLimits.get(alertType);

  if (lastAlert && (now - lastAlert) < RATE_LIMIT_WINDOW) {
    return false; // Rate limited
  }

  alertRateLimits.set(alertType, now);
  return true; // Allow alert
}

/**
 * Send a formatted alert to Zoho Cliq
 * @param {Object} env - Cloudflare Worker environment bindings
 * @param {string} severity - Alert severity (critical, warning, info)
 * @param {string} title - Alert title
 * @param {Array} fields - Array of field objects with {title, value} properties
 * @param {string} alertType - Type of alert for rate limiting (optional)
 * @param {Object} context - Request context for logging (optional)
 * @returns {Promise<boolean>} True if sent successfully, false otherwise
 */
export async function sendCliqAlert(env, severity, title, fields = [], alertType = 'default', context = null) {
  try {
    // Check rate limiting
    if (!checkRateLimit(alertType)) {
      logEvent(
        LogLevel.DEBUG,
        'Cliq alert rate limited',
        { alertType, severity, title },
        context
      );
      return false;
    }

    // Validate webhook URL
    const webhookUrl = env.CLIQ_WEBHOOK_URL;
    if (!webhookUrl) {
      logEvent(
        LogLevel.WARN,
        'Cliq webhook URL not configured',
        { severity, title },
        context
      );
      return false;
    }

    if (!webhookUrl.startsWith('https://cliq.zoho')) {
      logEvent(
        LogLevel.ERROR,
        'Invalid Cliq webhook URL format',
        { webhookUrl: webhookUrl.substring(0, 30) + '...' },
        context
      );
      return false;
    }

    // Build Cliq message payload
    const emoji = severity === Severity.CRITICAL ? '🚨' :
                  severity === Severity.WARNING ? '⚠️' : 'ℹ️';

    // Format fields as markdown table
    let fieldsText = '';
    if (fields.length > 0) {
      fieldsText = '\n\n';
      fields.forEach(field => {
        fieldsText += `**${field.title}:** ${field.value}\n`;
      });
    }

    // Add timestamp and environment
    fieldsText += `\n**Time:** ${new Date().toISOString()}`;
    fieldsText += `\n**Environment:** ${env.ENVIRONMENT || 'production'}`;

    const payload = {
      text: `${emoji} **PickAFarm Alert: ${title}**${fieldsText}`,
      card: {
        title: `${emoji} ${title}`,
        theme: severity === Severity.CRITICAL ? 'modern-inline' : 'prompt'
      }
    };

    // Send webhook request
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logEvent(
        LogLevel.ERROR,
        'Cliq webhook request failed',
        {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          alertType
        },
        context
      );
      return false;
    }

    logEvent(
      LogLevel.INFO,
      'Cliq alert sent successfully',
      { severity, title, alertType },
      context
    );

    return true;
  } catch (error) {
    logEvent(
      LogLevel.ERROR,
      'Failed to send Cliq alert',
      {
        error: error.message,
        stack: error.stack,
        severity,
        title,
        alertType
      },
      context
    );
    return false;
  }
}

/**
 * Send a build failure alert to Cliq
 * @param {Object} env - Environment bindings
 * @param {string} buildType - Type of build (e.g., 'prebuild', 'production')
 * @param {string} errorMessage - Error message from build
 * @param {Object} context - Request context (optional)
 */
export async function sendBuildFailureAlert(env, buildType, errorMessage, context = null) {
  return sendCliqAlert(
    env,
    Severity.CRITICAL,
    'Build Failure Detected',
    [
      { title: 'Build Type', value: buildType },
      { title: 'Error', value: errorMessage }
    ],
    'build_failure',
    context
  );
}

/**
 * Send a high error rate alert to Cliq
 * @param {Object} env - Environment bindings
 * @param {string} endpoint - API endpoint experiencing errors
 * @param {number} errorRate - Current error rate as percentage
 * @param {Object} context - Request context (optional)
 */
export async function sendHighErrorRateAlert(env, endpoint, errorRate, context = null) {
  return sendCliqAlert(
    env,
    Severity.CRITICAL,
    'High Error Rate Detected',
    [
      { title: 'Endpoint', value: endpoint },
      { title: 'Error Rate', value: `${(errorRate * 100).toFixed(2)}%` },
      { title: 'Threshold', value: '1%' }
    ],
    `high_error_rate_${endpoint}`,
    context
  );
}

/**
 * Send a database query failure alert to Cliq
 * @param {Object} env - Environment bindings
 * @param {string} query - SQL query that failed
 * @param {string} errorMessage - Error message
 * @param {Object} context - Request context (optional)
 */
export async function sendDatabaseErrorAlert(env, query, errorMessage, context = null) {
  return sendCliqAlert(
    env,
    Severity.CRITICAL,
    'Database Query Failure',
    [
      { title: 'Query', value: query.substring(0, 200) },
      { title: 'Error', value: errorMessage }
    ],
    'database_error',
    context
  );
}

/**
 * Send a rate limit violation alert to Cliq
 * @param {Object} env - Environment bindings
 * @param {string} userId - User ID hitting rate limits
 * @param {string} action - Action being rate limited
 * @param {Object} context - Request context (optional)
 */
export async function sendRateLimitAlert(env, userId, action, context = null) {
  return sendCliqAlert(
    env,
    Severity.WARNING,
    'Rate Limit Violation',
    [
      { title: 'User ID', value: userId },
      { title: 'Action', value: action }
    ],
    `rate_limit_${action}`,
    context
  );
}
