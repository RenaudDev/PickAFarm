-- Migration number: 0009 	 2025-10-15T00:49:05.778Z

-- Migration: Add Farmer Dashboard Tables
-- Story: 2.1 - Database Schema Migration for Epic 2
-- Created: 2025-01-14
-- Description: Creates 9 new tables for farmer dashboard features and extends 4 existing tables

-- ROLLBACK INSTRUCTIONS (if needed):
-- DROP TABLE wordpress_queue;
-- DROP TABLE circuit_breakers;
-- DROP TABLE rate_limits;
-- DROP TABLE farmer_social_accounts;
-- DROP TABLE notification_templates;
-- DROP TABLE qr_codes;
-- DROP TABLE marketing_analytics;
-- DROP TABLE in_app_notifications_archive;
-- DROP TABLE in_app_notifications;
-- (For ALTER TABLE rollbacks, manual column removal requires table recreation with backup/restore)

-- ==========================================
-- NEW TABLES (9 tables)
-- ==========================================

-- 1. In-App Notifications (for users)
CREATE TABLE in_app_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  farm_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT 0,
  read_at DATETIME,
  wordpress_post_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME DEFAULT (datetime('now', '+6 months')),
  FOREIGN KEY (user_id) REFERENCES users(clerk_user_id),
  FOREIGN KEY (farm_id) REFERENCES farms(zoho_record_id)
);

CREATE INDEX idx_notifications_user ON in_app_notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_farm ON in_app_notifications(farm_id, created_at DESC);
CREATE INDEX idx_notifications_expiry ON in_app_notifications(expires_at);

-- 2. Archived Notifications (older than 6 months)
CREATE TABLE in_app_notifications_archive (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  farm_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT 0,
  read_at DATETIME,
  wordpress_post_id INTEGER,
  created_at DATETIME,
  archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_archive_farm ON in_app_notifications_archive(farm_id, created_at DESC);

-- 3. Marketing Analytics (QR scans, link clicks, conversions)
CREATE TABLE marketing_analytics (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  referrer TEXT,
  session_id TEXT,
  converted_to_subscriber BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(zoho_record_id)
);

CREATE INDEX idx_marketing_farm ON marketing_analytics(farm_id, event_type, created_at DESC);
CREATE INDEX idx_marketing_referrer ON marketing_analytics(referrer, created_at DESC);

-- 4. QR Codes (for marketing materials)
CREATE TABLE qr_codes (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL,
  location_label TEXT NOT NULL,
  tracking_code TEXT NOT NULL UNIQUE,
  qr_image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(zoho_record_id)
);

CREATE INDEX idx_qr_farm ON qr_codes(farm_id);
CREATE INDEX idx_qr_tracking ON qr_codes(tracking_code);

-- 5. Notification Templates (for broadcast composer)
CREATE TABLE notification_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Farmer Social Accounts (Phase 3 - Facebook/Instagram integration)
CREATE TABLE farmer_social_accounts (
  id TEXT PRIMARY KEY,
  farmer_id TEXT NOT NULL,
  farm_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_page_id TEXT,
  access_token TEXT,
  auto_post_enabled BOOLEAN DEFAULT 0,
  connected_at DATETIME,
  last_post_at DATETIME,
  FOREIGN KEY (farmer_id) REFERENCES users(clerk_user_id),
  FOREIGN KEY (farm_id) REFERENCES farms(zoho_record_id)
);

CREATE INDEX idx_social_farmer ON farmer_social_accounts(farmer_id, platform);

-- 7. Rate Limits (for broadcast throttling)
CREATE TABLE rate_limits (
  id TEXT PRIMARY KEY,
  farmer_id TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'broadcast', 'image_upload', etc.
  count INTEGER DEFAULT 0,
  window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(clerk_user_id)
);

CREATE INDEX idx_rate_limits ON rate_limits(farmer_id, action_type, window_start);

-- 8. Circuit Breakers (for external service resilience)
CREATE TABLE circuit_breakers (
  service_name TEXT PRIMARY KEY,
  state TEXT NOT NULL DEFAULT 'CLOSED', -- 'CLOSED', 'OPEN', 'HALF_OPEN'
  failure_count INTEGER DEFAULT 0,
  last_failure_time DATETIME,
  last_success_time DATETIME,
  recovery_timeout INTEGER DEFAULT 30000, -- milliseconds
  failure_threshold INTEGER DEFAULT 5,
  success_threshold INTEGER DEFAULT 3,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. WordPress Queue (for failed post creation retries)
CREATE TABLE wordpress_queue (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL,
  post_data TEXT NOT NULL, -- JSON of post to create
  retry_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(zoho_record_id)
);

CREATE INDEX idx_wordpress_queue ON wordpress_queue(created_at);

-- ==========================================
-- MODIFY EXISTING TABLES (4 ALTER statements)
-- ==========================================

-- Extend saved_farms for notification preferences
ALTER TABLE saved_farms ADD COLUMN notify_email BOOLEAN DEFAULT 1;
ALTER TABLE saved_farms ADD COLUMN notify_in_app BOOLEAN DEFAULT 1;
ALTER TABLE saved_farms ADD COLUMN notify_types TEXT DEFAULT 'opening_date,weather,inventory,seasonal,event,closing';

-- Extend notification_log for farmer broadcast tracking
ALTER TABLE notification_log ADD COLUMN farmer_id TEXT;
-- notification_type column already exists from migration 003
ALTER TABLE notification_log ADD COLUMN subject TEXT;
ALTER TABLE notification_log ADD COLUMN message TEXT;
ALTER TABLE notification_log ADD COLUMN wordpress_post_id INTEGER;
ALTER TABLE notification_log ADD COLUMN facebook_post_id TEXT;
ALTER TABLE notification_log ADD COLUMN published_to_website BOOLEAN DEFAULT 0;

-- Extend users for farmer role
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN farm_id TEXT;

-- Extend farms for farmer edit tracking
ALTER TABLE farms ADD COLUMN has_pending_changes BOOLEAN DEFAULT 0;
ALTER TABLE farms ADD COLUMN last_farmer_edit DATETIME;
