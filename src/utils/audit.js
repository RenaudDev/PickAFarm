/**
 * Audit logging utility for tracking user actions
 * Stores audit events in D1 database for compliance and debugging
 */

import { logEvent, LogLevel } from './logger.js';

/**
 * Common audit action types
 */
export const AuditAction = {
  BROADCAST_SENT: 'broadcast_sent',
  FARM_UPDATED: 'farm_updated',
  FARM_DELETED: 'farm_deleted',
  IMAGE_UPLOADED: 'image_uploaded',
  REBUILD_TRIGGERED: 'rebuild_triggered',
  USER_REGISTERED: 'user_registered',
  USER_DELETED: 'user_deleted',
  FARM_SUBSCRIBED: 'farm_subscribed',
  FARM_UNSUBSCRIBED: 'farm_unsubscribed',
  PREFERENCES_UPDATED: 'preferences_updated'
};

/**
 * Resource types for audit log
 */
export const ResourceType = {
  FARM: 'farm',
  BROADCAST: 'broadcast',
  USER: 'user',
  IMAGE: 'image',
  SUBSCRIPTION: 'subscription',
  SYSTEM: 'system'
};

/**
 * Generate a UUID v4 for audit log entries
 * @returns {string} UUID v4 string
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Log an audit event to the database
 * @param {Object} env - Cloudflare Worker environment bindings
 * @param {string} userId - User ID performing the action (null for system actions)
 * @param {string} action - Action type (use AuditAction constants)
 * @param {string} resourceType - Type of resource (use ResourceType constants)
 * @param {string} resourceId - ID of the resource being acted upon
 * @param {Object} metadata - Additional context and details (will be JSON stringified)
 * @param {Object} context - Request context for logging (optional)
 * @returns {Promise<boolean>} True if logged successfully, false otherwise
 */
export async function logAuditEvent(
  env,
  userId,
  action,
  resourceType,
  resourceId,
  metadata = {},
  context = null
) {
  try {
    const id = generateUUID();
    const timestamp = new Date().toISOString();
    const metadataJson = JSON.stringify(metadata);

    // Insert into audit_log table
    const stmt = env.DB.prepare(
      `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    await stmt.bind(
      id,
      userId,
      action,
      resourceType,
      resourceId,
      metadataJson,
      timestamp
    ).run();

    // Log the audit event to structured logs as well
    logEvent(
      LogLevel.INFO,
      'Audit event logged',
      {
        auditId: id,
        userId,
        action,
        resourceType,
        resourceId
      },
      context
    );

    return true;
  } catch (error) {
    // Log error but don't fail the operation
    logEvent(
      LogLevel.ERROR,
      'Failed to log audit event',
      {
        error: error.message,
        stack: error.stack,
        userId,
        action,
        resourceType,
        resourceId
      },
      context
    );

    return false;
  }
}

/**
 * Query audit log entries
 * @param {Object} env - Environment bindings
 * @param {Object} filters - Query filters
 * @param {string} filters.userId - Filter by user ID
 * @param {string} filters.action - Filter by action type
 * @param {string} filters.resourceType - Filter by resource type
 * @param {string} filters.resourceId - Filter by resource ID
 * @param {string} filters.startDate - Start date (ISO string)
 * @param {string} filters.endDate - End date (ISO string)
 * @param {number} filters.limit - Max results (default: 100, max: 1000)
 * @returns {Promise<Array>} Array of audit log entries
 */
export async function queryAuditLog(env, filters = {}) {
  try {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      limit = 100
    } = filters;

    const maxLimit = Math.min(limit, 1000);
    const conditions = [];
    const params = [];

    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }

    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }

    if (resourceType) {
      conditions.push('resource_type = ?');
      params.push(resourceType);
    }

    if (resourceId) {
      conditions.push('resource_id = ?');
      params.push(resourceId);
    }

    if (startDate) {
      conditions.push('created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('created_at <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const query = `
      SELECT id, user_id, action, resource_type, resource_id, metadata, created_at
      FROM audit_log
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params, maxLimit).all();

    // Parse metadata JSON for each entry
    return result.results.map(entry => ({
      ...entry,
      metadata: entry.metadata ? JSON.parse(entry.metadata) : {}
    }));
  } catch (error) {
    logEvent(
      LogLevel.ERROR,
      'Failed to query audit log',
      {
        error: error.message,
        stack: error.stack,
        filters
      }
    );

    throw error;
  }
}

/**
 * Get audit log statistics
 * @param {Object} env - Environment bindings
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @returns {Promise<Object>} Statistics object with action counts
 */
export async function getAuditStats(env, startDate, endDate) {
  try {
    const query = `
      SELECT action, COUNT(*) as count
      FROM audit_log
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY action
      ORDER BY count DESC
    `;

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(startDate, endDate).all();

    const stats = {};
    result.results.forEach(row => {
      stats[row.action] = row.count;
    });

    return stats;
  } catch (error) {
    logEvent(
      LogLevel.ERROR,
      'Failed to get audit statistics',
      {
        error: error.message,
        stack: error.stack,
        startDate,
        endDate
      }
    );

    throw error;
  }
}
