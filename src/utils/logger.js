/**
 * Structured logging utility for Cloudflare Workers
 * Provides consistent JSON logging with correlation IDs for request tracing
 */

/**
 * Log levels
 */
export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

/**
 * Log a structured event
 * @param {string} level - Log level (error, warn, info, debug)
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata to include in log
 * @param {Object} context - Hono context object (optional, for correlationId)
 */
export function logEvent(level, message, metadata = {}, context = null) {
  const log = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'pickafarm-worker',
    ...(context && context.get && { correlationId: context.get('correlationId') }),
    ...metadata
  };

  console.log(JSON.stringify(log));
  return log;
}

/**
 * Create a logger instance bound to a specific request context
 * This allows automatic inclusion of correlation ID in all logs
 * @param {Object} context - Hono context object
 * @returns {Object} Logger instance with convenience methods
 */
export function createLogger(context) {
  return {
    error: (message, metadata = {}) =>
      logEvent(LogLevel.ERROR, message, metadata, context),

    warn: (message, metadata = {}) =>
      logEvent(LogLevel.WARN, message, metadata, context),

    info: (message, metadata = {}) =>
      logEvent(LogLevel.INFO, message, metadata, context),

    debug: (message, metadata = {}) =>
      logEvent(LogLevel.DEBUG, message, metadata, context),
  };
}

/**
 * Log an API request
 * @param {Object} context - Hono context object
 * @param {number} duration - Request duration in milliseconds
 * @param {number} statusCode - HTTP status code
 */
export function logRequest(context, duration, statusCode) {
  const metadata = {
    method: context.req.method,
    path: context.req.path,
    statusCode,
    duration: `${duration}ms`,
    userAgent: context.req.header('user-agent'),
  };

  const level = statusCode >= 500 ? LogLevel.ERROR :
                statusCode >= 400 ? LogLevel.WARN :
                LogLevel.INFO;

  logEvent(level, 'API request completed', metadata, context);
}

/**
 * Log an error with stack trace
 * @param {Object} context - Hono context object
 * @param {Error} error - Error object
 * @param {string} message - Custom error message
 * @param {Object} metadata - Additional metadata
 */
export function logError(context, error, message, metadata = {}) {
  logEvent(
    LogLevel.ERROR,
    message,
    {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code || 'UNKNOWN_ERROR'
      },
      ...metadata
    },
    context
  );
}
