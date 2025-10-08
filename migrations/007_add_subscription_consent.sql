-- Migration: Add subscription consent tracking to saved_farms table
-- Date: 2025-10-05
-- Description: Transform saved_farms to subscription system with consent tracking

-- Add new columns for consent and subscription tracking
ALTER TABLE saved_farms ADD COLUMN consent_given_at TEXT;
ALTER TABLE saved_farms ADD COLUMN consent_ip_address TEXT;
ALTER TABLE saved_farms ADD COLUMN consent_version TEXT DEFAULT 'v1';
ALTER TABLE saved_farms ADD COLUMN notification_preferences TEXT DEFAULT 'all';

-- Create user_preferences table for global notification settings
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  first_subscription_consent_shown INTEGER DEFAULT 0,
  email_notifications_enabled INTEGER DEFAULT 1,
  consent_version TEXT DEFAULT 'v1',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create index for faster user preference lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Backfill consent_given_at for existing saved_farms (use saved_at as proxy)
UPDATE saved_farms
SET consent_given_at = saved_at,
    consent_version = 'migrated_v1'
WHERE consent_given_at IS NULL;
