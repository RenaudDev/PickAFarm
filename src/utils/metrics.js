/**
 * Metrics tracking utility for monitoring system performance
 * Stores time-series metrics in D1 database for dashboards and alerting
 */

import { logEvent, LogLevel } from './logger.js';

/**
 * Common metric names
 */
export const MetricName = {
  BROADCAST_COUNT: 'broadcast_count',
  BROADCAST_RECIPIENTS: 'broadcast_recipients',
  IMAGE_UPLOAD_SUCCESS: 'image_upload_success',
  IMAGE_UPLOAD_FAILURE: 'image_upload_failure',
  API_REQUEST_COUNT: 'api_request_count',
  API_ERROR_COUNT: 'api_error_count',
  REBUILD_TRIGGERED: 'rebuild_triggered',
  ACTIVE_FARMER_COUNT: 'active_farmer_count'
};

/**
 * Generate a UUID v4 for metric entries
 * @returns {string} UUID v4 string
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Track a metric value
 * @param {Object} env - Cloudflare Worker environment bindings
 * @param {string} metricName - Name of the metric (use MetricName constants)
 * @param {number} metricValue - Numeric value for the metric
 * @param {Object} metadata - Additional context (will be JSON stringified)
 * @param {Object} context - Request context for logging (optional)
 * @returns {Promise<boolean>} True if tracked successfully, false otherwise
 */
export async function trackMetric(
  env,
  metricName,
  metricValue,
  metadata = {},
  context = null
) {
  try {
    const id = generateUUID();
    const timestamp = new Date().toISOString();
    const metadataJson = JSON.stringify(metadata);

    // Insert into metrics table
    const stmt = env.DB.prepare(
      `INSERT INTO metrics (id, metric_name, metric_value, metadata, created_at)
       VALUES (?, ?, ?, ?, ?)`
    );

    await stmt.bind(
      id,
      metricName,
      metricValue,
      metadataJson,
      timestamp
    ).run();

    // Log debug info
    logEvent(
      LogLevel.DEBUG,
      'Metric tracked',
      {
        metricId: id,
        metricName,
        metricValue
      },
      context
    );

    return true;
  } catch (error) {
    // Log error but don't fail the operation
    logEvent(
      LogLevel.ERROR,
      'Failed to track metric',
      {
        error: error.message,
        stack: error.stack,
        metricName,
        metricValue
      },
      context
    );

    return false;
  }
}

/**
 * Get metric summary for a specific metric over a time range
 * @param {Object} env - Environment bindings
 * @param {string} metricName - Name of the metric
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @param {string} aggregation - Aggregation type: 'sum', 'avg', 'count', 'min', 'max'
 * @returns {Promise<Object>} Aggregated metric data
 */
export async function getMetricSummary(
  env,
  metricName,
  startDate,
  endDate,
  aggregation = 'sum'
) {
  try {
    // Validate aggregation type
    const validAggregations = ['sum', 'avg', 'count', 'min', 'max'];
    if (!validAggregations.includes(aggregation)) {
      throw new Error(`Invalid aggregation type: ${aggregation}`);
    }

    const aggFunction = aggregation.toUpperCase();
    const query = `
      SELECT
        ${aggFunction}(metric_value) as value,
        COUNT(*) as count
      FROM metrics
      WHERE metric_name = ?
        AND created_at >= ?
        AND created_at <= ?
    `;

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(metricName, startDate, endDate).first();

    return {
      metricName,
      aggregation,
      value: result.value || 0,
      count: result.count || 0,
      startDate,
      endDate
    };
  } catch (error) {
    logEvent(
      LogLevel.ERROR,
      'Failed to get metric summary',
      {
        error: error.message,
        stack: error.stack,
        metricName,
        aggregation
      }
    );

    throw error;
  }
}

/**
 * Get time-series data for a metric (grouped by hour)
 * @param {Object} env - Environment bindings
 * @param {string} metricName - Name of the metric
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @param {string} aggregation - Aggregation type: 'sum', 'avg', 'count'
 * @returns {Promise<Array>} Array of {timestamp, value} objects
 */
export async function getMetricTimeSeries(
  env,
  metricName,
  startDate,
  endDate,
  aggregation = 'sum'
) {
  try {
    // Validate aggregation type
    const validAggregations = ['sum', 'avg', 'count'];
    if (!validAggregations.includes(aggregation)) {
      throw new Error(`Invalid aggregation type: ${aggregation}`);
    }

    const aggFunction = aggregation.toUpperCase();

    // Group by hour using SQLite's strftime
    const query = `
      SELECT
        strftime('%Y-%m-%dT%H:00:00Z', created_at) as hour,
        ${aggFunction}(metric_value) as value
      FROM metrics
      WHERE metric_name = ?
        AND created_at >= ?
        AND created_at <= ?
      GROUP BY hour
      ORDER BY hour ASC
    `;

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(metricName, startDate, endDate).all();

    return result.results.map(row => ({
      timestamp: row.hour,
      value: row.value || 0
    }));
  } catch (error) {
    logEvent(
      LogLevel.ERROR,
      'Failed to get metric time series',
      {
        error: error.message,
        stack: error.stack,
        metricName,
        aggregation
      }
    );

    throw error;
  }
}

/**
 * Get broadcast statistics for monitoring dashboard
 * @param {Object} env - Environment bindings
 * @returns {Promise<Object>} Broadcast statistics
 */
export async function getBroadcastStats(env) {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const nowISO = now.toISOString();

    // Get broadcast counts for different time periods
    const [count24h, count7d, count30d, avgRecipients] = await Promise.all([
      getMetricSummary(env, MetricName.BROADCAST_COUNT, last24h, nowISO, 'sum'),
      getMetricSummary(env, MetricName.BROADCAST_COUNT, last7d, nowISO, 'sum'),
      getMetricSummary(env, MetricName.BROADCAST_COUNT, last30d, nowISO, 'sum'),
      getMetricSummary(env, MetricName.BROADCAST_RECIPIENTS, last30d, nowISO, 'avg')
    ]);

    return {
      last24h: count24h.value,
      last7d: count7d.value,
      last30d: count30d.value,
      averageRecipientsPerBroadcast: Math.round(avgRecipients.value * 10) / 10
    };
  } catch (error) {
    logEvent(
      LogLevel.ERROR,
      'Failed to get broadcast statistics',
      {
        error: error.message,
        stack: error.stack
      }
    );

    throw error;
  }
}

/**
 * Get error rate statistics
 * @param {Object} env - Environment bindings
 * @param {string} timeRange - Time range ('24h', '7d', '30d')
 * @returns {Promise<Object>} Error rate statistics
 */
export async function getErrorRateStats(env, timeRange = '24h') {
  try {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const startISO = startDate.toISOString();
    const endISO = now.toISOString();

    // Get request count and error count
    const [requests, errors] = await Promise.all([
      getMetricSummary(env, MetricName.API_REQUEST_COUNT, startISO, endISO, 'sum'),
      getMetricSummary(env, MetricName.API_ERROR_COUNT, startISO, endISO, 'sum')
    ]);

    const totalRequests = requests.value;
    const totalErrors = errors.value;
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    // Get hourly error rate for trend
    const errorTimeSeries = await getMetricTimeSeries(
      env,
      MetricName.API_ERROR_COUNT,
      startISO,
      endISO,
      'sum'
    );

    return {
      totalRequests,
      totalErrors,
      errorRate,
      errorRatePercent: (errorRate * 100).toFixed(2),
      trend: errorTimeSeries
    };
  } catch (error) {
    logEvent(
      LogLevel.ERROR,
      'Failed to get error rate statistics',
      {
        error: error.message,
        stack: error.stack,
        timeRange
      }
    );

    throw error;
  }
}

/**
 * Get active farmer count (active farms in the database)
 * @param {Object} env - Environment bindings
 * @returns {Promise<number>} Number of active farms
 */
export async function getActiveFarmerCount(env) {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM farms
      WHERE active = 1
    `;

    const result = await env.DB.prepare(query).first();
    return result.count || 0;
  } catch (error) {
    logEvent(
      LogLevel.ERROR,
      'Failed to get active farmer count',
      {
        error: error.message,
        stack: error.stack
      }
    );

    return 0;
  }
}
