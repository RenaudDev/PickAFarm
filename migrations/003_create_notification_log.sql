-- Migration: Create notification_log table (optional but recommended)
-- Tracks all notifications sent, useful for debugging and analytics

CREATE TABLE IF NOT EXISTS notification_log (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  
  -- Recipients
  recipient_count INTEGER DEFAULT 0,
  recipients_list TEXT, -- JSON array of emails sent to
  
  -- Notification details
  triggered_by TEXT, -- 'zoho_webhook', 'manual', 'scheduled', etc.
  farm_changes TEXT, -- JSON object with before/after values
  
  -- Email service response
  email_service TEXT DEFAULT 'resend', -- Which service was used
  email_service_response TEXT, -- Full response from email service
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  
  -- Timestamps
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (farm_id) REFERENCES farms(zoho_record_id) ON DELETE CASCADE
);

-- Indexes for analytics and debugging
CREATE INDEX IF NOT EXISTS idx_notification_log_farm ON notification_log(farm_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent ON notification_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type);
