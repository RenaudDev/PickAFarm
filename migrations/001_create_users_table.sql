-- Migration: Create users table for Clerk authentication sync
-- This table stores user data from Clerk and notification preferences

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  
  -- Profile info
  first_name TEXT,
  last_name TEXT,
  
  -- Preferences
  city_id TEXT,
  preferred_categories TEXT, -- JSON array
  
  -- Notification settings
  opt_in_notifications INTEGER DEFAULT 1,
  notification_type TEXT DEFAULT 'web' CHECK(notification_type IN ('web', 'ios', 'android')),
  push_token TEXT,
  platform_preferences TEXT, -- JSON object
  
  -- Metadata
  confirmed BOOLEAN DEFAULT 0,
  last_notified TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city_id);
