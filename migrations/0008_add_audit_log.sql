-- Migration number: 0008 	 2025-10-14T21:26:59.210Z
-- Migration: Add audit_log table for tracking farmer actions
-- Date: 2025-01-14
-- Story: 1.5 Enhanced Monitoring & Alerting

-- Create audit log table for tracking all important user actions
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL, -- 'broadcast_sent', 'farm_updated', 'image_uploaded', 'rebuild_triggered', etc.
  resource_type TEXT,   -- 'farm', 'broadcast', 'user', 'image', etc.
  resource_id TEXT,     -- ID of the resource being acted upon
  metadata TEXT,        -- JSON string with additional action details
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- Create metrics table for tracking system metrics over time
CREATE TABLE IF NOT EXISTS metrics (
  id TEXT PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metadata TEXT,        -- JSON string with additional metric context
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient time-series queries
CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON metrics(metric_name, created_at);
